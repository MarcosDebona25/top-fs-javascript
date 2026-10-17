const { Router } = require('express');
const controller = require('../controllers/me');
const { requireAuth, requireRole } = require('../middlewares/auth');

const router = Router();

router.use(requireAuth);
router.get('/posts', requireRole('AUTHOR'), controller.listMyPosts);
router.get('/comments', controller.listMyComments);

module.exports = router;
