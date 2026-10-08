'use strict';

const { body } = require('express-validator');
const itemDb = require('../db/items');
const categoryDb = require('../db/categories');

const SKU_PATTERN = /^[A-Z0-9][A-Z0-9-]*$/;
const PRICE_PATTERN = /^\d{1,8}(\.\d{1,2})?$/;

// On edit routes the item id comes from req.params.id and is excluded
// from the SKU uniqueness check. The SKU itself stays immutable: the
// edit form shows it as read-only and the server never updates it.
function itemRules() {
  return [
  body('category_id')
    .trim()
    .isInt({ gt: 0 }).withMessage('Select a category.')
    .bail()
    .custom(async (value) => {
      const category = await categoryDb.findCategoryById(Number(value));
      if (!category) {
        throw new Error('The selected category does not exist.');
      }
      return true;
    }),
  body('sku')
    .trim()
    .customSanitizer((value) => String(value).toUpperCase())
    .isLength({ min: 3, max: 40 })
    .withMessage('Enter a SKU between 3 and 40 characters.')
    .bail()
    .matches(SKU_PATTERN)
    .withMessage('A SKU starts with a letter or digit and may contain only letters, digits and hyphens.')
    .bail()
    .custom(async (value, { req }) => {
      const excludeId = req.params.id ? Number(req.params.id) : null;
      const existing = await itemDb.findItemBySku(value, excludeId);
      if (existing) {
        throw new Error('A part with this SKU already exists. SKUs stay unique, even for archived parts.');
      }
      return true;
    }),
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
    .withMessage('Enter a price with up to 8 whole digits and up to 2 decimals, for example 14.99.')
    .bail()
    .custom((value) => {
      const amount = Number(value);
      if (amount < 0 || amount > 99999999.99) {
        throw new Error('The price must be between 0.00 and 99,999,99.99.');
      }
      return true;
    }),
  ];
}

module.exports = { itemRules };
