const { body, query } = require('express-validator');

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_BYTES = 72; // bcrypt ignores anything past 72 bytes

const passwordLength = (value) => Array.from(value).length;
const passwordBytes = (value) => Buffer.byteLength(value, 'utf8');

const USERNAME_MESSAGE = 'Username must be 3 to 20 characters: letters, numbers, _ and -.';
const usernamePattern = /^[A-Za-z0-9_-]{3,20}$/;

const registerRules = [
  body('username').isString().withMessage('Username is required.').bail().matches(usernamePattern).withMessage(USERNAME_MESSAGE),
  body('password')
    .isString()
    .withMessage('Password is required.')
    .bail()
    .custom((value) => passwordLength(value) >= MIN_PASSWORD_LENGTH)
    .withMessage(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
    .bail()
    .custom((value) => passwordBytes(value) <= MAX_PASSWORD_BYTES)
    .withMessage('Password is too long. Use a shorter password.'),
  body('confirmPassword')
    .custom((value, { req }) => typeof value === 'string' && value === req.body.password)
    .withMessage('Passwords do not match.'),
];

const loginRules = [
  body('username').isString().withMessage('Username is required.').bail().notEmpty().withMessage('Username is required.'),
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

const usernameAvailableRules = [
  query('username').isString().withMessage('Username is required.').bail().matches(usernamePattern).withMessage(USERNAME_MESSAGE),
];

module.exports = { registerRules, loginRules, usernameAvailableRules };
