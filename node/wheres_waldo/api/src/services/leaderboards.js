const { Prisma } = require('@prisma/client');
const { camelCase } = require('../lib/names');

// Each registered player's best completed game per map; ties go to whoever finished first.
const BEST = Prisma.sql`
  best AS (
    SELECT DISTINCT ON (g."userId", g."mapId")
           g."userId", g."mapId", g.id AS "gameId", g."durationMs", g."finishedAt"
    FROM "Game" g
    WHERE g."status" = 'COMPLETED' AND g."userId" IS NOT NULL
    ORDER BY g."userId", g."mapId", g."durationMs", g."finishedAt", g.id
  )`;

// One row per player: how many maps they finished, their total and the moment they finished the last one.
// Players with more maps rank first, then the lower total, then whoever got there earlier.
const GLOBAL = Prisma.sql`
  ${BEST},
  per_user AS (
    SELECT b."userId",
           COUNT(*) AS "mapsCompleted",
           SUM(b."durationMs") AS "totalMs",
           MAX(b."finishedAt") AS "completedAt",
           jsonb_object_agg(m.slug, b."durationMs") AS times
    FROM best b JOIN "Map" m ON m.id = b."mapId"
    GROUP BY b."userId"
  ),
  ranked AS (
    SELECT p.*, u.username,
           ROW_NUMBER() OVER (ORDER BY p."mapsCompleted" DESC, p."totalMs", p."completedAt", p."userId") AS rank,
           COUNT(*) OVER () AS total
    FROM per_user p JOIN "User" u ON u.id = p."userId"
  )`;

const mapRanked = (mapId) => Prisma.sql`
  ${BEST},
  ranked AS (
    SELECT b."userId", b."gameId", b."durationMs", u.username,
           ROW_NUMBER() OVER (ORDER BY b."durationMs", b."finishedAt", b."userId") AS rank,
           COUNT(*) OVER () AS total
    FROM best b JOIN "User" u ON u.id = b."userId"
    WHERE b."mapId" = ${mapId}
  )`;

const toNumber = (value) => (value === null || value === undefined ? null : Number(value));

// Standings are computed from the games on every request: cheap at this scale and never out of date.
function createLeaderboards({ prisma }) {
  async function mapSlugs() {
    return prisma.map.findMany({ orderBy: { position: 'asc' }, select: { id: true, slug: true, name: true } });
  }

  async function mapPage(mapId, { limit, offset }) {
    const rows = await prisma.$queryRaw`
      WITH ${mapRanked(mapId)}
      SELECT rank, username, "durationMs", total FROM ranked ORDER BY rank LIMIT ${limit} OFFSET ${offset}`;
    const [{ count }] = await prisma.$queryRaw`WITH ${BEST} SELECT COUNT(*) AS count FROM best WHERE "mapId" = ${mapId}`;
    return {
      rows: rows.map((row) => ({ rank: Number(row.rank), username: row.username, timeMs: row.durationMs })),
      total: Number(count),
    };
  }

  async function globalPage({ limit, offset }) {
    const slugs = (await mapSlugs()).map((map) => map.slug);
    const rows = await prisma.$queryRaw`
      WITH ${GLOBAL}
      SELECT rank, username, "mapsCompleted", "totalMs", times FROM ranked ORDER BY rank LIMIT ${limit} OFFSET ${offset}`;
    const [{ count }] = await prisma.$queryRaw`WITH ${GLOBAL} SELECT COUNT(*) AS count FROM ranked`;
    return {
      rows: rows.map((row) => ({
        rank: Number(row.rank),
        username: row.username,
        // Every map has a key; null means the player has not finished that one yet.
        times: Object.fromEntries(slugs.map((slug) => [camelCase(slug), row.times[slug] ?? null])),
        totalMs: Number(row.totalMs),
        mapsCompleted: Number(row.mapsCompleted),
      })),
      total: Number(count),
    };
  }

  // Where a player stands on a map, from their best game there: { rank, total, timeMs, gameId } or null.
  async function mapStanding(userId, mapId) {
    const rows = await prisma.$queryRaw`
      WITH ${mapRanked(mapId)} SELECT rank, total, "durationMs", "gameId" FROM ranked WHERE "userId" = ${userId}`;
    if (!rows.length) return null;
    return { rank: Number(rows[0].rank), total: Number(rows[0].total), timeMs: rows[0].durationMs, gameId: rows[0].gameId };
  }

  async function globalStanding(userId) {
    const rows = await prisma.$queryRaw`WITH ${GLOBAL} SELECT rank, total FROM ranked WHERE "userId" = ${userId}`;
    if (!rows.length) return null;
    return { rank: Number(rows[0].rank), total: Number(rows[0].total) };
  }

  // Fastest ranked time on each map: { [mapId]: ms }.
  async function bestTimes() {
    const rows = await prisma.$queryRaw`
      SELECT "mapId", MIN("durationMs") AS best FROM "Game"
      WHERE "status" = 'COMPLETED' AND "userId" IS NOT NULL GROUP BY "mapId"`;
    return Object.fromEntries(rows.map((row) => [row.mapId, toNumber(row.best)]));
  }

  // Everything the landing page shows: the global top and each map's top.
  async function summary(limit) {
    const maps = await mapSlugs();
    const global = await globalPage({ limit, offset: 0 });
    const perMap = [];
    for (const map of maps) {
      const page = await mapPage(map.id, { limit, offset: 0 });
      perMap.push({ slug: map.slug, name: map.name, rows: page.rows, total: page.total });
    }
    return { mapCount: maps.length, global, maps: perMap };
  }

  return { mapPage, globalPage, mapStanding, globalStanding, bestTimes, summary };
}

module.exports = createLeaderboards;
