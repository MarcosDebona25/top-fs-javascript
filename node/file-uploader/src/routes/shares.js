const { Router } = require('express');
const controller = require('../controllers/shares');
const { ensureAuthenticated } = require('../middlewares/auth');

const router = Router();

router.post('/:id/delete', ensureAuthenticated, controller.remove);

module.exports = router;
