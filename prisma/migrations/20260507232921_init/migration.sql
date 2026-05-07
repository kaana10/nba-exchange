-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "cashCents" INTEGER NOT NULL DEFAULT 1000000,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Player" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "position" TEXT,
    "teamAbbr" TEXT,
    "brId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPlayoff" BOOLEAN NOT NULL DEFAULT false,
    "lastGamelogSyncAt" DATETIME,
    "manualPriceCents" INTEGER,
    "legacyScore" INTEGER NOT NULL DEFAULT 10
);

-- CreateTable
CREATE TABLE "PlayerGame" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerId" INTEGER NOT NULL,
    "seasonEndYear" INTEGER NOT NULL,
    "gameNumber" INTEGER NOT NULL,
    "gameDate" DATETIME NOT NULL,
    "gameScore" REAL NOT NULL,
    "avgGameScore" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlayerGame_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlayerStat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerId" INTEGER NOT NULL,
    "season" INTEGER NOT NULL DEFAULT 0,
    "scope" TEXT NOT NULL DEFAULT 'season',
    "gameScore" REAL,
    "tsPct" REAL,
    "usageRate" REAL,
    "games" INTEGER,
    "minutes" REAL,
    "pts" REAL,
    "reb" REAL,
    "ast" REAL,
    "stl" REAL,
    "blk" REAL,
    "tov" REAL,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlayerStat_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlayerPrice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerId" INTEGER NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'engine_v1',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlayerPrice_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Holding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "playerId" INTEGER NOT NULL,
    "shares" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Holding_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Holding_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "playerId" INTEGER NOT NULL,
    "side" TEXT NOT NULL,
    "shares" INTEGER NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Trade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Trade_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Player_brId_idx" ON "Player"("brId");

-- CreateIndex
CREATE INDEX "PlayerGame_playerId_seasonEndYear_gameDate_idx" ON "PlayerGame"("playerId", "seasonEndYear", "gameDate");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerGame_playerId_seasonEndYear_gameNumber_key" ON "PlayerGame"("playerId", "seasonEndYear", "gameNumber");

-- CreateIndex
CREATE INDEX "PlayerStat_playerId_updatedAt_idx" ON "PlayerStat"("playerId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerStat_playerId_season_scope_key" ON "PlayerStat"("playerId", "season", "scope");

-- CreateIndex
CREATE INDEX "PlayerPrice_playerId_createdAt_idx" ON "PlayerPrice"("playerId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Holding_userId_playerId_key" ON "Holding"("userId", "playerId");

-- CreateIndex
CREATE INDEX "Trade_userId_createdAt_idx" ON "Trade"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Trade_playerId_createdAt_idx" ON "Trade"("playerId", "createdAt");
