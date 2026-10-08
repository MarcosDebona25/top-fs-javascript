'use strict';

const db = require('./pool');

async function listCategoriesWithCounts() {
  const { rows } = await db.query(`
    SELECT c.id, c.name, c.description, c.created_at, c.updated_at,
           COUNT(i.id)::int AS active_item_count
    FROM categories c
    LEFT JOIN items i ON i.category_id = c.id AND i.archived_at IS NULL
    GROUP BY c.id
    ORDER BY lower(c.name), c.id
  `);
  return rows;
}

async function listCategories() {
  const { rows } = await db.query(`
    SELECT id, name FROM categories ORDER BY lower(name), id
  `);
  return rows;
}

async function findCategoryById(id) {
  const { rows } = await db.query(
    'SELECT id, name, description, created_at, updated_at FROM categories WHERE id = $1',
    [id]
  );
  return rows[0] || null;
}

async function findCategoryByName(name, excludeId = null) {
  const { rows } = await db.query(
    `SELECT id FROM categories
     WHERE lower(name) = lower($1)${excludeId ? ' AND id <> $2' : ''}`,
    excludeId ? [name, excludeId] : [name]
  );
  return rows[0] || null;
}

async function createCategory({ name, description }) {
  const { rows } = await db.query(
    `INSERT INTO categories (name, description)
     VALUES ($1, $2)
     RETURNING id, name, description, created_at, updated_at`,
    [name, description]
  );
  return rows[0];
}

async function updateCategory(id, { name, description }) {
  const { rows } = await db.query(
    `UPDATE categories
     SET name = $1, description = $2, updated_at = now()
     WHERE id = $3
     RETURNING id, name, description, created_at, updated_at`,
    [name, description, id]
  );
  return rows[0] || null;
}

async function deleteCategory(id) {
  const { rowCount } = await db.query('DELETE FROM categories WHERE id = $1', [id]);
  return rowCount > 0;
}

// Active and archived items alike block a category deletion.
async function listBlockingItems(categoryId) {
  const { rows } = await db.query(
    `SELECT i.id, i.sku, i.name, i.archived_at IS NOT NULL AS archived
     FROM items i
     WHERE i.category_id = $1
     ORDER BY lower(i.name), i.id`,
    [categoryId]
  );
  return rows;
}

async function listActiveItems(categoryId, { limit, offset }) {
  const { rows } = await db.query(
    `SELECT i.id, i.sku, i.name, i.brand, i.stock_quantity, i.unit_price
     FROM items i
     WHERE i.category_id = $1 AND i.archived_at IS NULL
     ORDER BY lower(i.name), i.id
     LIMIT $2 OFFSET $3`,
    [categoryId, limit, offset]
  );
  return rows;
}

async function countActiveItems(categoryId) {
  const { rows } = await db.query(
    'SELECT COUNT(*)::int AS total FROM items WHERE category_id = $1 AND archived_at IS NULL',
    [categoryId]
  );
  return rows[0].total;
}

module.exports = {
  listCategoriesWithCounts,
  listCategories,
  findCategoryById,
  findCategoryByName,
  createCategory,
  updateCategory,
  deleteCategory,
  listBlockingItems,
  listActiveItems,
  countActiveItems,
};
