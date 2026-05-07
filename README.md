## NBA Exchange (MVP)

Paper-trading “athlete stock exchange” for NBA players:

- Login / signup
- Buy & sell shares (simulated cash)
- Portfolio view
- Bottom-of-screen price ticker
- Simple price engine (periodic “ticks”)

### Getting started

1) Install deps

```bash
cd nba-exchange
npm install
```

2) Set env

- Set `DATABASE_URL` (Postgres connection string).
- Set `JWT_SECRET` (any long random string).
- Set `GEMINI_API_KEY` if you want to later plug sentiment/news into pricing.

3) Create DB tables

```bash
cd nba-exchange
npx prisma migrate dev
```

4) Run

```bash
cd nba-exchange
npm run dev
```

Open `http://localhost:3000`.

### Deploying to Vercel

- **Root Directory**: set the Vercel project **Root Directory** to `nba-exchange` if the repo root is the parent folder (so `vercel.json` and Next.js are picked up).
- **Environment Variables** (for **Production** and **Preview** if you use previews):
  - `JWT_SECRET` — required at runtime.
  - `DATABASE_URL` — required at **runtime** (use your host’s normal “app” / pooled URL if they give one, e.g. Neon’s Prisma or pooled string).
  - **Migrations during build**: `vercel.json` runs `prisma migrate deploy` before `next build`. That step needs a URL Prisma can migrate with:
    - If migrate fails with pooler / PgBouncer errors, add a **direct** (non-pooling) URL as **`DIRECT_URL`** in Vercel (Neon: “non-pooling” / direct; Supabase: often a “direct” or transaction URL). `prisma.config.ts` uses `DIRECT_URL` first, then `POSTGRES_URL_NON_POOLING`, then `DATABASE_URL`.
  - Vars must exist for the environment that is building. If the build still says it cannot see the DB, open the deployment log and read the Prisma error code (e.g. P1001 = cannot reach DB).
- **Database migrations**: `vercel.json` sets `buildCommand` to `prisma migrate deploy && next build`.
- **Node**: this project expects **Node ≥ 20.19** (see `package.json` `engines`), matching Prisma 7. In Vercel → Settings → General, set the Node.js Version to **22.x** (or 20.19+) if builds fail for that reason.

### Notes

- **Seeding**: the first time you hit the market endpoints, a curated list of players is auto-seeded.
- **Price ticks**: on the Market page, use “Tick prices” to simulate a new minute of price movement.
- **Next steps**: replace the price engine with a live stats feed (play-by-play) and incorporate
  Gemini-powered sentiment signals (news + social).

