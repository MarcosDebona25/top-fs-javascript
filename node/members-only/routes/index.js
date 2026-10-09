'use strict';

const express = require('express');
const { ensureAuth, ensureGuest, ensureAdmin } = require('../middleware/auth');
const validators = require('../validators');
const auth = require('../controllers/auth');
const club = require('../controllers/club');
const messages = require('../controllers/messages');

const router = express.Router();

router.get('/', messages.home);

router.get('/sign-up', ensureGuest, auth.signUpForm);
router.post('/sign-up', ensureGuest, validators.signUp, auth.signUp);
router.get('/api/email-available', auth.emailAvailable);

router.get('/log-in', ensureGuest, auth.logInForm);
router.post('/log-in', ensureGuest, validators.logIn, auth.logIn);
router.post('/log-out', ensureAuth, auth.logOut);

router.get('/join-club', ensureAuth, club.joinForm);
router.post('/join-club', ensureAuth, validators.passcode, club.join);
router.get('/become-admin', ensureAuth, club.adminForm);
router.post('/become-admin', ensureAuth, validators.passcode, club.becomeAdmin);

router.get('/messages/new', ensureAuth, messages.newForm);
router.post('/messages', ensureAuth, validators.message, messages.create);
// State-changing action: POST (never GET), and checked server-side as admin.
router.post('/messages/:id/delete', ensureAdmin, messages.remove);

module.exports = router;
