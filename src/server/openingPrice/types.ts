export type FundamentalSeasonStats = {
  seasonYear: number;
  pointsPerGame: number;
  reboundsPerGame: number;
  assistsPerGame: number;
  playerEfficiencyRating: number; // PER
};

export type SocialBrandStats = {
  platform: "instagram" | "x" | "tiktok" | "youtube" | "mock";
  followerCount: number;
  avgLikesPerPost: number;
  avgCommentsPerPost?: number;
};

export type OpeningPriceJSON = {
  playerName: string;
  tickerSymbol: string;
  basePrice: number; // dollars
  socialMultiplier: number;
  finalOpeningPrice: number; // dollars
};

export type FundamentalsProvider = {
  getSeasonStats(input: { playerName: string; seasonYear: number }): Promise<FundamentalSeasonStats>;
};

export type SocialProvider = {
  getBrandStats(input: { playerName: string }): Promise<SocialBrandStats>;
};

