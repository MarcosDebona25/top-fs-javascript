const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const { HttpError } = require('../lib/http');

function limiter(options) {
  return rateLimit({
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (req, res, next) => next(new HttpError(429, 'Too many attempts. Try again later.', { code: 'RATE_LIMITED' })),
    ...options,
  });
}

// Built per app, so every createApp() starts with empty counters.
function createLimiters(config) {
  return {
    // Brute-force protection for login and sign-up (per IP).
    auth: limiter({ windowMs: 15 * 60 * 1000, limit: config.AUTH_RATE_LIMIT }),
    // The inline username check fires while typing, so it gets a much wider budget.
    availability: limiter({ windowMs: 60 * 1000, limit: 60 }),
    // Starting games creates rows: keep scripts from flooding the table.
    start: limiter({ windowMs: 60 * 1000, limit: config.START_RATE_LIMIT }),
    // Per game and IP: a person clicks a few times a second at most; a script clicks the whole map.
    guess: limiter({
      windowMs: 10 * 1000,
      limit: config.GUESS_RATE_LIMIT,
      keyGenerator: (req) => `${ipKeyGenerator(req.ip)}:${req.params.id}`,
    }),
  };
}

module.exports = createLimiters;
