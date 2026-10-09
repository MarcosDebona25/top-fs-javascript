'use strict';

const { body } = require('express-validator');
const itemDb = require('../db/items');
const categoryDb = require('../db/categories');
const { parseId } = require('../lib/params');
const { dbRule, failOnValidationFault } = require('../lib/validation');

const SKU_PATTERN = /^[A-Z0-9][A-Z0-9-]*$/;
// Up to 8 whole digits and 2 decimals: exactly what NUMERIC(10,2) holds,
// so no separate range check is needed.
const PRICE_PATTERN = /^\d{1,8}(\.\d{1,2})?$/;

// The SKU is validated only when a part is created. It is immutable
// afterwards: the edit form shows it as read-only and the server never
// reads it from an edit submission.
function itemRules({ includeSku = true } = {}) {
  const rules = [
    body('category_id')
      .trim()
      .custom((value) => parseId(value) !== null)
      .withMessage('Select a category.')
      .bail()
      .custom(
        dbRule(async (value) => {
          const category = await categoryDb.findCategoryById(parseId(value));
          return category ? null : 'The selected category does not exist.';
        })
      ),
  ];

  if (includeSku) {
    rules.push(
      body('sku')
        .trim()
        .customSanitizer((value) => String(value).toUpperCase())
        .isLength({ min: 3, max: 40 })
        .withMessage('Enter a SKU between 3 and 40 characters.')
        .bail()
        .matches(SKU_PATTERN)
        .withMessage('A SKU starts with a letter or digit and may contain only letters, digits and hyphens.')
        .bail()
        .custom(
          dbRule(async (value) => {
            const existing = await itemDb.findItemBySku(value);
            return existing
              ? 'A part with this SKU already exists. SKUs stay unique, even for archived parts.'
              : null;
          })
        )
    );
  }

  rules.push(
    body('name')
      .trim()
      .isLength({ min: 2, max: 120 })
      .withMessage('Enter a part name between 2 and 120 characters.'),
    body('brand')
      .trim()
      .isLength({ min: 1, max: 80 })
      .withMessage('Enter the brand.'),
    body('part_number')
      .optional()
      .trim()
      .isLength({ max: 60 })
      .withMessage('The part number must be 60 characters or fewer.'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('The description must be 1000 characters or fewer.'),
    body('unit_price')
      .trim()
      .notEmpty()
      .withMessage('Enter the unit price.')
      .bail()
      .matches(PRICE_PATTERN)
      .withMessage('Enter a price with up to 8 whole digits and up to 2 decimals, for example 14.99.'),
    failOnValidationFault
  );

  return rules;
}

module.exports = { itemRules };
