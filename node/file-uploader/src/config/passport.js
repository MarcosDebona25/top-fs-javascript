const passport = require('passport');
const { Strategy: LocalStrategy } = require('passport-local');
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');

// Compared when the email is unknown so both failures take a similar time.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12);

passport.use(
  new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, username: true, email: true, passwordHash: true },
      });
      const matches = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);
      if (!user || !matches) return done(null, false);
      return done(null, { id: user.id, username: user.username, email: user.email });
    } catch (error) {
      return done(error);
    }
  })
);

passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, username: true, email: true },
    });
    done(null, user || false);
  } catch (error) {
    done(error);
  }
});

module.exports = passport;
