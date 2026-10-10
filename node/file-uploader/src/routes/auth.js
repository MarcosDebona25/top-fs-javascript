const { Router } = require('express');
const controller = require('../controllers/auth');
const { ensureGuest, ensureAuthenticated } = require('../middlewares/auth');
const { signUpRules, logInRules } = require('../validators/auth');

const router = Router();

router.get('/sign-up', ensureGuest, controller.showSignUp);
router.post('/sign-up', ensureGuest, signUpRules, controller.signUp);
router.get('/log-in', ensureGuest, controller.showLogIn);
router.post('/log-in', ensureGuest, logInRules, controller.logIn);
router.post('/log-out', ensureAuthenticated, controller.logOut);

module.exports = router;
