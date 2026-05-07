import { NextResponse } from "next/server";
import { db } from "@/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Diagnostics for deploys: verifies env presence and DB connectivity (no secrets returned).
 */
export async function GET() {
  const jwtConfigured = Boolean(process.env.JWT_SECRET?.trim());
  const databaseUrlConfigured = Boolean(process.env.DATABASE_URL?.trim());

  let database: "ok" | "error" = "error";
  let databaseError: string | null = null;

  if (!databaseUrlConfigured) {
    databaseError = "DATABASE_URL is empty or missing";
  } else {
    try {
      await db.$queryRaw`SELECT 1`;
      database = "ok";
    } catch (e) {
      databaseError = e instanceof Error ? e.message.slice(0, 400) : "Unknown database error";
    }
  }

  const ok = jwtConfigured && database === "ok";

  return NextResponse.json({
    ok,
    jwtConfigured,
    databaseUrlConfigured,
    database,
    databaseError,
  });
}
