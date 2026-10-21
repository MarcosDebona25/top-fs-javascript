require('dotenv/config');
const { createHash, randomBytes } = require('node:crypto');
const bcrypt = require('bcryptjs');
const prisma = require('../src/lib/prisma');
const hitboxes = require('./data/hitboxes.json');

// Natural size of the original images in assets/maps.
const MAPS = [
  { slug: 'beach', name: 'Beach', imageWidth: 2560, imageHeight: 1644 },
  { slug: 'ski-slopes', name: 'Ski Slopes', imageWidth: 2560, imageHeight: 1623 },
  { slug: 'moon-base', name: 'Moon Base', imageWidth: 2560, imageHeight: 1685 },
];

const CHARACTERS = [
  { slug: 'waldo', name: 'Waldo' },
  { slug: 'woof', name: 'Woof' },
  { slug: 'wenda', name: 'Wenda' },
  { slug: 'wizard', name: 'Wizard Whitebeard' },
  { slug: 'odlaw', name: 'Odlaw' },
];

// Fictional players so a fresh install already has a believable leaderboard.
// Each time is the final duration in milliseconds (real time plus penalties) and the dates are spread
// over a few weeks. Some players replay a scene, but the leaderboard still shows only their best run.
const FICTIONAL_PLAYERS = [
  {
    username: 'waldo_watcher',
    games: [
      { map: 'beach', durationMs: 38_412, wrongCount: 0, finishedAt: '2026-09-20T19:12:00.000Z' },
      { map: 'beach', durationMs: 44_905, wrongCount: 1, finishedAt: '2026-09-21T20:05:00.000Z' },
      { map: 'ski-slopes', durationMs: 54_180, wrongCount: 2, finishedAt: '2026-09-22T18:40:00.000Z' },
      { map: 'moon-base', durationMs: 67_731, wrongCount: 1, finishedAt: '2026-09-23T21:18:00.000Z' },
    ],
  },
  {
    username: 'stripe_spotter',
    games: [
      { map: 'beach', durationMs: 41_907, wrongCount: 1, finishedAt: '2026-09-20T17:30:00.000Z' },
      { map: 'ski-slopes', durationMs: 57_640, wrongCount: 2, finishedAt: '2026-09-21T19:02:00.000Z' },
      { map: 'moon-base', durationMs: 70_205, wrongCount: 0, finishedAt: '2026-09-24T20:44:00.000Z' },
      { map: 'moon-base', durationMs: 75_900, wrongCount: 2, finishedAt: '2026-09-25T18:12:00.000Z' },
    ],
  },
  {
    username: 'odlaw_fan',
    games: [
      { map: 'beach', durationMs: 48_330, wrongCount: 2, finishedAt: '2026-09-19T16:25:00.000Z' },
      { map: 'ski-slopes', durationMs: 63_275, wrongCount: 1, finishedAt: '2026-09-23T19:55:00.000Z' },
      { map: 'moon-base', durationMs: 79_940, wrongCount: 2, finishedAt: '2026-09-26T21:03:00.000Z' },
    ],
  },
  {
    username: 'found_fred',
    games: [
      { map: 'beach', durationMs: 69_780, wrongCount: 4, finishedAt: '2026-09-18T15:10:00.000Z' },
      { map: 'ski-slopes', durationMs: 74_520, wrongCount: 3, finishedAt: '2026-09-22T17:20:00.000Z' },
      { map: 'moon-base', durationMs: 89_330, wrongCount: 5, finishedAt: '2026-09-27T20:15:00.000Z' },
    ],
  },
  {
    username: 'globe_trotter',
    games: [
      { map: 'beach', durationMs: 71_120, wrongCount: 3, finishedAt: '2026-09-19T18:45:00.000Z' },
      { map: 'ski-slopes', durationMs: 81_450, wrongCount: 4, finishedAt: '2026-09-24T17:35:00.000Z' },
      { map: 'moon-base', durationMs: 95_600, wrongCount: 3, finishedAt: '2026-09-28T19:50:00.000Z' },
    ],
  },
  {
    username: 'scene_sleuth',
    games: [
      { map: 'beach', durationMs: 58_240, wrongCount: 2, finishedAt: '2026-09-21T16:40:00.000Z' },
      { map: 'ski-slopes', durationMs: 66_780, wrongCount: 2, finishedAt: '2026-09-25T17:15:00.000Z' },
    ],
  },
  {
    username: 'moonwalker',
    games: [
      { map: 'beach', durationMs: 55_870, wrongCount: 2, finishedAt: '2026-09-19T20:30:00.000Z' },
      { map: 'moon-base', durationMs: 72_360, wrongCount: 1, finishedAt: '2026-09-24T21:25:00.000Z' },
      { map: 'moon-base', durationMs: 80_100, wrongCount: 3, finishedAt: '2026-09-28T19:05:00.000Z' },
    ],
  },
  {
    username: 'wenda_where',
    games: [
      { map: 'beach', durationMs: 52_610, wrongCount: 1, finishedAt: '2026-09-21T18:05:00.000Z' },
      { map: 'moon-base', durationMs: 82_450, wrongCount: 3, finishedAt: '2026-09-26T19:40:00.000Z' },
    ],
  },
  {
    username: 'ski_bunny',
    games: [
      { map: 'ski-slopes', durationMs: 59_845, wrongCount: 2, finishedAt: '2026-09-20T14:45:00.000Z' },
      { map: 'ski-slopes', durationMs: 68_400, wrongCount: 3, finishedAt: '2026-09-25T15:30:00.000Z' },
    ],
  },
  {
    username: 'woof_whisperer',
    games: [{ map: 'ski-slopes', durationMs: 62_390, wrongCount: 2, finishedAt: '2026-09-22T16:10:00.000Z' }],
  },
  {
    username: 'beach_bum',
    games: [{ map: 'beach', durationMs: 64_210, wrongCount: 3, finishedAt: '2026-09-18T17:55:00.000Z' }],
  },
  {
    username: 'wizard_eyes',
    games: [{ map: 'moon-base', durationMs: 73_540, wrongCount: 1, finishedAt: '2026-09-23T20:20:00.000Z' }],
  },
];

function assertRectangle(map, character, box) {
  const { x, y, width, height } = box || {};
  const valid = [x, y, width, height].every((value) => typeof value === 'number' && value >= 0 && value <= 1);
  if (!valid || width <= 0 || height <= 0 || x + width > 1 || y + height > 1) {
    throw new Error(`Invalid hitbox for ${map}/${character} in prisma/data/hitboxes.json`);
  }
}

// Stable UUID for a seeded game, so re-running the seed replaces the same rows instead of piling up copies.
function seedGameId(username, game) {
  const hex = createHash('sha1').update(`wheres-waldo:${username}:${game.map}:${game.finishedAt}`).digest('hex').slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

async function seedFictionalPlayers({ mapIds, characterIds }) {
  const penaltyMs = Number(process.env.WRONG_GUESS_PENALTY_MS) || 1000;
  // One unusable password hash for every demo account: these players exist to populate the board, not to log in.
  const passwordHash = bcrypt.hashSync(randomBytes(32).toString('hex'), 10);
  let gameCount = 0;

  for (const player of FICTIONAL_PLAYERS) {
    const user = await prisma.user.upsert({
      where: { usernameLower: player.username },
      update: { username: player.username },
      create: { username: player.username, usernameLower: player.username, passwordHash },
    });

    // The demo accounts belong to the seed, so rebuilding their runs keeps the data in this file authoritative.
    await prisma.game.deleteMany({ where: { userId: user.id } });

    for (const game of player.games) {
      const finishedAt = new Date(game.finishedAt);
      const gamePenaltyMs = game.wrongCount * penaltyMs;
      const elapsedMs = game.durationMs - gamePenaltyMs;
      if (!mapIds[game.map]) throw new Error(`Seed game for ${player.username} uses an unknown map: ${game.map}`);
      if (elapsedMs <= 0) throw new Error(`Seed game for ${player.username} on ${game.map} is shorter than its penalty`);

      const startedAt = new Date(finishedAt.getTime() - elapsedMs);
      const id = seedGameId(player.username, game);
      await prisma.game.create({
        data: {
          id,
          mapId: mapIds[game.map],
          userId: user.id,
          startedAt,
          finishedAt,
          wrongCount: game.wrongCount,
          penaltyMs: gamePenaltyMs,
          durationMs: game.durationMs,
          status: 'COMPLETED',
        },
      });

      // Finds are spread through the run and the last one lands exactly on finishedAt.
      const progress = [0.16, 0.34, 0.52, 0.74, 1];
      await prisma.gameFind.createMany({
        data: CHARACTERS.map((character, index) => ({
          gameId: id,
          characterId: characterIds[character.slug],
          foundAt: new Date(startedAt.getTime() + Math.round(elapsedMs * progress[index])),
        })),
      });
      gameCount += 1;
    }
  }

  return { playerCount: FICTIONAL_PLAYERS.length, gameCount };
}

async function main() {
  const characterIds = {};
  for (const [index, character] of CHARACTERS.entries()) {
    const row = await prisma.character.upsert({
      where: { slug: character.slug },
      update: { name: character.name, position: index + 1 },
      create: { ...character, position: index + 1 },
    });
    characterIds[character.slug] = row.id;
  }

  const mapIds = {};
  let uncalibrated = 0;
  for (const [index, map] of MAPS.entries()) {
    const row = await prisma.map.upsert({
      where: { slug: map.slug },
      update: { name: map.name, imageWidth: map.imageWidth, imageHeight: map.imageHeight, position: index + 1 },
      create: { ...map, position: index + 1 },
    });
    mapIds[map.slug] = row.id;
    for (const character of CHARACTERS) {
      const box = hitboxes.maps[map.slug] && hitboxes.maps[map.slug][character.slug];
      assertRectangle(map.slug, character.slug, box);
      const data = { x: box.x, y: box.y, width: box.width, height: box.height, calibrated: box.calibrated === true };
      if (!data.calibrated) uncalibrated += 1;
      await prisma.mapCharacter.upsert({
        where: { mapId_characterId: { mapId: row.id, characterId: characterIds[character.slug] } },
        update: data,
        create: { mapId: row.id, characterId: characterIds[character.slug], ...data },
      });
    }
  }

  const { playerCount, gameCount } = await seedFictionalPlayers({ mapIds, characterIds });

  console.log(`Seeded ${MAPS.length} maps, ${CHARACTERS.length} characters, ${playerCount} fictional players and ${gameCount} games.`);
  if (uncalibrated > 0) {
    console.warn(`WARNING: ${uncalibrated} hitboxes are placeholders (calibrated: false). Draw the real ones with the calibration tool.`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
