import { db } from "@/server/db";
import { SEED_PLAYERS } from "@/server/playersSeed";
import { fallbackSpreadPriceCents } from "@/server/fallbackPricing";
const DEFAULT_PRICE_CENTS = 1_000; // $10.00 (league-average placeholder)
const MIN_PRICE_CENTS = 500; // $5.00 absolute floor

export async function ensureSeeded() {
  const count = await db.player.count();
  if (count > 0) return;

  await db.player.createMany({
    data: SEED_PLAYERS.map((p) => ({
      id: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      position: p.position,
      teamAbbr: p.teamAbbr,
      brId: p.brId,
      isActive: true,
      legacyScore: 0,
    })),
  });

  // Seed should be idempotent: include any newcomers even if DB already has players.
  // (For dev, we keep the early-return above; in production we'd upsert instead.)

  await db.playerPrice.createMany({
    data: SEED_PLAYERS.map((p, idx) => ({
      playerId: p.id,
      priceCents: DEFAULT_PRICE_CENTS + idx * 250,
      source: "seed",
    })),
  });
}

export async function getLatestPrices() {
  await ensureSeeded();

  const players = await db.player.findMany({
    where: { isActive: true, isPlayoff: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    include: {
      prices: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  return players.map((p) => ({
    id: p.id,
    name: `${p.firstName} ${p.lastName}`,
    teamAbbr: p.teamAbbr,
    position: p.position,
    priceCents: p.prices[0]?.priceCents ?? DEFAULT_PRICE_CENTS,
    updatedAt: p.prices[0]?.createdAt ?? null,
  }));
}

export async function tickPrices() {
  await ensureSeeded();

  const players = await db.player.findMany({
    where: { isActive: true, isPlayoff: true },
    select: {
      id: true,
      manualPriceCents: true,
      games: {
        orderBy: [{ seasonEndYear: "desc" }, { gameNumber: "desc" }],
        take: 1,
        select: { avgGameScore: true },
      },
    },
  });

  const updates = players.map((p) => {
    const avg = p.games[0]?.avgGameScore;
    const next =
      typeof avg === "number"
        ? Math.max(MIN_PRICE_CENTS, Math.round(avg * 100))
        : Math.max(MIN_PRICE_CENTS, p.manualPriceCents ?? fallbackSpreadPriceCents(p.id));
    return { playerId: p.id, priceCents: next, source: "gmsc_avg_season" };
  });

  await db.playerPrice.createMany({ data: updates });
}

