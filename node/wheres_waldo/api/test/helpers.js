// Loaded first by every test file: points the app at the test database before anything connects.
const { testDatabaseUrl } = require('../scripts/test-db');

process.env.DATABASE_URL = testDatabaseUrl();
process.env.SESSION_SECRET = 'test-secret-'.repeat(8);
process.env.CORS_ORIGINS = 'http://localhost:5173';

const request = require('supertest');
const { createApp } = require('../src/app');
const prisma = require('../src/lib/prisma');

// A clock the tests move by hand, so every duration is exact.
function createClock(start = '2026-01-01T00:00:00.000Z') {
  let current = new Date(start).getTime();
  return {
    now: () => new Date(current),
    advance(ms) {
      current += ms;
    },
  };
}

// Known rectangles (normalized 0..1, x/y = top-left corner) used instead of the seed's placeholders.
const HITBOXES = {
  waldo: { x: 0.1, y: 0.1, width: 0.05, height: 0.05 },
  woof: { x: 0.3, y: 0.1, width: 0.05, height: 0.05 },
  wenda: { x: 0.5, y: 0.1, width: 0.05, height: 0.05 },
  wizard: { x: 0.7, y: 0.1, width: 0.05, height: 0.05 },
  odlaw: { x: 0.9, y: 0.1, width: 0.05, height: 0.05 },
};
const CHARACTER_SLUGS = Object.keys(HITBOXES);
const MAP_SLUGS = ['beach', 'ski-slopes', 'moon-base'];

// Centre of a character's rectangle: always a hit.
const centerOf = (slug) => ({ x: HITBOXES[slug].x + HITBOXES[slug].width / 2, y: HITBOXES[slug].y + HITBOXES[slug].height / 2 });

async function useKnownHitboxes() {
  const characters = await prisma.character.findMany();
  const maps = await prisma.map.findMany();
  for (const map of maps) {
    for (const character of characters) {
      await prisma.mapCharacter.update({
        where: { mapId_characterId: { mapId: map.id, characterId: character.id } },
        data: { ...HITBOXES[character.slug], calibrated: true },
      });
    }
  }
}

async function resetData() {
  await prisma.game.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$executeRaw`DELETE FROM "session"`;
}

// Tests run with cheap bcrypt, no session pruning timer, an http (not https) cookie and rate limits
// out of the way (the tests that exercise a limit set their own).
function createTestApp({ config = {}, start } = {}) {
  const clock = createClock(start);
  const defaults = {
    COOKIE_SECURE: false,
    BCRYPT_COST: 4,
    SESSION_PRUNE: false,
    AUTH_RATE_LIMIT: 1000,
    START_RATE_LIMIT: 1000,
    GUESS_RATE_LIMIT: 1000,
  };
  const app = createApp({ now: clock.now, config: { ...defaults, ...config } });
  return { app, clock };
}

let usernameCounter = 0;
const uniqueName = (prefix = 't') => `${prefix}_${Date.now().toString(36)}${(usernameCounter += 1)}`;

// Registers a player through the API and returns a supertest agent that keeps the session cookie.
async function registerAgent(app, username = uniqueName(), password = 'a long password') {
  const agent = request.agent(app);
  await agent.post('/api/auth/register').send({ username, password, confirmPassword: password }).expect(201);
  return { agent, username };
}

module.exports = {
  request,
  prisma,
  createTestApp,
  createClock,
  resetData,
  useKnownHitboxes,
  registerAgent,
  uniqueName,
  HITBOXES,
  CHARACTER_SLUGS,
  MAP_SLUGS,
  centerOf,
};
