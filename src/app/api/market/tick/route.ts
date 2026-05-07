import { NextResponse } from "next/server";
import { tickPrices } from "@/server/market";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  await tickPrices();
  return NextResponse.json({ ok: true });
}

