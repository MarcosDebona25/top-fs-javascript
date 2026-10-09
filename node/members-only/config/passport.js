'use strict';

const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const { findUserByEmail, findUserById } = require('../db/queries');

// Same message for unknown email and wrong password: no account enumeration.
const BAD_LOGIN = { message: 'Incorrect email or password.' };

function configurePassport(passport) {
  passport.use(
    new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
      try {
        const user = await findUserByEmail(String(email).trim().toLowerCase());
        if (!user) return done(null, false, BAD_LOGIN);
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) return done(null, false, BAD_LOGIN);
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user, done) => done(null, user.id));

  passport.deserializeUser(async (id, done) => {
    try {
      done(null, (await findUserById(id)) || false);
    } catch (err) {
      done(err);
    }
  });
}

module.exports = configurePassport;
