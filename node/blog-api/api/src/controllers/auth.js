const bcrypt = require('bcryptjs');
const passport = require('../config/passport');
const prisma = require('../lib/prisma');
const { HttpError } = require('../lib/http');
const { validated } = require('../lib/validation');
const { uniqueViolationField } = require('../lib/prisma-errors');
const { signAccessToken } = require('../lib/jwt');
const { COOKIE_SECURE } = require('../lib/env');

const BCRYPT_COST = 12;
const COOKIE_NAME = 'token';
const COOKIE_OPTIONS = { httpOnly: true, secure: COOKIE_SECURE, sameSite: 'strict', path: '/' };

// The token only travels in the HttpOnly cookie: the body never repeats it.
function startSession(res, user, status) {
  const { token, expiresAt, maxAge } = signAccessToken(user);
  res.cookie(COOKIE_NAME, token, { ...COOKIE_OPTIONS, maxAge });
  return res.status(status).json({ user: { id: user.id, username: user.username, role: user.role }, expiresAt });
}

async function signUp(req, res) {
  const { username, password } = validated(req);
  let user;
  try {
    const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
    user = await prisma.user.create({
      data: { username, passwordHash },
      select: { id: true, username: true, role: true },
    });
  } catch (error) {
    if (uniqueViolationField(error) === 'username') throw new HttpError(409, 'This username is already taken.');
    throw error;
  }
  return startSession(res, user, 201);
}

function logIn(req, res, next) {
  validated(req);
  passport.authenticate('local', { session: false }, (error, user) => {
    if (error) return next(error);
    // Same answer for an unknown user and a wrong password.
    if (!user) return next(new HttpError(401, 'Invalid username or password'));
    return startSession(res, user, 200);
  })(req, res, next);
}

// HttpOnly: the frontend cannot delete the cookie, so the API sends an expired one.
function logOut(req, res) {
  res.clearCookie(COOKIE_NAME, COOKIE_OPTIONS);
  res.status(204).end();
}

function me(req, res) {
  res.json({ user: req.user, expiresAt: req.tokenExpiresAt });
}

module.exports = { signUp, logIn, logOut, me };
