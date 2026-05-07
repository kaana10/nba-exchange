import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { fetchBrGameLogs } from "@/server/basketballReference/fetchGameLogs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const QuerySchema = z.object({
  token: z.string().min(1),
  seasonEndYear: z.coerce.number().int().min(1950).max(2100),
  limit: z.coerce.number().int().min(1).max(25).default(5),
  minHoursBetweenSyncs: z.coerce.number().int().min(0).max(168).default(24),
});

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    token: url.searchParams.get("token"),
    seasonEndYear: url.searchParams.get("seasonEndYear"),
    limit: url.searchParams.get("limit") ?? undefined,
    minHoursBetweenSyncs: url.searchParams.get("minHoursBetweenSyncs") ?? undefined,
  });
  if (!parsed.success) return NextResponse.json({ error: "Invalid query" }, { status: 400 });

  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken || parsed.data.token !== adminToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - parsed.data.minHoursBetweenSyncs * 60 * 60 * 1000);

  const candidates = await db.player.findMany({
    where: {
      isActive: true,
      isPlayoff: true,
      brId: { not: null },
      OR: [{ lastGamelogSyncAt: null }, { lastGamelogSyncAt: { lt: cutoff } }],
    },
    select: { id: true, brId: true, firstName: true, lastName: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    take: parsed.data.limit,
  });

  const results: Array<{ playerId: number; playerName: string; ok: boolean; gamesImported?: number; error?: string }> =
    [];

  for (const p of candidates) {
    const playerName = `${p.firstName} ${p.lastName}`;
    try {
      const logs = await fetchBrGameLogs({ brId: p.brId!, seasonEndYear: parsed.data.seasonEndYear });

      await db.playerGame.deleteMany({ where: { playerId: p.id, seasonEndYear: parsed.data.seasonEndYear } });

      let sum = 0;
      const toCreate = logs.map((g) => {
        sum += g.gameScore;
        const avg = sum / g.gameNumber;
        return {
          playerId: p.id,
          seasonEndYear: parsed.data.seasonEndYear,
          gameNumber: g.gameNumber,
          gameDate: g.gameDate,
          gameScore: g.gameScore,
          avgGameScore: avg,
        };
      });

      if (toCreate.length) await db.playerGame.createMany({ data: toCreate });

      const last = toCreate[toCreate.length - 1];
      if (last) {
        await db.playerPrice.create({
          data: {
            playerId: p.id,
            priceCents: Math.max(500, Math.round(last.avgGameScore * 100)),
            source: "gmsc_avg_season",
          },
        });
      }

      await db.player.update({ where: { id: p.id }, data: { lastGamelogSyncAt: new Date() } });
      results.push({ playerId: p.id, playerName, ok: true, gamesImported: toCreate.length });
    } catch (e) {
      results.push({ playerId: p.id, playerName, ok: false, error: e instanceof Error ? e.message : "error" });
    }

    // polite pacing between player pages
    await sleep(1500);
  }

  return NextResponse.json({
    ok: true,
    seasonEndYear: parsed.data.seasonEndYear,
    processed: candidates.length,
    results,
  });
}

