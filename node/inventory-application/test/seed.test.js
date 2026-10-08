'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { beforeEach } = require('node:test');

require('./bootstrap');

const { resetDatabase, db } = require('./helpers');
const seed = require('../db/seed');

beforeEach(async () => {
  await resetDatabase();
});

test('the seed loads the planned dataset', async () => {
  await seed.main();

  const { rows: categories } = await db.query(
    'SELECT COUNT(*)::int AS total FROM categories'
  );
  assert.equal(categories[0].total, 7);

  const { rows: items } = await db.query(
    'SELECT COUNT(*)::int AS total FROM items'
  );
  assert.equal(items[0].total, 24);

  const { rows: movements } = await db.query(
    'SELECT COUNT(*)::int AS total FROM stock_movements'
  );
  assert.ok(movements[0].total > 40);

  // Accessories stays empty.
  const { rows: accessories } = await db.query(
    `SELECT COUNT(i.id)::int AS total
     FROM categories c
     LEFT JOIN items i ON i.category_id = c.id
     WHERE lower(c.name) = 'accessories'`
  );
  assert.equal(accessories[0].total, 0);

  // One archived part and one out-of-stock part exist.
  const { rows: archived } = await db.query(
    'SELECT COUNT(*)::int AS total FROM items WHERE archived_at IS NOT NULL'
  );
  assert.equal(archived[0].total, 1);

  const { rows: outOfStock } = await db.query(
    'SELECT COUNT(*)::int AS total FROM items WHERE stock_quantity = 0 AND archived_at IS NULL'
  );
  assert.equal(outOfStock[0].total, 1);
});

test('repeating the seed does not duplicate data or alter existing parts', async () => {
  await seed.main();

  // Simulate an existing change made after the first seed run.
  const { rows } = await db.query(
    "SELECT id FROM items WHERE sku = 'BRK-1001'"
  );
  const itemId = rows[0].id;
  await db.query(
    'UPDATE items SET unit_price = $1, updated_at = now() WHERE id = $2',
    ['123.45', itemId]
  );
  const { rows: before } = await db.query(
    'SELECT COUNT(*)::int AS total FROM stock_movements'
  );

  await seed.main();

  const { rows: afterItems } = await db.query(
    'SELECT COUNT(*)::int AS total FROM items'
  );
  assert.equal(afterItems[0].total, 24);

  const { rows: afterMovements } = await db.query(
    'SELECT COUNT(*)::int AS total FROM stock_movements'
  );
  assert.equal(afterMovements[0].total, before[0].total);

  // The manual change is preserved.
  const { rows: price } = await db.query(
    'SELECT unit_price FROM items WHERE id = $1',
    [itemId]
  );
  assert.equal(price[0].unit_price, '123.45');
});

test('seeded stock matches the sum of seeded movements', async () => {
  await seed.main();

  const { rows } = await db.query(
    `SELECT i.id, i.stock_quantity,
            COALESCE(SUM(m.delta), 0)::int AS movement_total
     FROM items i
     LEFT JOIN stock_movements m ON m.item_id = i.id
     GROUP BY i.id`
  );
  for (const row of rows) {
    assert.equal(
      row.stock_quantity,
      row.movement_total,
      `stock mismatch for item ${row.id}`
    );
  }
});
