'use strict';

const db = require('../db/pool');
const { ConflictError, NotFoundError } = require('../lib/errors');

// Records a stock movement atomically: the item row is locked, the
// movement is inserted and the stock updated, and both changes commit
// together or roll back together. Every query runs on the same client,
// as pg transactions require: when no client is supplied, one is
// checked out of the pool for the whole transaction.
//
// Outcomes:
//   { replay: true, movement }  — the same request_id was already processed
//   { unchanged: true, stock }  — adjustment matched the current stock
//   { movement }                — a new movement was recorded
async function recordMovement(itemId, input, client = null) {
  const useClient = client || (await db.connect());
  try {
    await useClient.query('BEGIN');
    try {
      const { rows } = await useClient.query(
        `SELECT id, sku, stock_quantity, archived_at
         FROM items
         WHERE id = $1
         FOR UPDATE`,
        [itemId]
      );
      const item = rows[0];
      if (!item) throw new NotFoundError('The requested part was not found.');

      if (item.archived_at) {
        throw new ConflictError(
          `Part ${item.sku} is archived, so no stock movements can be recorded. Restore the part first.`,
          { item }
        );
      }

      // Idempotency: recognize a submission that was already processed,
      // even when it is sent again or twice at once.
      const processed = await useClient.query(
        `SELECT id, item_id, type, delta, stock_before, stock_after, reason, created_at
         FROM stock_movements
         WHERE request_id = $1`,
        [input.requestId]
      );
      if (processed.rows.length) {
        await useClient.query('COMMIT');
        return { replay: true, movement: processed.rows[0] };
      }

      const before = item.stock_quantity;
      let delta;

      if (input.type === 'receipt') {
        delta = input.quantity;
      } else if (input.type === 'dispatch') {
        if (input.quantity > before) {
          throw new ConflictError(
            `Only ${before} unit${before === 1 ? '' : 's'} of ${item.sku} are on hand. Dispatch no more than ${before}, or record an adjustment with the counted quantity.`,
            { item }
          );
        }
        delta = -input.quantity;
      } else {
        // Adjustment: the administrator enters the counted quantity.
        delta = input.quantity - before;
        if (delta === 0) {
          await useClient.query('COMMIT');
          return { unchanged: true, stock: before };
        }
      }

      const after = before + delta;

      const inserted = await useClient.query(
        `INSERT INTO stock_movements
           (item_id, type, delta, stock_before, stock_after, reason, request_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, item_id, type, delta, stock_before, stock_after, reason, created_at`,
        [itemId, input.type, delta, before, after, input.reason, input.requestId]
      );

      await useClient.query(
        'UPDATE items SET stock_quantity = $1, updated_at = now() WHERE id = $2',
        [after, itemId]
      );

      await useClient.query('COMMIT');

      return { movement: inserted.rows[0] };
    } catch (err) {
      await useClient.query('ROLLBACK');
      throw err;
    }
  } finally {
    if (!client) useClient.release();
  }
}

module.exports = { recordMovement };
