const { body } = require('express-validator');

const isUnit = (value) => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;

// x and y are fractions of the image (0 to 1), measured from the top-left corner.
const guessRules = [
  body('character').isString().withMessage('Choose a character.').bail().isLength({ min: 1, max: 40 }).withMessage('Choose a character.'),
  body('x').custom(isUnit).withMessage('x must be a number between 0 and 1.'),
  body('y').custom(isUnit).withMessage('y must be a number between 0 and 1.'),
];

module.exports = { guessRules };
