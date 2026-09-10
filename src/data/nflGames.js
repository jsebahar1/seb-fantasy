// ── NFL teams, listed by division ─────────────────────────────────────────────
// Order here doesn't affect the model; it only breaks exact score ties.
export const NFL_TEAMS = [
  // AFC East
  'Buffalo Bills', 'Miami Dolphins', 'New England Patriots', 'New York Jets',
  // AFC North
  'Baltimore Ravens', 'Cincinnati Bengals', 'Cleveland Browns', 'Pittsburgh Steelers',
  // AFC South
  'Houston Texans', 'Indianapolis Colts', 'Jacksonville Jaguars', 'Tennessee Titans',
  // AFC West
  'Denver Broncos', 'Kansas City Chiefs', 'Las Vegas Raiders', 'Los Angeles Chargers',
  // NFC East
  'Dallas Cowboys', 'New York Giants', 'Philadelphia Eagles', 'Washington Commanders',
  // NFC North
  'Chicago Bears', 'Detroit Lions', 'Green Bay Packers', 'Minnesota Vikings',
  // NFC South
  'Atlanta Falcons', 'Carolina Panthers', 'New Orleans Saints', 'Tampa Bay Buccaneers',
  // NFC West
  'Arizona Cardinals', 'Los Angeles Rams', 'San Francisco 49ers', 'Seattle Seahawks',
];

// ── Game results ──────────────────────────────────────────────────────────────
// Same shape as the college football data. Names must match NFL_TEAMS exactly.
// Ties are supported: equal points record a T for both sides and score 0.
//
//   { home: 'Kansas City Chiefs', away: 'Buffalo Bills', homePoints: 27, awayPoints: 24 },
//
export const NFL_GAMES = [
];
