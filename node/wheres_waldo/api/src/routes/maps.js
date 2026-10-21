const { Router } = require('express');
const createMapsController = require('../controllers/maps');
const createGamesController = require('../controllers/games');

function createMapsRoutes(ctx) {
  const maps = createMapsController(ctx);
  const games = createGamesController(ctx);
  const router = Router();

  router.get('/', maps.list);
  router.get('/:slug', maps.show);
  router.post('/:slug/games', ctx.limiters.start, games.start);

  return router;
}

module.exports = createMapsRoutes;
