'use strict';

const { validationResult } = require('express-validator');
const categoryDb = require('../db/categories');
const { setFlash } = require('../lib/flash');
const { paginate, PER_PAGE } = require('../lib/pagination');
const { NotFoundError } = require('../lib/errors');

function extractFields(body) {
  return {
    name: String(body.name || '').trim(),
    description: String(body.description || '').trim(),
  };
}

async function findCategoryOr404(id) {
  const category = await categoryDb.findCategoryById(id);
  if (!category) throw new NotFoundError('The requested category was not found.');
  return category;
}

function makePageHref(categoryId, filters) {
  return (page) => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    return `/categories/${categoryId}?${params.toString()}`;
  };
}

async function showNewForm(req, res, next) {
  try {
    res.render('categories/new', { values: {}, errors: {} });
  } catch (err) {
    next(err);
  }
}

async function createCategory(req, res, next) {
  const errors = validationResult(req);
  const values = extractFields(req.body);

  if (!errors.isEmpty()) {
    return res.status(422).render('categories/new', {
      values,
      errors: errors.mapped(),
    });
  }

  try {
    const category = await categoryDb.createCategory(values);
    setFlash(req, 'success', `Category "${category.name}" was created.`);
    res.redirect(303, `/categories/${category.id}`);
  } catch (err) {
    // Backstop for a concurrent duplicate that slipped past the check.
    if (err.code === '23505') {
      return res.status(422).render('categories/new', {
        values,
        errors: { name: { msg: 'A category with this name already exists.' } },
      });
    }
    next(err);
  }
}

async function showCategory(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw new NotFoundError('The requested category was not found.');

    const category = await findCategoryOr404(id);
    const page = req.query.page && /^\d+$/.test(req.query.page) ? Number(req.query.page) : 1;

    const [items, total] = await Promise.all([
      categoryDb.listActiveItems(id, { limit: PER_PAGE, offset: (page - 1) * PER_PAGE }),
      categoryDb.countActiveItems(id),
    ]);

    const pagination = paginate({ page, total });
    res.render('categories/show', {
      category,
      items,
      pagination,
      hrefFor: makePageHref(id),
    });
  } catch (err) {
    next(err);
  }
}

async function showEditForm(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw new NotFoundError('The requested category was not found.');

    const category = await findCategoryOr404(id);
    res.render('categories/edit', {
      category,
      values: { name: category.name, description: category.description },
      errors: {},
    });
  } catch (err) {
    next(err);
  }
}

async function updateCategory(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw new NotFoundError('The requested category was not found.');

    const category = await findCategoryOr404(id);
    const errors = validationResult(req);
    const values = extractFields(req.body);

    if (!errors.isEmpty()) {
      return res.status(422).render('categories/edit', {
        category,
        values,
        errors: errors.mapped(),
      });
    }

    const updated = await categoryDb.updateCategory(id, values);
    setFlash(req, 'success', `Category "${updated.name}" was updated.`);
    res.redirect(303, `/categories/${id}`);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(422).render('categories/edit', {
        values: extractFields(req.body),
        errors: { name: { msg: 'A category with this name already exists.' } },
      });
    }
    next(err);
  }
}

async function showDeleteForm(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw new NotFoundError('The requested category was not found.');

    const category = await findCategoryOr404(id);
    const blockingItems = await categoryDb.listBlockingItems(id);
    res.render('categories/delete', { category, blockingItems, conflict: null });
  } catch (err) {
    next(err);
  }
}

async function deleteCategory(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw new NotFoundError('The requested category was not found.');

    const category = await findCategoryOr404(id);
    const blockingItems = await categoryDb.listBlockingItems(id);

    if (blockingItems.length) {
      return res.status(409).render('categories/delete', {
        category,
        blockingItems,
        conflict:
          `Category "${category.name}" cannot be deleted because it contains ` +
          `${blockingItems.length} part${blockingItems.length === 1 ? '' : 's'}. ` +
          'Move every part to another category before deleting this one.',
      });
    }

    await categoryDb.deleteCategory(id);
    setFlash(req, 'success', `Category "${category.name}" was deleted.`);
    res.redirect(303, '/');
  } catch (err) {
    // A part was assigned to the category between the check and the delete.
    if (err.code === '23503') {
      const blockingItems = await categoryDb.listBlockingItems(Number(req.params.id));
      return res.status(409).render('categories/delete', {
        category: { id: Number(req.params.id), name: req.body.name || 'This category' },
        blockingItems,
        conflict:
          'The category still contains parts. Move every part to another category before deleting it.',
      });
    }
    next(err);
  }
}

module.exports = {
  showNewForm,
  createCategory,
  showCategory,
  showEditForm,
  updateCategory,
  showDeleteForm,
  deleteCategory,
};
