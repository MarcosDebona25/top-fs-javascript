require('dotenv/config');

// Fail fast: the API must not start with a missing or weak secret.
const REQUIRED = ['DATABASE_URL', 'JWT_SECRET', 'JWT_EXPIRES_IN', 'JWT_ISSUER', 'JWT_AUDIENCE', 'CORS_ORIGINS'];
const missing = REQUIRED.filter((name) => !process.env[name]);
if (missing.length) throw new Error(`Missing environment variables: ${missing.join(', ')}`);
if (process.env.JWT_SECRET.length < 64) throw new Error('JWT_SECRET must be at least 64 characters long');

module.exports = {
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
  JWT_ISSUER: process.env.JWT_ISSUER,
  JWT_AUDIENCE: process.env.JWT_AUDIENCE,
  CORS_ORIGINS: process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim()),
  // Secure cookies are only sent over HTTPS; set COOKIE_SECURE=false only if a local client refuses them over http://localhost.
  COOKIE_SECURE: process.env.COOKIE_SECURE !== 'false',
};
