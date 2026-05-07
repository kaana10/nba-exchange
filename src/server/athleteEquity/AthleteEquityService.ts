export type SharePriceWeights = Readonly<{
  production: number; // Game Score
  efficiency: number; // TS%
  usage: number; // Usage rate
}>;

export type SharePriceInputs = Readonly<{
  gameScore: number; // 10 = average, 40+ = elite
  tsPercentage: number; // fraction, e.g. 0.58
  usageRate: number; // fraction, e.g. 0.30
}>;

export type SharePriceResult = Readonly<{
  priceDollars: number;
  components: {
    productionPriceDollars: number;
    efficiencyMultiplier: number;
    usageMultiplier: number;
  };
  weights: SharePriceWeights;
}>;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export class AthleteEquityService {
  static readonly DEFAULT_WEIGHTS: SharePriceWeights = Object.freeze({
    production: 0.5,
    efficiency: 0.3,
    usage: 0.2,
  });

  constructor(private readonly weights: SharePriceWeights = AthleteEquityService.DEFAULT_WEIGHTS) {
    const sum = weights.production + weights.efficiency + weights.usage;
    if (Math.abs(sum - 1) > 1e-6) {
      throw new Error("SharePriceWeights must sum to 1.0");
    }
  }

  /**
   * This formula turns player evaluation into a repeatable, researchable model (stats → price),
   * so users can build and manage a portfolio instead of making coin-flip bets on isolated outcomes.
   */
  calculateSharePrice(gameScore: number, tsPercentage: number, usageRate: number): SharePriceResult {
    // Production (50%): normalize Game Score so 10 => $10.00 (average), 40 => $40.00 (elite).
    const normalizedGameScore = clamp(gameScore, 0, 45);
    const productionPriceDollars = round2(
      clamp(10 + ((normalizedGameScore - 10) / (40 - 10)) * 30, 1, 60),
    );

    // Efficiency Multiplier (30%): TS% where ~58% is neutral (1.0x), 65%+ premium.
    // Below-average efficiency gets a small haircut; clamp keeps it readable/stable.
    const ts = clamp(tsPercentage, 0.35, 0.80);
    const tsPremium = clamp((ts - 0.58) / (0.65 - 0.58), -1, 1); // -1..1
    const efficiencyMultiplier = round2(clamp(1 + tsPremium * 0.15, 0.85, 1.15));

    // Usage Premium (20%): 30%+ usage earns star-power premium (narrative volatility / market impact).
    const usage = clamp(usageRate, 0.05, 0.45);
    const usagePremium = clamp((usage - 0.20) / (0.30 - 0.20), 0, 1); // 0..1
    const usageMultiplier = round2(clamp(1 + usagePremium * 0.25, 1.0, 1.25));

    const w = this.weights;
    const blendedMultiplier = w.production + w.efficiency * efficiencyMultiplier + w.usage * usageMultiplier;
    const priceDollars = round2(productionPriceDollars * blendedMultiplier);

    return {
      priceDollars,
      components: {
        productionPriceDollars,
        efficiencyMultiplier,
        usageMultiplier,
      },
      weights: w,
    };
  }
}

