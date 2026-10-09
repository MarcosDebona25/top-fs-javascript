'use strict';

const crypto = require('crypto');
const { ForbiddenError } = require('./errors');

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

// In-memory failed-attempt tracker keyed by IP. Good enough for a single-process
// local application; a shared store would be needed behind multiple workers.
const attempts = new Map();

function passwordMatches(input) {
  const configured = process.env.ADMIN_PASSWORD;
  if (typeof input !== 'string' || input === '' || !configured) return false;
  // Compare fixed-length digests so timingSafeEqual always receives equal-length
  // buffers, regardless of the input length.
  const inputDigest = crypto.createHash('sha256').update(input).digest();
  const configuredDigest = crypto.createHash('sha256').update(configured).digest();
  return crypto.timingSafeEqual(inputDigest, configuredDigest);
}

function isRateLimited(ip) {
  const record = attempts.get(ip);
  if (!record) return false;
  if (Date.now() > record.resetAt) {
    attempts.delete(ip);
    return false;
  }
  return record.count >= MAX_ATTEMPTS;
}

// Drop expired records so addresses that never come back do not accumulate.
function purgeExpired(now) {
  for (const [ip, record] of attempts) {
    if (now > record.resetAt) attempts.delete(ip);
  }
}

function recordFailure(ip) {
  const now = Date.now();
  purgeExpired(now);
  const record = attempts.get(ip);
  if (!record || now > record.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    record.count += 1;
  }
}

function clearFailures(ip) {
  attempts.delete(ip);
}

// Test support: forget every recorded failure.
function resetRateLimits() {
  attempts.clear();
}

// Applied to every protected POST. Never stores the password, logs it, or keeps
// an authenticated state: it is verified again on each protected action.
function requireAdminPassword(req, res, next) {
  const ip = req.ip;
  if (isRateLimited(ip)) {
    return next(
      new ForbiddenError(
        'Too many failed password attempts. Wait 15 minutes before trying again.'
      )
    );
  }
  if (!passwordMatches(req.body.admin_password)) {
    recordFailure(ip);
    return next(
      new ForbiddenError(
        'Incorrect or missing password. Enter the administrative password to continue.'
      )
    );
  }
  clearFailures(ip);
  return next();
}

module.exports = {
  requireAdminPassword,
  passwordMatches,
  isRateLimited,
  recordFailure,
  clearFailures,
  resetRateLimits,
};
