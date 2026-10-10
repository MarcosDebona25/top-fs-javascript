const { body } = require('express-validator');

const folderName = body('name')
  .trim()
  .notEmpty()
  .withMessage('Folder name is required.')
  .bail()
  .isLength({ max: 100 })
  .withMessage('Folder name must be 100 characters or fewer.')
  .bail()
  .custom((value) => !/[/\\]/.test(value))
  .withMessage("Folder name can't contain / or \\.");

module.exports = { folderNameRules: [folderName] };
