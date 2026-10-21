require('dotenv/config');

const REQUIRED = ['DATABASE_URL', 'SESSION_SECRET', 'CORS_ORIGINS'];

function positiveNumber(env, name, fallback) {
  if (env[name] === undefined || env[name] === '') return fallback;
  const value = Number(env[name]);
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${name} must be a positive number`);
  return value;
}

// Reads and validates the environment. Fail fast: the API must not start with a missing or weak secret.
// createApp() accepts overrides on top of this, which is how the tests change the game rules.
function loadConfig(env = process.env) {
  const missing = REQUIRED.filter((name) => !env[name]);
  if (missing.length) throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  if (env.SESSION_SECRET.length < 64) throw new Error('SESSION_SECRET must be at least 64 characters long');

  const trustProxy = env.TRUST_PROXY ? Number(env.TRUST_PROXY) : false;
  if (trustProxy !== false && (!Number.isInteger(trustProxy) || trustProxy < 1)) {
    throw new Error('TRUST_PROXY must be a number of proxy hops (1 or more), or empty');
  }

  return {
    DATABASE_URL: env.DATABASE_URL,
    SESSION_SECRET: env.SESSION_SECRET,
    SESSION_MAX_AGE_DAYS: positiveNumber(env, 'SESSION_MAX_AGE_DAYS', 7),
    // Secure cookies are only sent over HTTPS; set COOKIE_SECURE=false only for local development over http://localhost.
    COOKIE_SECURE: env.COOKIE_SECURE !== 'false',
    CORS_ORIGINS: env.CORS_ORIGINS.split(',').map((origin) => origin.trim()),
    TRUST_PROXY: trustProxy,
    MIN_GAME_MS: positiveNumber(env, 'MIN_GAME_MS', 5000),
    WRONG_GUESS_PENALTY_MS: positiveNumber(env, 'WRONG_GUESS_PENALTY_MS', 1000),
    HIT_MARGIN: positiveNumber(env, 'HIT_MARGIN', 0.005),
    SSE_HEARTBEAT_MS: positiveNumber(env, 'SSE_HEARTBEAT_MS', 25000),
    // Rate limits. The overrides exist for the end-to-end suite, which logs in more often than people do.
    AUTH_RATE_LIMIT: positiveNumber(env, 'AUTH_RATE_LIMIT', 10),
    START_RATE_LIMIT: positiveNumber(env, 'START_RATE_LIMIT', 30),
    GUESS_RATE_LIMIT: positiveNumber(env, 'GUESS_RATE_LIMIT', 30),
    BCRYPT_COST: 12,
    SESSION_PRUNE: true,
  };
}

module.exports = { loadConfig };
