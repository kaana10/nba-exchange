import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const QuerySchema = z.object({
  playerId: z
    .string()
    .regex(/^\d+$/)
    .transform((s) => Number(s)),
  seasonEndYear: z.coerce.number().int().min(1950).max(2100).optional(),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    playerId: url.searchParams.get("playerId"),
    seasonEndYear: url.searchParams.get("seasonEndYear") ?? undefined,
  });
  if (!parsed.success) return NextResponse.json({ error: "Invalid query" }, { status: 400 });

  const player = await db.player.findUnique({
    where: { id: parsed.data.playerId },
    select: { id: true, firstName: true, lastName: true, teamAbbr: true, position: true },
  });
  if (!player) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const where = {
    playerId: player.id,
    ...(parsed.data.seasonEndYear ? { seasonEndYear: parsed.data.seasonEndYear } : {}),
  };

  const games = await db.playerGame.findMany({
    where,
    orderBy: [{ seasonEndYear: "asc" }, { gameNumber: "asc" }],
    select: { seasonEndYear: true, gameNumber: true, gameDate: true, gameScore: true, avgGameScore: true },
    take: 2000,
  });

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

