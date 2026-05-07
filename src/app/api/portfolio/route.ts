import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { getSessionUserId } from "@/server/auth";
import { ensureSeeded } from "@/server/market";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureSeeded();

  const [user, holdings] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { cashCents: true, email: true } }),
    db.holding.findMany({
      where: { userId, shares: { gt: 0 } },
      include: {
        player: {
          include: { prices: { orderBy: { createdAt: "desc" }, take: 1 } },
        },
      },
      orderBy: { shares: "desc" },
    }),
  ]);

  const positions = holdings.map((h) => {
    const priceCents = h.player.prices[0]?.priceCents ?? 0;
    return {
      playerId: h.playerId,
      name: `${h.player.firstName} ${h.player.lastName}`,
      teamAbbr: h.player.teamAbbr,
      position: h.player.position,
      shares: h.shares,
      priceCents,
      marketValueCents: priceCents * h.shares,
    };
  });

  const equityCents =
    (user?.cashCents ?? 0) + positions.reduce((sum, p) => sum + p.marketValueCents, 0);

  return NextResponse.json({
    cashCents: user?.cashCents ?? 0,
    equityCents,
    positions,
  });
}

