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
- **Environment Variables**: add `DATABASE_URL` and `JWT_SECRET` for **Production** (and Preview if you use preview deploys). Local `.env` is not uploaded to Vercel.
- **Database migrations**: `vercel.json` sets `buildCommand` to `prisma migrate deploy && next build`. Without that step, production often has no tables and signup returns a 500.
- **Hosted Postgres (Neon, Supabase, etc.)**: use the connection string they give for **serverless / pooled** access where applicable; if migrations fail in build, check the provider’s docs for a separate **direct** URL for `prisma migrate`.

### Notes

- **Seeding**: the first time you hit the market endpoints, a curated list of players is auto-seeded.
- **Price ticks**: on the Market page, use “Tick prices” to simulate a new minute of price movement.
- **Next steps**: replace the price engine with a live stats feed (play-by-play) and incorporate
  Gemini-powered sentiment signals (news + social).

