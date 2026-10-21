const bcrypt = require('bcryptjs');
const { HttpError } = require('../lib/http');
const { validated } = require('../lib/validation');

const TAKEN_MESSAGE = 'That username is already taken.';

function createAuthController({ prisma, passport, config, sessionCookieName }) {
  const publicUser = (user) => ({ id: user.id, username: user.username });

  // passport 0.7 regenerates the session on login, which also prevents session fixation.
  const logInUser = (req, user) =>
    new Promise((resolve, reject) => req.login(publicUser(user), (error) => (error ? reject(error) : resolve())));

  async function register(req, res) {
    const { username, password } = validated(req);
    const passwordHash = await bcrypt.hash(password, config.BCRYPT_COST);
    let user;
    try {
      user = await prisma.user.create({ data: { username, usernameLower: username.toLowerCase(), passwordHash } });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new HttpError(409, TAKEN_MESSAGE, { errors: { username: TAKEN_MESSAGE }, code: 'USERNAME_TAKEN' });
      }
      throw error;
    }
    await logInUser(req, user);
    res.status(201).json({ user: publicUser(user) });
  }

  function login(req, res, next) {
    validated(req);
    passport.authenticate('local', (error, user) => {
      if (error) return next(error);
      // Same answer for an unknown user and a wrong password.
      if (!user) return next(new HttpError(401, 'Invalid username or password.', { code: 'INVALID_CREDENTIALS' }));
      return logInUser(req, user).then(() => res.json({ user: publicUser(user) }), next);
    })(req, res, next);
  }

  // Idempotent: logging out when nobody is logged in is not an error.
  function logout(req, res, next) {
    req.logout((error) => {
      if (error) return next(error);
      return req.session.destroy(() => {
        res.clearCookie(sessionCookieName);
        res.status(204).end();
      });
    });
  }

  // Guests are a normal case, not an error: the client asks on every page load.
  function me(req, res) {
    res.json({ user: req.user ? publicUser(req.user) : null });
  }

  // Backs the inline check while typing; the registration itself still handles the race.
  async function usernameAvailable(req, res) {
    const { username } = validated(req);
    const existing = await prisma.user.findUnique({ where: { usernameLower: username.toLowerCase() }, select: { id: true } });
    if (existing) return res.json({ username, available: false, errors: { username: TAKEN_MESSAGE } });
    return res.json({ username, available: true });
  }

  return { register, login, logout, me, usernameAvailable };
}

module.exports = createAuthController;
