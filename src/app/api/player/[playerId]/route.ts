import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { fallbackSpreadPriceCents } from "@/server/fallbackPricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ParamsSchema = z.object({
  playerId: z
    .string()
    .regex(/^\d+$/)
    .transform((s) => Number(s)),
});

const QuerySchema = z.object({
  seasonEndYear: z.coerce.number().int().min(1950).max(2100).optional(),
});

export async function GET(req: NextRequest, ctx: { params: Promise<{ playerId: string }> }) {
  const rawParams = await ctx.params;
  const params = ParamsSchema.safeParse(rawParams);
  if (!params.success) return NextResponse.json({ error: "Invalid player id" }, { status: 400 });

  const url = new URL(req.url);
  const query = QuerySchema.safeParse({
    seasonEndYear: url.searchParams.get("seasonEndYear") ?? undefined,
  });
  if (!query.success) return NextResponse.json({ error: "Invalid query" }, { status: 400 });

  const player = await db.player.findUnique({
    where: { id: params.data.playerId },
    select: { id: true, firstName: true, lastName: true, teamAbbr: true, position: true, isPlayoff: true },
  });
  if (!player) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!player.isPlayoff) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const games = await db.playerGame.findMany({
    where: {
      playerId: player.id,
      ...(query.data.seasonEndYear ? { seasonEndYear: query.data.seasonEndYear } : {}),
    },
    orderBy: [{ seasonEndYear: "asc" }, { gameNumber: "asc" }],
    select: {
      seasonEndYear: true,
      gameNumber: true,
      gameDate: true,
      gameScore: true,
      avgGameScore: true,
    },
    take: 2000,
  });

  if (!games.length) {
    // Deterministic synthetic “stock history” for demos when we have no real game logs yet.
    const baseCents =
      (await db.player.findUnique({ where: { id: player.id }, select: { manualPriceCents: true } }))
        ?.manualPriceCents ?? fallbackSpreadPriceCents(player.id);

    const base = baseCents / 100;
    const points = 30;
    let avg = base;

    const synthetic = Array.from({ length: points }, (_, i) => {
      const gameNumber = i + 1;
      const drift = Math.sin((player.id + gameNumber) * 0.9) * 0.8;
      const gmsc = Math.max(2, base + drift);
      avg = (avg * i + gmsc) / gameNumber;
      const day = new Date(Date.now() - (points - gameNumber) * 24 * 60 * 60 * 1000);
      return {
        seasonEndYear: new Date().getFullYear(),
        gameNumber,
        gameDate: day,
        gameScore: gmsc,
        avgGameScore: avg,
      };
    });

    return NextResponse.json({
      player: {
        id: player.id,
        name: `${player.firstName} ${player.lastName}`,
        teamAbbr: player.teamAbbr,
        position: player.position,
      },
      games: synthetic,
      synthetic: true,
    });
  }

  return NextResponse.json({
    player: {
      id: player.id,
      name: `${player.firstName} ${player.lastName}`,
      teamAbbr: player.teamAbbr,
      position: player.position,
    },
    games,
  });
}

