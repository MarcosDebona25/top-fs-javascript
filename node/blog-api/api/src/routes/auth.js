const { Router } = require('express');
const controller = require('../controllers/auth');
const { requireAuth } = require('../middlewares/auth');
const { authLimiter } = require('../middlewares/rate-limit');
const { signUpRules, logInRules } = require('../validators/auth');

const router = Router();

router.post('/signup', authLimiter, signUpRules, controller.signUp);
router.post('/login', authLimiter, logInRules, controller.logIn);
router.post('/logout', requireAuth, controller.logOut);
router.get('/me', requireAuth, controller.me);

module.exports = router;
