const { Router } = require('express');
const controller = require('../controllers/files');
const { ensureAuthenticated } = require('../middlewares/auth');
const { fileRenameRules } = require('../validators/file');

const router = Router();

router.use(ensureAuthenticated);

router.get('/:id', controller.show);
router.post('/:id/rename', fileRenameRules, controller.rename);
router.post('/:id/delete', controller.remove);
router.get('/:id/download', controller.download);

module.exports = router;
