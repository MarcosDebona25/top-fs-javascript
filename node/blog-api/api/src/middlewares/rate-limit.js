const { rateLimit } = require('express-rate-limit');
const { HttpError } = require('../lib/http');

// Brute-force protection for login and sign-up: 10 attempts per IP every 15 minutes.
// AUTH_RATE_LIMIT only exists for the end-to-end suite, which logs in more often than that from one IP.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT) || 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (req, res, next) => next(new HttpError(429, 'Too many attempts. Try again later.')),
});

module.exports = { authLimiter };
