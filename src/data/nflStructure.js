// ── NFL conferences and divisions ─────────────────────────────────────────────
// Names must match NFL_TEAMS in nflGames.js exactly.

export const NFL_DIVISIONS = {
  'AFC East': ['Buffalo Bills', 'Miami Dolphins', 'New England Patriots', 'New York Jets'],
  'AFC North': ['Baltimore Ravens', 'Cincinnati Bengals', 'Cleveland Browns', 'Pittsburgh Steelers'],
  'AFC South': ['Houston Texans', 'Indianapolis Colts', 'Jacksonville Jaguars', 'Tennessee Titans'],
  'AFC West': ['Denver Broncos', 'Kansas City Chiefs', 'Las Vegas Raiders', 'Los Angeles Chargers'],
  'NFC East': ['Dallas Cowboys', 'New York Giants', 'Philadelphia Eagles', 'Washington Commanders'],
  'NFC North': ['Chicago Bears', 'Detroit Lions', 'Green Bay Packers', 'Minnesota Vikings'],
  'NFC South': ['Atlanta Falcons', 'Carolina Panthers', 'New Orleans Saints', 'Tampa Bay Buccaneers'],
  'NFC West': ['Arizona Cardinals', 'Los Angeles Rams', 'San Francisco 49ers', 'Seattle Seahawks'],
};

// Conferences are just the divisions grouped by their prefix.
export const NFL_CONFERENCES = Object.entries(NFL_DIVISIONS).reduce((acc, [div, teams]) => {
  const conf = div.slice(0, 3); // 'AFC' or 'NFC'
  (acc[conf] ??= []).push(...teams);
  return acc;
}, {});

const flatten = groups =>
  Object.fromEntries(
    Object.entries(groups).flatMap(([name, teams]) => teams.map(t => [t, name])),
  );

/** team name -> 'AFC' | 'NFC' */
export const TEAM_CONFERENCE = flatten(NFL_CONFERENCES);

/** team name -> e.g. 'AFC East' */
export const TEAM_DIVISION = flatten(NFL_DIVISIONS);
