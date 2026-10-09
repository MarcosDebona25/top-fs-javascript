'use strict';

require('dotenv').config();

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cookieSession = require('cookie-session');

const { csrfSynchronisedProtection, generateToken } = require('./lib/csrf');
const { flashMiddleware } = require('./lib/flash');
const { formatPrice, formatMoney, formatDateTime } = require('./lib/format');
const { NotFoundError, HttpError, UnprocessableError } = require('./lib/errors');
const homeRoutes = require('./routes');
const categoryRoutes = require('./routes/categories');
const itemRoutes = require('./routes/items');

// The session secret signs the cookie that carries CSRF state. Production must supply its own; local development and tests fall back to a fixed one.
const DEV_SESSION_SECRET = 'local-dev-session-secret';
const sessionSecret = process.env.SESSION_SECRET || DEV_SESSION_SECRET;
if (!process.env.SESSION_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET is required when NODE_ENV is "production". Set it in the environment.');
  }
  if (process.env.NODE_ENV !== 'test') {
    console.warn('SESSION_SECRET is not set: using the built-in development secret.');
  }
}

// PostgreSQL rejections of malformed input that slipped past validation: value too long (22001), number out of range (22003), invalid text, representation (22P02).
const BAD_INPUT_PG_CODES = new Set(['22001', '22003', '22P02']);

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('query parser', 'extended');

// Security headers (CSP allows only same-origin resources).
app.use(helmet());

// Form parsing with a body size limit.
app.use(express.urlencoded({ extended: false, limit: '100kb' }));

// Static assets (styles, fonts, icons).
app.use(express.static(path.join(__dirname, 'public')));

// Anonymous, signed session used only for CSRF state and flash messages. No authentication state is kept between actions.
app.use(
  cookieSession({
    name: 'axle_supply_session',
    keys: [sessionSecret],
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax',
    httpOnly: true,
  })
);

// CSRF protection on every POST (token read from the hidden `_csrf` field).
app.use(csrfSynchronisedProtection);

// A form field sent more than once arrives as an array. No form here does that, so it is rejected instead of being coerced into a single value.
app.use((req, res, next) => {
  const repeated = Object.values(req.body || {}).some((value) => typeof value !== 'string');
  if (repeated) {
    return next(new UnprocessableError('Each form field may be sent only once. Reload the form and try again.'));
  }
  next();
});

// Shared view locals: CSRF token, flash message, formatting helpers and the current location (used to mark the active navigation item).
app.use((req, res, next) => {
  res.locals.csrfToken = generateToken(req);
  res.locals.currentPath = req.path;
  res.locals.currentStatus = typeof req.query.status === 'string' ? req.query.status : '';
  res.locals.formatPrice = formatPrice;
  res.locals.formatMoney = formatMoney;
  res.locals.formatDateTime = formatDateTime;
  next();
});
app.use(flashMiddleware);

app.use('/', homeRoutes);
app.use('/categories', categoryRoutes);
app.use('/items', itemRoutes);

// Any unmatched route is a 404.
app.use((req, res, next) => {
  next(new NotFoundError());
});

// Central error handler: HTTP errors render a friendly page,
// unexpected failures log the technical detail server-side only.
app.use((err, req, res, next) => {
  const isBadInput = BAD_INPUT_PG_CODES.has(err.code);
  const isCsrfFailure = err.code === 'EBADCSRFTOKEN';
  const statusCode = isBadInput ? 400 : err.statusCode || err.status || 500;

  if (statusCode >= 500) {
    console.error(`[${new Date().toISOString()}] ${statusCode} ${err.message}`);
    console.error(err.stack);
  }

  const isHttpError = err instanceof HttpError;
  res.status(statusCode).render('errors/error', {
    status: statusCode,
    title:
      statusCode === 404
        ? 'Page not found'
        : statusCode === 403
          ? 'Access denied'
          : statusCode === 409
            ? 'The operation cannot be completed'
            : statusCode === 422
              ? 'The submitted data has problems'
              : statusCode === 400
                ? 'The request is not valid'
                : 'Something went wrong',
    message: isHttpError
      ? err.message
      : isCsrfFailure
        ? 'The security token of this form is missing or has expired. Go back, reload the form and submit it again.'
        : isBadInput
          ? 'The request contains a value that is too long, out of range or malformed.'
          : 'An unexpected error occurred. The detail was logged on the server; try again in a moment.',
    details: err.details || null,
  });
});

module.exports = app;
