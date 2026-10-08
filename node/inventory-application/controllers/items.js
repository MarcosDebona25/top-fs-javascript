'use strict';

const crypto = require('crypto');
const { validationResult } = require('express-validator');
const itemDb = require('../db/items');
const categoryDb = require('../db/categories');
const movementDb = require('../db/movements');
const movementService = require('../services/movements');
const archivingService = require('../services/archiving');
const { setFlash } = require('../lib/flash');
const { paginate, PER_PAGE } = require('../lib/pagination');
const { NotFoundError } = require('../lib/errors');

const MOVEMENT_TYPES = ['receipt', 'dispatch', 'adjustment'];

function extractItemFields(body) {
  return {
    category_id: Number(body.category_id),
    sku: String(body.sku || '').trim().toUpperCase(),
    name: String(body.name || '').trim(),
    brand: String(body.brand || '').trim(),
    part_number: body.part_number ? String(body.part_number).trim() : null,
    description: String(body.description || '').trim(),
    unit_price: String(body.unit_price || '').trim(),
  };
}

function parseCatalogFilters(query) {
  const status = query.status === 'archived' ? 'archived' : 'active';
  const availability = ['in_stock', 'out_of_stock'].includes(query.availability)
    ? query.availability
    : 'all';
  const categoryId =
    query.category_id && /^\d+$/.test(query.category_id) ? Number(query.category_id) : null;
  const q = typeof query.q === 'string' && query.q.trim() ? query.q.trim() : null;
  const page = query.page && /^\d+$/.test(query.page) ? Math.max(1, Number(query.page)) : 1;
  return { status, availability, categoryId, q, page };
}

function makeCatalogHref(filters) {
  return (page) => {
    const params = new URLSearchParams();
    if (filters.q) params.set('q', filters.q);
    if (filters.categoryId) params.set('category_id', String(filters.categoryId));
    if (filters.availability !== 'all') params.set('availability', filters.availability);
    if (filters.status !== 'active') params.set('status', filters.status);
    params.set('page', String(page));
    return `/items?${params.toString()}`;
  };
}

async function findItemOr404(id) {
  const item = await itemDb.findItemById(id);
  if (!item) throw new NotFoundError('The requested part was not found.');
  return item;
}

async function listItems(req, res, next) {
  try {
    const filters = parseCatalogFilters(req.query);
    const [items, total, categories] = await Promise.all([
      itemDb.searchItems({
        ...filters,
        limit: PER_PAGE,
        offset: (filters.page - 1) * PER_PAGE,
      }),
      itemDb.countItems(filters),
      categoryDb.listCategories(),
    ]);

    res.render('items/index', {
      items,
      filters,
      categories,
      pagination: paginate({ page: filters.page, total }),
      hrefFor: makeCatalogHref(filters),
    });
  } catch (err) {
    next(err);
  }
}

async function showNewForm(req, res, next) {
  try {
    const categories = await categoryDb.listCategories();

    // A part cannot exist without a category: point at the action
    // that unblocks the catalog instead of rendering a broken form.
    if (!categories.length) {
      return res.render('items/no-categories');
    }

    const preselectedCategoryId =
      req.query.category_id && /^\d+$/.test(req.query.category_id)
        ? Number(req.query.category_id)
        : null;

    res.render('items/new', {
      categories,
      values: {
        category_id: preselectedCategoryId || '',
        sku: '',
        name: '',
        brand: '',
        part_number: '',
        description: '',
        unit_price: '',
      },
      errors: {},
    });
  } catch (err) {
    next(err);
  }
}

async function createItem(req, res, next) {
  const errors = validationResult(req);
  const values = extractItemFields(req.body);

  if (!errors.isEmpty()) {
    const categories = await categoryDb.listCategories();
    return res.status(422).render('items/new', {
      categories,
      values: { ...values, category_id: req.body.category_id },
      errors: errors.mapped(),
    });
  }

  try {
    const item = await itemDb.createItem(values);
    setFlash(req, 'success', `Part ${item.sku} was created with zero stock.`);
    res.redirect(303, `/items/${item.id}`);
  } catch (err) {
    const categories = await categoryDb.listCategories();
    if (err.code === '23505') {
      return res.status(422).render('items/new', {
        categories,
        values: { ...values, category_id: req.body.category_id },
        errors: { sku: { msg: 'A part with this SKU already exists. SKUs stay unique, even for archived parts.' } },
      });
    }
    next(err);
  }
}

async function showItem(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw new NotFoundError('The requested part was not found.');

    const item = await findItemOr404(id);
    const page = req.query.page && /^\d+$/.test(req.query.page) ? Math.max(1, Number(req.query.page)) : 1;

    const [movements, total] = await Promise.all([
      movementDb.listMovements(id, { limit: PER_PAGE, offset: (page - 1) * PER_PAGE }),
      movementDb.countMovements(id),
    ]);

    res.render('items/show', {
      item,
      movements,
      pagination: paginate({ page, total }),
      hrefFor: (p) => `/items/${id}?page=${p}#history`,
    });
  } catch (err) {
    next(err);
  }
}

async function showEditForm(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw new NotFoundError('The requested part was not found.');

    const item = await findItemOr404(id);
    const categories = await categoryDb.listCategories();

    res.render('items/edit', {
      item,
      categories,
      values: {
        category_id: item.category_id,
        sku: item.sku,
        name: item.name,
        brand: item.brand,
        part_number: item.part_number || '',
        description: item.description,
        unit_price: item.unit_price,
      },
      errors: {},
    });
  } catch (err) {
    next(err);
  }
}

async function updateItem(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw new NotFoundError('The requested part was not found.');

    const item = await findItemOr404(id);
    const errors = validationResult(req);
    const values = extractItemFields(req.body);

    if (!errors.isEmpty()) {
      const categories = await categoryDb.listCategories();
      return res.status(422).render('items/edit', {
        item,
        categories,
        values: { ...values, category_id: req.body.category_id },
        errors: errors.mapped(),
      });
    }

    const updated = await itemDb.updateItem(id, values);
    setFlash(req, 'success', `Part ${updated.sku} was updated.`);
    res.redirect(303, `/items/${id}`);
  } catch (err) {
    if (err.code === '23505') {
      const categories = await categoryDb.listCategories();
      return res.status(422).render('items/edit', {
        item: await findItemOr404(Number(req.params.id)),
        categories,
        values: extractItemFields(req.body),
        errors: { sku: { msg: 'A part with this SKU already exists.' } },
      });
    }
    next(err);
  }
}

async function showMovementForm(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw new NotFoundError('The requested part was not found.');

    const item = await findItemOr404(id);
    const type = MOVEMENT_TYPES.includes(req.query.type) ? req.query.type : 'receipt';

    res.render('items/movements/new', {
      item,
      type,
      requestId: crypto.randomUUID(),
      values: { quantity: '', reason: '' },
      errors: {},
      conflict: null,
    });
  } catch (err) {
    next(err);
  }
}

async function createMovement(req, res, next) {
  const id = Number(req.params.id);
  const type = MOVEMENT_TYPES.includes(req.body.type) ? req.body.type : 'receipt';
  const values = {
    quantity: String(req.body.quantity || ''),
    reason: String(req.body.reason || ''),
  };

  const renderForm = (status, extras = {}) => {
    return res.status(status).render('items/movements/new', {
      item: extras.item,
      type,
      requestId: String(req.body.request_id || ''),
      values,
      errors: extras.errors || {},
      conflict: extras.conflict || null,
    });
  };

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const item = await itemDb.findItemById(id);
    if (!item) throw new NotFoundError('The requested part was not found.');
    return renderForm(422, { item, errors: errors.mapped() });
  }

  try {
    const result = await movementService.recordMovement(id, {
      type,
      quantity: Number(req.body.quantity),
      reason: values.reason.trim(),
      requestId: String(req.body.request_id),
    });

    if (result.replay) {
      setFlash(
        req,
        'info',
        'This request was already processed. The movement was recorded only once.'
      );
    } else if (result.unchanged) {
      setFlash(
        req,
        'info',
        `The counted quantity matches the registered stock (${result.stock} unit${result.stock === 1 ? '' : 's'}). No movement was recorded.`
      );
    } else {
      const movement = result.movement;
      const labels = {
        receipt: 'Receipt recorded',
        dispatch: 'Dispatch recorded',
        adjustment: 'Adjustment recorded',
      };
      const sign = movement.delta > 0 ? '+' : '−';
      setFlash(
        req,
        'success',
        `${labels[movement.type]}: ${sign}${Math.abs(movement.delta)} unit${Math.abs(movement.delta) === 1 ? '' : 's'}. Stock is now ${movement.stock_after}.`
      );
    }

    res.redirect(303, `/items/${id}#history`);
  } catch (err) {
    if (err instanceof require('../lib/errors').ConflictError) {
      const item = err.details && err.details.item ? err.details.item : await itemDb.findItemById(id);
      return renderForm(409, {
        item,
        conflict: err.message,
      });
    }
    next(err);
  }
}

async function showArchiveForm(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw new NotFoundError('The requested part was not found.');

    const item = await findItemOr404(id);
    res.render('items/archive', { item, conflict: null });
  } catch (err) {
    next(err);
  }
}

async function archiveItem(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw new NotFoundError('The requested part was not found.');

    const archived = await archivingService.archiveItem(id);
    setFlash(
      req,
      'success',
      `Part ${archived.sku} was archived. Its data and full history are preserved.`
    );
    res.redirect(303, `/items/${id}`);
  } catch (err) {
    if (err instanceof require('../lib/errors').ConflictError) {
      const item = err.details && err.details.item ? err.details.item : await itemDb.findItemById(Number(req.params.id));
      return res.status(409).render('items/archive', { item, conflict: err.message });
    }
    next(err);
  }
}

async function showRestoreForm(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw new NotFoundError('The requested part was not found.');

    const item = await findItemOr404(id);
    res.render('items/restore', { item, conflict: null });
  } catch (err) {
    next(err);
  }
}

async function restoreItem(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw new NotFoundError('The requested part was not found.');

    const restored = await archivingService.restoreItem(id);
    setFlash(req, 'success', `Part ${restored.sku} was restored and accepts stock movements again.`);
    res.redirect(303, `/items/${id}`);
  } catch (err) {
    if (err instanceof require('../lib/errors').ConflictError) {
      const item = err.details && err.details.item ? err.details.item : await itemDb.findItemById(Number(req.params.id));
      return res.status(409).render('items/restore', { item, conflict: err.message });
    }
    next(err);
  }
}

module.exports = {
  listItems,
  showNewForm,
  createItem,
  showItem,
  showEditForm,
  updateItem,
  showMovementForm,
  createMovement,
  showArchiveForm,
  archiveItem,
  showRestoreForm,
  restoreItem,
};
