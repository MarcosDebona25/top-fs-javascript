'use strict';

const { body } = require('express-validator');

const MOVEMENT_TYPES = ['receipt', 'dispatch', 'adjustment'];

function movementRules() {
  return [
  body('type')
    .trim()
    .isIn(MOVEMENT_TYPES)
    .withMessage('Select a movement type: receipt, dispatch or adjustment.'),
  body('quantity')
    .trim()
    .isInt({ min: 0 })
    .withMessage('Enter a whole number of units, 0 or more.')
    .bail()
    .custom((value, { req }) => {
      const quantity = Number(value);
      if (req.body.type !== 'adjustment' && quantity < 1) {
        throw new Error('Enter at least 1 unit.');
      }
      return true;
    }),
  body('reason')
    .trim()
    .isLength({ min: 1, max: 250 })
    .withMessage('Enter a reason between 1 and 250 characters.'),
  body('request_id')
    .trim()
    .isUUID()
    .withMessage('The request identifier is invalid.'),
  ];
}

module.exports = { movementRules };
