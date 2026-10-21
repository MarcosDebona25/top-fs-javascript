-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'REJECTED');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "usernameLower" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Map" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageWidth" INTEGER NOT NULL,
    "imageHeight" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "Map_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Character" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "Character_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MapCharacter" (
    "mapId" INTEGER NOT NULL,
    "characterId" INTEGER NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "width" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "calibrated" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "MapCharacter_pkey" PRIMARY KEY ("mapId","characterId")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" UUID NOT NULL,
    "mapId" INTEGER NOT NULL,
    "userId" INTEGER,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3),
    "wrongCount" INTEGER NOT NULL DEFAULT 0,
    "penaltyMs" INTEGER NOT NULL DEFAULT 0,
    "durationMs" INTEGER,
    "status" "GameStatus" NOT NULL DEFAULT 'IN_PROGRESS',

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameFind" (
    "gameId" UUID NOT NULL,
    "characterId" INTEGER NOT NULL,
    "foundAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameFind_pkey" PRIMARY KEY ("gameId","characterId")
);

-- CreateTable
CREATE TABLE "session" (
    "sid" VARCHAR NOT NULL,
    "sess" JSON NOT NULL,
    "expire" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_usernameLower_key" ON "User"("usernameLower");

-- CreateIndex
CREATE UNIQUE INDEX "Map_slug_key" ON "Map"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Map_position_key" ON "Map"("position");

-- CreateIndex
CREATE UNIQUE INDEX "Character_slug_key" ON "Character"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Character_position_key" ON "Character"("position");

-- CreateIndex
CREATE INDEX "Game_mapId_status_durationMs_idx" ON "Game"("mapId", "status", "durationMs");

-- CreateIndex
CREATE INDEX "Game_userId_mapId_idx" ON "Game"("userId", "mapId");

-- CreateIndex
CREATE INDEX "session_expire_idx" ON "session"("expire");

-- AddForeignKey
ALTER TABLE "MapCharacter" ADD CONSTRAINT "MapCharacter_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "Map"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapCharacter" ADD CONSTRAINT "MapCharacter_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "Map"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameFind" ADD CONSTRAINT "GameFind_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameFind" ADD CONSTRAINT "GameFind_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;
