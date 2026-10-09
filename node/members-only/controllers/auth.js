'use strict';

const bcrypt = require('bcryptjs');
const passport = require('passport');
const { createUser, emailExists } = require('../db/queries');
const { errorsFor } = require('../validators');
const { validateEmail } = require('../shared/rules');

function signUpForm(req, res) {
  res.render('sign-up', { errors: {}, values: {} });
}

async function signUp(req, res, next) {
  try {
    const { firstName, lastName, email } = req.body;
    const errors = errorsFor(req);
    if (errors) {
      return res.status(422).render('sign-up', { errors, values: { firstName, lastName, email } });
    }
    const passwordHash = await bcrypt.hash(req.body.password, 10);
    try {
      await createUser({ firstName, lastName, email, passwordHash });
    } catch (err) {
      // Lost a race against another sign-up with the same email.
      if (err.code === '23505') {
        return res.status(422).render('sign-up', {
          errors: { email: 'That email is already registered.' },
          values: { firstName, lastName, email },
        });
      }
      throw err;
    }
    req.flash('success', 'Account created. Log in to continue.');
    return res.redirect('/log-in');
  } catch (err) {
    return next(err);
  }
}

function logInForm(req, res) {
  res.render('log-in', { values: {} });
}

const logIn = passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/log-in',
  failureFlash: true,
});

function logOut(req, res, next) {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy((destroyErr) => {
      if (destroyErr) return next(destroyErr);
      res.clearCookie('connect.sid');
      return res.redirect('/');
    });
  });
}

// Live availability check for the sign-up form. Returns only a boolean.
async function emailAvailable(req, res, next) {
  try {
    const email = String(req.query.email || '').trim().toLowerCase();
    if (validateEmail(email)) return res.json({ valid: false, available: false });
    return res.json({ valid: true, available: !(await emailExists(email)) });
  } catch (err) {
    return next(err);
  }
}

module.exports = { signUpForm, signUp, logInForm, logIn, logOut, emailAvailable };
