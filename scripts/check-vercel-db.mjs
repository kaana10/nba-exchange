#!/usr/bin/env node
/**
 * Fail fast on Vercel if no DB URL is available for `prisma migrate deploy`.
 */
const direct =
  process.env.DIRECT_URL?.trim() ||
  process.env.POSTGRES_URL_NON_POOLING?.trim() ||
  "";
const databaseUrl = process.env.DATABASE_URL?.trim() || "";

const hasAny = Boolean(direct || databaseUrl);

if (!hasAny) {
  console.error(
    "\n❌ Vercel build: No database URL found.\n\n" +
      "Add in Vercel → Project → Settings → Environment Variables:\n" +
      "  • DATABASE_URL = your Postgres connection string (required)\n" +
      "  • DIRECT_URL = non-pooling / direct string if you use Neon or Supabase pooler (often required for migrations)\n\n" +
      "Enable them for Production (and Preview if you use preview deploys), then Redeploy.",
  );
  process.exit(1);
}

// Prisma migrate needs a real Postgres session; pooled URLs often break migrations.
const migrateUrl = direct || databaseUrl;
const looksLikePooler = /pooler|pgbouncer/i.test(migrateUrl);

if (looksLikePooler && !direct) {
  console.error(
    "\n❌ Vercel build: DATABASE_URL looks like a POOLER URL (connection pooler).\n" +
      "`prisma migrate deploy` usually needs a DIRECT (non-pooling) Postgres URL Prisma docs + Neon/Supabase both say this).\n\n" +
      "What to do:\n" +
      "  1. In Neon (or Supabase), copy the **direct** / **non-pooling** connection string.\n" +
      "  2. In Vercel → Environment Variables → add **DIRECT_URL** = that string.\n" +
      "  3. Keep **DATABASE_URL** as your normal (often pooled) URL for the running app.\n" +
      "  4. Redeploy.\n",
  );
  process.exit(1);
}

console.log("✓ Database env check passed (migrate will use direct URL if DIRECT_URL is set, else DATABASE_URL).");
