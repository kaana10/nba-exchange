export function fallbackManualPriceCentsByName(fullName: string): number | null {
  const n = fullName.trim().toLowerCase();

  // Hand-tuned “looks legit” baselines (dollars -> cents).
  // Adjust freely for demos.
  const map: Record<string, number> = {
    "shai gilgeous-alexander": 55_00,
    "nikola jokic": 52_00,
    "luka doncic": 50_00,
    "jayson tatum": 46_00,
    "lebron james": 45_00,
    "stephen curry": 44_00,
    "kevin durant": 42_00,
    "joel embiid": 41_00,
    "anthony edwards": 38_00,
    "jimmy butler": 36_00,
    "ja morant": 35_00,
    "giannis antetokounmpo": 48_00,
  };

  return map[n] ?? null;
}

function hashInt(x: number) {
  // deterministic pseudo-random-ish 0..1 from int
  const s = Math.sin(x * 999) * 10000;
  return s - Math.floor(s);
}

export function fallbackSpreadPriceCents(playerId: number): number {
  // For everyone else: spread roughly $8 .. $28 so the board doesn’t look flat.
  const r = hashInt(playerId);
  const dollars = 8 + r * 20;
  return Math.round(dollars * 100);
}

