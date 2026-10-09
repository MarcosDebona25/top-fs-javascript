'use strict';

const { body, validationResult } = require('express-validator');
const Rules = require('../shared/rules');
const { emailExists } = require('../db/queries');

// Turns a shared rule (returns message|null) into an express-validator check.
function rule(chain, fn) {
  return chain.custom((value, { req }) => {
    const message = fn(value, req);
    if (message) throw new Error(message);
    return true;
  });
}

const signUp = [
  rule(body('firstName').trim(), Rules.validateFirstName),
  rule(body('lastName').trim(), Rules.validateLastName),
  rule(body('email').trim().toLowerCase(), Rules.validateEmail).bail().custom(async (email) => {
    if (await emailExists(email)) throw new Error('That email is already registered.');
    return true;
  }),
  rule(body('password'), Rules.validatePassword),
  rule(body('confirmPassword'), (value, req) => Rules.validateConfirm(req.body.password, value)),
];

const logIn = [
  body('email').trim().toLowerCase(),
  body('password'),
];

const passcode = [rule(body('passcode').trim(), Rules.validatePasscode)];

const message = [
  rule(body('title').trim(), Rules.validateTitle),
  rule(body('text').trim(), Rules.validateText),
];

// Collects errors as {field: message} (first error per field).
function errorsFor(req) {
  const result = validationResult(req);
  if (result.isEmpty()) return null;
  const errors = {};
  for (const e of result.array()) if (!errors[e.path]) errors[e.path] = e.msg;
  return errors;
}

module.exports = { signUp, logIn, passcode, message, errorsFor };
