import type {
  FundamentalsProvider,
  OpeningPriceJSON,
  SocialProvider,
} from "@/server/openingPrice/types";

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function toTickerSymbol(playerName: string) {
  // Simple, deterministic: last name uppercased (fallback to first).
  const cleaned = playerName.replace(/[^a-zA-Z\s']/g, "").trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  const last = parts[parts.length - 1] ?? cleaned;
  return last.replace(/'/g, "").toUpperCase().slice(0, 6);
}

export function calculateBaselinePriceDollars(input: {
  pointsPerGame: number;
  reboundsPerGame: number;
  assistsPerGame: number;
  playerEfficiencyRating: number;
}) {
  // Pillar 1: fundamentals only.
  // PER anchors “overall efficiency”, while box stats capture volume.
  const impact =
    input.pointsPerGame * 1.0 +
    input.reboundsPerGame * 1.15 +
    input.assistsPerGame * 1.35 +
    input.playerEfficiencyRating * 1.6;

  // Map to a plausible “IPO price” range.
  const dollars = 12 + impact * 2.1;
  return round2(clamp(dollars, 5, 500));
}

export function calculateSocialMultiplier(input: {
  followerCount: number;
  avgLikesPerPost: number;
}) {
  // Pillar 3: brand equity / liquidity premium.
  // Use log scaling so superstars don’t explode prices.
  const followers = Math.max(0, input.followerCount);
  const likes = Math.max(0, input.avgLikesPerPost);

  const followerSignal = Math.log10(followers + 10) / 8; // ~0.5 for 10M+
  const engagementSignal = Math.log10(likes + 10) / 6; // ~0.7 for 100k+

  const raw = 1 + followerSignal * 0.35 + engagementSignal * 0.25;
  return round2(clamp(raw, 1.0, 1.75));
}

export async function getOpeningPriceJSON(input: {
  playerName: string;
  seasonYear: number;
  fundamentals: FundamentalsProvider;
  social: SocialProvider;
}): Promise<OpeningPriceJSON> {
  const [fund, brand] = await Promise.all([
    input.fundamentals.getSeasonStats({
      playerName: input.playerName,
      seasonYear: input.seasonYear,
    }),
    input.social.getBrandStats({ playerName: input.playerName }),
  ]);

  const basePrice = calculateBaselinePriceDollars({
    pointsPerGame: fund.pointsPerGame,
    reboundsPerGame: fund.reboundsPerGame,
    assistsPerGame: fund.assistsPerGame,
    playerEfficiencyRating: fund.playerEfficiencyRating,
  });

  const socialMultiplier = calculateSocialMultiplier({
    followerCount: brand.followerCount,
    avgLikesPerPost: brand.avgLikesPerPost,
  });

  const finalOpeningPrice = round2(basePrice * socialMultiplier);

  return {
    playerName: input.playerName,
    tickerSymbol: toTickerSymbol(input.playerName),
    basePrice,
    socialMultiplier,
    finalOpeningPrice,
  };
}

