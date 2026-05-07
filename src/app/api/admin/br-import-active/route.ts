import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { fetchAllActivePlayersFromBr } from "@/server/basketballReference/importActivePlayers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const QuerySchema = z.object({
  token: z.string().min(1),
});

export async function POST(req: Request) {
  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({ token: url.searchParams.get("token") });
  if (!parsed.success) return NextResponse.json({ error: "Invalid query" }, { status: 400 });

  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken || parsed.data.token !== adminToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const active = await fetchAllActivePlayersFromBr();

  // Upsert by brId; if player exists already, attach brId/name if missing.
  // For new players, we create them with a synthetic numeric id derived from brId hash.
  // (Later, replace this with a real NBA player id provider.)
  const createdOrUpdated: Array<{ brId: string; playerName: string; action: "created" | "updated" }> = [];

  function hashToInt(s: string) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    // keep within signed 32-bit positive
    return (h & 0x7fffffff) || 1;
  }

  for (const p of active) {
    const existing = await db.player.findFirst({
      where: { brId: p.brId },
      select: { id: true, firstName: true, lastName: true },
    });

    if (existing) {
      // ensure active & names
      await db.player.update({
        where: { id: existing.id },
        data: {
          isActive: true,
          firstName: existing.firstName || p.firstName,
          lastName: existing.lastName || p.lastName,
        },
      });
      createdOrUpdated.push({ brId: p.brId, playerName: p.playerName, action: "updated" });
      continue;
    }

    // Might already exist by name without brId — try to match by (first,last).
    const byName = await db.player.findFirst({
      where: { firstName: p.firstName, lastName: p.lastName },
      select: { id: true, brId: true },
    });

    if (byName) {
      await db.player.update({
        where: { id: byName.id },
        data: { brId: p.brId, isActive: true },
      });
      createdOrUpdated.push({ brId: p.brId, playerName: p.playerName, action: "updated" });
      continue;
    }

    await db.player.create({
      data: {
        id: hashToInt(p.brId),
        firstName: p.firstName,
        lastName: p.lastName,
        brId: p.brId,
        isActive: true,
        legacyScore: 0,
      },
    });
    createdOrUpdated.push({ brId: p.brId, playerName: p.playerName, action: "created" });
  }

  return NextResponse.json({
    ok: true,
    importedActiveCount: active.length,
    changedCount: createdOrUpdated.length,
    sample: createdOrUpdated.slice(0, 20),
  });
}

