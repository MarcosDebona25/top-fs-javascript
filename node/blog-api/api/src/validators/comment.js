const { body } = require('express-validator');

const CONTENT_MAX = 1000;

// Comments are plain text: the frontends render them escaped, never as HTML or Markdown.
const commentRules = [
  body('content')
    .isString()
    .withMessage('Comment must be text.')
    .bail()
    .trim()
    .isLength({ min: 1, max: CONTENT_MAX })
    .withMessage(`Comment must be 1 to ${CONTENT_MAX} characters.`),
];

module.exports = { commentRules };
