import * as cheerio from "cheerio";

export type BrActivePlayer = {
  brId: string;
  playerName: string;
  firstName: string;
  lastName: string;
};

const LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");

function brIndexUrl(letter: string) {
  return `https://www.basketball-reference.com/players/${letter}/`;
}

function parseName(name: string) {
  const cleaned = name.replace(/\s+/g, " ").trim();
  const parts = cleaned.split(" ").filter(Boolean);
  const firstName = parts[0] ?? cleaned;
  const lastName = parts.length > 1 ? parts[parts.length - 1] : cleaned;
  return { cleaned, firstName, lastName };
}

export async function fetchAllActivePlayersFromBr(): Promise<BrActivePlayer[]> {
  const active: BrActivePlayer[] = [];

  for (const letter of LETTERS) {
    const res = await fetch(brIndexUrl(letter), {
      headers: {
        "user-agent": "nba-exchange-mgt828/0.1 (educational project; low-frequency fetching)",
        "accept-language": "en-US,en;q=0.9",
      },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`BR index fetch failed for ${letter} (${res.status})`);

    const html = await res.text();
    const $ = cheerio.load(html);

    // On BR index pages, active players are bolded: <strong><a href="/players/x/slug.html">Name</a></strong>
    $("table#players tbody tr").each((_, el) => {
      const row = $(el);
      const strongLink = row.find("th strong a");
      if (!strongLink.length) return;

      const href = strongLink.attr("href") ?? "";
      const m = href.match(/\/players\/[a-z]\/([a-z0-9]+)\.html/);
      if (!m) return;

      const brId = m[1];
      const name = strongLink.text().trim();
      if (!name) return;

      const parsed = parseName(name);
      active.push({
        brId,
        playerName: parsed.cleaned,
        firstName: parsed.firstName,
        lastName: parsed.lastName,
      });
    });
  }

  // De-dupe by brId
  const seen = new Set<string>();
  return active.filter((p) => (seen.has(p.brId) ? false : (seen.add(p.brId), true)));
}

