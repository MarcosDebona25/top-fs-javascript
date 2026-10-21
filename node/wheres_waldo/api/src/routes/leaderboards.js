const { Router } = require('express');
const createLeaderboardsController = require('../controllers/leaderboards');
const { pageRules } = require('../validators/leaderboards');

function createLeaderboardsRoutes(ctx) {
  const controller = createLeaderboardsController(ctx);
  const router = Router();

  router.get('/summary', controller.summary);
  router.get('/global', pageRules, controller.global);
  router.get('/maps/:slug', pageRules, controller.forMap);
  router.get('/stream', controller.stream);

  return router;
}

module.exports = createLeaderboardsRoutes;
