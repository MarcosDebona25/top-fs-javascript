'use strict';

const db = require('./pool');

async function listMovements(itemId, { limit, offset }) {
  const { rows } = await db.query(
    `SELECT id, type, delta, stock_before, stock_after, reason, request_id, created_at
     FROM stock_movements
     WHERE item_id = $1
     ORDER BY created_at DESC, id DESC
     LIMIT $2 OFFSET $3`,
    [itemId, limit, offset]
  );
  return rows;
}

async function countMovements(itemId) {
  const { rows } = await db.query(
    'SELECT COUNT(*)::int AS total FROM stock_movements WHERE item_id = $1',
    [itemId]
  );
  return rows[0].total;
}

async function findByRequestId(requestId) {
  const { rows } = await db.query(
    'SELECT id, item_id, type, delta, stock_before, stock_after, reason, created_at FROM stock_movements WHERE request_id = $1',
    [requestId]
  );
  return rows[0] || null;
}

module.exports = {
  listMovements,
  countMovements,
  findByRequestId,
};
