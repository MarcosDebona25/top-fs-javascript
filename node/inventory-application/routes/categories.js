'use strict';

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../lib/async-handler');
const { requireAdminPassword } = require('../lib/admin-auth');
const categoriesController = require('../controllers/categories');
const { categoryRules } = require('../validators/category');

// The plan defines no GET /categories page: the home page
// lists the categories, so the index redirects there.
router.get('/', (req, res) => {
  res.redirect(303, '/');
});
router.post('/', categoryRules(), asyncHandler(categoriesController.createCategory));

// /new is registered before /:id so the literal path wins.
router.get('/new', asyncHandler(categoriesController.showNewForm));

router.get('/:id', asyncHandler(categoriesController.showCategory));

// Protected: edit and delete require the administrative password.
router.get('/:id/edit', asyncHandler(categoriesController.showEditForm));
router.post(
  '/:id/edit',
  requireAdminPassword,
  categoryRules(),
  asyncHandler(categoriesController.updateCategory)
);
router.get('/:id/delete', asyncHandler(categoriesController.showDeleteForm));
router.post(
  '/:id/delete',
  requireAdminPassword,
  asyncHandler(categoriesController.deleteCategory)
);

module.exports = router;
