const cors = require('cors');
const { CORS_ORIGINS } = require('../lib/env');

const corsMiddleware = cors({
  origin(origin, callback) {
    // No Origin header: not a cross-origin browser request (curl, REST Client, same origin).
    // Writes without Origin are rejected later by the CSRF guard.
    if (!origin || CORS_ORIGINS.includes(origin)) return callback(null, true);
    return callback(null, false); // no CORS headers: the browser blocks the response
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'X-Requested-With'],
  maxAge: 600,
});

module.exports = corsMiddleware;
