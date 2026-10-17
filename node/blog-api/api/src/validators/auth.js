const { body } = require('express-validator');

const MAX_PASSWORD_BYTES = 72; // bcrypt ignores anything past 72 bytes
const MIN_PASSWORD_LENGTH = 8;

const passwordLength = (value) => Array.from(value).length;
const passwordBytes = (value) => Buffer.byteLength(value, 'utf8');

const usernameRule = body('username')
  .isString()
  .withMessage('Username is required.')
  .bail()
  .trim()
  .toLowerCase()
  .matches(/^[a-z0-9_]{3,20}$/)
  .withMessage('Username must be 3 to 20 characters: lowercase letters, numbers and underscores.');

const signUpRules = [
  usernameRule,
  body('password')
    .isString()
    .withMessage('Password is required.')
    .bail()
    .custom((value) => passwordLength(value) >= MIN_PASSWORD_LENGTH)
    .withMessage(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
    .bail()
    .custom((value) => passwordBytes(value) <= MAX_PASSWORD_BYTES)
    .withMessage('Password is too long. Use a shorter password.'),
];

const logInRules = [
  body('username').isString().withMessage('Username is required.').bail().trim().toLowerCase().notEmpty()
    .withMessage('Username is required.'),
  body('password')
    .isString()
    .withMessage('Password is required.')
    .bail()
    .notEmpty()
    .withMessage('Password is required.')
    .bail()
    .custom((value) => passwordBytes(value) <= MAX_PASSWORD_BYTES)
    .withMessage('Password is too long. Use a shorter password.'),
];

module.exports = { signUpRules, logInRules };
