'use strict';

const { body } = require('express-validator');
const categoryDb = require('../db/categories');

// On edit routes the category id comes from req.params.id and is
// excluded from the uniqueness check.
function categoryRules() {
  return [
    body('name')
      .trim()
      .isLength({ min: 2, max: 80 })
      .withMessage('Enter a category name between 2 and 80 characters.')
      .bail()
      .custom(async (value, { req }) => {
        const excludeId = req.params.id ? Number(req.params.id) : null;
        const existing = await categoryDb.findCategoryByName(value, excludeId);
        if (existing) {
          throw new Error('A category with this name already exists.');
        }
        return true;
      }),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('The description must be 1000 characters or fewer.'),
  ];
}

module.exports = { categoryRules };
