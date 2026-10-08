'use strict';

const db = require('../db/pool');
const { ConflictError, NotFoundError } = require('../lib/errors');

async function archiveItem(itemId, client = null) {
  const useClient = client || (await db.connect());
  try {
    await useClient.query('BEGIN');
    try {
      const { rows } = await useClient.query(
        `SELECT id, sku, name, stock_quantity, archived_at
         FROM items
         WHERE id = $1
         FOR UPDATE`,
        [itemId]
      );
      const item = rows[0];
      if (!item) throw new NotFoundError('The requested part was not found.');

      if (item.archived_at) {
        throw new ConflictError(`Part ${item.sku} is already archived.`, { item });
      }

      if (item.stock_quantity > 0) {
        throw new ConflictError(
          `Part ${item.sku} still has ${item.stock_quantity} unit${item.stock_quantity === 1 ? '' : 's'} on hand. Dispatch the stock, or record an adjustment with a counted quantity of zero before archiving.`,
          { item }
        );
      }

      await useClient.query(
        'UPDATE items SET archived_at = now(), updated_at = now() WHERE id = $1',
        [itemId]
      );
      await useClient.query('COMMIT');

      return { ...item, archived_at: new Date().toISOString() };
    } catch (err) {
      await useClient.query('ROLLBACK');
      throw err;
    }
  } finally {
    if (!client) useClient.release();
  }
}

async function restoreItem(itemId, client = null) {
  const useClient = client || (await db.connect());
  try {
    await useClient.query('BEGIN');
    try {
      const { rows } = await useClient.query(
        `SELECT id, sku, name, stock_quantity, archived_at
         FROM items
         WHERE id = $1
         FOR UPDATE`,
        [itemId]
      );
      const item = rows[0];
      if (!item) throw new NotFoundError('The requested part was not found.');

      if (!item.archived_at) {
        throw new ConflictError(`Part ${item.sku} is not archived, so there is nothing to restore.`, { item });
      }

      await useClient.query(
        'UPDATE items SET archived_at = NULL, updated_at = now() WHERE id = $1',
        [itemId]
      );
      await useClient.query('COMMIT');

      return { ...item, archived_at: null };
    } catch (err) {
      await useClient.query('ROLLBACK');
      throw err;
    }
  } finally {
    if (!client) useClient.release();
  }
}

module.exports = { archiveItem, restoreItem };
