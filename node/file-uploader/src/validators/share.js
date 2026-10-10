const { body } = require('express-validator');

const ALLOWED_DURATIONS = [1, 7, 15, 30];

const shareRules = [
  body('durationDays')
    .isIn(ALLOWED_DURATIONS.map(String))
    .withMessage('Select a duration of 1, 7, 15 or 30 days.')
    .bail()
    .toInt(),
];

module.exports = { shareRules, ALLOWED_DURATIONS };
