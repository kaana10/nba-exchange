-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PlayerStat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerId" INTEGER NOT NULL,
    "season" INTEGER NOT NULL DEFAULT 0,
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
INSERT INTO "new_PlayerStat" ("ast", "blk", "createdAt", "games", "id", "minutes", "playerId", "pts", "reb", "scope", "season", "stl", "tov", "updatedAt") SELECT "ast", "blk", "createdAt", "games", "id", "minutes", "playerId", "pts", "reb", "scope", coalesce("season", 0) AS "season", "stl", "tov", "updatedAt" FROM "PlayerStat";
DROP TABLE "PlayerStat";
ALTER TABLE "new_PlayerStat" RENAME TO "PlayerStat";
CREATE INDEX "PlayerStat_playerId_updatedAt_idx" ON "PlayerStat"("playerId", "updatedAt");
CREATE UNIQUE INDEX "PlayerStat_playerId_season_scope_key" ON "PlayerStat"("playerId", "season", "scope");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
