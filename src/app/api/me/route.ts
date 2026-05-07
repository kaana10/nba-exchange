import { NextResponse } from "next/server";
import { getSessionUserId } from "@/server/auth";
import { db } from "@/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ user: null });

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, cashCents: true },
  });
  return NextResponse.json({ user });
}

