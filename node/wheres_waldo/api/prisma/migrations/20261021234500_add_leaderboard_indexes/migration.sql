-- Covering indexes for the leaderboard's "best game per player and map" CTE.
DROP INDEX "Game_userId_mapId_idx";

CREATE INDEX "Game_userId_mapId_durationMs_finishedAt_idx"
  ON "Game" ("userId", "mapId", "durationMs", "finishedAt");

CREATE INDEX "Game_mapId_userId_durationMs_finishedAt_idx"
  ON "Game" ("mapId", "userId", "durationMs", "finishedAt");
