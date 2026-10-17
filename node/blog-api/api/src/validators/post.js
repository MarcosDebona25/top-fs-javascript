const { body } = require('express-validator');

const TITLE_MAX = 150;
const CONTENT_MAX = 50000;

const title = () =>
  body('title')
    .isString()
    .withMessage('Title must be text.')
    .bail()
    .trim()
    .isLength({ min: 1, max: TITLE_MAX })
    .withMessage(`Title must be 1 to ${TITLE_MAX} characters.`);

const content = () =>
  body('content')
    .isString()
    .withMessage('Content must be text.')
    .bail()
    .trim()
    .isLength({ min: 1, max: CONTENT_MAX })
    .withMessage(`Content must be 1 to ${CONTENT_MAX} characters.`);

const createPostRules = [title(), content()];

const updatePostRules = [
  body().custom((value) => {
    const fields = value && typeof value === 'object' ? Object.keys(value) : [];
    if (!fields.some((field) => ['title', 'content', 'published'].includes(field))) {
      throw new Error('Send at least one of: title, content, published.');
    }
    return true;
  }),
  title().optional(),
  content().optional(),
  body('published').optional().isBoolean({ strict: true }).withMessage('Published must be true or false.'),
];

module.exports = { createPostRules, updatePostRules };
