const { Router } = require('express');
const controller = require('../controllers/posts');
const { requireAuth, optionalAuth, requireRole } = require('../middlewares/auth');
const { createPostRules, updatePostRules } = require('../validators/post');
const { commentRules } = require('../validators/comment');

const router = Router();
const authorOnly = [requireAuth, requireRole('AUTHOR')];

router.get('/', controller.listPublished);
router.post('/', authorOnly, createPostRules, controller.createPost);
router.get('/:postId', optionalAuth, controller.getPost);
router.patch('/:postId', authorOnly, updatePostRules, controller.updatePost);
router.delete('/:postId', authorOnly, controller.deletePost);

router.get('/:postId/comments', optionalAuth, controller.listComments);
router.post('/:postId/comments', requireAuth, commentRules, controller.createComment);

module.exports = router;
