import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { fetchBrGameLogs } from "@/server/basketballReference/fetchGameLogs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const QuerySchema = z.object({
  token: z.string().min(1),
  seasonEndYear: z.coerce.number().int().min(1950).max(2100),
  playerId: z.coerce.number().int(),
});

export async function POST(req: Request) {
  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    token: url.searchParams.get("token"),
    seasonEndYear: url.searchParams.get("seasonEndYear"),
    playerId: url.searchParams.get("playerId"),
  });
  if (!parsed.success) return NextResponse.json({ error: "Invalid query" }, { status: 400 });

  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken || parsed.data.token !== adminToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const player = await db.player.findUnique({
    where: { id: parsed.data.playerId },
    select: { id: true, brId: true, firstName: true, lastName: true },
  });
  if (!player?.brId) return NextResponse.json({ error: "Player missing brId" }, { status: 400 });

  const logs = await fetchBrGameLogs({ brId: player.brId, seasonEndYear: parsed.data.seasonEndYear });

  // Rebuild season rows for this player/year.
  await db.playerGame.deleteMany({
    where: { playerId: player.id, seasonEndYear: parsed.data.seasonEndYear },
  });

  let sum = 0;
  const toCreate = logs.map((g) => {
    sum += g.gameScore;
    const avg = sum / g.gameNumber;
    return {
      playerId: player.id,
      seasonEndYear: parsed.data.seasonEndYear,
      gameNumber: g.gameNumber,
      gameDate: g.gameDate,
      gameScore: g.gameScore,
      avgGameScore: avg,
    };
  });

  if (toCreate.length) await db.playerGame.createMany({ data: toCreate });

  // Set the current market price equal to the latest average GmSc (in dollars).
  const last = toCreate[toCreate.length - 1];
  if (last) {
    await db.playerPrice.create({
      data: {
        playerId: player.id,
        priceCents: Math.max(500, Math.round(last.avgGameScore * 100)),
        source: "gmsc_avg_season",
      },
    });
  }

  await db.player.update({ where: { id: player.id }, data: { lastGamelogSyncAt: new Date() } });

  return NextResponse.json({
    ok: true,
    playerId: player.id,
    playerName: `${player.firstName} ${player.lastName}`,
    seasonEndYear: parsed.data.seasonEndYear,
    gamesImported: toCreate.length,
    lastAvgGameScore: last?.avgGameScore ?? null,
  });
}

