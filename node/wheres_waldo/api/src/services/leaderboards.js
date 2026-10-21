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

const bestForMap = (mapId) => Prisma.sql`
  best AS (
    SELECT DISTINCT ON (g."userId")
           g."userId", g."mapId", g.id AS "gameId", g."durationMs", g."finishedAt"
    FROM "Game" g
    WHERE g."status" = 'COMPLETED' AND g."userId" IS NOT NULL AND g."mapId" = ${mapId}
    ORDER BY g."userId", g."durationMs", g."finishedAt", g.id
  )`;

const mapRanked = (mapId) => Prisma.sql`
  ${bestForMap(mapId)},
  ranked AS (
    SELECT b."userId", b."gameId", b."durationMs", u.username,
           ROW_NUMBER() OVER (ORDER BY b."durationMs", b."finishedAt", b."userId") AS rank,
           COUNT(*) OVER () AS total
    FROM best b JOIN "User" u ON u.id = b."userId"
  )`;

const MAP_SLUGS_TTL_MS = 60_000;
const toNumber = (value) => (value === null || value === undefined ? null : Number(value));

// Standings are computed from the games on every request: cheap at this scale and never out of date.
function createLeaderboards({ prisma }) {
  // Map metadata changes only when the database is seeded, so one lookup per minute is enough.
  let cachedMapSlugs = null;
  async function mapSlugs() {
    const now = Date.now();
    if (cachedMapSlugs && now - cachedMapSlugs.at < MAP_SLUGS_TTL_MS) return cachedMapSlugs.value;
    const value = await prisma.map.findMany({ orderBy: { position: 'asc' }, select: { id: true, slug: true, name: true } });
    cachedMapSlugs = { at: now, value };
    return value;
  }

  // `rows[0].total` is the window count that `ranked` already computes, so the usual page is one
  // query. Only an out-of-range page needs a separate count to keep the pagination honest.
  async function totalFrom(rows, countQuery) {
    if (rows.length) return Number(rows[0].total);
    const [{ count }] = await countQuery();
    return Number(count);
  }

  async function mapPage(mapId, { limit, offset }) {
    const rows = await prisma.$queryRaw`
      WITH ${mapRanked(mapId)}
      SELECT rank, username, "durationMs", total FROM ranked ORDER BY rank LIMIT ${limit} OFFSET ${offset}`;
    const total = await totalFrom(rows, () => prisma.$queryRaw`WITH ${bestForMap(mapId)} SELECT COUNT(*) AS count FROM best`);
    return {
      rows: rows.map((row) => ({ rank: Number(row.rank), username: row.username, timeMs: row.durationMs })),
      total,
    };
  }

  async function globalPage({ limit, offset, maps: knownMaps }) {
    const maps = knownMaps ?? (await mapSlugs());
    const slugs = maps.map((map) => map.slug);
    const rows = await prisma.$queryRaw`
      WITH ${GLOBAL}
      SELECT rank, username, "mapsCompleted", "totalMs", times, total FROM ranked ORDER BY rank LIMIT ${limit} OFFSET ${offset}`;
    const total = await totalFrom(rows, () => prisma.$queryRaw`WITH ${GLOBAL} SELECT COUNT(*) AS count FROM ranked`);
    return {
      rows: rows.map((row) => ({
        rank: Number(row.rank),
        username: row.username,
        // Every map has a key; null means the player has not finished that one yet.
        times: Object.fromEntries(slugs.map((slug) => [camelCase(slug), row.times[slug] ?? null])),
        totalMs: Number(row.totalMs),
        mapsCompleted: Number(row.mapsCompleted),
      })),
      total,
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

  // Everything the landing page shows: the global top, each map's top and each map's best time.
  // The global page and the per-map top rows are fetched in parallel: three queries in total.
  async function summary(limit) {
    const maps = await mapSlugs();
    const [global, topRows] = await Promise.all([
      globalPage({ limit, offset: 0, maps }),
      prisma.$queryRaw`
        WITH ${BEST},
        ranked AS (
          SELECT b."mapId", b."userId", b."durationMs", u.username,
                 ROW_NUMBER() OVER (PARTITION BY b."mapId" ORDER BY b."durationMs", b."finishedAt", b."userId") AS rank,
                 COUNT(*) OVER (PARTITION BY b."mapId") AS total
          FROM best b JOIN "User" u ON u.id = b."userId"
        )
        SELECT "mapId", rank, username, "durationMs", total
        FROM ranked WHERE rank <= ${limit} ORDER BY "mapId", rank`,
    ]);

    const byMap = new Map();
    for (const row of topRows) {
      if (!byMap.has(row.mapId)) byMap.set(row.mapId, { rows: [], total: Number(row.total) });
      byMap.get(row.mapId).rows.push({ rank: Number(row.rank), username: row.username, timeMs: row.durationMs });
    }

    const perMap = maps.map((map) => {
      const page = byMap.get(map.id) ?? { rows: [], total: 0 };
      return {
        slug: map.slug,
        name: map.name,
        rows: page.rows,
        total: page.total,
        bestTimeMs: page.rows[0]?.timeMs ?? null,
      };
    });
    return { mapCount: maps.length, global, maps: perMap };
  }

  return { mapPage, globalPage, mapStanding, globalStanding, bestTimes, summary };
}

module.exports = createLeaderboards;
