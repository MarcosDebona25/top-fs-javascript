'use strict';

require('dotenv').config();

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cookieSession = require('cookie-session');

const { csrfSynchronisedProtection, generateToken } = require('./lib/csrf');
const { flashMiddleware } = require('./lib/flash');
const { formatPrice, formatDateTime } = require('./lib/format');
const { NotFoundError, HttpError } = require('./lib/errors');
const homeRoutes = require('./routes');
const categoryRoutes = require('./routes/categories');
const itemRoutes = require('./routes/items');

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

// Anonymous, signed session used only for CSRF state and flash messages.
// No authentication state is kept between actions.
app.use(
  cookieSession({
    name: 'axle_supply_session',
    keys: [process.env.SESSION_SECRET || 'local-dev-session-secret'],
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax',
    httpOnly: true,
  })
);

// CSRF protection on every POST (token read from the hidden `_csrf` field).
app.use(csrfSynchronisedProtection);

// Shared view locals: CSRF token, flash message and formatting helpers.
app.use((req, res, next) => {
  res.locals.csrfToken = generateToken(req);
  res.locals.formatPrice = formatPrice;
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
  const statusCode = err.statusCode || err.status || 500;

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
              : 'Something went wrong',
    message: isHttpError
      ? err.message
      : 'An unexpected error occurred. The detail was logged on the server; try again in a moment.',
    details: err.details || null,
  });
});

module.exports = app;
