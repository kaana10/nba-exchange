import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { fetchBrAdvancedSeasonMetrics } from "@/server/basketballReference/fetchAdvancedSeason";
import { tickPrices } from "@/server/market";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const QuerySchema = z.object({
  token: z.string().min(1),
  seasonStartYear: z.coerce.number().int().min(1950).max(2100),
  playerId: z.coerce.number().int().optional(),
});

export async function POST(req: Request) {
  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    token: url.searchParams.get("token"),
    seasonStartYear: url.searchParams.get("seasonStartYear"),
    playerId: url.searchParams.get("playerId") ?? undefined,
  });
  if (!parsed.success) return NextResponse.json({ error: "Invalid query" }, { status: 400 });

  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken || parsed.data.token !== adminToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const players = await db.player.findMany({
    where: {
      isActive: true,
      brId: { not: null },
      ...(parsed.data.playerId ? { id: parsed.data.playerId } : {}),
    },
    select: { id: true, brId: true, firstName: true, lastName: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  const results: Array<{ playerId: number; playerName: string; ok: boolean; error?: string }> = [];

  for (const p of players) {
    const name = `${p.firstName} ${p.lastName}`;
    try {
      const metrics = await fetchBrAdvancedSeasonMetrics({
        brId: p.brId!,
        seasonStartYear: parsed.data.seasonStartYear,
      });

      await db.playerStat.upsert({
        where: {
          playerId_season_scope: { playerId: p.id, season: parsed.data.seasonStartYear, scope: "season" },
        },
        create: {
          playerId: p.id,
          season: parsed.data.seasonStartYear,
          scope: "season",
          gameScore: metrics.gameScore,
          tsPct: metrics.tsPct,
          usageRate: metrics.usageRate,
        },
        update: {
          gameScore: metrics.gameScore,
          tsPct: metrics.tsPct,
          usageRate: metrics.usageRate,
        },
      });

      results.push({ playerId: p.id, playerName: name, ok: true });
    } catch (e) {
      results.push({
        playerId: p.id,
        playerName: name,
        ok: false,
        error: e instanceof Error ? e.message : "unknown error",
      });
    }
  }

  await tickPrices();
  return NextResponse.json({ ok: true, count: results.length, results });
}

