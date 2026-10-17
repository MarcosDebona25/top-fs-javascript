const { Router } = require('express');
const controller = require('../controllers/comments');
const { requireAuth } = require('../middlewares/auth');
const { commentRules } = require('../validators/comment');

const router = Router();

router.patch('/:commentId', requireAuth, commentRules, controller.updateComment);
router.delete('/:commentId', requireAuth, controller.deleteComment);

module.exports = router;
