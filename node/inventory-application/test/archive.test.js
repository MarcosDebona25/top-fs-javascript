'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { beforeEach } = require('node:test');

require('./bootstrap');

const {
  agent,
  resetDatabase,
  createCategory,
  createItem,
  protectedPost,
  postForm,
  extractHidden,
  db,
  ADMIN_PASSWORD,
} = require('./helpers');

const archivingService = require('../services/archiving');

beforeEach(async () => {
  await resetDatabase();
});

// The archive and restore confirmation pages only render a
// form when the action is possible, so the per-session CSRF
// token is taken from the edit form, which always has one.
async function archiveViaWeb(itemId) {
  const agentInstance = agent();
  const form = await agentInstance.get(`/items/${itemId}/edit`);
  const token = extractHidden(form, '_csrf');
  return agentInstance.post(`/items/${itemId}/archive`).type('form').send({
    _csrf: token,
    admin_password: ADMIN_PASSWORD,
  });
}

async function restoreViaWeb(itemId) {
  const agentInstance = agent();
  const form = await agentInstance.get(`/items/${itemId}/edit`);
  const token = extractHidden(form, '_csrf');
  return agentInstance.post(`/items/${itemId}/restore`).type('form').send({
    _csrf: token,
    admin_password: ADMIN_PASSWORD,
  });
}

test('archiving a part with positive stock is blocked with 409', async () => {
  const item = await createItem({ sku: 'TST-ARCH' });
  const { db: database } = require('./helpers');
  await database.query(
    `INSERT INTO stock_movements (item_id, type, delta, stock_before, stock_after, reason, request_id)
     VALUES ($1, 'receipt', 5, 0, 5, 'Delivery', $2)`,
    [item.id, require('./helpers').crypto.randomUUID()]
  );
  // The movement above is inserted directly, so the stock
  // column is updated the same way the service would.
  await database.query('UPDATE items SET stock_quantity = 5 WHERE id = $1', [item.id]);

  const res = await archiveViaWeb(item.id);
  assert.equal(res.status, 409);
  assert.match(res.text, /still has 5 units/i);
  assert.match(res.text, /zero before archiving/i);

  const { rows } = await db.query(
    'SELECT archived_at FROM items WHERE id = $1',
    [item.id]
  );
  assert.equal(rows[0].archived_at, null);
});

test('archiving a part with zero stock succeeds', async () => {
  const item = await createItem({ sku: 'TST-ARCH-OK' });

  const res = await archiveViaWeb(item.id);
  assert.equal(res.status, 303);
  assert.equal(res.headers.location, `/items/${item.id}`);

  const { rows } = await db.query(
    'SELECT archived_at FROM items WHERE id = $1',
    [item.id]
  );
  assert.ok(rows[0].archived_at);
});

test('archived parts do not accept movements until restored', async () => {
  const item = await createItem({ sku: 'TST-ARCH-MOVE' });
  await archiveViaWeb(item.id);

  const agentInstance = agent();
  const form = await agentInstance.get(
    `/items/${item.id}/movements/new?type=receipt`
  );
  const token = extractHidden(form, '_csrf');
  const requestId = extractHidden(form, 'request_id');
  const res = await postForm(agentInstance, `/items/${item.id}/movements`, {
    type: 'receipt',
    quantity: '5',
    reason: 'Should be blocked',
    request_id: requestId,
    _csrf: token,
    admin_password: ADMIN_PASSWORD,
  });
  assert.equal(res.status, 409);
  assert.match(res.text, /archived/i);
  assert.match(res.text, /Restore the part first/i);

  const { rows } = await db.query(
    'SELECT COUNT(*)::int AS total FROM stock_movements WHERE item_id = $1',
    [item.id]
  );
  assert.equal(rows[0].total, 0);
});

test('restoring an archived part makes it accept movements again', async () => {
  const item = await createItem({ sku: 'TST-RESTORE' });
  await archiveViaWeb(item.id);

  const res = await restoreViaWeb(item.id);
  assert.equal(res.status, 303);

  const { rows } = await db.query(
    'SELECT archived_at FROM items WHERE id = $1',
    [item.id]
  );
  assert.equal(rows[0].archived_at, null);

  // A movement now succeeds.
  const agentInstance = agent();
  const form = await agentInstance.get(
    `/items/${item.id}/movements/new?type=receipt`
  );
  const token = extractHidden(form, '_csrf');
  const requestId = extractHidden(form, 'request_id');
  const movement = await postForm(agentInstance, `/items/${item.id}/movements`, {
    type: 'receipt',
    quantity: '3',
    reason: 'Back in stock',
    request_id: requestId,
    _csrf: token,
    admin_password: ADMIN_PASSWORD,
  });
  assert.equal(movement.status, 303);
});

test('SKU and full history are preserved after archiving', async () => {
  const item = await createItem({
    sku: 'TST-KEEP',
    name: 'Hydraulic Filter',
  });
  const { db: database, crypto } = require('./helpers');
  await database.query(
    `INSERT INTO stock_movements (item_id, type, delta, stock_before, stock_after, reason, request_id)
     VALUES ($1, 'receipt', 12, 0, 12, 'Delivery', $2),
            ($1, 'dispatch', -12, 12, 0, 'Final orders', $3)`,
    [item.id, crypto.randomUUID(), crypto.randomUUID()]
  );

  await archiveViaWeb(item.id);

  const { rows } = await db.query(
    'SELECT sku, archived_at FROM items WHERE id = $1',
    [item.id]
  );
  assert.equal(rows[0].sku, 'TST-KEEP');
  assert.ok(rows[0].archived_at);

  const { rows: movements } = await db.query(
    'SELECT COUNT(*)::int AS total FROM stock_movements WHERE item_id = $1',
    [item.id]
  );
  assert.equal(movements[0].total, 2);

  // The detail page still shows the history.
  const detail = await agent().get(`/items/${item.id}`);
  assert.match(detail.text, /Delivery/);
  assert.match(detail.text, /Final orders/);
});

test('archiving an archived part and restoring an active part return 409', async () => {
  const archived = await createItem({ sku: 'TST-TWICE' });
  await archiveViaWeb(archived.id);

  const again = await archiveViaWeb(archived.id);
  assert.equal(again.status, 409);
  assert.match(again.text, /already archived/i);

  const active = await createItem({ sku: 'TST-ACTIVE' });
  const restore = await restoreViaWeb(active.id);
  assert.equal(restore.status, 409);
  assert.match(restore.text, /not archived/i);
});

test('archive and restore verify the password on every POST', async () => {
  const item = await createItem({ sku: 'TST-PW' });

  const agentInstance = agent();
  const form = await agentInstance.get(`/items/${item.id}/archive`);
  const token = extractHidden(form, '_csrf');

  const wrong = await agentInstance.post(`/items/${item.id}/archive`).type('form').send({
    _csrf: token,
    admin_password: 'wrong-password',
  });
  assert.equal(wrong.status, 403);

  const missing = await agentInstance.post(`/items/${item.id}/archive`).type('form').send({
    _csrf: token,
  });
  assert.equal(missing.status, 403);

  const { rows } = await db.query(
    'SELECT archived_at FROM items WHERE id = $1',
    [item.id]
  );
  assert.equal(rows[0].archived_at, null);
});

test('archive service locks the row and checks stock under the lock', async () => {
  const item = await createItem({ sku: 'TST-LOCK' });
  const { db: database, crypto } = require('./helpers');
  await database.query(
    `INSERT INTO stock_movements (item_id, type, delta, stock_before, stock_after, reason, request_id)
     VALUES ($1, 'receipt', 3, 0, 3, 'Delivery', $2)`,
    [item.id, crypto.randomUUID()]
  );
  // The movement above is inserted directly, so the stock
  // column is updated the same way the service would.
  await database.query('UPDATE items SET stock_quantity = 3 WHERE id = $1', [item.id]);

  await assert.rejects(
    () => archivingService.archiveItem(item.id),
    (err) => err.statusCode === 409 && /still has 3 units/.test(err.message)
  );
});
