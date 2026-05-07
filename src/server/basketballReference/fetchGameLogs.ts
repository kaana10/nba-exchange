import * as cheerio from "cheerio";
import { fetchTextWithBackoff } from "@/server/basketballReference/fetchWithBackoff";

export type BrGameLogRow = {
  gameNumber: number;
  gameDate: Date;
  gameScore: number;
};

function gameLogUrl(brId: string, seasonEndYear: number) {
  const letter = brId[0]?.toLowerCase();
  if (!letter) throw new Error("Invalid brId");
  return `https://www.basketball-reference.com/players/${letter}/${brId}/gamelog/${seasonEndYear}`;
}

function extractTableHtml(pageHtml: string, tableId: string) {
  if (pageHtml.includes(`id="${tableId}"`)) return pageHtml;
  const commentBlocks = pageHtml.match(/<!--([\s\S]*?)-->/g) ?? [];
  for (const block of commentBlocks) {
    if (block.includes(`id="${tableId}"`)) return block.replace(/^<!--/, "").replace(/-->$/, "");
  }
  return pageHtml;
}

function parseNumber(s: string) {
  const n = Number(s.trim());
  return Number.isFinite(n) ? n : null;
}

export async function fetchBrGameLogs(input: { brId: string; seasonEndYear: number }) {
  const html = await fetchTextWithBackoff({
    url: gameLogUrl(input.brId, input.seasonEndYear),
    maxAttempts: 6,
    minDelayMsBetweenAttempts: 1500,
    maxWaitMsOn429: 15_000,
  });

  const withTable = extractTableHtml(html, "pgl_basic");
  const $ = cheerio.load(withTable);

  const table = $("#pgl_basic");
  if (!table.length) throw new Error("Game log table not found");

  const rows: BrGameLogRow[] = [];
  table.find("tbody tr").each((_, el) => {
    const tr = $(el);
    if (tr.hasClass("thead")) return;

    const g = tr.find('th[data-stat="ranker"]').text().trim();
    const dateTxt = tr.find('td[data-stat="date_game"]').text().trim();
    const gmscTxt = tr.find('td[data-stat="game_score"]').text().trim();

    const gameNumber = parseNumber(g);
    const gameScore = parseNumber(gmscTxt);
    if (gameNumber === null || gameScore === null) return;
    if (!dateTxt) return;

    const gameDate = new Date(dateTxt);
    if (Number.isNaN(gameDate.getTime())) return;

    rows.push({ gameNumber, gameDate, gameScore });
  });

  rows.sort((a, b) => a.gameNumber - b.gameNumber);
  return rows;
}

