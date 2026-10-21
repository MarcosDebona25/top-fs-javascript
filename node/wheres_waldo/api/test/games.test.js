const {
  request,
  prisma,
  createTestApp,
  resetData,
  useKnownHitboxes,
  registerAgent,
  HITBOXES,
  CHARACTER_SLUGS,
  centerOf,
} = require('./helpers');

let app;
let clock;

beforeEach(async () => {
  await resetData();
  await useKnownHitboxes();
  ({ app, clock } = createTestApp());
});

afterEach(async () => {
  await app.close();
});

afterAll(async () => {
  await resetData();
  await prisma.$disconnect();
});

const startGame = async (agent, slug = 'beach') => (await agent.post(`/api/maps/${slug}/games`).expect(201)).body.game;
const guess = (agent, id, body) => agent.post(`/api/games/${id}/guesses`).send(body);
const find = (agent, id, slug) => guess(agent, id, { character: slug, ...centerOf(slug) });
const miss = (agent, id) => guess(agent, id, { character: 'waldo', x: 0.5, y: 0.9 });

// Finds every character, spending `ms` of (fake) time before the last one; returns that last response.
async function findAll(agent, id, ms, status = 200) {
  for (const slug of CHARACTER_SLUGS.slice(0, -1)) await find(agent, id, slug).expect(200);
  clock.advance(ms);
  return find(agent, id, CHARACTER_SLUGS[CHARACTER_SLUGS.length - 1]).expect(status);
}

describe('POST /api/maps/:slug/games', () => {
  it('starts a game for a guest, timed by the server', async () => {
    const res = await request(app).post('/api/maps/beach/games').expect(201);
    const { game } = res.body;

    expect(game.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(game).toMatchObject({
      mapSlug: 'beach',
      status: 'in_progress',
      ranked: false,
      startedAt: '2026-01-01T00:00:00.000Z',
      serverTime: '2026-01-01T00:00:00.000Z',
      found: [],
      wrongCount: 0,
      penaltyMs: 0,
      wrongGuessPenaltyMs: 1000,
    });
    expect(game.characters.map((character) => character.slug)).toEqual(CHARACTER_SLUGS);
    expect(res.headers['set-cookie']).toBeUndefined();
  });

  it('attaches the player to the game when somebody is logged in', async () => {
    const { agent, username } = await registerAgent(app);
    const game = await startGame(agent, 'moon-base');

    expect(game.ranked).toBe(true);
    const stored = await prisma.game.findUnique({ where: { id: game.id }, include: { user: true } });
    expect(stored.user.username).toBe(username);
  });

  it('answers 404 for an unknown map', async () => {
    await request(app).post('/api/maps/atlantis/games').expect(404);
  });

  it('limits how many games one client can start', async () => {
    const limited = createTestApp({ config: { START_RATE_LIMIT: 2 } }).app;
    await request(limited).post('/api/maps/beach/games').expect(201);
    await request(limited).post('/api/maps/beach/games').expect(201);
    const res = await request(limited).post('/api/maps/beach/games').expect(429);
    expect(res.body.code).toBe('RATE_LIMITED');
    await limited.close();
  });
});

describe('POST /api/games/:id/guesses', () => {
  it('confirms a click inside the character and remembers it', async () => {
    const agent = request.agent(app);
    const game = await startGame(agent);

    const res = await find(agent, game.id, 'waldo').expect(200);
    expect(res.body).toMatchObject({ correct: true, completed: false, character: 'waldo', found: ['waldo'], wrongCount: 0, penaltyMs: 0 });
    expect((await agent.get(`/api/games/${game.id}`)).body.game.found).toEqual(['waldo']);
  });

  it('accepts the edges of the rectangle and a small margin around it, and nothing beyond', async () => {
    const agent = request.agent(app);
    const game = await startGame(agent);
    const { x, y, width, height } = HITBOXES.waldo;
    const margin = 0.005;
    const at = (px, py) => guess(agent, game.id, { character: 'waldo', x: px, y: py });

    expect((await at(x + width + margin - 0.0001, y + height / 2)).body.correct).toBe(true);
    const afterHit = await startGame(agent);
    expect((await guess(agent, afterHit.id, { character: 'waldo', x: x - margin + 0.0001, y: y - margin + 0.0001 })).body.correct).toBe(true);
    const outside = await startGame(agent);
    expect((await guess(agent, outside.id, { character: 'waldo', x: x - margin - 0.001, y: y + height / 2 })).body.correct).toBe(false);
    expect((await guess(agent, outside.id, { character: 'waldo', x: x + width / 2, y: y + height + margin + 0.001 })).body.correct).toBe(false);
  });

  it('adds the penalty for every wrong click and leaves the found list alone', async () => {
    const agent = request.agent(app);
    const game = await startGame(agent);

    await miss(agent, game.id).expect(200);
    const res = await miss(agent, game.id).expect(200);
    expect(res.body).toMatchObject({ correct: false, completed: false, found: [], wrongCount: 2, penaltyMs: 2000 });
  });

  it('counts a click on another character\'s spot as wrong', async () => {
    const agent = request.agent(app);
    const game = await startGame(agent);

    const res = await guess(agent, game.id, { character: 'woof', ...centerOf('waldo') }).expect(200);
    expect(res.body.correct).toBe(false);
    expect(res.body.wrongCount).toBe(1);
  });

  it('takes the penalty from the configuration', async () => {
    const custom = createTestApp({ config: { WRONG_GUESS_PENALTY_MS: 2500 } }).app;
    const game = (await request(custom).post('/api/maps/beach/games').expect(201)).body.game;
    expect(game.wrongGuessPenaltyMs).toBe(2500);
    const res = await request(custom).post(`/api/games/${game.id}/guesses`).send({ character: 'waldo', x: 0.5, y: 0.9 }).expect(200);
    expect(res.body.penaltyMs).toBe(2500);
    await custom.close();
  });

  it('is idempotent for a character that is already found: no penalty, wherever the click was', async () => {
    const agent = request.agent(app);
    const game = await startGame(agent);
    await find(agent, game.id, 'waldo').expect(200);

    const again = await guess(agent, game.id, { character: 'waldo', x: 0.8, y: 0.8 }).expect(200);
    expect(again.body).toMatchObject({ correct: true, alreadyFound: true, found: ['waldo'], wrongCount: 0, penaltyMs: 0 });
    expect(await prisma.gameFind.count({ where: { gameId: game.id } })).toBe(1);
  });

  it('answers 422 for coordinates outside the image or not numbers', async () => {
    const agent = request.agent(app);
    const game = await startGame(agent);

    for (const bad of [{ x: 1.5, y: 0.5 }, { x: -0.1, y: 0.5 }, { x: '0.5', y: 0.5 }, { x: null, y: 0.5 }, { x: 0.5 }, { x: 0.5, y: Infinity }]) {
      const res = await guess(agent, game.id, { character: 'waldo', ...bad }).expect(422);
      expect(res.body.errors.x || res.body.errors.y).toBeDefined();
    }
    expect((await agent.get(`/api/games/${game.id}`)).body.game.wrongCount).toBe(0);
  });

  it('answers 422 for a missing or unknown character', async () => {
    const agent = request.agent(app);
    const game = await startGame(agent);

    expect((await guess(agent, game.id, { x: 0.5, y: 0.5 }).expect(422)).body.errors.character).toBeDefined();
    expect((await guess(agent, game.id, { character: 'gandalf', x: 0.5, y: 0.5 }).expect(422)).body.errors.character).toMatch(/no such character/);
  });

  it('limits the clicks per game', async () => {
    const limited = createTestApp({ config: { GUESS_RATE_LIMIT: 3 } }).app;
    const first = (await request(limited).post('/api/maps/beach/games').expect(201)).body.game;
    const second = (await request(limited).post('/api/maps/beach/games').expect(201)).body.game;
    const click = (id) => request(limited).post(`/api/games/${id}/guesses`).send({ character: 'waldo', x: 0.5, y: 0.9 });

    for (let i = 0; i < 3; i += 1) await click(first.id).expect(200);
    const res = await click(first.id).expect(429);
    expect(res.body.code).toBe('RATE_LIMITED');
    await click(second.id).expect(200); // another game has its own budget
    await limited.close();
  });
});

describe('finishing a game', () => {
  it('computes the time on the server: real time plus penalties', async () => {
    const agent = request.agent(app);
    const game = await startGame(agent);
    await miss(agent, game.id).expect(200);
    await miss(agent, game.id).expect(200);

    const res = await findAll(agent, game.id, 30000);

    expect(res.body).toMatchObject({ correct: true, completed: true, found: CHARACTER_SLUGS, wrongCount: 2, penaltyMs: 2000 });
    expect(res.body.result).toMatchObject({
      durationMs: 32000,
      elapsedMs: 30000,
      penaltyMs: 2000,
      wrongCount: 2,
      startedAt: '2026-01-01T00:00:00.000Z',
      finishedAt: '2026-01-01T00:00:30.000Z',
    });
    const stored = await prisma.game.findUnique({ where: { id: game.id } });
    expect(stored.status).toBe('COMPLETED');
    expect(stored.durationMs).toBe(32000);
  });

  it('ignores any time the client tries to send', async () => {
    const agent = request.agent(app);
    const game = await startGame(agent);
    for (const slug of CHARACTER_SLUGS.slice(0, -1)) await find(agent, game.id, slug).expect(200);
    clock.advance(45000);

    const res = await guess(agent, game.id, { character: 'odlaw', ...centerOf('odlaw'), durationMs: 1, finishedAt: '2026-01-01T00:00:01Z', penaltyMs: -5000, status: 'COMPLETED' }).expect(200);
    expect(res.body.result.durationMs).toBe(45000);
  });

  it('gives a guest their time but records no position', async () => {
    const agent = request.agent(app);
    const game = await startGame(agent);

    const res = await findAll(agent, game.id, 20000);
    expect(res.body.result).toMatchObject({ durationMs: 20000, ranked: false, mapPosition: null, globalPosition: null, personalBest: false });
    const stored = await prisma.game.findUnique({ where: { id: game.id } });
    expect(stored.userId).toBeNull();
  });

  it('tells a registered player where they stand on the map and overall', async () => {
    const { agent } = await registerAgent(app);
    const game = await startGame(agent);

    const res = await findAll(agent, game.id, 20000);
    expect(res.body.result).toMatchObject({
      ranked: true,
      mapPosition: { rank: 1, total: 1 },
      globalPosition: { rank: 1, total: 1 },
      personalBest: true,
    });
  });

  it('flags only the fastest of a player\'s games as the personal best', async () => {
    const { agent } = await registerAgent(app);
    const best = await findAll(agent, (await startGame(agent)).id, 20000);
    const slower = await findAll(agent, (await startGame(agent)).id, 25000);
    const faster = await findAll(agent, (await startGame(agent)).id, 15000);

    expect(best.body.result.personalBest).toBe(true);
    expect(slower.body.result.personalBest).toBe(false);
    expect(slower.body.result.mapPosition).toEqual({ rank: 1, total: 1 });
    expect(faster.body.result.personalBest).toBe(true);
  });

  it('ranks a player among others', async () => {
    const first = await registerAgent(app);
    const second = await registerAgent(app);
    await findAll(first.agent, (await startGame(first.agent)).id, 20000);

    const res = await findAll(second.agent, (await startGame(second.agent)).id, 30000);
    expect(res.body.result.mapPosition).toEqual({ rank: 2, total: 2 });
    expect(res.body.result.globalPosition).toEqual({ rank: 2, total: 2 });
  });

  it('refuses further clicks once the game is over', async () => {
    const agent = request.agent(app);
    const game = await startGame(agent);
    await findAll(agent, game.id, 20000);

    const res = await find(agent, game.id, 'waldo').expect(409);
    expect(res.body.code).toBe('GAME_FINISHED');
    expect((await miss(agent, game.id).expect(409)).body.code).toBe('GAME_FINISHED');
    expect((await agent.get(`/api/games/${game.id}`)).body.game.penaltyMs).toBe(0);
  });

  it('finishes only once when the last two characters arrive together', async () => {
    const { agent } = await registerAgent(app);
    const game = await startGame(agent);
    for (const slug of CHARACTER_SLUGS.slice(0, 3)) await find(agent, game.id, slug).expect(200);
    clock.advance(20000);

    const results = await Promise.all([find(agent, game.id, 'wizard'), find(agent, game.id, 'odlaw')]);
    expect(results.map((res) => res.status)).toEqual([200, 200]);
    expect(results.some((res) => res.body.completed)).toBe(true);
    const stored = await prisma.game.findUnique({ where: { id: game.id } });
    expect(stored.status).toBe('COMPLETED');
    expect(stored.durationMs).toBe(20000);
  });
});

describe('the minimum time', () => {
  it('rejects a game finished faster than MIN_GAME_MS and never ranks it', async () => {
    const { agent } = await registerAgent(app);
    const game = await startGame(agent);

    const res = await findAll(agent, game.id, 4999, 422);
    expect(res.body.code).toBe('GAME_TOO_FAST');
    expect(res.body.game.status).toBe('rejected');
    expect(res.body.result.ranked).toBe(false);
    expect(res.body.result.mapPosition).toBeNull();
    const stored = await prisma.game.findUnique({ where: { id: game.id } });
    expect(stored.status).toBe('REJECTED');
    expect((await find(agent, game.id, 'waldo').expect(409)).body.code).toBe('GAME_FINISHED');
  });

  it('accepts a game that takes exactly MIN_GAME_MS', async () => {
    const agent = request.agent(app);
    const game = await startGame(agent);
    await findAll(agent, game.id, 5000);
  });

  it('judges the real time, so penalties cannot make a too-fast game valid', async () => {
    const agent = request.agent(app);
    const game = await startGame(agent);
    for (let i = 0; i < 10; i += 1) await miss(agent, game.id).expect(200);

    await findAll(agent, game.id, 3000, 422);
  });

  it('takes the limit from the configuration', async () => {
    const strict = createTestApp({ config: { MIN_GAME_MS: 60000 } });
    const agent = request.agent(strict.app);
    const game = (await agent.post('/api/maps/beach/games').expect(201)).body.game;
    for (const slug of CHARACTER_SLUGS.slice(0, -1)) await agent.post(`/api/games/${game.id}/guesses`).send({ character: slug, ...centerOf(slug) }).expect(200);
    strict.clock.advance(59999);

    await agent.post(`/api/games/${game.id}/guesses`).send({ character: 'odlaw', ...centerOf('odlaw') }).expect(422);
    await strict.app.close();
  });
});

describe('who can play a game', () => {
  it('lets a registered player\'s game be played only from their session', async () => {
    const { agent } = await registerAgent(app);
    const game = await startGame(agent);

    const anonymous = await find(request.agent(app), game.id, 'waldo').expect(401);
    expect(anonymous.body.code).toBe('AUTH_REQUIRED');
    await request(app).get(`/api/games/${game.id}`).expect(401);

    const stranger = (await registerAgent(app)).agent;
    await find(stranger, game.id, 'waldo').expect(404);
    await stranger.get(`/api/games/${game.id}`).expect(404);

    await find(agent, game.id, 'waldo').expect(200);
  });

  it('treats the id of a guest game as the key to it', async () => {
    const game = await startGame(request.agent(app));
    await find(request.agent(app), game.id, 'waldo').expect(200);
    expect((await request(app).get(`/api/games/${game.id}`).expect(200)).body.game.found).toEqual(['waldo']);
  });

  it('stops a player who logged out from continuing', async () => {
    const { agent } = await registerAgent(app);
    const game = await startGame(agent);
    await agent.post('/api/auth/logout').expect(204);
    await find(agent, game.id, 'waldo').expect(401);
  });

  it('answers 404 for ids that are malformed or do not exist', async () => {
    await request(app).get('/api/games/not-a-uuid').expect(404);
    await request(app).get('/api/games/00000000-0000-4000-8000-000000000000').expect(404);
    await request(app).post('/api/games/00000000-0000-4000-8000-000000000000/guesses').send({ character: 'waldo', x: 0.1, y: 0.1 }).expect(404);
    await request(app).post('/api/games/nope/guesses').send({ character: 'waldo', x: 0.1, y: 0.1 }).expect(404);
  });
});

describe('GET /api/games/:id', () => {
  it('shows the progress of a game in play, without a result', async () => {
    const agent = request.agent(app);
    const game = await startGame(agent);
    await find(agent, game.id, 'woof').expect(200);
    await miss(agent, game.id).expect(200);

    const res = await agent.get(`/api/games/${game.id}`).expect(200);
    expect(res.body.game).toMatchObject({ status: 'in_progress', found: ['woof'], wrongCount: 1, penaltyMs: 1000 });
    expect(res.body.game.result).toBeUndefined();
  });

  it('keeps the result of a finished game available after a reload', async () => {
    const agent = request.agent(app);
    const game = await startGame(agent);
    await findAll(agent, game.id, 20000);

    const res = await agent.get(`/api/games/${game.id}`).expect(200);
    expect(res.body.game.status).toBe('completed');
    expect(res.body.game.result.durationMs).toBe(20000);
  });
});

describe('what the API never reveals', () => {
  it('leaves coordinates out of every game response', async () => {
    const agent = request.agent(app);
    const bodies = [];
    const game = await startGame(agent);
    bodies.push({ game });
    bodies.push((await agent.get(`/api/games/${game.id}`)).body);
    bodies.push((await find(agent, game.id, 'waldo')).body);
    bodies.push((await miss(agent, game.id)).body);
    bodies.push((await findAll(agent, game.id, 20000)).body);
    bodies.push((await agent.get(`/api/games/${game.id}`)).body);

    const text = JSON.stringify(bodies);
    for (const key of ['"x"', '"y"', '"width"', '"height"', '"hitbox', '"calibrated"']) expect(text).not.toContain(key);
  });
});
