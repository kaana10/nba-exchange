import { NextResponse } from "next/server";
import { getLatestPrices } from "@/server/market";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const market = await getLatestPrices();
  return NextResponse.json({ market });
}

