const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const { Pool } = require('pg');

const COOKIE_NAME = 'waldo.sid';
const DAY = 24 * 60 * 60 * 1000;

// Sessions live in the "session" table (see the Session model), so they survive a restart.
function createSession(config) {
  const pool = new Pool({ connectionString: config.DATABASE_URL });
  const store = new PgSession({
    pool,
    tableName: 'session',
    createTableIfMissing: false,
    pruneSessionInterval: config.SESSION_PRUNE ? 15 * 60 : false,
  });
  const middleware = session({
    name: COOKIE_NAME,
    store,
    secret: config.SESSION_SECRET,
    resave: false,
    // Guests never get a cookie: a session only exists once somebody logs in.
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: config.COOKIE_SECURE,
      sameSite: 'lax',
      maxAge: config.SESSION_MAX_AGE_DAYS * DAY,
    },
  });
  return { middleware, close: () => pool.end(), cookieName: COOKIE_NAME };
}

module.exports = createSession;
