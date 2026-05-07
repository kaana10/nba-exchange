import type { FundamentalsProvider, FundamentalSeasonStats } from "@/server/openingPrice/types";

// Mock fundamentals until we wire a real stats provider (BallDontLie, SportsDataIO, etc).
export class MockFundamentalsProvider implements FundamentalsProvider {
  async getSeasonStats(input: {
    playerName: string;
    seasonYear: number;
  }): Promise<FundamentalSeasonStats> {
    // James Harden example numbers (approximate, for testing the mapping).
    if (input.playerName.toLowerCase().includes("james harden")) {
      return {
        seasonYear: input.seasonYear,
        pointsPerGame: 16.6,
        reboundsPerGame: 5.1,
        assistsPerGame: 8.5,
        playerEfficiencyRating: 18.2,
      };
    }

    return {
      seasonYear: input.seasonYear,
      pointsPerGame: 10,
      reboundsPerGame: 3,
      assistsPerGame: 3,
      playerEfficiencyRating: 12,
    };
  }
}

