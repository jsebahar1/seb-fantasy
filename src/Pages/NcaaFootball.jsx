import { useMemo, useState } from 'react';
import SEO from '../components/SEO';
import './NcaaFootball.css';

// ── Formula constants (M2 / M3 from original spreadsheet) ────────────────────
const M2 = 139;
const M3 = 140;

// ── Full team list ────────────────────────────────────────────────────────────
const TEAMS = [
  'Air Force', 'Akron', 'Alabama', 'Appalachian State', 'Arizona', 'Arizona State',
  'Arkansas', 'Arkansas State', 'Army', 'Auburn', 'Ball State', 'Baylor',
  'Boise State', 'Boston College', 'Bowling Green', 'Buffalo', 'BYU', 'California',
  'Central Michigan', 'Charlotte', 'Cincinnati', 'Clemson', 'Coastal Carolina',
  'Colorado', 'Colorado State', 'Delaware', 'Duke', 'East Carolina', 'Eastern Michigan',
  'FIU', 'Florida', 'Florida Atlantic', 'Florida State', 'Fresno State',
  'Georgia', 'Georgia Southern', 'Georgia State', 'Georgia Tech', 'Hawaii',
  'Houston', 'Illinois', 'Indiana', 'Iowa', 'Iowa State', 'Jacksonville State',
  'James Madison', 'Kansas', 'Kansas State', 'Kennesaw State', 'Kent State',
  'Kentucky', 'Liberty', 'Louisiana', 'Louisiana Monroe', 'Louisiana Tech',
  'Louisville', 'LSU', 'Marshall', 'Maryland', 'Memphis', 'Miami (FL)',
  'Miami (OH)', 'Michigan', 'Michigan State', 'Middle Tennessee', 'Minnesota',
  'Mississippi State', 'Missouri', 'Missouri State', 'Navy', 'Nebraska',
  'Nevada', 'New Mexico', 'New Mexico State', 'NC State', 'North Carolina',
  'North Dakota State', 'North Texas', 'Northern Illinois', 'Northwestern',
  'Notre Dame', 'Ohio', 'Ohio State', 'Oklahoma', 'Oklahoma State',
  'Old Dominion', 'Ole Miss', 'Oregon', 'Oregon State', 'Penn State',
  'Pittsburgh', 'Purdue', 'Rice', 'Rutgers', 'Sacramento State', 'Sam Houston',
  'San Diego State', 'San Jose State', 'SMU', 'South Alabama', 'South Carolina',
  'South Florida', 'Southern Miss', 'Stanford', 'Syracuse', 'TCU', 'Temple',
  'Tennessee', 'Texas', 'Texas A&M', 'Texas State', 'Texas Tech', 'Toledo',
  'Troy', 'Tulane', 'Tulsa', 'UAB', 'UCF', 'UCLA', 'UConn', 'UMass',
  'UNLV', 'USC', 'UTEP', 'UTSA', 'Utah', 'Utah State', 'Vanderbilt',
  'Virginia', 'Virginia Tech', 'Wake Forest', 'Washington', 'Washington State',
  'West Virginia', 'Western Kentucky', 'Western Michigan', 'Wisconsin', 'Wyoming', 'FCS',
];

// ── Initial game data ─────────────────────────────────────────────────────────
const INITIAL_GAMES = [
  { home: 'North Carolina',    away: 'TCU',             homePoints: 15, awayPoints: 10 },
  { home: 'USC',               away: 'San Jose State',  homePoints: 42, awayPoints: 26 },
  { home: 'Virginia',          away: 'NC State',        homePoints: 34, awayPoints:  8 },
  { home: 'North Dakota State',away: 'Jacksonville State', homePoints: 33, awayPoints: 7 },
  { home: 'Eastern Michigan',  away: 'Sacramento State',homePoints: 28, awayPoints: 17 },
  { home: 'Stanford',          away: 'Hawaii',          homePoints: 37, awayPoints: 27 },
  { home: 'Florida State',     away: 'New Mexico State',homePoints: 34, awayPoints: 17 },
  { home: 'UNLV',              away: 'Memphis',         homePoints: 21, awayPoints: 27 },
  { home: 'Utah',             away: 'FCS',             homePoints: 66, awayPoints: 14 },
  { home: 'Missouri',         away: 'FCS',             homePoints: 54, awayPoints: 14 },
  { home: 'Rutgers',          away: 'UMass',           homePoints: 21, awayPoints: 37 },
  { home: 'UCF',              away: 'FCS',             homePoints: 73, awayPoints:  6 },
  { home: 'Kennesaw State',   away: 'FCS',             homePoints: 47, awayPoints:  0 },
  { home: 'Delaware',         away: 'FCS',             homePoints: 42, awayPoints:  7 },
  { home: 'Wake Forest',      away: 'Akron',           homePoints: 38, awayPoints: 16 },
  { home: 'Buffalo',          away: 'FCS',             homePoints: 21, awayPoints: 17 },
  { home: 'Minnesota',        away: 'FCS',             homePoints: 59, awayPoints:  7 },
  { home: 'Georgia Tech',     away: 'Colorado',        homePoints: 13, awayPoints: 14 },
  { home: 'Illinois',         away: 'UAB',             homePoints: 42, awayPoints: 23 },
  { home: 'Miami (FL)',       away: 'Stanford',        homePoints: 45, awayPoints:  6 },
  { home: 'Oklahoma',        away: 'UTEP',             homePoints: 51, awayPoints:  0 },
  { home: 'USC',             away: 'Fresno State',     homePoints: 39, awayPoints:  0 },
  { home: 'Eastern Michigan', away: 'San Jose State',  homePoints: 21, awayPoints: 27 },
  { home: 'Georgia State',   away: 'FCS',              homePoints: 59, awayPoints: 10 },
  { home: 'Purdue',          away: 'FCS',              homePoints: 44, awayPoints: 19 },
  { home: 'Kansas',          away: 'FCS',              homePoints: 51, awayPoints:  6 },
  { home: 'Michigan State',  away: 'Toledo',           homePoints: 30, awayPoints: 20 },
  { home: 'Ohio State',        away: 'Ball State',       homePoints: 56, awayPoints:  3 },
  { home: 'Oregon',            away: 'Boise State',      homePoints: 34, awayPoints: 27 },
  { home: 'Georgia',           away: 'FCS',              homePoints: 63, awayPoints:  3 },
  { home: 'Texas',             away: 'Texas State',      homePoints: 59, awayPoints:  7 },
  { home: 'Indiana',           away: 'North Texas',      homePoints: 52, awayPoints: 16 },
  { home: 'Texas A&M',         away: 'Missouri State',   homePoints: 50, awayPoints:  0 },
  { home: 'LSU',               away: 'Clemson',          homePoints: 51, awayPoints: 10 },
  { home: 'Texas Tech',        away: 'FCS',              homePoints: 33, awayPoints: 10 },
  { home: 'Alabama',           away: 'East Carolina',    homePoints: 48, awayPoints: 10 },
  { home: 'BYU',               away: 'FCS',              homePoints: 63, awayPoints:  7 },
  { home: 'Michigan',          away: 'Western Michigan', homePoints: 13, awayPoints: 12 },
  { home: 'Penn State',        away: 'Marshall',         homePoints: 45, awayPoints:  0 },
  { home: 'Tennessee',         away: 'FCS',              homePoints: 56, awayPoints:  9 },
  { home: 'Iowa',              away: 'Northern Illinois',homePoints: 40, awayPoints:  0 },
  { home: 'Houston',           away: 'Oregon State',     homePoints: 33, awayPoints: 20 },
  { home: 'UConn',             away: 'FCS',              homePoints: 56, awayPoints:  7 },
  { home: 'West Virginia',     away: 'Coastal Carolina', homePoints: 31, awayPoints: 24 },
  { home: 'Syracuse',          away: 'FCS',              homePoints: 66, awayPoints:  3 },
  { home: 'Nebraska',          away: 'Ohio',             homePoints: 49, awayPoints: 21 },
  { home: 'James Madison',     away: 'Liberty',          homePoints: 20, awayPoints: 13 },
  { home: 'Bowling Green',     away: 'FCS',              homePoints: 13, awayPoints: 20 },
  { home: 'Army',              away: 'FCS',              homePoints: 59, awayPoints:  3 },
  { home: 'Pittsburgh',        away: 'Miami (OH)',       homePoints: 59, awayPoints: 14 },
  { home: 'South Carolina',    away: 'Kent State',       homePoints: 57, awayPoints:  0 },
  { home: 'Iowa State',        away: 'FCS',              homePoints: 38, awayPoints: 10 },
  { home: 'Kentucky',          away: 'FCS',              homePoints: 45, awayPoints: 13 },
  { home: 'Air Force',         away: 'FCS',              homePoints: 34, awayPoints:  0 },
  { home: 'Temple',            away: 'FCS',              homePoints: 38, awayPoints: 14 },
  { home: 'Duke',              away: 'Tulane',           homePoints: 17, awayPoints:  3 },
  { home: 'Navy',              away: 'FCS',              homePoints: 42, awayPoints: 15 },
  { home: 'Appalachian State', away: 'FCS',              homePoints: 55, awayPoints:  3 },
  { home: 'Charlotte',         away: 'FCS',              homePoints: 41, awayPoints: 43 },
  { home: 'Auburn',            away: 'Baylor',           homePoints: 17, awayPoints: 16 },
  { home: 'Cincinnati',        away: 'Boston College',   homePoints: 34, awayPoints: 15 },
  { home: 'UTSA',              away: 'FCS',              homePoints: 45, awayPoints: 16 },
  { home: 'Tulsa',             away: 'Oklahoma State',   homePoints: 24, awayPoints: 10 },
  { home: 'Arkansas',          away: 'FCS',              homePoints: 31, awayPoints: 14 },
  { home: 'Southern Miss',     away: 'FCS',              homePoints: 49, awayPoints:  3 },
  { home: 'Colorado State',    away: 'Wyoming',          homePoints: 35, awayPoints: 13 },
  { home: 'Jacksonville State',away: 'FCS',              homePoints: 49, awayPoints:  7 },
  { home: 'Rice',              away: 'FCS',              homePoints: 31, awayPoints:  3 },
  { home: 'Vanderbilt',        away: 'FCS',              homePoints: 28, awayPoints:  9 },
  { home: 'Georgia Southern',  away: 'FCS',              homePoints: 31, awayPoints:  0 },
  { home: 'Memphis',           away: 'Arkansas State',   homePoints: 42, awayPoints: 24 },
  { home: 'Old Dominion',      away: 'FCS',              homePoints: 31, awayPoints: 10 },
  { home: 'South Florida',     away: 'FIU',              homePoints: 19, awayPoints:  9 },
  { home: 'Troy',              away: 'Sam Houston',      homePoints: 24, awayPoints: 21 },
  { home: 'Kansas State',      away: 'FCS',              homePoints: 71, awayPoints:  3 },
  { home: 'Utah State',        away: 'FCS',              homePoints: 17, awayPoints: 29 },
  { home: 'South Alabama',     away: 'FCS',              homePoints: 39, awayPoints: 14 },
  { home: 'Mississippi State', away: 'Louisiana Monroe', homePoints: 62, awayPoints: 13 },
  { home: 'Louisiana Tech',    away: 'FCS',              homePoints: 80, awayPoints:  6 },
  { home: 'Virginia Tech',     away: 'FCS',              homePoints: 73, awayPoints:  3 },
  { home: 'Florida',           away: 'Florida Atlantic', homePoints: 66, awayPoints: 21 },
  { home: 'Louisiana',         away: 'FCS',              homePoints: 38, awayPoints:  7 },
  { home: 'Northwestern',      away: 'FCS',              homePoints: 34, awayPoints: 18 },
  { home: 'Maryland',          away: 'FCS',              homePoints: 62, awayPoints:  0 },
  { home: 'Arizona State',     away: 'FCS',              homePoints: 70, awayPoints:  7 },
  { home: 'San Diego State',   away: 'FCS',              homePoints: 53, awayPoints: 20 },
  { home: 'Arizona',           away: 'FCS',              homePoints: 35, awayPoints:  7 },
  { home: 'New Mexico',        away: 'Central Michigan', homePoints: 38, awayPoints:  7 },
  { home: 'North Dakota State',away: 'FCS',              homePoints: 38, awayPoints:  0 },
  { home: 'Sacramento State',  away: 'FCS',              homePoints: 52, awayPoints:  0 },
  { home: 'Hawaii',            away: 'UNLV',             homePoints:  6, awayPoints: 21 },
  { home: 'Middle Tennessee',  away: 'FCS',              homePoints: 38, awayPoints: 14 },
  { home: 'New Mexico State',  away: 'FCS',              homePoints: 51, awayPoints: 14 },
  { home: 'Nevada',            away: 'Western Kentucky', homePoints: 49, awayPoints: 14 },
  { home: 'California',        away: 'UCLA',             homePoints: 24, awayPoints: 45 },
];

// ── Scoring engine ────────────────────────────────────────────────────────────
function gameScore(diff, opponentRank) {
  // Replicates the Excel formula:
  // Win:  ((M3 - opp_rank) / M2)^2 * diff
  // Loss: SQRT(opp_rank / M2) * diff   (diff is negative)
  return diff > 0
    ? Math.pow((M3 - opponentRank) / M2, 2) * diff
    : Math.sqrt(opponentRank / M2) * diff;
}

function buildRankings(games) {
  const teamSet = new Set(TEAMS);

  // Initialize all teams at the midpoint rank
  const mid = Math.ceil(TEAMS.length / 2);
  const ranks = {};
  TEAMS.forEach(t => { ranks[t] = mid; });

  // Iterative solver — converges in ~30–50 iterations
  for (let iter = 0; iter < 100; iter++) {
    const scores = {};
    TEAMS.forEach(t => { scores[t] = 0; });

    for (const { home, away, homePoints, awayPoints } of games) {
      if (!teamSet.has(home) || !teamSet.has(away)) continue;
      const homeDiff = homePoints - awayPoints;
      const awayDiff = awayPoints - homePoints;
      scores[home] += gameScore(homeDiff, ranks[away]);
      scores[away] += gameScore(awayDiff, ranks[home]);
    }

    // Re-rank descending by score; stable sort preserves alphabetical ties
    const sorted = [...TEAMS].sort((a, b) => scores[b] - scores[a]);
    sorted.forEach((t, i) => { ranks[t] = i + 1; });
  }

  // Compute final display scores with the converged ranks
  const finalScores = {};
  TEAMS.forEach(t => { finalScores[t] = 0; });

  for (const { home, away, homePoints, awayPoints } of games) {
    if (!teamSet.has(home) || !teamSet.has(away)) continue;
    const homeDiff = homePoints - awayPoints;
    const awayDiff = awayPoints - homePoints;
    finalScores[home] += gameScore(homeDiff, ranks[away]);
    finalScores[away] += gameScore(awayDiff, ranks[home]);
  }

  // Re-rank from the final scores. The solver loop leaves `ranks` one step
  // ahead of the scores that produced them, so ranking off `finalScores` is
  // what keeps the displayed rank and the displayed score in the same order.
  [...TEAMS]
    .sort((a, b) => finalScores[b] - finalScores[a])
    .forEach((t, i) => { ranks[t] = i + 1; });

  // Calculate records from games
  const records = {};
  TEAMS.forEach(t => { records[t] = { w: 0, l: 0 }; });
  const played = new Set();

  for (const { home, away, homePoints, awayPoints } of games) {
    if (teamSet.has(home)) played.add(home);
    if (teamSet.has(away)) played.add(away);
    if (homePoints > awayPoints) {
      if (teamSet.has(home)) records[home].w++;
      if (teamSet.has(away)) records[away].l++;
    } else if (awayPoints > homePoints) {
      if (teamSet.has(away)) records[away].w++;
      if (teamSet.has(home)) records[home].l++;
    }
  }

  return TEAMS.map(t => ({
    team: t,
    rank: ranks[t],
    score: Math.round(finalScores[t] * 10000) / 10000,
    record: records[t],
    hasGames: played.has(t),
  })).sort((a, b) => a.rank - b.rank);
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function NcaaFootball() {
  const [search, setSearch] = useState('');

  const rankings = useMemo(() => buildRankings(INITIAL_GAMES), []);

  const filtered = search.trim()
    ? rankings.filter(r => r.team.toLowerCase().includes(search.toLowerCase()))
    : rankings;

  const gamesPlayed = INITIAL_GAMES.length;
  const teamsRanked = rankings.filter(r => r.hasGames).length;

  function rankClass(rank) {
    if (rank <= 3)  return 'cf-rank cf-rank--top3';
    if (rank <= 10) return 'cf-rank cf-rank--top10';
    if (rank <= 25) return 'cf-rank cf-rank--top25';
    return 'cf-rank';
  }

  return (
    <main className="page">
      <SEO
        title="CFB Power Rankings"
        path="/ncaa-football"
        description="Data-driven college football power rankings built on a strength-of-schedule-adjusted scoring model. Updated after every game."
        keywords={['college football rankings 2026', 'CFB power rankings', 'ncaa football model', 'college football analytics']}
      />

      <div className="container">
        {/* Header */}
        <div className="cf-hero">
          <p className="eyebrow">CFB Rankings</p>
          <h1 className="page-title">College Football Power Rankings</h1>
          <p className="cf-sub">
            A strength-adjusted model where every win and loss is weighted by your
            opponent's rank. Beating a top team is worth more. Losing to a weak team
            costs more. Updated after every game.
          </p>
          <div className="cf-stats">
            <div className="cf-stat">
              <span className="cf-stat-val">{gamesPlayed}</span>
              <span className="cf-stat-label">Games Scored</span>
            </div>
            <div className="cf-stat">
              <span className="cf-stat-val">{teamsRanked}</span>
              <span className="cf-stat-label">Teams Ranked</span>
            </div>
            <div className="cf-stat">
              <span className="cf-stat-val">{TEAMS.length}</span>
              <span className="cf-stat-label">Teams Tracked</span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="cf-controls">
          <input
            className="cf-search"
            type="text"
            placeholder="Search team…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="cf-clear" onClick={() => setSearch('')}>×</button>
          )}
        </div>

        {/* Rankings table */}
        <div className="cf-table-wrap">
          <table className="cf-table">
            <thead>
              <tr>
                <th className="cf-th-rank">Rank</th>
                <th className="cf-th-team">Team</th>
                <th className="cf-th-record">Record</th>
                <th className="cf-th-score">Score</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(row => (
                <tr key={row.team} className={row.hasGames ? 'cf-tr--active' : 'cf-tr--idle'}>
                  <td>
                    <span className={rankClass(row.rank)}>
                      {row.rank}
                    </span>
                  </td>
                  <td className="cf-td-team">{row.team}</td>
                  <td className="cf-td-record">
                    {row.hasGames
                      ? `${row.record.w}–${row.record.l}`
                      : <span className="cf-idle">0–0</span>}
                  </td>
                  <td className="cf-td-score">
                    {row.hasGames
                      ? <span className={row.score >= 0 ? 'cf-score--pos' : 'cf-score--neg'}>
                          {row.score >= 0 ? '+' : ''}{row.score.toFixed(4)}
                        </span>
                      : <span className="cf-idle">—</span>}
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="cf-empty">No teams match "{search}"</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="cf-footnote">
          Score = sum of game scores. Win vs. top team earns more; loss to weak team costs more.
          Teams with no games are tracked but unranked relative to each other.
        </p>
      </div>
    </main>
  );
}
