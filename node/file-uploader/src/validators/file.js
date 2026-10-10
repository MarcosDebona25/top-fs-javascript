const { body } = require('express-validator');
const { MAX_BASE_NAME_LENGTH } = require('../lib/file-types');

// A trailing dot followed by 1 to 5 alphanumerics with at least one letter reads as an extension.
const LOOKS_LIKE_EXTENSION = /\.(?=[a-z0-9]{1,5}$)[a-z0-9]*[a-z][a-z0-9]*$/i;

const fileRenameRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('File name is required.')
    .bail()
    .isLength({ max: MAX_BASE_NAME_LENGTH })
    .withMessage(`File name must be ${MAX_BASE_NAME_LENGTH} characters or fewer.`)
    .bail()
    .custom((value) => !/[/\\]/.test(value))
    .withMessage("File name can't contain / or \\.")
    .bail()
    .custom((value) => !LOOKS_LIKE_EXTENSION.test(value))
    .withMessage("File extension can't be changed."),
];

module.exports = { fileRenameRules };
