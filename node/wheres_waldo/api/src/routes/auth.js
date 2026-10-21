const { Router } = require('express');
const createAuthController = require('../controllers/auth');
const { registerRules, loginRules, usernameAvailableRules } = require('../validators/auth');

function createAuthRoutes(ctx) {
  const controller = createAuthController(ctx);
  const router = Router();

  router.post('/register', ctx.limiters.auth, registerRules, controller.register);
  router.post('/login', ctx.limiters.auth, loginRules, controller.login);
  router.post('/logout', controller.logout);
  router.get('/me', controller.me);
  router.get('/username-available', ctx.limiters.availability, usernameAvailableRules, controller.usernameAvailable);

  return router;
}

module.exports = createAuthRoutes;
