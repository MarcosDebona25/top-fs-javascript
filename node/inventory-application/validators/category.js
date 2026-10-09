'use strict';

const { body } = require('express-validator');
const categoryDb = require('../db/categories');
const { parseId } = require('../lib/params');
const { dbRule, failOnValidationFault } = require('../lib/validation');

// On edit routes the category id comes from req.params.id and is
// excluded from the uniqueness check.
function categoryRules() {
  return [
    body('name')
      .trim()
      .isLength({ min: 2, max: 80 })
      .withMessage('Enter a category name between 2 and 80 characters.')
      .bail()
      .custom(
        dbRule(async (value, req) => {
          const excludeId = parseId(req.params.id);
          const existing = await categoryDb.findCategoryByName(value, excludeId);
          return existing ? 'A category with this name already exists.' : null;
        })
      ),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('The description must be 1000 characters or fewer.'),
    failOnValidationFault,
  ];
}

module.exports = { categoryRules };
