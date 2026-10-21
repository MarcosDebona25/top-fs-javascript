const { Router } = require('express');
const createGamesController = require('../controllers/games');
const { guessRules } = require('../validators/games');

function createGamesRoutes(ctx) {
  const controller = createGamesController(ctx);
  const router = Router();

  router.get('/:id', controller.show);
  router.post('/:id/guesses', ctx.limiters.guess, guessRules, controller.guess);

  return router;
}

module.exports = createGamesRoutes;
