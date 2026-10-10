const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const passport = require('../config/passport');
const prisma = require('../lib/prisma');
const { mapErrors } = require('../lib/http');
const { uniqueViolationField } = require('../lib/prisma-errors');

const BCRYPT_COST = 12;

function showSignUp(req, res) {
  res.render('auth/sign-up', { title: 'Sign up', errors: {}, values: {} });
}

function showLogIn(req, res) {
  res.render('auth/log-in', { title: 'Log in', errors: {}, values: {} });
}

async function signUp(req, res, next) {
  const { username, email, password } = req.body;
  const values = { username, email };
  const renderErrors = (errors) =>
    res.status(422).render('auth/sign-up', { title: 'Sign up', errors, values });

  const result = validationResult(req);
  if (!result.isEmpty()) return renderErrors(mapErrors(result));

  let user;
  try {
    const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
    user = await prisma.user.create({
      data: { email, username, passwordHash, folders: { create: { name: 'My Drive' } } },
      select: { id: true, username: true, email: true, folders: { select: { id: true } } },
    });
  } catch (error) {
    const field = uniqueViolationField(error);
    if (field === 'email') return renderErrors({ email: 'This email cannot be used. Try a different one.' });
    if (field === 'username') return renderErrors({ username: 'This username is already taken.' });
    throw error;
  }

  const sessionUser = { id: user.id, username: user.username, email: user.email };
  const rootId = user.folders[0].id;
  req.login(sessionUser, (error) => {
    if (error) return next(error);
    req.flash('success', 'Account created. Welcome to your drive.');
    return res.redirect(`/folders/${rootId}`);
  });
}

function logIn(req, res, next) {
  const values = { email: req.body.email };
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return res.status(422).render('auth/log-in', { title: 'Log in', errors: mapErrors(result), values });
  }

  passport.authenticate('local', (error, user) => {
    if (error) return next(error);
    if (!user) {
      return res.status(422).render('auth/log-in', {
        title: 'Log in',
        errors: { form: 'Incorrect email or password.' },
        values,
      });
    }
    return req.login(user, (loginError) => {
      if (loginError) return next(loginError);
      return res.redirect('/');
    });
  })(req, res, next);
}

function logOut(req, res, next) {
  req.logout((error) => {
    if (error) return next(error);
    return req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.redirect('/log-in');
    });
  });
}

module.exports = { showSignUp, showLogIn, signUp, logIn, logOut };
