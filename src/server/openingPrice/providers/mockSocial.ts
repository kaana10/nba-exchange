import type { SocialBrandStats, SocialProvider } from "@/server/openingPrice/types";

export class MockSocialProvider implements SocialProvider {
  async getBrandStats(input: { playerName: string }): Promise<SocialBrandStats> {
    if (input.playerName.toLowerCase().includes("james harden")) {
      return {
        platform: "mock",
        followerCount: 23_000_000,
        avgLikesPerPost: 180_000,
        avgCommentsPerPost: 2_500,
      };
    }

    return {
      platform: "mock",
      followerCount: 200_000,
      avgLikesPerPost: 2_000,
      avgCommentsPerPost: 50,
    };
  }
}

