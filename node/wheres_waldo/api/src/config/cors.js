const cors = require('cors');

function createCors(config) {
  return cors({
    origin(origin, callback) {
      // No Origin header: not a cross-origin browser request (curl, REST Client, same origin).
      if (!origin || config.CORS_ORIGINS.includes(origin)) return callback(null, true);
      return callback(null, false); // no CORS headers: the browser blocks the response
    },
    credentials: true,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    maxAge: 600,
  });
}

module.exports = createCors;
