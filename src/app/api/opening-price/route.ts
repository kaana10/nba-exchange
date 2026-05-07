import { NextResponse } from "next/server";
import { z } from "zod";
import { getOpeningPriceJSON } from "@/server/openingPrice/openingPriceService";
import { MockFundamentalsProvider } from "@/server/openingPrice/providers/mockFundamentals";
import { MockSocialProvider } from "@/server/openingPrice/providers/mockSocial";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const QuerySchema = z.object({
  playerName: z.string().min(1),
  seasonYear: z.coerce.number().int().min(1950).max(2100).default(new Date().getFullYear()),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    playerName: url.searchParams.get("playerName"),
    seasonYear: url.searchParams.get("seasonYear") ?? undefined,
  });
  if (!parsed.success) return NextResponse.json({ error: "Invalid query" }, { status: 400 });

  const json = await getOpeningPriceJSON({
    playerName: parsed.data.playerName,
    seasonYear: parsed.data.seasonYear,
    fundamentals: new MockFundamentalsProvider(),
    social: new MockSocialProvider(),
  });

  return NextResponse.json(json);
}

