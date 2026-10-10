const { Router } = require('express');
const controller = require('../controllers/folders');
const shares = require('../controllers/shares');
const files = require('../controllers/files');
const { handleUpload } = require('../middlewares/upload');
const { ensureAuthenticated } = require('../middlewares/auth');
const { folderNameRules } = require('../validators/folder');
const { shareRules } = require('../validators/share');

const router = Router();

router.use(ensureAuthenticated);

router.get('/:id', controller.show);
router.post('/:id/folders', folderNameRules, controller.createSubfolder);
router.post('/:id/rename', folderNameRules, controller.rename);
router.get('/:id/delete', controller.showDelete);
router.post('/:id/delete', controller.remove);
router.post('/:id/files', handleUpload, files.upload);
router.get('/:id/shares', shares.index);
router.post('/:id/shares', shareRules, shares.create);

module.exports = router;
