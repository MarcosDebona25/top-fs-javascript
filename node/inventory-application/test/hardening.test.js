'use strict';

// Malformed, oversized and repeated input: every case here must end in a
// 4xx response and leave the data untouched, never in a 500.

const test = require('node:test');
const assert = require('node:assert/strict');
const { beforeEach } = require('node:test');

require('./bootstrap');

const {
  agent,
  resetDatabase,
  createCategory,
  createItem,
  publicPost,
  protectedPost,
  postForm,
  extractHidden,
  countRows,
  db,
  crypto,
  ADMIN_PASSWORD,
} = require('./helpers');

const categoryDb = require('../db/categories');
const { MAX_MOVEMENT_QUANTITY, MAX_STOCK } = require('../lib/limits');

beforeEach(async () => {
  await resetDatabase();
});

async function postMovement(itemId, fields) {
  const agentInstance = agent();
  const form = await agentInstance.get(`/items/${itemId}/movements/new?type=${fields.type}`);
  return postForm(agentInstance, `/items/${itemId}/movements`, {
    reason: 'Test reason',
    request_id: extractHidden(form, 'request_id'),
    _csrf: extractHidden(form, '_csrf'),
    admin_password: ADMIN_PASSWORD,
    ...fields,
  });
}

async function stockOf(itemId) {
  const { rows } = await db.query('SELECT stock_quantity FROM items WHERE id = $1', [itemId]);
  return rows[0].stock_quantity;
}

test('receipts and dispatches are capped per movement', async () => {
  const item = await createItem({ sku: 'TST-CAP' });

  const overCap = await postMovement(item.id, {
    type: 'receipt',
    quantity: String(MAX_MOVEMENT_QUANTITY + 1),
  });
  assert.equal(overCap.status, 422);
  assert.match(overCap.text, new RegExp(`${MAX_MOVEMENT_QUANTITY} units or fewer`));

  const beyondInteger = await postMovement(item.id, { type: 'receipt', quantity: '3000000000' });
  assert.equal(beyondInteger.status, 422);

  const dispatchOverCap = await postMovement(item.id, {
    type: 'dispatch',
    quantity: String(MAX_MOVEMENT_QUANTITY + 1),
  });
  assert.equal(dispatchOverCap.status, 422);
  assert.equal(await countRows('stock_movements'), 0);

  const atCap = await postMovement(item.id, {
    type: 'receipt',
    quantity: String(MAX_MOVEMENT_QUANTITY),
  });
  assert.equal(atCap.status, 303);
  assert.equal(await stockOf(item.id), MAX_MOVEMENT_QUANTITY);
});

test('adjustments are capped at the maximum stock', async () => {
  const item = await createItem({ sku: 'TST-ADJCAP' });

  const overCap = await postMovement(item.id, {
    type: 'adjustment',
    quantity: String(MAX_STOCK + 1),
  });
  assert.equal(overCap.status, 422);
  assert.equal(await countRows('stock_movements'), 0);

  const atCap = await postMovement(item.id, { type: 'adjustment', quantity: String(MAX_STOCK) });
  assert.equal(atCap.status, 303);
  assert.equal(await stockOf(item.id), MAX_STOCK);
});

test('a receipt that would exceed the maximum stock is rejected with 409', async () => {
  const item = await createItem({ sku: 'TST-FULL' });
  await postMovement(item.id, { type: 'adjustment', quantity: String(MAX_STOCK - 5) });

  const res = await postMovement(item.id, { type: 'receipt', quantity: '6' });
  assert.equal(res.status, 409);
  assert.match(res.text, /above the limit/);
  // The conflict page is rendered with the complete part, name included.
  assert.match(res.text, /Test part/);
  assert.equal(await stockOf(item.id), MAX_STOCK - 5);
  assert.equal(await countRows('stock_movements'), 1);
});

test('category page treats page=0 as the first page', async () => {
  const category = await createCategory({ name: 'Braking' });
  await createItem({ sku: 'BRK-0001', name: 'Brake Pad', category });

  const res = await agent().get(`/categories/${category.id}?page=0`);
  assert.equal(res.status, 200);
  assert.match(res.text, /Brake Pad/);
});

test('oversized and non-decimal ids return 404, never 500', async () => {
  const item = await createItem({ sku: 'TST-IDS' });

  const paths = [
    '/items/99999999999',
    '/items/1e3',
    '/items/0x10',
    '/items/1.0',
    '/items/-1',
    '/items/0',
    '/items/abc/edit',
    '/items/99999999999/movements/new',
    '/categories/99999999999',
    '/categories/1e0',
    '/categories/99999999999/delete',
  ];
  for (const path of paths) {
    const res = await agent().get(path);
    assert.equal(res.status, 404, `Expected 404 for ${path}`);
  }

  // The plain decimal form of the same id still works.
  assert.equal((await agent().get(`/items/${item.id}`)).status, 200);
});

test('oversized filter and page values are ignored instead of failing', async () => {
  await createItem({ sku: 'TST-QUERY', name: 'Query part' });

  const hugeCategory = await agent().get('/items?category_id=99999999999');
  assert.equal(hugeCategory.status, 200);
  assert.match(hugeCategory.text, /Query part/);

  const hugePage = await agent().get('/items?page=999999999999999999999');
  assert.equal(hugePage.status, 200);
  assert.match(hugePage.text, /Query part/);

  const preselect = await agent().get('/items/new?category_id=99999999999');
  assert.equal(preselect.status, 200);
});

test('posting a movement to a non-numeric part id returns 404', async () => {
  const item = await createItem({ sku: 'TST-NAN' });
  const agentInstance = agent();
  const form = await agentInstance.get(`/items/${item.id}/movements/new?type=receipt`);

  for (const badId of ['abc', '99999999999', '1e0']) {
    const res = await postForm(agentInstance, `/items/${badId}/movements`, {
      type: 'receipt',
      quantity: '1',
      reason: 'Test reason',
      request_id: crypto.randomUUID(),
      _csrf: extractHidden(form, '_csrf'),
      admin_password: ADMIN_PASSWORD,
    });
    assert.equal(res.status, 404, `Expected 404 for id ${badId}`);
  }
  assert.equal(await countRows('stock_movements'), 0);
});

test('a page beyond the last one shows the last page, consistently', async () => {
  const category = await createCategory({ name: 'Braking' });
  for (let i = 1; i <= 25; i += 1) {
    await createItem({
      sku: `BRK-${String(i).padStart(4, '0')}`,
      name: `Brake Part ${String(i).padStart(2, '0')}`,
      category,
    });
  }

  const catalog = await agent().get('/items?page=99');
  assert.equal(catalog.status, 200);
  assert.equal((catalog.text.match(/data-label="SKU"/g) || []).length, 5);
  assert.doesNotMatch(catalog.text, /No parts match/);
  assert.match(catalog.text, /Brake Part 25/);

  const categoryPage = await agent().get(`/categories/${category.id}?page=99`);
  assert.equal(categoryPage.status, 200);
  assert.equal((categoryPage.text.match(/data-label="SKU"/g) || []).length, 5);
});

test('a request id already used for another part is a conflict, not a replay', async () => {
  const category = await createCategory({ name: 'Braking' });
  const first = await createItem({ sku: 'TST-ONE', category });
  const second = await createItem({ sku: 'TST-TWO', name: 'Second part', category });

  const requestId = crypto.randomUUID();
  const original = await postMovement(first.id, {
    type: 'receipt',
    quantity: '4',
    request_id: requestId,
  });
  assert.equal(original.status, 303);

  const reused = await postMovement(second.id, {
    type: 'receipt',
    quantity: '9',
    request_id: requestId,
  });
  assert.equal(reused.status, 409);
  assert.match(reused.text, /another part/);
  assert.match(reused.text, /Second part/);

  assert.equal(await stockOf(first.id), 4);
  assert.equal(await stockOf(second.id), 0);
  assert.equal(await countRows('stock_movements'), 1);

  // The same id on the original part is still a harmless replay.
  const replay = await postMovement(first.id, {
    type: 'receipt',
    quantity: '4',
    request_id: requestId,
  });
  assert.equal(replay.status, 303);
  assert.equal(await stockOf(first.id), 4);
});

test('a form field sent twice is rejected with 422', async () => {
  const item = await createItem({ sku: 'TST-DUP' });
  const agentInstance = agent();
  const form = await agentInstance.get(`/items/${item.id}/movements/new?type=receipt`);
  const base =
    `type=receipt&reason=Test&_csrf=${encodeURIComponent(extractHidden(form, '_csrf'))}` +
    `&admin_password=${encodeURIComponent(ADMIN_PASSWORD)}`;
  const requestId = extractHidden(form, 'request_id');

  const twoQuantities = await agentInstance
    .post(`/items/${item.id}/movements`)
    .type('form')
    .send(`${base}&request_id=${requestId}&quantity=1&quantity=2`);
  assert.equal(twoQuantities.status, 422);

  const twoRequestIds = await agentInstance
    .post(`/items/${item.id}/movements`)
    .type('form')
    .send(`${base}&quantity=1&request_id=${requestId}&request_id=${crypto.randomUUID()}`);
  assert.equal(twoRequestIds.status, 422);

  assert.equal(await countRows('stock_movements'), 0);
});

test('editing a part never changes its SKU', async () => {
  const category = await createCategory({ name: 'Braking' });
  const item = await createItem({ sku: 'TST-KEEP', name: 'Old name', category });
  await createItem({ sku: 'TST-TAKEN', name: 'Other part', category });

  const fields = {
    category_id: String(category.id),
    name: 'New name',
    brand: 'New brand',
    unit_price: '12.50',
  };

  // A free SKU and one that belongs to another part are both ignored.
  for (const sku of ['TST-CHANGED', 'TST-TAKEN']) {
    const res = await protectedPost(agent(), `/items/${item.id}/edit`, `/items/${item.id}/edit`, {
      ...fields,
      sku,
    });
    assert.equal(res.status, 303, `Expected 303 when submitting sku ${sku}`);
  }

  const { rows } = await db.query('SELECT sku, name, brand, unit_price FROM items WHERE id = $1', [item.id]);
  assert.deepEqual(rows[0], { sku: 'TST-KEEP', name: 'New name', brand: 'New brand', unit_price: '12.50' });

  const invalid = await protectedPost(agent(), `/items/${item.id}/edit`, `/items/${item.id}/edit`, {
    ...fields,
    name: 'x',
  });
  assert.equal(invalid.status, 422);
  assert.match(invalid.text, /TST-KEEP/);
});

test('search matches % and _ literally', async () => {
  const category = await createCategory({ name: 'Supplies' });
  await createItem({ sku: 'SUP-0001', name: 'Shop Rag 100% Cotton', category });
  await createItem({ sku: 'SUP-0002', name: 'Hose_Clamp', category });
  await createItem({ sku: 'SUP-0003', name: 'Plain part', category });

  const percent = await agent().get('/items?q=%25');
  assert.equal((percent.text.match(/data-label="SKU"/g) || []).length, 1);
  assert.match(percent.text, /Shop Rag/);

  const underscore = await agent().get('/items?q=_');
  assert.equal((underscore.text.match(/data-label="SKU"/g) || []).length, 1);
  assert.match(underscore.text, /Hose_Clamp/);

  const backslash = await agent().get('/items?q=%5C');
  assert.equal(backslash.status, 200);
  assert.equal((backslash.text.match(/data-label="SKU"/g) || []).length, 0);
});

test('an oversized category id on a new part is a field error', async () => {
  await createCategory({ name: 'Braking' });

  const res = await publicPost(agent(), '/items/new', '/items', {
    category_id: '99999999999999',
    sku: 'BRK-0001',
    name: 'Brake Pad',
    brand: 'Brembo',
    unit_price: '89.90',
  });
  assert.equal(res.status, 422);
  assert.match(res.text, /Select a category\./);
  assert.doesNotMatch(res.text, /out of range/);
  assert.equal(await countRows('items'), 0);
});

test('a database failure during validation is not shown as a field error', async (t) => {
  t.mock.method(categoryDb, 'findCategoryByName', async () => {
    throw new Error('connection refused by database host');
  });
  t.mock.method(console, 'error', () => {});

  const res = await publicPost(agent(), '/categories/new', '/categories', {
    name: 'Cooling',
    description: '',
  });
  assert.equal(res.status, 500);
  assert.doesNotMatch(res.text, /connection refused/);
});

test('an invalid CSRF token explains what to do', async () => {
  const res = await postForm(agent(), '/categories', { name: 'No CSRF', description: '' });
  assert.equal(res.status, 403);
  assert.match(res.text, /security token/);
  assert.doesNotMatch(res.text, /unexpected error/);
});
