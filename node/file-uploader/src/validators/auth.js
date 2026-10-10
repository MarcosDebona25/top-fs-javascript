const { body } = require('express-validator');

const MAX_PASSWORD_BYTES = 72;
const MIN_PASSWORD_LENGTH = 8;

const passwordLength = (value) => Array.from(value).length;
const passwordBytes = (value) => Buffer.byteLength(value, 'utf8');

const emailRule = body('email')
  .trim()
  .toLowerCase()
  .notEmpty()
  .withMessage('Email is required.')
  .bail()
  .isLength({ max: 254 })
  .withMessage('Email is too long.')
  .bail()
  .isEmail()
  .withMessage('Enter a valid email address.');

const bytesRule = (field) =>
  body(field)
    .custom((value) => passwordBytes(value || '') <= MAX_PASSWORD_BYTES)
    .withMessage(`Password is too long (max ${MAX_PASSWORD_BYTES} bytes).`);

const signUpRules = [
  body('username')
    .trim()
    .toLowerCase()
    .matches(/^[a-z0-9_]{3,20}$/)
    .withMessage('Username must be 3 to 20 characters: lowercase letters, numbers and underscores.'),
  emailRule,
  body('password')
    .isString()
    .bail()
    .custom((value) => passwordLength(value) >= MIN_PASSWORD_LENGTH)
    .withMessage(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
    .bail()
    .custom((value) => passwordBytes(value) <= MAX_PASSWORD_BYTES)
    .withMessage(`Password is too long (max ${MAX_PASSWORD_BYTES} bytes).`),
  body('passwordConfirmation')
    .custom((value, { req }) => value === req.body.password)
    .withMessage("Passwords don't match."),
  bytesRule('passwordConfirmation'),
];

const logInRules = [
  emailRule,
  body('password').notEmpty().withMessage('Password is required.').bail(),
  bytesRule('password'),
];

module.exports = { signUpRules, logInRules, MAX_PASSWORD_BYTES };
