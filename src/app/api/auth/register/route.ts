import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { applySessionCookie, hashPassword } from "@/server/auth";
import { mapPrismaToAuthError } from "@/server/prisma-http";

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
    const res = NextResponse.json({ ok: true });
    await applySessionCookie(res, user.id);
    return res;
  } catch (e) {
    const prismaErr = mapPrismaToAuthError(e);
    if (prismaErr) {
      return NextResponse.json({ error: prismaErr.error }, { status: prismaErr.status });
    }
    const message = e instanceof Error ? e.message : "";
    if (message.includes("Unique constraint failed") || message.includes("P2002")) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }
    if (message.includes("Missing JWT_SECRET")) {
      return NextResponse.json({ error: "Server misconfigured (JWT_SECRET missing)" }, { status: 500 });
    }
    if (message.includes("DATABASE_URL") || message.includes("connectionString")) {
      return NextResponse.json({ error: "Server misconfigured (DATABASE_URL missing)" }, { status: 500 });
    }
    if (message.includes("does not exist") || message.includes("P2021")) {
      return NextResponse.json({ error: "Database not migrated (missing tables)" }, { status: 500 });
    }
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}

