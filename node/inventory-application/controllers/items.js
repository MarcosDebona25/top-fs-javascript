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
const { NotFoundError, ConflictError } = require('../lib/errors');
const { parseId, parsePage } = require('../lib/params');
const { MAX_MOVEMENT_QUANTITY, MAX_STOCK } = require('../lib/limits');

const MOVEMENT_TYPES = ['receipt', 'dispatch', 'adjustment'];
const MOVEMENT_LIMITS = { maxQuantity: MAX_MOVEMENT_QUANTITY, maxStock: MAX_STOCK };
const CATEGORY_GONE = 'The selected category no longer exists. Select another one.';

function requireItemId(req) {
  const id = parseId(req.params.id);
  if (id === null) throw new NotFoundError('The requested part was not found.');
  return id;
}

function extractItemFields(body) {
  return {
    category_id: parseId(body.category_id),
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
  const categoryId = parseId(query.category_id);
  const q = typeof query.q === 'string' && query.q.trim() ? query.q.trim() : null;
  const page = parsePage(query.page);
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
    const [total, categories] = await Promise.all([
      itemDb.countItems(filters),
      categoryDb.listCategories(),
    ]);

    // Count first so an out-of-range page is clamped before it becomes an
    // offset: the list and the pagination always describe the same page.
    const pagination = paginate({ page: filters.page, total });
    const items = await itemDb.searchItems({
      ...filters,
      page: pagination.page,
      limit: PER_PAGE,
    });

    res.render('items/index', {
      items,
      filters,
      categories,
      pagination,
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

    const preselectedCategoryId = parseId(req.query.category_id);

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
    // Backstops for a concurrent change that slipped past validation:
    // a duplicate SKU (23505) or a category deleted meanwhile (23503).
    const raceErrors = {
      23505: { sku: { msg: 'A part with this SKU already exists. SKUs stay unique, even for archived parts.' } },
      23503: { category_id: { msg: CATEGORY_GONE } },
    }[err.code];
    if (raceErrors) {
      const categories = await categoryDb.listCategories();
      return res.status(422).render('items/new', {
        categories,
        values: { ...values, category_id: req.body.category_id },
        errors: raceErrors,
      });
    }
    next(err);
  }
}

async function showItem(req, res, next) {
  try {
    const id = requireItemId(req);

    const item = await findItemOr404(id);
    const total = await movementDb.countMovements(id);
    const pagination = paginate({ page: parsePage(req.query.page), total });
    const movements = await movementDb.listMovements(id, {
      limit: PER_PAGE,
      offset: (pagination.page - 1) * PER_PAGE,
    });

    res.render('items/show', {
      item,
      movements,
      pagination,
      hrefFor: (p) => `/items/${id}?page=${p}#history`,
    });
  } catch (err) {
    next(err);
  }
}

async function showEditForm(req, res, next) {
  try {
    const id = requireItemId(req);

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
    const id = requireItemId(req);

    const item = await findItemOr404(id);
    const errors = validationResult(req);
    // The SKU is immutable: whatever the submission carries is ignored.
    const values = { ...extractItemFields(req.body), sku: item.sku };
    const renderInvalid = async (fieldErrors) => {
      const categories = await categoryDb.listCategories();
      return res.status(422).render('items/edit', {
        item,
        categories,
        values: { ...values, category_id: req.body.category_id },
        errors: fieldErrors,
      });
    };

    if (!errors.isEmpty()) return await renderInvalid(errors.mapped());

    try {
      const updated = await itemDb.updateItem(id, values);
      setFlash(req, 'success', `Part ${updated.sku} was updated.`);
      res.redirect(303, `/items/${id}`);
    } catch (err) {
      // The category was deleted between validation and the update.
      if (err.code === '23503') return await renderInvalid({ category_id: { msg: CATEGORY_GONE } });
      throw err;
    }
  } catch (err) {
    next(err);
  }
}

async function showMovementForm(req, res, next) {
  try {
    const id = requireItemId(req);

    const item = await findItemOr404(id);
    const type = MOVEMENT_TYPES.includes(req.query.type) ? req.query.type : 'receipt';

    res.render('items/movements/new', {
      item,
      type,
      requestId: crypto.randomUUID(),
      limits: MOVEMENT_LIMITS,
      values: { quantity: '', reason: '' },
      errors: {},
      conflict: null,
    });
  } catch (err) {
    next(err);
  }
}

async function createMovement(req, res, next) {
  const id = requireItemId(req);
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
      limits: MOVEMENT_LIMITS,
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
    if (err instanceof ConflictError) {
      // Reload the full row: the form needs the name and the current stock.
      const item = await findItemOr404(id);
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
    const id = requireItemId(req);

    const item = await findItemOr404(id);
    res.render('items/archive', { item, conflict: null });
  } catch (err) {
    next(err);
  }
}

async function archiveItem(req, res, next) {
  try {
    const id = requireItemId(req);

    const archived = await archivingService.archiveItem(id);
    setFlash(
      req,
      'success',
      `Part ${archived.sku} was archived. Its data and full history are preserved.`
    );
    res.redirect(303, `/items/${id}`);
  } catch (err) {
    if (err instanceof ConflictError) {
      const item = await findItemOr404(requireItemId(req));
      return res.status(409).render('items/archive', { item, conflict: err.message });
    }
    next(err);
  }
}

async function showRestoreForm(req, res, next) {
  try {
    const id = requireItemId(req);

    const item = await findItemOr404(id);
    res.render('items/restore', { item, conflict: null });
  } catch (err) {
    next(err);
  }
}

async function restoreItem(req, res, next) {
  try {
    const id = requireItemId(req);

    const restored = await archivingService.restoreItem(id);
    setFlash(req, 'success', `Part ${restored.sku} was restored and accepts stock movements again.`);
    res.redirect(303, `/items/${id}`);
  } catch (err) {
    if (err instanceof ConflictError) {
      const item = await findItemOr404(requireItemId(req));
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
