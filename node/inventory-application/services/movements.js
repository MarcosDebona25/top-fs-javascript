'use strict';

const db = require('../db/pool');
const { ConflictError, NotFoundError } = require('../lib/errors');
const { MAX_STOCK } = require('../lib/limits');

const REQUEST_ID_CONSTRAINT = 'stock_movements_request_id_key';
const MOVEMENT_COLUMNS =
  'id, item_id, type, delta, stock_before, stock_after, reason, created_at';

// A request_id identifies one submission of one part's movement form. Seeing
// it again for the same part is a replay; seeing it for another part is a
// conflict, never a silent success.
function replayOrConflict(movement, itemId, item) {
  if (movement.item_id !== itemId) {
    throw new ConflictError(
      'This form was already used to record a movement for another part. Reload the page and submit the movement again.',
      { item }
    );
  }
  return { replay: true, movement };
}

// Records a stock movement atomically: the item row is locked, the
// movement is inserted and the stock updated, and both changes commit
// together or roll back together. Every query runs on the same client,
// as pg transactions require: when no client is supplied, one is
// checked out of the pool for the whole transaction.
//
// Outcomes:
//   { replay: true, movement }   the same request_id was already processed
//   { unchanged: true, stock }   adjustment matched the current stock
//   { movement }                 a new movement was recorded
async function recordMovement(itemId, input, client = null) {
  const useClient = client || (await db.connect());
  let item = null;
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
      item = rows[0];
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
        `SELECT ${MOVEMENT_COLUMNS} FROM stock_movements WHERE request_id = $1`,
        [input.requestId]
      );
      if (processed.rows.length) {
        const outcome = replayOrConflict(processed.rows[0], item.id, item);
        await useClient.query('COMMIT');
        return outcome;
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
      if (after > MAX_STOCK) {
        throw new ConflictError(
          `Part ${item.sku} would hold ${after} units, above the limit of ${MAX_STOCK}. Record a smaller quantity.`,
          { item }
        );
      }

      const inserted = await useClient.query(
        `INSERT INTO stock_movements
           (item_id, type, delta, stock_before, stock_after, reason, request_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING ${MOVEMENT_COLUMNS}`,
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
      // The same request_id was committed by a concurrent submission for a
      // different part (same-part submissions queue on the row lock above).
      if (err.code === '23505' && err.constraint === REQUEST_ID_CONSTRAINT) {
        const { rows } = await useClient.query(
          `SELECT ${MOVEMENT_COLUMNS} FROM stock_movements WHERE request_id = $1`,
          [input.requestId]
        );
        if (rows.length) return replayOrConflict(rows[0], item.id, item);
      }
      throw err;
    }
  } finally {
    if (!client) useClient.release();
  }
}

module.exports = { recordMovement };
