const { Router } = require('express');
const controller = require('../controllers/public-share');

const router = Router();

router.get('/:token', controller.showShared);
router.get('/:token/folders/:folderId', controller.showSubfolder);
router.get('/:token/files/:fileId', controller.showFile);
router.get('/:token/files/:fileId/download', controller.download);

module.exports = router;
