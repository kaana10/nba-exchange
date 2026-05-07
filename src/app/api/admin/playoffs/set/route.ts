import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  token: z.string().min(1),
  playerId: z.number().int(),
  isPlayoff: z.boolean(),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken || parsed.data.token !== adminToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await db.player.update({
    where: { id: parsed.data.playerId },
    data: { isPlayoff: parsed.data.isPlayoff },
  });

  return NextResponse.json({ ok: true });
}

