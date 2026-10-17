const passport = require('passport');
const { Strategy: LocalStrategy } = require('passport-local');
const { Strategy: JwtStrategy } = require('passport-jwt');
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const { JWT_SECRET, JWT_ISSUER, JWT_AUDIENCE } = require('../lib/env');

const USER_SELECT = { id: true, username: true, role: true };

// Compared when the username is unknown so both failures take a similar time.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12);

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await prisma.user.findUnique({
        where: { username },
        select: { ...USER_SELECT, passwordHash: true },
      });
      const matches = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);
      if (!user || !matches) return done(null, false);
      return done(null, { id: user.id, username: user.username, role: user.role });
    } catch (error) {
      return done(error);
    }
  })
);

// req.cookies is filled by cookie-parser.
const fromCookie = (req) => (req && req.cookies ? req.cookies.token || null : null);

passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: fromCookie,
      secretOrKey: JWT_SECRET,
      algorithms: ['HS256'],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    },
    async (payload, done) => {
      try {
        // Re-read the user so a deleted account or a changed role takes effect immediately.
        const user = await prisma.user.findUnique({ where: { id: Number(payload.sub) }, select: USER_SELECT });
        return done(null, user || false, { exp: payload.exp });
      } catch (error) {
        return done(error);
      }
    }
  )
);

module.exports = passport;
