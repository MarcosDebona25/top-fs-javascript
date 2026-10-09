'use strict';

const db = require('./pool');
const { PER_PAGE } = require('../lib/pagination');

// Builds a shared WHERE clause so the catalog list and its count always agree.
function buildFilters(filters) {
  const where = [];
  const params = [];

  where.push(filters.status === 'archived' ? 'i.archived_at IS NOT NULL' : 'i.archived_at IS NULL');

  if (filters.q) {
    // Escape LIKE wildcards so the search text is matched literally.
    const literal = filters.q.toLowerCase().replace(/[\\%_]/g, '\\$&');
    params.push(`%${literal}%`);
    const pattern = `$${params.length}`;
    where.push(
      `(lower(i.name) LIKE ${pattern} OR lower(i.sku) LIKE ${pattern} OR lower(i.brand) LIKE ${pattern})`
    );
  }

  if (filters.categoryId) {
    params.push(filters.categoryId);
    where.push(`i.category_id = $${params.length}`);
  }

  if (filters.availability === 'in_stock') {
    where.push('i.stock_quantity > 0');
  } else if (filters.availability === 'out_of_stock') {
    where.push('i.stock_quantity = 0');
  }

  return { where, params };
}

async function searchItems(filters) {
  const limit = filters.limit || PER_PAGE;
  const offset = ((filters.page || 1) - 1) * limit;
  const { where, params } = buildFilters(filters);
  params.push(limit, offset);

  const { rows } = await db.query(`
    SELECT i.id, i.category_id, i.sku, i.name, i.brand, i.part_number, i.description,
           i.unit_price, i.stock_quantity, i.archived_at, i.created_at, i.updated_at,
           c.name AS category_name
    FROM items i
    JOIN categories c ON c.id = i.category_id
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY lower(i.name), i.id
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `, params);
  return rows;
}

async function countItems(filters) {
  const { where, params } = buildFilters(filters);
  const { rows } = await db.query(
    `SELECT COUNT(*)::int AS total FROM items i ${where.length ? `WHERE ${where.join(' AND ')}` : ''}`,
    params
  );
  return rows[0].total;
}

async function findItemById(id) {
  const { rows } = await db.query(
    `SELECT i.id, i.category_id, i.sku, i.name, i.brand, i.part_number, i.description,
            i.unit_price, i.stock_quantity, i.archived_at, i.created_at, i.updated_at,
            c.name AS category_name
     FROM items i
     JOIN categories c ON c.id = i.category_id
     WHERE i.id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function findItemBySku(sku) {
  const { rows } = await db.query('SELECT id FROM items WHERE sku = $1', [sku]);
  return rows[0] || null;
}

async function createItem(fields) {
  const { rows } = await db.query(
    `INSERT INTO items (category_id, sku, name, brand, part_number, description, unit_price)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, sku, name, stock_quantity, created_at`,
    [
      fields.category_id,
      fields.sku,
      fields.name,
      fields.brand,
      fields.part_number,
      fields.description,
      fields.unit_price,
    ]
  );
  return rows[0];
}

async function updateItem(id, fields) {
  const { rows } = await db.query(
    `UPDATE items
     SET category_id = $1, name = $2, brand = $3, part_number = $4, description = $5,
         unit_price = $6, updated_at = now()
     WHERE id = $7
     RETURNING id, sku, name, stock_quantity, archived_at`,
    [
      fields.category_id,
      fields.name,
      fields.brand,
      fields.part_number,
      fields.description,
      fields.unit_price,
      id,
    ]
  );
  return rows[0] || null;
}

module.exports = {
  searchItems,
  countItems,
  findItemById,
  findItemBySku,
  createItem,
  updateItem,
};
