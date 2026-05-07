import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

declare global {
  var __prisma: PrismaClient | undefined;
}

function sqliteAdapter() {
  const raw = process.env.DATABASE_URL?.trim() || "file:./dev.db";
  const url = raw.startsWith("file:") ? raw : `file:${raw}`;
  return new PrismaBetterSqlite3({ url });
}

export const db: PrismaClient =
  globalThis.__prisma ??
  new PrismaClient({
    adapter: sqliteAdapter(),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalThis.__prisma = db;
