'use strict';

const crypto = require('crypto');
const request = require('supertest');
const db = require('../db/pool');
const adminAuth = require('../lib/admin-auth');
const app = require('../app');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

function agent() {
  return request.agent(app);
}

// Extract a hidden field from a rendered form page.
function extractHidden(res, name) {
  const pattern = new RegExp(`name="${name}" value="([^"]*)"`);
  const match = res.text.match(pattern);
  return match ? match[1] : null;
}

function extractCsrfToken(res) {
  const token = extractHidden(res, '_csrf');
  if (!token) {
    throw new Error('CSRF token not found in the rendered form');
  }
  return token;
}

async function resetDatabase() {
  await db.query(
    'TRUNCATE TABLE stock_movements, items, categories RESTART IDENTITY CASCADE'
  );
}

async function createCategory({ name = 'Braking', description = '' } = {}) {
  // Fixture helper: reuse the category when it already
  // exists so repeated fixture calls stay idempotent.
  const { rows } = await db.query(
    `INSERT INTO categories (name, description)
     VALUES ($1, $2)
     ON CONFLICT (lower(name)) DO UPDATE SET name = EXCLUDED.name
     RETURNING *`,
    [name, description]
  );
  return rows[0];
}

async function createItem({
  sku = 'TST-0001',
  name = 'Test part',
  brand = 'Test brand',
  part_number = null,
  description = '',
  unit_price = '10.00',
  category = null,
} = {}) {
  const record = category || (await createCategory());
  const { rows } = await db.query(
    `INSERT INTO items
       (category_id, sku, name, brand, part_number, description, unit_price)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [record.id, sku, name, brand, part_number, description, unit_price]
  );
  return rows[0];
}

// Posts a form as a browser would: urlencoded body with the
// session cookie carried by the agent.
function postForm(agentInstance, path, form) {
  return agentInstance.post(path).type('form').send(form);
}

// Posts a public form (no administrative password required).
async function publicPost(agentInstance, formPath, postPath, form = {}) {
  const page = await agentInstance.get(formPath);
  const token = extractCsrfToken(page);
  return postForm(agentInstance, postPath, { ...form, _csrf: token });
}

// Posts a protected form with the administrative password.
async function protectedPost(agentInstance, formPath, postPath, form = {}) {
  const page = await agentInstance.get(formPath);
  const token = extractCsrfToken(page);
  return postForm(agentInstance, postPath, {
    ...form,
    _csrf: token,
    admin_password: ADMIN_PASSWORD,
  });
}

async function countRows(table, where = 'TRUE', params = []) {
  const { rows } = await db.query(
    `SELECT COUNT(*)::int AS total FROM ${table} WHERE ${where}`,
    params
  );
  return rows[0].total;
}

module.exports = {
  app,
  agent,
  extractHidden,
  extractCsrfToken,
  resetDatabase,
  createCategory,
  createItem,
  postForm,
  publicPost,
  protectedPost,
  countRows,
  adminAuth,
  ADMIN_PASSWORD,
  crypto,
  db,
};
