'use strict';

const path = require('node:path');
const express = require('express');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const flash = require('connect-flash');
const passport = require('passport');

const pool = require('./db/pool');
const configurePassport = require('./config/passport');
const routes = require('./routes');

configurePassport(passport);

// Exported as a factory (no listen) so tests can drive the app with supertest.
function createApp() {
  const app = express();

  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'ejs');

  app.use(express.urlencoded({ extended: false }));
  app.use(express.static(path.join(__dirname, 'public')));
  // Same rule file for browser and server.
  app.get('/js/rules.js', (req, res) => res.sendFile(path.join(__dirname, 'shared', 'rules.js')));

  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'dev-only-secret',
      resave: false,
      saveUninitialized: false,
      store: new PgSession({ pool }),
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24,
        secure: process.env.NODE_ENV === 'production',
      },
    })
  );

  app.use(flash());
  app.use(passport.initialize());
  app.use(passport.session());

  app.use((req, res, next) => {
    res.locals.currentUser = req.user || null;
    res.locals.success = req.flash('success');
    res.locals.failure = req.flash('error');
    next();
  });

  app.use(routes);

  app.use((req, res) => res.status(404).render('error', { message: 'Page not found.' }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).render('error', { message: 'Something went wrong.' });
  });

  return app;
}

module.exports = createApp;
