import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { createSession, hashPassword } from "@/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(8).max(200),
});

export async function POST(req: Request) {
  try {
    const json = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const email = parsed.data.email.trim().toLowerCase();
    const passwordHash = await hashPassword(parsed.data.password);

    const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) return NextResponse.json({ error: "Email already in use" }, { status: 409 });

    const user = await db.user.create({
      data: { email, passwordHash },
      select: { id: true },
    });
    await createSession(user.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "";
    if (message.includes("Unique constraint failed") || message.includes("P2002")) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
