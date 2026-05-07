#!/usr/bin/env node
/**
 * Fail fast on Vercel if no DB URL is available for `prisma migrate deploy`.
 */
const has =
  process.env.DIRECT_URL?.trim() ||
  process.env.POSTGRES_URL_NON_POOLING?.trim() ||
  process.env.DATABASE_URL?.trim();

if (!has) {
  console.error(
    "Vercel build: DATABASE_URL is missing (or empty). Add it under Project → Settings → Environment Variables",
    "for Production (and Preview if you deploy previews). If migrate still fails with a pooler error, add DIRECT_URL (non-pooling).",
  );
  process.exit(1);
}
