const { parseUuid } = require('../lib/http');
const { validated } = require('../lib/validation');

function createGamesController({ games }) {
  async function start(req, res) {
    res.status(201).json({ game: await games.start(req.params.slug, req.user) });
  }

  async function show(req, res) {
    res.json({ game: await games.get(parseUuid(req.params.id), req.user) });
  }

  async function guess(req, res) {
    const input = validated(req);
    const { status, body } = await games.guess(parseUuid(req.params.id), req.user, input);
    res.status(status).json(body);
  }

  return { start, show, guess };
}

module.exports = createGamesController;
