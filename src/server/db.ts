import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import type { PoolConfig } from "pg";

declare global {
  var __prisma: PrismaClient | undefined;
}

/** `DATABASE_PG_TLS_INSECURE=1` sets `ssl: { rejectUnauthorized: false }` (debugging only; try fixing URL/sslmode first). */
function pgPoolInput(): string | PoolConfig {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    return "";
  }
  if (process.env.DATABASE_PG_TLS_INSECURE === "1") {
    return {
      connectionString,
      ssl: { rejectUnauthorized: false },
    };
  }
  return connectionString;
}

export const db: PrismaClient =
  globalThis.__prisma ??
  new PrismaClient({
    adapter: new PrismaPg(pgPoolInput()),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalThis.__prisma = db;

