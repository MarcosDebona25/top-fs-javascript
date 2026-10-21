const { HttpError } = require('../lib/http');

const WITH_DETAILS = {
  map: { include: { characters: { include: { character: true }, orderBy: { character: { position: 'asc' } } } } },
  finds: { include: { character: true }, orderBy: { foundAt: 'asc' } },
};

const lower = (status) => status.toLowerCase();

function createGames({ prisma, now, config, leaderboards, maps, events }) {
  async function standing(game) {
    if (game.userId === null || game.status !== 'COMPLETED') return null;
    const [mapStanding, globalStanding] = await Promise.all([
      leaderboards.mapStanding(game.userId, game.mapId),
      leaderboards.globalStanding(game.userId),
    ]);
    return { mapStanding, globalStanding };
  }

  // The outcome of a finished game. Guests get their time but no positions: nothing was recorded for them.
  async function presentResult(game) {
    const positions = await standing(game);
    return {
      durationMs: game.durationMs,
      elapsedMs: game.durationMs - game.penaltyMs,
      penaltyMs: game.penaltyMs,
      wrongCount: game.wrongCount,
      ranked: game.userId !== null && game.status === 'COMPLETED',
      mapPosition: positions && positions.mapStanding ? { rank: positions.mapStanding.rank, total: positions.mapStanding.total } : null,
      globalPosition: positions && positions.globalStanding ? positions.globalStanding : null,
      // Whether this game is the one the leaderboards show for the player (their best on the map).
      personalBest: positions && positions.mapStanding ? positions.mapStanding.gameId === game.id : false,
      startedAt: game.startedAt,
      finishedAt: game.finishedAt,
    };
  }

  function present(game) {
    return {
      id: game.id,
      mapSlug: game.map.slug,
      status: lower(game.status),
      // A registered player's game is recorded when it completes; a guest's is not.
      ranked: game.userId !== null,
      startedAt: game.startedAt,
      finishedAt: game.finishedAt,
      // The client's stopwatch runs from startedAt; serverTime lets it correct for a skewed local clock.
      serverTime: now(),
      characters: maps.presentCharacters(game.map),
      found: game.finds.map((find) => find.character.slug),
      wrongCount: game.wrongCount,
      penaltyMs: game.penaltyMs,
      wrongGuessPenaltyMs: config.WRONG_GUESS_PENALTY_MS,
    };
  }

  async function load(id) {
    return prisma.game.findUnique({ where: { id }, include: WITH_DETAILS });
  }

  // A guest's game has no owner: its unguessable id is the capability. A registered player's game
  // can only be played from their own session; to anyone else it does not exist.
  async function loadFor(id, user) {
    const game = await load(id);
    if (!game) throw new HttpError(404, 'Game not found');
    if (game.userId !== null) {
      if (!user) throw new HttpError(401, 'Log in to continue this game.', { code: 'AUTH_REQUIRED' });
      if (user.id !== game.userId) throw new HttpError(404, 'Game not found');
    }
    return game;
  }

  async function start(mapSlug, user) {
    const map = await maps.findBySlug(mapSlug);
    const game = await prisma.game.create({
      data: { mapId: map.id, userId: user ? user.id : null, startedAt: now() },
      include: WITH_DETAILS,
    });
    return present(game);
  }

  async function get(id, user) {
    const game = await loadFor(id, user);
    const body = present(game);
    if (game.status !== 'IN_PROGRESS') body.result = await presentResult(game);
    return body;
  }

  // Closes the game exactly once: the UPDATE only matches while it is still in progress, and it adds the
  // penalties the row holds at that very moment, so a late wrong guess cannot slip between read and write.
  async function finish(game) {
    const finishedAt = now();
    const elapsedMs = Math.max(0, finishedAt.getTime() - game.startedAt.getTime());
    const status = elapsedMs < config.MIN_GAME_MS ? 'REJECTED' : 'COMPLETED';
    const updated = await prisma.$queryRaw`
      UPDATE "Game"
      SET "finishedAt" = ${finishedAt}, "durationMs" = ${elapsedMs}::int + "penaltyMs", "status" = ${status}::"GameStatus"
      WHERE "id" = ${game.id}::uuid AND "status" = 'IN_PROGRESS'
      RETURNING "id"`;
    return { won: updated.length === 1, status };
  }

  async function guess(id, user, { character, x, y }) {
    const game = await loadFor(id, user);
    if (game.status !== 'IN_PROGRESS') {
      throw new HttpError(409, 'This game is already finished.', { code: 'GAME_FINISHED' });
    }
    const target = game.map.characters.find((entry) => entry.character.slug === character);
    if (!target) throw new HttpError(422, 'Validation failed', { errors: { character: 'There is no such character on this map.' } });

    const reply = async (fields) => {
      const fresh = await load(id);
      return { ...fields, character, found: fresh.finds.map((find) => find.character.slug), wrongCount: fresh.wrongCount, penaltyMs: fresh.penaltyMs };
    };

    // Asking again for a character that is already found changes nothing, wherever the click was.
    if (game.finds.some((find) => find.character.slug === character)) {
      return { status: 200, body: await reply({ correct: true, alreadyFound: true, completed: false }) };
    }

    // The rectangle grows by HIT_MARGIN on every side, as a fraction of the image.
    const margin = config.HIT_MARGIN;
    const hit =
      x >= target.x - margin && x <= target.x + target.width + margin && y >= target.y - margin && y <= target.y + target.height + margin;

    if (!hit) {
      const { count } = await prisma.game.updateMany({
        where: { id, status: 'IN_PROGRESS' },
        data: { wrongCount: { increment: 1 }, penaltyMs: { increment: config.WRONG_GUESS_PENALTY_MS } },
      });
      if (count === 0) throw new HttpError(409, 'This game is already finished.', { code: 'GAME_FINISHED' });
      return { status: 200, body: await reply({ correct: false, completed: false }) };
    }

    await prisma.gameFind.createMany({ data: [{ gameId: id, characterId: target.characterId, foundAt: now() }], skipDuplicates: true });
    const foundCount = await prisma.gameFind.count({ where: { gameId: id } });
    if (foundCount < game.map.characters.length) {
      return { status: 200, body: await reply({ correct: true, completed: false }) };
    }

    const outcome = await finish(game);
    const finished = await load(id);
    if (finished.status === 'REJECTED') {
      // Too fast to be human: the game is kept (so it cannot be replayed) but never ranked.
      throw new HttpError(422, 'That was too fast to be ranked.', {
        code: 'GAME_TOO_FAST',
        extra: { game: present(finished), result: await presentResult(finished) },
      });
    }
    const body = await reply({ correct: true, completed: true });
    body.result = await presentResult(finished);
    if (outcome.won && finished.userId !== null) {
      events.publish({ type: 'ranked-game', mapSlug: finished.map.slug, username: user.username, durationMs: finished.durationMs });
    }
    return { status: 200, body };
  }

  return { start, get, guess };
}

module.exports = createGames;
