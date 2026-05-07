import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { getSessionUserId } from "@/server/auth";
import { ensureSeeded } from "@/server/market";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  playerId: z.number().int(),
  side: z.enum(["BUY", "SELL"]),
  shares: z.number().int().positive().max(10_000),
});

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  await ensureSeeded();

  const { playerId, side, shares } = parsed.data;

  const latestPrice = await db.playerPrice.findFirst({
    where: { playerId },
    orderBy: { createdAt: "desc" },
    select: { priceCents: true },
  });
  if (!latestPrice) return NextResponse.json({ error: "Unknown player" }, { status: 404 });

  const priceCents = latestPrice.priceCents;
  const notional = priceCents * shares;

  try {
    const result = await db.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { cashCents: true },
      });
      if (!user) throw new Error("no_user");

      const holding = await tx.holding.findUnique({
        where: { userId_playerId: { userId, playerId } },
        select: { id: true, shares: true },
      });

      if (side === "BUY") {
        if (user.cashCents < notional) throw new Error("no_cash");
        await tx.user.update({
          where: { id: userId },
          data: { cashCents: { decrement: notional } },
        });
        await tx.holding.upsert({
          where: { userId_playerId: { userId, playerId } },
          create: { userId, playerId, shares },
          update: { shares: { increment: shares } },
        });
      } else {
        const owned = holding?.shares ?? 0;
        if (owned < shares) throw new Error("no_shares");
        await tx.user.update({
          where: { id: userId },
          data: { cashCents: { increment: notional } },
        });
        await tx.holding.update({
          where: { userId_playerId: { userId, playerId } },
          data: { shares: { decrement: shares } },
        });
      }

      await tx.trade.create({
        data: { userId, playerId, side, shares, priceCents },
      });

      const updated = await tx.user.findUnique({
        where: { id: userId },
        select: { cashCents: true },
      });
      return { cashCents: updated?.cashCents ?? 0 };
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    if (msg === "no_cash") return NextResponse.json({ error: "Insufficient cash" }, { status: 400 });
    if (msg === "no_shares") return NextResponse.json({ error: "Insufficient shares" }, { status: 400 });
    return NextResponse.json({ error: "Trade failed" }, { status: 500 });
  }
}

