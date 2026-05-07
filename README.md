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

- `DATABASE_URL="file:./dev.db"` (SQLite file next to the project — no Postgres server).
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

### Notes

- **Seeding**: the first time you hit the market endpoints, a curated list of players is auto-seeded.
- **Price ticks**: on the Market page, use “Tick prices” to simulate a new minute of price movement.
- **Next steps**: replace the price engine with a live stats feed (play-by-play) and incorporate
  Gemini-powered sentiment signals (news + social).

