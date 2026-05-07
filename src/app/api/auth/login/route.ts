import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { createSession, verifyPassword } from "@/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(1).max(200),
});

export async function POST(req: Request) {
  try {
    const json = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase();
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, passwordHash: true },
    });
    if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    const ok = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!ok) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    await createSession(user.id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
