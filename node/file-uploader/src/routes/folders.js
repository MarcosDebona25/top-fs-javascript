const { Router } = require('express');
const controller = require('../controllers/folders');
const shares = require('../controllers/shares');
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
router.get('/:id/shares', shares.index);
router.post('/:id/shares', shareRules, shares.create);

module.exports = router;
