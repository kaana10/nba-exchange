import * as cheerio from "cheerio";

export type BrAdvancedSeasonMetrics = {
  seasonStartYear: number;
  seasonLabel: string;
  gameScore: number;
  tsPct: number; // fraction (0..1)
  usageRate: number; // fraction (0..1)
};

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const cache = new Map<string, { at: number; value: BrAdvancedSeasonMetrics }>();

function parseNumber(s: string | undefined) {
  if (!s) return null;
  const n = Number(String(s).trim());
  return Number.isFinite(n) ? n : null;
}

function parsePctFraction(s: string | undefined) {
  const n = parseNumber(s);
  if (n === null) return null;
  // basketball-reference uses decimals like 0.623 for TS%
  return n;
}

function parsePercentToFraction(s: string | undefined) {
  const n = parseNumber(s);
  if (n === null) return null;
  return n / 100;
}

function computeGameScoreFromPerGame(perGame: {
  pts: number;
  fg: number;
  fga: number;
  ft: number;
  fta: number;
  orb: number;
  drb: number;
  stl: number;
  ast: number;
  blk: number;
  pf: number;
  tov: number;
}) {
  // John Hollinger Game Score (per-game approximation from season per-game stats).
  return (
    perGame.pts +
    0.4 * perGame.fg -
    0.7 * perGame.fga -
    0.4 * (perGame.fta - perGame.ft) +
    0.7 * perGame.orb +
    0.3 * perGame.drb +
    perGame.stl +
    0.7 * perGame.ast +
    0.7 * perGame.blk -
    0.4 * perGame.pf -
    perGame.tov
  );
}

function seasonLabelFromStartYear(seasonStartYear: number) {
  return `${seasonStartYear}-${String(seasonStartYear + 1).slice(-2)}`;
}

function brUrl(brId: string) {
  const letter = brId[0]?.toLowerCase();
  if (!letter) throw new Error("Invalid brId");
  return `https://www.basketball-reference.com/players/${letter}/${brId}.html`;
}

function extractAdvancedTableHtml(pageHtml: string) {
  // Basketball-Reference frequently wraps tables in HTML comments.
  // Try direct first; if missing, scan comment blocks for the table id.
  if (pageHtml.includes('id="advanced"') || pageHtml.includes('id="per_game"')) return pageHtml;

  const commentBlocks = pageHtml.match(/<!--([\s\S]*?)-->/g) ?? [];
  for (const block of commentBlocks) {
    if (block.includes('id="advanced"') || block.includes('id="per_game"')) {
      return block.replace(/^<!--/, "").replace(/-->$/, "");
    }
  }
  return pageHtml;
}

export async function fetchBrAdvancedSeasonMetrics(input: {
  brId: string;
  seasonStartYear: number; // e.g. 2025 for 2025-26
}): Promise<BrAdvancedSeasonMetrics> {
  const cacheKey = `${input.brId}:${input.seasonStartYear}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.value;

  const url = brUrl(input.brId);
  const res = await fetch(url, {
    headers: {
      // Play nice: identify ourselves.
      "user-agent": "nba-exchange-mgt828/0.1 (educational project; low-frequency fetching)",
      "accept-language": "en-US,en;q=0.9",
    },
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Basketball-Reference fetch failed (${res.status})`);
  const html = await res.text();
  const htmlWithAdvanced = extractAdvancedTableHtml(html);
  const $ = cheerio.load(htmlWithAdvanced);

  const seasonLabel = seasonLabelFromStartYear(input.seasonStartYear);

  // Advanced table: find row where season text equals season end year or label.
  const seasonEndYear = String(input.seasonStartYear + 1);

  const advanced = $("#advanced");
  const perGame = $("#per_game_stats");
  if (!advanced.length) throw new Error("Advanced table not found on Basketball-Reference page");
  if (!perGame.length) throw new Error("Per-game table not found on Basketball-Reference page");

  function findSeasonRow(table: ReturnType<typeof $>) {
    let found: ReturnType<typeof $> | null = null;
    table.find("tbody tr").each((_, el) => {
      const $el = $(el);
      // BR uses data-stat="year_id" with strings like "2023-24" on player pages.
      const yearId = $el.find('th[data-stat="year_id"]').text().trim();
      if (yearId === seasonLabel || yearId === seasonEndYear) found = $el;
    });
    return found;
  }

  const advRow = findSeasonRow(advanced);
  const pgRow = findSeasonRow(perGame);
  if (!advRow || !pgRow) throw new Error(`Season row not found for ${seasonLabel}`);
  const adv = advRow as ReturnType<typeof $>;
  const pg = pgRow as ReturnType<typeof $>;

  // Game Score is in per-game table (data-stat="gmsc"); TS% and USG% are in advanced.
  // BR does not provide season "gmsc" directly, so we compute an approximation from per-game stats.
  const pts = parseNumber(pg.find('td[data-stat="pts_per_g"]').text());
  const fg = parseNumber(pg.find('td[data-stat="fg_per_g"]').text());
  const fga = parseNumber(pg.find('td[data-stat="fga_per_g"]').text());
  const ft = parseNumber(pg.find('td[data-stat="ft_per_g"]').text());
  const fta = parseNumber(pg.find('td[data-stat="fta_per_g"]').text());
  const orb = parseNumber(pg.find('td[data-stat="orb_per_g"]').text());
  const drb = parseNumber(pg.find('td[data-stat="drb_per_g"]').text());
  const stl = parseNumber(pg.find('td[data-stat="stl_per_g"]').text());
  const ast = parseNumber(pg.find('td[data-stat="ast_per_g"]').text());
  const blk = parseNumber(pg.find('td[data-stat="blk_per_g"]').text());
  const pf = parseNumber(pg.find('td[data-stat="pf_per_g"]').text());
  const tov = parseNumber(pg.find('td[data-stat="tov_per_g"]').text());

  const gameScore =
    pts !== null &&
    fg !== null &&
    fga !== null &&
    ft !== null &&
    fta !== null &&
    orb !== null &&
    drb !== null &&
    stl !== null &&
    ast !== null &&
    blk !== null &&
    pf !== null &&
    tov !== null
      ? computeGameScoreFromPerGame({ pts, fg, fga, ft, fta, orb, drb, stl, ast, blk, pf, tov })
      : null;

  const tsPct = parsePctFraction(adv.find('td[data-stat="ts_pct"]').text()) ?? null;
  const usageRate = parsePercentToFraction(adv.find('td[data-stat="usg_pct"]').text()) ?? null;

  if (gameScore === null || tsPct === null || usageRate === null) {
    throw new Error("Missing required metrics to compute (gameScore, ts_pct, usg_pct)");
  }

  const value: BrAdvancedSeasonMetrics = {
    seasonStartYear: input.seasonStartYear,
    seasonLabel,
    gameScore,
    tsPct,
    usageRate,
  };

  cache.set(cacheKey, { at: Date.now(), value });
  return value;
}

