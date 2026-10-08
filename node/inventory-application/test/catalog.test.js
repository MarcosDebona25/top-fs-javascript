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
  publicPost,
  protectedPost,
  postForm,
  extractCsrfToken,
  countRows,
  ADMIN_PASSWORD,
} = require('./helpers');

beforeEach(async () => {
  await resetDatabase();
});

test('home page lists categories with their active part counts', async () => {
  await createCategory({ name: 'Braking' });
  const category = await createCategory({ name: 'Engine' });
  await createItem({ sku: 'ENG-0001', category });

  const res = await agent().get('/');
  assert.equal(res.status, 200);
  assert.match(res.text, /Axle Supply/);
  assert.match(res.text, /Braking/);
  assert.match(res.text, /Engine/);
  // Engine has 1 active part, Braking none.
  const engine = res.text.indexOf('Engine');
  const braking = res.text.indexOf('Braking');
  assert.match(res.text.slice(engine, engine + 400), /<span class="mono">1<\/span>\s*active part/);
  assert.match(res.text.slice(braking, braking + 400), /<span class="mono">0<\/span>\s*active parts/);
});

test('creating a category is public (no password required)', async () => {
  const res = await publicPost(agent(), '/categories/new', '/categories', {
    name: 'Suspension',
    description: 'Dampers and mounts',
  });
  assert.equal(res.status, 303);
  assert.match(res.headers.location, /\/categories\/\d+/);
  assert.equal(await countRows('categories'), 1);
});

test('category names are unique without regard to capital letters', async () => {
  await createCategory({ name: 'Braking' });

  const res = await publicPost(agent(), '/categories/new', '/categories', {
    name: 'BRAKING',
    description: '',
  });
  assert.equal(res.status, 422);
  assert.match(res.text, /already exists/i);
  assert.equal(await countRows('categories'), 1);
});

test('category name must be between 2 and 80 characters', async () => {
  const tooShort = await publicPost(agent(), '/categories/new', '/categories', {
    name: 'x',
    description: '',
  });
  assert.equal(tooShort.status, 422);
  assert.match(tooShort.text, /between 2 and 80 characters/i);

  const tooLong = await publicPost(agent(), '/categories/new', '/categories', {
    name: 'a'.repeat(81),
    description: '',
  });
  assert.equal(tooLong.status, 422);
});

test('category description is limited to 1000 characters', async () => {
  const res = await publicPost(agent(), '/categories/new', '/categories', {
    name: 'Cooling',
    description: 'd'.repeat(1001),
  });
  assert.equal(res.status, 422);
  assert.match(res.text, /1000 characters or fewer/i);
});

test('duplicate data returns 422 and preserves entered values', async () => {
  await createCategory({ name: 'Cooling' });

  const res = await publicPost(agent(), '/categories/new', '/categories', {
    name: 'Cooling',
    description: 'Keep the engine cold',
  });
  assert.equal(res.status, 422);
  assert.match(res.text, /value="Cooling"/);
  assert.match(res.text, /Keep the engine cold/);
});

test('category page shows the category and its active parts', async () => {
  const category = await createCategory({ name: 'Braking' });
  await createItem({ sku: 'BRK-0001', name: 'Brake Pad', category });
  await createItem({ sku: 'BRK-0002', name: 'Brake Rotor', category });

  const res = await agent().get(`/categories/${category.id}`);
  assert.equal(res.status, 200);
  assert.match(res.text, /Braking/);
  assert.match(res.text, /Brake Pad/);
  assert.match(res.text, /Brake Rotor/);
});

test('unknown category returns 404', async () => {
  const res = await agent().get('/categories/999');
  assert.equal(res.status, 404);
});

test('editing a category requires the password and persists changes', async () => {
  const category = await createCategory({ name: 'Braking', description: 'Old' });

  // A wrong password is rejected before anything is changed.
  const agentInstance = agent();
  const form = await agentInstance.get(`/categories/${category.id}/edit`);
  const token = extractCsrfToken(form);
  const wrongPassword = await agentInstance
    .post(`/categories/${category.id}/edit`)
    .type('form')
    .send({ name: 'Braking v2', description: 'New', _csrf: token, admin_password: 'wrong-password' });
  assert.equal(wrongPassword.status, 403);

  const res = await protectedPost(
    agent(),
    `/categories/${category.id}/edit`,
    `/categories/${category.id}/edit`,
    { name: 'Braking v2', description: 'New description' }
  );
  assert.equal(res.status, 303);
  assert.equal(res.headers.location, `/categories/${category.id}`);

  const { rows } = await require('./helpers').db.query(
    'SELECT name, description FROM categories WHERE id = $1',
    [category.id]
  );
  assert.equal(rows[0].name, 'Braking v2');
  assert.equal(rows[0].description, 'New description');
});

test('protected category edit without CSRF token is rejected with 403', async () => {
  const category = await createCategory({ name: 'Braking' });
  const res = await postForm(agent(), `/categories/${category.id}/edit`, {
    name: 'Hacked',
    description: '',
    admin_password: require('./helpers').ADMIN_PASSWORD,
  });
  assert.equal(res.status, 403);
});

test('deleting an empty category succeeds and redirects home', async () => {
  const category = await createCategory({ name: 'Accessories' });

  const res = await protectedPost(
    agent(),
    `/categories/${category.id}/delete`,
    `/categories/${category.id}/delete`,
    {}
  );
  assert.equal(res.status, 303);
  assert.equal(res.headers.location, '/');
  assert.equal(await countRows('categories', 'id = $1', [category.id]), 0);
});

test('deleting a category with active parts is blocked with 409 and lists them', async () => {
  const category = await createCategory({ name: 'Braking' });
  const item = await createItem({ sku: 'BRK-0001', name: 'Brake Pad', category });

  // The delete page shows the parts that block deletion
  // instead of a confirmation form, so the per-session
  // CSRF token comes from the new-category form.
  const agentInstance = agent();
  const form = await agentInstance.get('/categories/new');
  const token = extractCsrfToken(form);
  const res = await agentInstance
    .post(`/categories/${category.id}/delete`)
    .type('form')
    .send({ _csrf: token, admin_password: ADMIN_PASSWORD });
  assert.equal(res.status, 409);
  assert.match(res.text, /cannot be deleted/i);
  assert.match(res.text, /BRK-0001/);
  assert.match(res.text, /Brake Pad/);
  assert.equal(await countRows('categories', 'id = $1', [category.id]), 1);
  assert.equal(item.id > 0, true);
});

test('deleting a category with archived parts is also blocked', async () => {
  const category = await createCategory({ name: 'Braking' });
  const item = await createItem({ sku: 'BRK-0001', category });
  const { db } = require('./helpers');
  await db.query('UPDATE items SET archived_at = now(), stock_quantity = 0 WHERE id = $1', [item.id]);

  const agentInstance = agent();
  const form = await agentInstance.get('/categories/new');
  const token = extractCsrfToken(form);
  const res = await agentInstance
    .post(`/categories/${category.id}/delete`)
    .type('form')
    .send({ _csrf: token, admin_password: ADMIN_PASSWORD });
  assert.equal(res.status, 409);
  assert.equal(await countRows('categories', 'id = $1', [category.id]), 1);
});

test('delete confirmation page shows the parts that block deletion', async () => {
  const category = await createCategory({ name: 'Braking' });
  await createItem({ sku: 'BRK-0001', name: 'Brake Pad', category });

  const res = await agent().get(`/categories/${category.id}/delete`);
  assert.equal(res.status, 200);
  assert.match(res.text, /Parts that block deletion/i);
  assert.match(res.text, /BRK-0001/);
});

test('catalog filters, search and pagination keep working together', async () => {
  const category = await createCategory({ name: 'Braking' });
  for (let i = 1; i <= 25; i += 1) {
    await createItem({
      sku: `BRK-${String(i).padStart(4, '0')}`,
      name: `Brake Part ${i}`,
      category,
    });
  }

  const page1 = await agent().get('/items');
  assert.equal(page1.status, 200);
  assert.equal((page1.text.match(/data-label="SKU"/g) || []).length, 20);
  assert.match(page1.text, /page=2/);

  const page2 = await agent().get('/items?page=2');
  assert.equal((page2.text.match(/data-label="SKU"/g) || []).length, 5);

  // Search by name, case-insensitive.
  const search = await agent().get('/items?q=brake%20part%203');
  assert.match(search.text, /Brake Part 3/);
  assert.doesNotMatch(search.text, /Brake Part 1(?!\d)/);

  // Search by SKU and brand.
  const bySku = await agent().get('/items?q=brk-0007');
  assert.match(bySku.text, /BRK-0007/);

  // Filters are preserved in pagination links.
  const filtered = await agent().get('/items?q=brake&category_id=1');
  const pageLinks = filtered.text.match(/href="\/items\?[^"]*page=2[^"]*"/g) || [];
  assert.ok(pageLinks.length > 0, 'pagination to page 2 exists');
  assert.match(pageLinks[0], /category_id=1/);
  assert.match(pageLinks[0], /q=brake/);
});

test('catalog filters by category, availability and status', async () => {
  const category = await createCategory({ name: 'Braking' });
  const inStock = await createItem({ sku: 'BRK-0001', name: 'In stock part', category });
  const { db } = require('./helpers');
  await db.query('UPDATE items SET stock_quantity = 5 WHERE id = $1', [inStock.id]);
  const empty = await createItem({ sku: 'BRK-0002', name: 'Empty part', category });

  const inStockRes = await agent().get('/items?availability=in_stock');
  assert.match(inStockRes.text, /In stock part/);
  assert.doesNotMatch(inStockRes.text, /Empty part/);

  const outOfStock = await agent().get('/items?availability=out_of_stock');
  assert.match(outOfStock.text, /Empty part/);
  assert.doesNotMatch(outOfStock.text, /In stock part/);

  await db.query('UPDATE items SET archived_at = now() WHERE id = $1', [empty.id]);
  const archived = await agent().get('/items?status=archived');
  assert.match(archived.text, /Empty part/);
  assert.doesNotMatch(archived.text, /In stock part/);

  const active = await agent().get('/items?status=active');
  assert.match(active.text, /In stock part/);
  assert.doesNotMatch(active.text, /Empty part/);
});

test('new part form requires an existing category and starts at zero stock', async () => {
  const category = await createCategory({ name: 'Braking' });

  const form = await agent().get('/items/new');
  assert.equal(form.status, 200);
  assert.ok(form.text.includes(`value="${category.id}"`), 'the created category is offered in the select');

  const res = await publicPost(agent(), '/items/new', '/items', {
    category_id: String(category.id),
    sku: 'brk-0001',
    name: 'Brake Pad',
    brand: 'Brembo',
    unit_price: '89.90',
  });
  assert.equal(res.status, 303);

  const { rows } = await require('./helpers').db.query(
    'SELECT sku, stock_quantity FROM items WHERE id = $1',
    [Number(new URL(res.headers.location, 'http://localhost').pathname.split('/').pop())]
  );
  // SKU is normalized to capitals and the part starts at zero.
  assert.equal(rows[0].sku, 'BRK-0001');
  assert.equal(rows[0].stock_quantity, 0);
});

test('new part form indicates that a category must be created first', async () => {
  const res = await agent().get('/items/new');
  assert.equal(res.status, 200);
  assert.match(res.text, /Create a category first/i);
  assert.doesNotMatch(res.text, /<form/);
});

test('duplicate SKU is rejected, even with different capitalization', async () => {
  const category = await createCategory({ name: 'Braking' });
  await createItem({ sku: 'BRK-0001', category });

  const res = await publicPost(agent(), '/items/new', '/items', {
    category_id: String(category.id),
    sku: 'brk-0001',
    name: 'Another part',
    brand: 'Brembo',
    unit_price: '10.00',
  });
  assert.equal(res.status, 422);
  assert.match(res.text, /already exists/i);
  assert.equal(await countRows('items'), 1);
});

test('invalid part data returns 422 with field errors', async () => {
  const category = await createCategory({ name: 'Braking' });

  const cases = [
    { sku: 'ab', name: 'Valid name', brand: 'B', unit_price: '1.00' }, // SKU too short
    { sku: '-abc', name: 'Valid name', brand: 'B', unit_price: '1.00' }, // SKU bad start
    { sku: 'ABC-1', name: 'x', brand: 'B', unit_price: '1.00' }, // name too short
    { sku: 'ABC-1', name: 'Valid name', brand: '', unit_price: '1.00' }, // missing brand
    { sku: 'ABC-1', name: 'Valid name', brand: 'B', unit_price: '-5.00' }, // negative price
    { sku: 'ABC-1', name: 'Valid name', brand: 'B', unit_price: '12.345' }, // too many decimals
    { sku: 'ABC-1', name: 'Valid name', brand: 'B', unit_price: 'abc' }, // not a number
    { sku: 'ABC-1', name: 'Valid name', brand: 'B', unit_price: '1.00', category_id: '999' }, // unknown category
  ];

  for (const form of cases) {
    const res = await publicPost(agent(), '/items/new', '/items', form);
    assert.equal(res.status, 422, `Expected 422 for ${JSON.stringify(form)}`);
    assert.match(res.text, /There is a problem/);
  }
  assert.equal(await countRows('items'), 0);
});

test('part page shows the identification plate, stock and history', async () => {
  const category = await createCategory({ name: 'Braking' });
  const item = await createItem({
    sku: 'BRK-0001',
    name: 'Brake Pad Set',
    brand: 'Brembo',
    part_number: 'P 85 036',
    unit_price: '89.90',
    category,
  });
  const { db } = require('./helpers');
  await db.query(
    `INSERT INTO stock_movements (item_id, type, delta, stock_before, stock_after, reason, request_id)
     VALUES ($1, 'receipt', 10, 0, 10, 'Delivery', $2)`,
    [item.id, require('./helpers').crypto.randomUUID()]
  );

  const res = await agent().get(`/items/${item.id}`);
  assert.equal(res.status, 200);
  assert.match(res.text, /Part identification/i);
  assert.match(res.text, /Brake Pad Set/);
  assert.match(res.text, /Brembo/);
  assert.match(res.text, /P 85 036/);
  assert.match(res.text, /\$89\.90/);
  assert.match(res.text, /Delivery/);
});

test('part history is paginated in groups of 20, newest first', async () => {
  const item = await createItem({ sku: 'TST-HIST' });
  const { db, crypto } = require('./helpers');
  for (let i = 1; i <= 25; i += 1) {
    await db.query(
      `INSERT INTO stock_movements (item_id, type, delta, stock_before, stock_after, reason, request_id, created_at)
       VALUES ($1, 'receipt', 1, 0, 1, $2, $3, now() - ($4::int * interval '1 minute'))`,
      [item.id, `Movement ${i}`, crypto.randomUUID(), 25 - i]
    );
  }

  const page1 = await agent().get(`/items/${item.id}`);
  const reasons1 = page1.text.match(/Movement \d+/g) || [];
  assert.equal(reasons1.length, 20);
  // Newest first: Movement 25 appears on page 1, Movement 1 does not.
  assert.match(page1.text, /Movement 25/);
  assert.doesNotMatch(page1.text, /Movement 1(?!\d)/);

  const page2 = await agent().get(`/items/${item.id}?page=2`);
  const reasons2 = page2.text.match(/Movement \d+/g) || [];
  assert.equal(reasons2.length, 5);
  assert.match(page2.text, /Movement 1(?!\d)/);
});

test('search treats user input as a parameter, not SQL', async () => {
  await createItem({ sku: 'TST-0001', name: 'Brake Pad' });
  const attack = "'; DROP TABLE items; --";

  const res = await agent().get(`/items?q=${encodeURIComponent(attack)}`);
  assert.equal(res.status, 200);
  assert.match(res.text, /No parts match/);
  // The table still exists and keeps its data.
  assert.equal(await countRows('items'), 1);
});

test('user-entered content is escaped in the rendered page', async () => {
  await createCategory({ name: '<script>alert("xss")</script>' });

  const res = await agent().get('/');
  assert.equal(res.status, 200);
  assert.doesNotMatch(res.text, /<script>alert/);
  assert.match(res.text, /&lt;script&gt;/);
});
