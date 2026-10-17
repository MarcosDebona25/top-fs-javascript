const { HttpError } = require('../lib/http');
const { CORS_ORIGINS } = require('../lib/env');

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const CLIENT_HEADER_VALUE = 'blog-client';

function csrfGuard(req, res, next) {
  if (!UNSAFE_METHODS.has(req.method)) return next();

  // The browser sets Sec-Fetch-Site; a cross-site write is always rejected.
  if (req.get('Sec-Fetch-Site') === 'cross-site') {
    return next(new HttpError(403, 'Cross-site request blocked'));
  }
  // A missing Origin or "null" is no proof that the request comes from our frontends.
  const origin = req.get('Origin');
  if (!origin || !CORS_ORIGINS.includes(origin)) {
    return next(new HttpError(403, 'Origin not allowed'));
  }
  // A custom header can only be sent cross-origin after passing the CORS preflight.
  if (req.get('X-Requested-With') !== CLIENT_HEADER_VALUE) {
    return next(new HttpError(403, 'Missing request header'));
  }
  return next();
}

module.exports = { csrfGuard };
