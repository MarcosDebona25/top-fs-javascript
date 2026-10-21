const { request, prisma, createTestApp, resetData, useKnownHitboxes, registerAgent, CHARACTER_SLUGS, MAP_SLUGS } = require('./helpers');

let app;

beforeAll(async () => {
  await resetData();
  await useKnownHitboxes();
  ({ app } = createTestApp());
});

afterAll(async () => {
  await useKnownHitboxes();
  await app.close();
  await prisma.$disconnect();
});

// Every property name anywhere in a JSON value.
function keysOf(value, found = new Set()) {
  if (Array.isArray(value)) value.forEach((item) => keysOf(item, found));
  else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      found.add(key);
      keysOf(child, found);
    }
  }
  return found;
}

describe('GET /api/maps', () => {
  it('lists the three maps in order with their five characters in order', async () => {
    const res = await request(app).get('/api/maps').expect(200);

    expect(res.body.maps.map((map) => map.slug)).toEqual(MAP_SLUGS);
    expect(res.body.maps.map((map) => map.name)).toEqual(['Beach', 'Ski Slopes', 'Moon Base']);
    for (const map of res.body.maps) {
      expect(map.characters.map((character) => character.slug)).toEqual(CHARACTER_SLUGS);
      expect(map.imageWidth).toBe(2560);
      expect(map.imageHeight).toBeGreaterThan(1000);
    }
    expect(res.body.maps[0].characters.map((character) => character.name)).toEqual([
      'Waldo',
      'Woof',
      'Wenda',
      'Wizard Whitebeard',
      'Odlaw',
    ]);
  });

  it('never exposes where the characters are', async () => {
    const res = await request(app).get('/api/maps').expect(200);
    const keys = keysOf(res.body);
    for (const forbidden of ['x', 'y', 'width', 'height', 'hitbox', 'hitboxes', 'rect']) {
      expect(keys.has(forbidden)).toBe(false);
    }
  });

  it('reports that no ranked time exists yet', async () => {
    const res = await request(app).get('/api/maps').expect(200);
    expect(res.body.maps.map((map) => map.bestTimeMs)).toEqual([null, null, null]);
  });

  it('shows the fastest ranked time of each map', async () => {
    const { username } = await registerAgent(app);
    const user = await prisma.user.findUnique({ where: { usernameLower: username.toLowerCase() } });
    const beach = await prisma.map.findUnique({ where: { slug: 'beach' } });
    const finishedAt = new Date('2026-01-01T00:10:00Z');
    const game = { mapId: beach.id, userId: user.id, startedAt: finishedAt, finishedAt, status: 'COMPLETED' };
    await prisma.game.createMany({
      data: [
        { ...game, durationMs: 41000 },
        { ...game, durationMs: 39500 },
        // Guests and rejected games never count.
        { ...game, userId: null, durationMs: 1000 },
        { ...game, status: 'REJECTED', durationMs: 900 },
      ],
    });

    const res = await request(app).get('/api/maps').expect(200);
    expect(res.body.maps.map((map) => map.bestTimeMs)).toEqual([39500, null, null]);
    await resetData();
  });

  it('flags a map whose rectangles are still placeholders', async () => {
    const beach = await prisma.map.findUnique({ where: { slug: 'beach' } });
    await prisma.mapCharacter.updateMany({ where: { mapId: beach.id }, data: { calibrated: false } });

    const res = await request(app).get('/api/maps').expect(200);
    expect(res.body.maps.map((map) => map.calibrated)).toEqual([false, true, true]);
    await useKnownHitboxes();
  });
});
