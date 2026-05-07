import * as cheerio from "cheerio";

export type BrRosterPlayer = {
  brId: string;
  playerName: string;
  firstName: string;
  lastName: string;
  teamAbbr: string;
};

function playoffsUrl(seasonEndYear: number) {
  return `https://www.basketball-reference.com/playoffs/NBA_${seasonEndYear}.html`;
}

function parseName(name: string) {
  const cleaned = name.replace(/\s+/g, " ").trim();
  const parts = cleaned.split(" ").filter(Boolean);
  const firstName = parts[0] ?? cleaned;
  const lastName = parts.length > 1 ? parts[parts.length - 1] : cleaned;
  return { cleaned, firstName, lastName };
}

function teamRosterUrl(teamAbbr: string, seasonEndYear: number) {
  return `https://www.basketball-reference.com/teams/${teamAbbr}/${seasonEndYear}.html`;
}

export async function fetchRosterPlayersForTeamsFromBr(input: {
  seasonEndYear: number;
  teamAbbrs: string[];
}) {
  const teams = input.teamAbbrs.map((t) => t.trim().toUpperCase()).filter(Boolean);
  const players: BrRosterPlayer[] = [];

  for (const teamAbbr of teams) {
    const r = await fetch(teamRosterUrl(teamAbbr, input.seasonEndYear), {
      headers: {
        "user-agent": "nba-exchange-mgt828/0.1 (educational project; low-frequency fetching)",
        "accept-language": "en-US,en;q=0.9",
      },
      cache: "no-store",
    });
    if (!r.ok) continue;

    const teamHtml = await r.text();
    const $$ = cheerio.load(teamHtml);

    $$('#roster a[href^="/players/"]').each((_, el) => {
      const a = $$(el);
      const href = a.attr("href") ?? "";
      const m = href.match(/\/players\/[a-z]\/([a-z0-9]+)\.html/);
      if (!m) return;
      const brId = m[1];
      const name = a.text().trim();
      if (!name) return;
      const parsed = parseName(name);
      players.push({
        brId,
        playerName: parsed.cleaned,
        firstName: parsed.firstName,
        lastName: parsed.lastName,
        teamAbbr,
      });
    });
  }

  const seen = new Set<string>();
  return players.filter((p) => (seen.has(p.brId) ? false : (seen.add(p.brId), true)));
}

export async function fetchPlayoffRosterPlayersFromBr(input: { seasonEndYear: number }) {
  const res = await fetch(playoffsUrl(input.seasonEndYear), {
    headers: {
      "user-agent": "nba-exchange-mgt828/0.1 (educational project; low-frequency fetching)",
      "accept-language": "en-US,en;q=0.9",
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`BR playoffs fetch failed (${res.status})`);
  const html = await res.text();
  const $ = cheerio.load(html);

  // The playoffs page links to team season pages like /teams/BOS/2026.html.
  const teamSet = new Set<string>();
  $('a[href^="/teams/"]').each((_, el) => {
    const href = $(el).attr("href") ?? "";
    const m = href.match(/\/teams\/([A-Z]{3})\/(\d{4})\.html/);
    if (!m) return;
    const teamAbbr = m[1];
    const yr = Number(m[2]);
    if (yr === input.seasonEndYear) teamSet.add(teamAbbr);
  });

  const teams = [...teamSet].sort();
  if (teams.length === 0) throw new Error("Could not find playoff teams on BR page");

  return fetchRosterPlayersForTeamsFromBr({ seasonEndYear: input.seasonEndYear, teamAbbrs: teams });
}

