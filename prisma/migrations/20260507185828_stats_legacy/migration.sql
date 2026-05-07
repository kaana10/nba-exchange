-- CreateTable
CREATE TABLE "PlayerStat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerId" INTEGER NOT NULL,
    "season" INTEGER,
    "scope" TEXT NOT NULL DEFAULT 'season',
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

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Player" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "position" TEXT,
    "teamAbbr" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "legacyScore" INTEGER NOT NULL DEFAULT 10
);
INSERT INTO "new_Player" ("firstName", "id", "lastName", "position", "teamAbbr") SELECT "firstName", "id", "lastName", "position", "teamAbbr" FROM "Player";
DROP TABLE "Player";
ALTER TABLE "new_Player" RENAME TO "Player";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "PlayerStat_playerId_updatedAt_idx" ON "PlayerStat"("playerId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerStat_playerId_season_scope_key" ON "PlayerStat"("playerId", "season", "scope");
