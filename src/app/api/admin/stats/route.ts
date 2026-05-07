import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { tickPrices } from "@/server/market";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Minimal admin endpoint to paste per-game stats until we wire live providers.
// Protected by ADMIN_TOKEN to avoid random writes.
const BodySchema = z.object({
  token: z.string().min(1),
  playerId: z.number().int(),
  scope: z.enum(["season", "career"]).default("season"),
  season: z.number().int().optional(),
  advanced: z
    .object({
      gameScore: z.number().nonnegative().optional(),
      tsPct: z.number().min(0).max(1).optional(),
      usageRate: z.number().min(0).max(1).optional(),
    })
    .optional(),
  perGame: z.object({
    pts: z.number().nonnegative().optional(),
    reb: z.number().nonnegative().optional(),
    ast: z.number().nonnegative().optional(),
    stl: z.number().nonnegative().optional(),
    blk: z.number().nonnegative().optional(),
    tov: z.number().nonnegative().optional(),
  }),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken || parsed.data.token !== adminToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { playerId, scope, season, perGame, advanced } = parsed.data;
  const seasonKey = season ?? 0;

  await db.playerStat.upsert({
    where: { playerId_season_scope: { playerId, season: seasonKey, scope } },
    create: { playerId, season: seasonKey, scope, ...perGame, ...advanced },
    update: { ...perGame, ...advanced },
  });

  await tickPrices();
  return NextResponse.json({ ok: true });
}

