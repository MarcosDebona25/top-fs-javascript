const { request, prisma, createTestApp, resetData } = require('./helpers');

let app;
const BASE = new Date('2026-01-01T00:00:00Z').getTime();
const MINUTE = 60 * 1000;
let maps;

beforeAll(async () => {
  ({ app } = createTestApp());
  maps = Object.fromEntries((await prisma.map.findMany()).map((map) => [map.slug, map.id]));
});

beforeEach(resetData);

afterAll(async () => {
  await resetData();
  await app.close();
  await prisma.$disconnect();
});

const createPlayer = (username) =>
  prisma.user.create({ data: { username, usernameLower: username.toLowerCase(), passwordHash: 'not-a-real-hash' } });

// Writes a finished game straight into the database: these tests are about how games are ranked, not played.
// `at` is the minute (after a fixed start) when it finished, which breaks ties.
function addGame(user, slug, durationMs, at, { status = 'COMPLETED', guest = false } = {}) {
  const finishedAt = new Date(BASE + at * MINUTE);
  return prisma.game.create({
    data: {
      mapId: maps[slug],
      userId: guest ? null : user.id,
      startedAt: new Date(finishedAt.getTime() - durationMs),
      finishedAt: status === 'IN_PROGRESS' ? null : finishedAt,
      durationMs: status === 'IN_PROGRESS' ? null : durationMs,
      status,
    },
  });
}

async function addPlayer(name, times) {
  const user = await createPlayer(name);
  let at = 0;
  for (const [slug, ms] of Object.entries(times)) await addGame(user, slug, ms, (at += 1));
  return user;
}

const names = (body) => body.rows.map((row) => row.username);

describe('GET /api/leaderboards/summary', () => {
  it('is empty before anybody has finished a game', async () => {
    const res = await request(app).get('/api/leaderboards/summary').expect(200);
    expect(res.body).toEqual({
      mapCount: 3,
      global: { rows: [], total: 0 },
      maps: [
        { slug: 'beach', name: 'Beach', rows: [], total: 0 },
        { slug: 'ski-slopes', name: 'Ski Slopes', rows: [], total: 0 },
        { slug: 'moon-base', name: 'Moon Base', rows: [], total: 0 },
      ],
    });
  });

  it('shows the global top 10 and the top 10 of each map', async () => {
    for (let i = 1; i <= 12; i += 1) await addPlayer(`p${String(i).padStart(2, '0')}`, { beach: i * 10000 });

    const res = await request(app).get('/api/leaderboards/summary').expect(200);
    expect(res.body.global.rows).toHaveLength(10);
    expect(res.body.global.total).toBe(12);
    expect(res.body.maps[0].rows).toHaveLength(10);
    expect(res.body.maps[0].total).toBe(12);
    expect(res.body.maps[0].rows[0]).toEqual({ rank: 1, username: 'p01', timeMs: 10000 });
    expect(res.body.maps[1].rows).toEqual([]);
  });
});

describe('GET /api/leaderboards/maps/:slug', () => {
  it('ranks players by their time, fastest first, with the rank on every row', async () => {
    await addPlayer('slow', { beach: 30000 });
    await addPlayer('fast', { beach: 10000 });
    await addPlayer('mid', { beach: 20000 });

    const res = await request(app).get('/api/leaderboards/maps/beach').expect(200);
    expect(res.body.map).toEqual({ slug: 'beach', name: 'Beach' });
    expect(res.body.rows).toEqual([
      { rank: 1, username: 'fast', timeMs: 10000 },
      { rank: 2, username: 'mid', timeMs: 20000 },
      { rank: 3, username: 'slow', timeMs: 30000 },
    ]);
    expect(res.body).toMatchObject({ page: 1, pageSize: 10, total: 3, totalPages: 1 });
  });

  it('counts each player once, with their best game', async () => {
    const alice = await createPlayer('alice');
    await addGame(alice, 'beach', 50000, 1);
    await addGame(alice, 'beach', 30000, 2);
    await addGame(alice, 'beach', 40000, 3);
    await addPlayer('bob', { beach: 35000 });

    const res = await request(app).get('/api/leaderboards/maps/beach').expect(200);
    expect(res.body.rows).toEqual([
      { rank: 1, username: 'alice', timeMs: 30000 },
      { rank: 2, username: 'bob', timeMs: 35000 },
    ]);
    expect(res.body.total).toBe(2);
  });

  it('puts whoever reached a tied time first ahead', async () => {
    const late = await createPlayer('late');
    const early = await createPlayer('early');
    await addGame(late, 'beach', 20000, 9);
    await addGame(early, 'beach', 20000, 3);

    const res = await request(app).get('/api/leaderboards/maps/beach').expect(200);
    expect(names(res.body)).toEqual(['early', 'late']);
  });

  it('ignores guests, rejected games and games still in play', async () => {
    const player = await createPlayer('player');
    await addGame(player, 'beach', 25000, 1);
    await addGame(player, 'beach', 9000, 2, { status: 'REJECTED' });
    await addGame(player, 'beach', 8000, 3, { status: 'IN_PROGRESS' });
    await addGame(player, 'beach', 7000, 4, { guest: true });

    const res = await request(app).get('/api/leaderboards/maps/beach').expect(200);
    expect(res.body.rows).toEqual([{ rank: 1, username: 'player', timeMs: 25000 }]);
  });

  it('keeps the maps apart', async () => {
    await addPlayer('beach_only', { beach: 10000 });
    await addPlayer('moon_only', { 'moon-base': 10000 });

    expect(names((await request(app).get('/api/leaderboards/maps/beach')).body)).toEqual(['beach_only']);
    expect(names((await request(app).get('/api/leaderboards/maps/moon-base')).body)).toEqual(['moon_only']);
  });

  it('answers 404 for an unknown map', async () => {
    await request(app).get('/api/leaderboards/maps/atlantis').expect(404);
  });

  it('pages through the ranking', async () => {
    for (let i = 1; i <= 7; i += 1) await addPlayer(`p${i}`, { beach: i * 10000 });
    const page = (number) => request(app).get('/api/leaderboards/maps/beach').query({ page: number, pageSize: 3 }).expect(200);

    const first = (await page(1)).body;
    const second = (await page(2)).body;
    const third = (await page(3)).body;
    expect(first).toMatchObject({ page: 1, pageSize: 3, total: 7, totalPages: 3 });
    expect(names(first)).toEqual(['p1', 'p2', 'p3']);
    expect(second.rows.map((row) => row.rank)).toEqual([4, 5, 6]);
    expect(names(third)).toEqual(['p7']);
    expect((await page(4)).body.rows).toEqual([]);
  });

  it('answers 422 for a page or size that makes no sense', async () => {
    for (const query of [{ page: 0 }, { page: 'x' }, { page: 1.5 }, { pageSize: 0 }, { pageSize: 51 }, { pageSize: 'many' }]) {
      const res = await request(app).get('/api/leaderboards/maps/beach').query(query).expect(422);
      expect(Object.keys(res.body.errors)).toHaveLength(1);
    }
  });
});

describe('GET /api/leaderboards/global', () => {
  it('ranks players who finished more maps first, then by total time', async () => {
    await addPlayer('alice', { beach: 30000, 'ski-slopes': 40000, 'moon-base': 50000 }); // 3 maps, 120 s
    await addPlayer('bob', { beach: 20000, 'ski-slopes': 30000, 'moon-base': 40000 }); // 3 maps, 90 s
    await addPlayer('carol', { beach: 10000, 'ski-slopes': 15000 }); // 2 maps, 25 s
    await addPlayer('dave', { 'moon-base': 5000 }); // 1 map, 5 s
    await addPlayer('erin', { beach: 4000 }); // 1 map, 4 s

    const res = await request(app).get('/api/leaderboards/global').expect(200);
    expect(names(res.body)).toEqual(['bob', 'alice', 'carol', 'erin', 'dave']);
    expect(res.body.rows.map((row) => row.rank)).toEqual([1, 2, 3, 4, 5]);
    expect(res.body).toMatchObject({ page: 1, pageSize: 10, total: 5, totalPages: 1 });
  });

  it('gives every row a time per map, null for the maps not finished, and the partial total', async () => {
    await addPlayer('bob', { beach: 20000, 'ski-slopes': 30000, 'moon-base': 40000 });
    await addPlayer('carol', { beach: 10000, 'moon-base': 15000 });

    const res = await request(app).get('/api/leaderboards/global').expect(200);
    expect(res.body.rows).toEqual([
      { rank: 1, username: 'bob', times: { beach: 20000, skiSlopes: 30000, moonBase: 40000 }, totalMs: 90000, mapsCompleted: 3 },
      { rank: 2, username: 'carol', times: { beach: 10000, skiSlopes: null, moonBase: 15000 }, totalMs: 25000, mapsCompleted: 2 },
    ]);
  });

  it('uses each player\'s best time per map in the total', async () => {
    const alice = await createPlayer('alice');
    await addGame(alice, 'beach', 90000, 1);
    await addGame(alice, 'beach', 20000, 2);
    await addGame(alice, 'ski-slopes', 70000, 3);
    await addGame(alice, 'ski-slopes', 30000, 4);

    const res = await request(app).get('/api/leaderboards/global').expect(200);
    expect(res.body.rows[0]).toMatchObject({ times: { beach: 20000, skiSlopes: 30000, moonBase: null }, totalMs: 50000, mapsCompleted: 2 });
  });

  it('breaks a tie in favour of whoever completed their set first', async () => {
    const times = { beach: 20000, 'ski-slopes': 30000, 'moon-base': 40000 };
    const slow = await createPlayer('finished_later');
    const quick = await createPlayer('finished_first');
    for (const [slug, ms] of Object.entries(times)) await addGame(slow, slug, ms, 50);
    for (const [slug, ms] of Object.entries(times)) await addGame(quick, slug, ms, 10);

    const res = await request(app).get('/api/leaderboards/global').expect(200);
    expect(names(res.body)).toEqual(['finished_first', 'finished_later']);
  });

  it('leaves out guests, rejected games and games still in play', async () => {
    const player = await createPlayer('player');
    await addGame(player, 'beach', 30000, 1);
    await addGame(player, 'ski-slopes', 5000, 2, { status: 'REJECTED' });
    await addGame(player, 'moon-base', 5000, 3, { status: 'IN_PROGRESS' });
    await addGame(player, 'moon-base', 5000, 4, { guest: true });

    const res = await request(app).get('/api/leaderboards/global').expect(200);
    expect(res.body.rows).toHaveLength(1);
    expect(res.body.rows[0]).toMatchObject({ times: { beach: 30000, skiSlopes: null, moonBase: null }, mapsCompleted: 1 });
  });

  it('pages through the ranking', async () => {
    for (let i = 1; i <= 5; i += 1) await addPlayer(`p${i}`, { beach: i * 10000 });
    const res = await request(app).get('/api/leaderboards/global').query({ page: 2, pageSize: 2 }).expect(200);

    expect(names(res.body)).toEqual(['p3', 'p4']);
    expect(res.body.rows.map((row) => row.rank)).toEqual([3, 4]);
    expect(res.body).toMatchObject({ page: 2, pageSize: 2, total: 5, totalPages: 3 });
    await request(app).get('/api/leaderboards/global').query({ pageSize: 99 }).expect(422);
  });

  it('removes a player\'s times when their account is deleted', async () => {
    const user = await addPlayer('leaver', { beach: 10000 });
    await prisma.user.delete({ where: { id: user.id } });

    expect((await request(app).get('/api/leaderboards/global')).body.total).toBe(0);
  });
});
