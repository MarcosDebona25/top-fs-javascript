'use strict';

const pool = require('./pool');

async function createUser({ firstName, lastName, email, passwordHash }) {
  const { rows } = await pool.query(
    `INSERT INTO users (first_name, last_name, email, password_hash)
     VALUES ($1, $2, $3, $4)
     RETURNING id, first_name, last_name, email, is_member, is_admin`,
    [firstName, lastName, email, passwordHash]
  );
  return rows[0];
}

async function findUserByEmail(email) {
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return rows[0] || null;
}

async function findUserById(id) {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0] || null;
}

async function emailExists(email) {
  const { rows } = await pool.query('SELECT 1 FROM users WHERE email = $1', [email]);
  return rows.length > 0;
}

async function makeMember(userId) {
  await pool.query('UPDATE users SET is_member = TRUE WHERE id = $1', [userId]);
}

// Admins are always members too.
async function makeAdmin(userId) {
  await pool.query('UPDATE users SET is_admin = TRUE, is_member = TRUE WHERE id = $1', [userId]);
}

async function createMessage({ title, text, userId }) {
  const { rows } = await pool.query(
    'INSERT INTO messages (title, text, user_id) VALUES ($1, $2, $3) RETURNING id',
    [title, text, userId]
  );
  return rows[0];
}

// Author and date are only selected for members: a guest's query result never
// contains them, so they cannot leak through the template by mistake.
async function listMessages({ includeAuthor }) {
  const sql = includeAuthor
    ? `SELECT m.id, m.title, m.text, m.created_at,
              u.first_name, u.last_name
       FROM messages m JOIN users u ON u.id = m.user_id
       ORDER BY m.created_at DESC, m.id DESC`
    : `SELECT m.id, m.title, m.text
       FROM messages m
       ORDER BY m.created_at DESC, m.id DESC`;
  const { rows } = await pool.query(sql);
  return rows;
}

async function deleteMessage(id) {
  const { rowCount } = await pool.query('DELETE FROM messages WHERE id = $1', [id]);
  return rowCount > 0;
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  emailExists,
  makeMember,
  makeAdmin,
  createMessage,
  listMessages,
  deleteMessage,
};
