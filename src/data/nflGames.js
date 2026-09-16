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
  // Week 1
  { home: 'Seattle Seahawks',       away: 'New England Patriots',   homePoints: 13, awayPoints: 10, week: 1 },
  { home: 'Los Angeles Rams',       away: 'San Francisco 49ers',    homePoints: 7,  awayPoints: 27, week: 1 },
  { home: 'Carolina Panthers',      away: 'Chicago Bears',          homePoints: 37, awayPoints: 59, week: 1 },
  { home: 'Indianapolis Colts',     away: 'Baltimore Ravens',       homePoints: 23, awayPoints: 41, week: 1 },
  { home: 'Pittsburgh Steelers',    away: 'Atlanta Falcons',        homePoints: 20, awayPoints: 13, week: 1 },
  { home: 'Jacksonville Jaguars',   away: 'Cleveland Browns',       homePoints: 34, awayPoints: 10, week: 1 },
  { home: 'Cincinnati Bengals',     away: 'Tampa Bay Buccaneers',   homePoints: 33, awayPoints: 27, week: 1 },
  { home: 'Tennessee Titans',       away: 'New York Jets',          homePoints: 10, awayPoints: 23, week: 1 },
  { home: 'Detroit Lions',          away: 'New Orleans Saints',     homePoints: 31, awayPoints: 30, week: 1 },
  { home: 'Houston Texans',         away: 'Buffalo Bills',          homePoints: 31, awayPoints: 36, week: 1 },
  { home: 'Los Angeles Chargers',   away: 'Arizona Cardinals',      homePoints: 14, awayPoints: 26, week: 1 },
  { home: 'Minnesota Vikings',      away: 'Green Bay Packers',      homePoints: 39, awayPoints: 22, week: 1 },
  { home: 'Las Vegas Raiders',      away: 'Miami Dolphins',         homePoints: 27, awayPoints: 13, week: 1 },
  { home: 'Philadelphia Eagles',    away: 'Washington Commanders',  homePoints: 24, awayPoints: 22, week: 1 },
  { home: 'New York Giants',        away: 'Dallas Cowboys',         homePoints: 28, awayPoints: 20, week: 1 },
  { home: 'Kansas City Chiefs',     away: 'Denver Broncos',         homePoints: 31, awayPoints: 10, week: 1 },
];
