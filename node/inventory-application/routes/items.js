'use strict';

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../lib/async-handler');
const { requireAdminPassword } = require('../lib/admin-auth');
const itemsController = require('../controllers/items');
const { itemRules } = require('../validators/item');
const { movementRules } = require('../validators/movement');

// Public: browse the catalog and create parts.
router.get('/', asyncHandler(itemsController.listItems));
router.post('/', itemRules(), asyncHandler(itemsController.createItem));

// /new is registered before /:id so the literal path wins.
router.get('/new', asyncHandler(itemsController.showNewForm));

router.get('/:id', asyncHandler(itemsController.showItem));

// Protected: editing requires the administrative password.
router.get('/:id/edit', asyncHandler(itemsController.showEditForm));
router.post(
  '/:id/edit',
  requireAdminPassword,
  itemRules({ includeSku: false }),
  asyncHandler(itemsController.updateItem)
);

// Protected: archive and restore require the administrative password.
router.get('/:id/archive', asyncHandler(itemsController.showArchiveForm));
router.post(
  '/:id/archive',
  requireAdminPassword,
  asyncHandler(itemsController.archiveItem)
);
router.get('/:id/restore', asyncHandler(itemsController.showRestoreForm));
router.post(
  '/:id/restore',
  requireAdminPassword,
  asyncHandler(itemsController.restoreItem)
);

// Protected: recording movements requires the administrative password.
router.get('/:id/movements/new', asyncHandler(itemsController.showMovementForm));
router.post(
  '/:id/movements',
  requireAdminPassword,
  movementRules(),
  asyncHandler(itemsController.createMovement)
);

module.exports = router;
