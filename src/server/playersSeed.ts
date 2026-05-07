export type SeedPlayer = {
  id: number;
  firstName: string;
  lastName: string;
  position?: string;
  teamAbbr?: string;
  brId?: string;
};

// Curated starter universe for the MVP. Expand via a real stats provider later.
export const SEED_PLAYERS: SeedPlayer[] = [
  { id: 237, firstName: "LeBron", lastName: "James", position: "F", teamAbbr: "LAL", brId: "jamesle01" },
  { id: 115, firstName: "Stephen", lastName: "Curry", position: "G", teamAbbr: "GSW" },
  { id: 15, firstName: "Giannis", lastName: "Antetokounmpo", position: "F", teamAbbr: "MIL" },
  { id: 140, firstName: "Kevin", lastName: "Durant", position: "F", teamAbbr: "PHX" },
  { id: 132, firstName: "Nikola", lastName: "Jokic", position: "C", teamAbbr: "DEN" },
  { id: 278, firstName: "Luka", lastName: "Doncic", position: "G", teamAbbr: "LAL" },
  { id: 246, firstName: "Joel", lastName: "Embiid", position: "C", teamAbbr: "PHI" },
  { id: 192, firstName: "Jayson", lastName: "Tatum", position: "F", teamAbbr: "BOS" },
  { id: 434, firstName: "Shai", lastName: "Gilgeous-Alexander", position: "G", teamAbbr: "OKC" },
  { id: 447, firstName: "Ja", lastName: "Morant", position: "G", teamAbbr: "MEM" },
  { id: 300, firstName: "Anthony", lastName: "Edwards", position: "G", teamAbbr: "MIN" },
  { id: 145, firstName: "Jimmy", lastName: "Butler", position: "F", teamAbbr: "MIA" },

  // Primary example requested
  { id: 13, firstName: "James", lastName: "Harden", position: "G", teamAbbr: "LAC", brId: "hardeja01" },
];

