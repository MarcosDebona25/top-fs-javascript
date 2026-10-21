const { query } = require('express-validator');

const MAX_PAGE_SIZE = 50;

const pageRules = [
  query('page').optional().isInt({ min: 1, max: 100000 }).withMessage('page must be a whole number, 1 or more.').toInt(),
  query('pageSize')
    .optional()
    .isInt({ min: 1, max: MAX_PAGE_SIZE })
    .withMessage(`pageSize must be a whole number between 1 and ${MAX_PAGE_SIZE}.`)
    .toInt(),
];

module.exports = { pageRules };
