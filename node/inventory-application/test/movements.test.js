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
  crypto,
  ADMIN_PASSWORD,
} = require('./helpers');

const movementService = require('../services/movements');

beforeEach(async () => {
  await resetDatabase();
});

async function recordViaWeb(itemId, { type, quantity, reason }) {
  const agentInstance = agent();
  const form = await agentInstance.get(
    `/items/${itemId}/movements/new?type=${type}`
  );
  const token = extractHidden(form, '_csrf');
  const requestId = extractHidden(form, 'request_id');
  return {
    response: await postForm(agentInstance, `/items/${itemId}/movements`, {
      type,
      quantity: String(quantity),
      reason,
      request_id: requestId,
      _csrf: token,
      admin_password: ADMIN_PASSWORD,
    }),
    requestId,
  };
}

test('receipt of 10, dispatch of 3 and adjustment to 5: final stock 5', async () => {
  const category = await createCategory({ name: 'Braking' });
  const item = await createItem({ sku: 'TST-FLOW', category });

  const receipt = await recordViaWeb(item.id, {
    type: 'receipt',
    quantity: 10,
    reason: 'Supplier delivery',
  });
  assert.equal(receipt.response.status, 303);

  const dispatch = await recordViaWeb(item.id, {
    type: 'dispatch',
    quantity: 3,
    reason: 'Workshop order',
  });
  assert.equal(dispatch.response.status, 303);

  const adjustment = await recordViaWeb(item.id, {
    type: 'adjustment',
    quantity: 5,
    reason: 'Shelf count',
  });
  assert.equal(adjustment.response.status, 303);

  const { rows } = await db.query(
    'SELECT stock_quantity FROM items WHERE id = $1',
    [item.id]
  );
  assert.equal(rows[0].stock_quantity, 5);

  const { rows: movements } = await db.query(
    'SELECT delta FROM stock_movements WHERE item_id = $1 ORDER BY id',
    [item.id]
  );
  assert.deepEqual(
    movements.map((m) => m.delta),
    [10, -3, -2]
  );
});

test('stored stock always matches the sum of its movements', async () => {
  const item = await createItem({ sku: 'TST-SUM' });

  await recordViaWeb(item.id, { type: 'receipt', quantity: 100, reason: 'r1' });
  await recordViaWeb(item.id, { type: 'dispatch', quantity: 37, reason: 'r2' });
  await recordViaWeb(item.id, { type: 'adjustment', quantity: 50, reason: 'r3' });
  await recordViaWeb(item.id, { type: 'dispatch', quantity: 12, reason: 'r4' });

  const { rows } = await db.query(
    'SELECT stock_quantity FROM items WHERE id = $1',
    [item.id]
  );
  const { rows: totals } = await db.query(
    'SELECT COALESCE(SUM(delta), 0)::int AS total FROM stock_movements WHERE item_id = $1',
    [item.id]
  );
  assert.equal(rows[0].stock_quantity, totals[0].total);
  // 100 − 37 = 63, counted 50, then a dispatch of 12.
  assert.equal(rows[0].stock_quantity, 38);
});

test('dispatching more than the available stock is rejected with 409', async () => {
  const item = await createItem({ sku: 'TST-OVER' });
  await recordViaWeb(item.id, { type: 'receipt', quantity: 2, reason: 'r' });

  const res = await recordViaWeb(item.id, {
    type: 'dispatch',
    quantity: 5,
    reason: 'Too many',
  });
  assert.equal(res.response.status, 409);
  assert.match(res.response.text, /Only 2 units/i);

  const { rows } = await db.query(
    'SELECT stock_quantity FROM items WHERE id = $1',
    [item.id]
  );
  assert.equal(rows[0].stock_quantity, 2);
  const { rows: movements } = await db.query(
    'SELECT COUNT(*)::int AS total FROM stock_movements WHERE item_id = $1',
    [item.id]
  );
  assert.equal(movements[0].total, 1);
});

test('invalid quantities are rejected with 422', async () => {
  const item = await createItem({ sku: 'TST-INVALID' });

  const cases = [
    { type: 'dispatch', quantity: 0 },
    { type: 'receipt', quantity: -3 },
    { type: 'receipt', quantity: 2.5 },
    { type: 'receipt', quantity: 'abc' },
  ];

  for (const { type, quantity } of cases) {
    const agentInstance = agent();
    const form = await agentInstance.get(
      `/items/${item.id}/movements/new?type=${type}`
    );
    const token = extractHidden(form, '_csrf');
    const requestId = extractHidden(form, 'request_id');
    const res = await postForm(agentInstance, `/items/${item.id}/movements`, {
      type,
      quantity: String(quantity),
      reason: 'Some reason',
      request_id: requestId,
      _csrf: token,
      admin_password: ADMIN_PASSWORD,
    });
    assert.equal(res.status, 422, `Expected 422 for ${type} ${quantity}`);
  }

  const { rows } = await db.query(
    'SELECT COUNT(*)::int AS total FROM stock_movements'
  );
  assert.equal(rows[0].total, 0);
});

test('adjustment with the same counted quantity records nothing', async () => {
  const item = await createItem({ sku: 'TST-SAME' });
  await recordViaWeb(item.id, { type: 'receipt', quantity: 12, reason: 'r' });

  const agentInstance = agent();
  const form = await agentInstance.get(
    `/items/${item.id}/movements/new?type=adjustment`
  );
  const token = extractHidden(form, '_csrf');
  const requestId = extractHidden(form, 'request_id');
  const res = await postForm(agentInstance, `/items/${item.id}/movements`, {
    type: 'adjustment',
    quantity: '12',
    reason: 'Counted the same',
    request_id: requestId,
    _csrf: token,
    admin_password: ADMIN_PASSWORD,
  });
  assert.equal(res.status, 303);

  const { rows } = await db.query(
    'SELECT stock_quantity FROM items WHERE id = $1',
    [item.id]
  );
  assert.equal(rows[0].stock_quantity, 12);
  const { rows: movements } = await db.query(
    'SELECT COUNT(*)::int AS total FROM stock_movements WHERE item_id = $1',
    [item.id]
  );
  assert.equal(movements[0].total, 1); // only the initial receipt

  // The redirect target explains that the stock already matches.
  const detail = await agentInstance.get(`/items/${item.id}`);
  assert.match(detail.text, /matches the registered stock/i);
});

test('the same request UUID is processed only once, even when repeated', async () => {
  const item = await createItem({ sku: 'TST-IDEM' });

  const first = await recordViaWeb(item.id, {
    type: 'receipt',
    quantity: 10,
    reason: 'Supplier delivery',
  });
  assert.equal(first.response.status, 303);

  // The same form is submitted again (same request_id).
  const agentInstance = agent();
  const formToken = extractHidden(
    await agentInstance.get(`/items/${item.id}/movements/new?type=receipt`),
    '_csrf'
  );
  const res = await postForm(agentInstance, `/items/${item.id}/movements`, {
    type: 'receipt',
    quantity: '10',
    reason: 'Supplier delivery',
    request_id: first.requestId,
    _csrf: formToken,
    admin_password: ADMIN_PASSWORD,
  });
  assert.equal(res.status, 303);

  const { rows } = await db.query(
    'SELECT stock_quantity FROM items WHERE id = $1',
    [item.id]
  );
  assert.equal(rows[0].stock_quantity, 10);
  const { rows: movements } = await db.query(
    'SELECT COUNT(*)::int AS total FROM stock_movements WHERE item_id = $1',
    [item.id]
  );
  assert.equal(movements[0].total, 1);

  // The replay is reported to the user.
  const detail = await agentInstance.get(`/items/${item.id}`);
  assert.match(detail.text, /already processed/i);
});

test('two simultaneous dispatches of the last unit: only one is accepted', async () => {
  const item = await createItem({ sku: 'TST-RACE' });
  await recordViaWeb(item.id, { type: 'receipt', quantity: 1, reason: 'r' });

  const first = agent();
  const second = agent();

  const [formA, formB] = await Promise.all([
    first.get(`/items/${item.id}/movements/new?type=dispatch`),
    second.get(`/items/${item.id}/movements/new?type=dispatch`),
  ]);

  const [resA, resB] = await Promise.all([
    postForm(first, `/items/${item.id}/movements`, {
      type: 'dispatch',
      quantity: '1',
      reason: 'Simultaneous A',
      request_id: extractHidden(formA, 'request_id'),
      _csrf: extractHidden(formA, '_csrf'),
      admin_password: ADMIN_PASSWORD,
    }),
    postForm(second, `/items/${item.id}/movements`, {
      type: 'dispatch',
      quantity: '1',
      reason: 'Simultaneous B',
      request_id: extractHidden(formB, 'request_id'),
      _csrf: extractHidden(formB, '_csrf'),
      admin_password: ADMIN_PASSWORD,
    }),
  ]);

  const statuses = [resA.status, resB.status].sort();
  assert.deepEqual(statuses, [303, 409]);

  const { rows } = await db.query(
    'SELECT stock_quantity FROM items WHERE id = $1',
    [item.id]
  );
  assert.equal(rows[0].stock_quantity, 0);
  const { rows: movements } = await db.query(
    'SELECT COUNT(*)::int AS total FROM stock_movements WHERE item_id = $1',
    [item.id]
  );
  assert.equal(movements[0].total, 2); // receipt + the single accepted dispatch
});

test('stock and movement roll back together when the update fails', async () => {
  const item = await createItem({ sku: 'TST-ROLLBACK' });

  const client = await db.connect();
  const sabotaged = new Proxy(client, {
    get(target, prop) {
      if (prop === 'query') {
        return async (text, params) => {
          if (/^\s*UPDATE\s+items/i.test(text)) {
            throw new Error('simulated failure after the movement insert');
          }
          return target.query(text, params);
        };
      }
      const value = target[prop];
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });

  await assert.rejects(
    () =>
      movementService.recordMovement(item.id, {
        type: 'receipt',
        quantity: 5,
        reason: 'Will be rolled back',
        requestId: crypto.randomUUID(),
      }, sabotaged),
    /simulated failure/
  );
  client.release();

  const { rows } = await db.query(
    'SELECT stock_quantity FROM items WHERE id = $1',
    [item.id]
  );
  assert.equal(rows[0].stock_quantity, 0);
  const { rows: movements } = await db.query(
    'SELECT COUNT(*)::int AS total FROM stock_movements WHERE item_id = $1',
    [item.id]
  );
  assert.equal(movements[0].total, 0);
});

test('movements are recorded through a single transactional client', async () => {
  const item = await createItem({ sku: 'TST-CLIENT' });

  const queries = [];
  const client = await db.connect();
  const tracking = new Proxy(client, {
    get(target, prop) {
      if (prop === 'query') {
        return async (text, params) => {
          queries.push(text);
          return target.query(text, params);
        };
      }
      const value = target[prop];
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });

  await movementService.recordMovement(item.id, {
    type: 'receipt',
    quantity: 7,
    reason: 'Tracked',
    requestId: crypto.randomUUID(),
  }, tracking);
  client.release();

  assert.ok(queries.some((q) => /^BEGIN/i.test(q)), 'transaction begins');
  assert.ok(queries.some((q) => /FOR UPDATE/i.test(q)), 'row is locked');
  assert.ok(queries.some((q) => /INSERT INTO stock_movements/i.test(q)), 'movement inserted');
  assert.ok(queries.some((q) => /^UPDATE items/i.test(q)), 'stock updated');
  assert.ok(queries.some((q) => /^COMMIT/i.test(q)), 'transaction commits');
});

test('recorded movement follows the delta sign rules', async () => {
  const item = await createItem({ sku: 'TST-SIGN' });
  await recordViaWeb(item.id, { type: 'receipt', quantity: 10, reason: 'r' });
  await recordViaWeb(item.id, { type: 'dispatch', quantity: 4, reason: 'r' });
  await recordViaWeb(item.id, { type: 'adjustment', quantity: 8, reason: 'r' });

  const { rows } = await db.query(
    `SELECT type, delta FROM stock_movements
     WHERE item_id = $1 ORDER BY id`,
    [item.id]
  );
  assert.equal(rows[0].type, 'receipt');
  assert.ok(rows[0].delta > 0);
  assert.equal(rows[1].type, 'dispatch');
  assert.ok(rows[1].delta < 0);
  assert.equal(rows[2].type, 'adjustment');
  // 10 - 4 = 6, counted 8 → adjustment of +2 (adjustments may add).
  assert.equal(rows[2].delta, 2);
});

test('every movement row satisfies stock_after = stock_before + delta', async () => {
  const item = await createItem({ sku: 'TST-CONS' });
  await recordViaWeb(item.id, { type: 'receipt', quantity: 10, reason: 'r' });
  await recordViaWeb(item.id, { type: 'dispatch', quantity: 3, reason: 'r' });
  await recordViaWeb(item.id, { type: 'adjustment', quantity: 9, reason: 'r' });

  const { rows } = await db.query(
    `SELECT stock_before, stock_after, delta FROM stock_movements
     WHERE item_id = $1`,
    [item.id]
  );
  for (const row of rows) {
    assert.equal(row.stock_after, row.stock_before + row.delta);
    assert.ok(row.stock_before >= 0);
    assert.ok(row.stock_after >= 0);
  }
});
