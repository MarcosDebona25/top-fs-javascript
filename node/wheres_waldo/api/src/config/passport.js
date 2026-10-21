const { Passport } = require('passport');
const { Strategy: LocalStrategy } = require('passport-local');
const bcrypt = require('bcryptjs');

// One Passport per app: createApp() can be called many times (the tests do) without sharing state.
function createPassport({ prisma, config }) {
  const passport = new Passport();
  // Compared when the username is unknown so both failures take a similar time.
  const dummyHash = bcrypt.hashSync('not-a-real-password', config.BCRYPT_COST);

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await prisma.user.findUnique({ where: { usernameLower: username.toLowerCase() } });
        const matches = await bcrypt.compare(password, user ? user.passwordHash : dummyHash);
        if (!user || !matches) return done(null, false);
        return done(null, { id: user.id, username: user.username });
      } catch (error) {
        return done(error);
      }
    })
  );

  passport.serializeUser((user, done) => done(null, user.id));

  passport.deserializeUser(async (id, done) => {
    try {
      // Re-read the user so a deleted account stops being logged in immediately.
      const user = await prisma.user.findUnique({ where: { id }, select: { id: true, username: true } });
      done(null, user || false);
    } catch (error) {
      done(error);
    }
  });

  return passport;
}

module.exports = createPassport;
