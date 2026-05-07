import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { fetchRosterPlayersForTeamsFromBr } from "@/server/basketballReference/importPlayoffRosters";
import { tickPrices } from "@/server/market";
import { fallbackManualPriceCentsByName } from "@/server/fallbackPricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const QuerySchema = z.object({
  token: z.string().min(1),
  seasonEndYear: z.coerce.number().int().min(1950).max(2100),
  teams: z.string().min(1), // comma-separated 3-letter abbreviations
});

export async function POST(req: Request) {
  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    token: url.searchParams.get("token"),
    seasonEndYear: url.searchParams.get("seasonEndYear"),
    teams: url.searchParams.get("teams"),
  });
  if (!parsed.success) return NextResponse.json({ error: "Invalid query" }, { status: 400 });

  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken || parsed.data.token !== adminToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teamAbbrs = parsed.data.teams
    .split(",")
    .map((t) => t.trim().toUpperCase())
    .filter(Boolean);

  if (teamAbbrs.length !== 8) {
    return NextResponse.json(
      { error: "Expected exactly 8 team abbreviations (comma-separated)." },
      { status: 400 },
    );
  }

  // Clear all playoff flags; we will set only the remaining 8 teams.
  await db.player.updateMany({ data: { isPlayoff: false } });

  const rosterPlayers = await fetchRosterPlayersForTeamsFromBr({
    seasonEndYear: parsed.data.seasonEndYear,
    teamAbbrs,
  });

  function hashToInt(s: string) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return (h & 0x7fffffff) || 1;
  }

  let created = 0;
  let updated = 0;

  for (const p of rosterPlayers) {
    const existing = await db.player.findFirst({ where: { brId: p.brId }, select: { id: true } });
    if (existing) {
      await db.player.update({
        where: { id: existing.id },
        data: {
          isActive: true,
          isPlayoff: true,
          teamAbbr: p.teamAbbr,
          firstName: p.firstName,
          lastName: p.lastName,
          manualPriceCents: fallbackManualPriceCentsByName(`${p.firstName} ${p.lastName}`) ?? undefined,
        },
      });
      updated++;
      continue;
    }

    const byName = await db.player.findFirst({
      where: { firstName: p.firstName, lastName: p.lastName },
      select: { id: true },
    });
    if (byName) {
      await db.player.update({
        where: { id: byName.id },
        data: {
          brId: p.brId,
          isActive: true,
          isPlayoff: true,
          teamAbbr: p.teamAbbr,
          manualPriceCents: fallbackManualPriceCentsByName(`${p.firstName} ${p.lastName}`) ?? undefined,
        },
      });
      updated++;
      continue;
    }

    await db.player.create({
      data: {
        id: hashToInt(p.brId),
        firstName: p.firstName,
        lastName: p.lastName,
        brId: p.brId,
        teamAbbr: p.teamAbbr,
        isActive: true,
        isPlayoff: true,
        manualPriceCents: fallbackManualPriceCentsByName(`${p.firstName} ${p.lastName}`) ?? undefined,
        legacyScore: 0,
      },
    });
    created++;
  }

  // Ensure every newly-included player gets an immediate season-based price (or $10 placeholder).
  await tickPrices();

  return NextResponse.json({
    ok: true,
    seasonEndYear: parsed.data.seasonEndYear,
    teams: teamAbbrs,
    rosterCount: rosterPlayers.length,
    created,
    updated,
  });
}

