'use strict';

// Ids are PostgreSQL INTEGER keys: positive, at most 9 digits. Anything else
// (letters, signs, exponents, hex, oversized values, repeated fields) is
// treated as "no such id" instead of being sent to the database.
const ID_PATTERN = /^[1-9]\d{0,8}$/;
const PAGE_PATTERN = /^\d{1,9}$/;

function parseId(value) {
  if (typeof value !== 'string' || !ID_PATTERN.test(value)) return null;
  return Number(value);
}

// Page numbers start at 1; anything unreadable falls back to the first page.
function parsePage(value) {
  if (typeof value !== 'string' || !PAGE_PATTERN.test(value)) return 1;
  return Math.max(1, Number(value));
}

module.exports = { parseId, parsePage };
