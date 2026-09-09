import { useEffect, useMemo, useState } from 'react';
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
  { home: 'Notre Dame',        away: 'Wisconsin',        homePoints: 41, awayPoints: 13 },
  { home: 'Ole Miss',          away: 'Louisville',       homePoints: 41, awayPoints: 38 },
  { home: 'Washington',        away: 'Washington State', homePoints: 24, awayPoints: 10 },
  { home: 'Florida State',     away: 'SMU',              homePoints: 24, awayPoints: 27},
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

// How far each pass is allowed to move a team toward its newly sorted position.
// Snapping teams straight onto their new rank (a value of 1) turns the feedback
// loop into a permanent oscillation — the ranks never settle, and the scores you
// end up displaying were computed from a different set of ranks than the ones
// you display. Easing into each new position instead lets the loop reach a real
// fixed point, where the ranks feeding the formula are the ranks on the page.
const DAMPING = 0.25;

function scoreAll(games, teamSet, ranks) {
  const scores = {};
  TEAMS.forEach(t => { scores[t] = 0; });

  for (const { home, away, homePoints, awayPoints } of games) {
    if (!teamSet.has(home) || !teamSet.has(away)) continue;
    const diff = homePoints - awayPoints;
    scores[home] += gameScore(diff, ranks[away]);
    scores[away] += gameScore(-diff, ranks[home]);
  }
  return scores;
}

function rankOrder(scores) {
  const ranks = {};
  [...TEAMS]
    .sort((a, b) => scores[b] - scores[a])
    .forEach((t, i) => { ranks[t] = i + 1; });
  return ranks;
}

function solveRanks(games, teamSet) {
  // Every team starts at the midpoint so nobody is assumed strong or weak.
  const mid = Math.ceil(TEAMS.length / 2);
  const rating = {};
  TEAMS.forEach(t => { rating[t] = mid; });

  // Phase 1: damped iteration on continuous ratings, which settles in ~30 passes.
  for (let i = 0; i < 100; i++) {
    const scores = scoreAll(games, teamSet, rating);
    [...TEAMS]
      .sort((a, b) => scores[b] - scores[a])
      .forEach((t, pos) => {
        rating[t] = (1 - DAMPING) * rating[t] + DAMPING * (pos + 1);
      });
  }

  // Phase 2: snap the settled ratings to whole-number ranks and let those
  // stabilize, so the rank the formula consumes is the rank shown on the page.
  let ranks = rankOrder(
    Object.fromEntries(TEAMS.map(t => [t, -rating[t]]))
  );
  let scores = scoreAll(games, teamSet, ranks);

  for (let i = 0; i < 50; i++) {
    const next = rankOrder(scores);
    if (TEAMS.every(t => next[t] === ranks[t])) break;
    ranks = next;
    scores = scoreAll(games, teamSet, ranks);
  }

  return { ranks, scores };
}

function buildRankings(games) {
  const teamSet = new Set(TEAMS);
  const { ranks, scores } = solveRanks(games, teamSet);

  const logs = {};
  const records = {};
  TEAMS.forEach(t => { logs[t] = []; records[t] = { w: 0, l: 0 }; });

  for (const { home, away, homePoints, awayPoints } of games) {
    if (!teamSet.has(home) || !teamSet.has(away)) continue;
    const diff = homePoints - awayPoints;

    logs[home].push({
      opponent: away, atHome: true, oppRank: ranks[away],
      pointsFor: homePoints, pointsAgainst: awayPoints,
      result: diff > 0 ? 'W' : diff < 0 ? 'L' : 'T',
      value: gameScore(diff, ranks[away]),
    });
    logs[away].push({
      opponent: home, atHome: false, oppRank: ranks[home],
      pointsFor: awayPoints, pointsAgainst: homePoints,
      result: diff < 0 ? 'W' : diff > 0 ? 'L' : 'T',
      value: gameScore(-diff, ranks[home]),
    });

    if (diff > 0) { records[home].w++; records[away].l++; }
    else if (diff < 0) { records[away].w++; records[home].l++; }
  }

  return TEAMS.map(t => ({
    team: t,
    rank: ranks[t],
    score: scores[t],
    record: records[t],
    games: logs[t],
    hasGames: logs[t].length > 0,
  })).sort((a, b) => a.rank - b.rank);
}

function fmt(n) {
  return `${n >= 0 ? '+' : ''}${n.toFixed(4)}`;
}

// ── Team detail dialog ────────────────────────────────────────────────────────
function TeamDetail({ row, onClose }) {
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="cf-modal-backdrop" onClick={onClose}>
      <div
        className="cf-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`${row.team} rating detail`}
        onClick={e => e.stopPropagation()}
      >
        <button className="cf-modal-close" onClick={onClose} aria-label="Close">×</button>

        <div className="cf-modal-head">
          <span className="cf-modal-rank">#{row.rank}</span>
          <div>
            <h3 className="cf-modal-team">{row.team}</h3>
            <p className="cf-modal-meta">
              {row.record.w}–{row.record.l}
              <span className="cf-modal-dot">·</span>
              <span className={row.score >= 0 ? 'cf-score--pos' : 'cf-score--neg'}>
                {fmt(row.score)}
              </span>
            </p>
          </div>
        </div>

        {row.games.length === 0 ? (
          <p className="cf-modal-empty">No games played yet.</p>
        ) : (
          <div className="cf-modal-table-wrap">
            <table className="cf-modal-table">
              <thead>
                <tr>
                  <th>Opponent</th>
                  <th className="cf-mt-num">Rank</th>
                  <th className="cf-mt-num">Score</th>
                  <th className="cf-mt-res">Res</th>
                  <th className="cf-mt-num">Points</th>
                </tr>
              </thead>
              <tbody>
                {row.games.map((g, i) => (
                  <tr key={i}>
                    <td className="cf-mt-opp">
                      <span className="cf-mt-loc">{g.atHome ? 'vs' : '@'}</span>
                      {g.opponent}
                    </td>
                    <td className="cf-mt-num">{g.oppRank}</td>
                    <td className="cf-mt-num">{g.pointsFor}–{g.pointsAgainst}</td>
                    <td className="cf-mt-res">
                      <span className={`cf-res cf-res--${g.result.toLowerCase()}`}>{g.result}</span>
                    </td>
                    <td className={`cf-mt-num ${g.value >= 0 ? 'cf-score--pos' : 'cf-score--neg'}`}>
                      {fmt(g.value)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4}>Total</td>
                  <td className={`cf-mt-num ${row.score >= 0 ? 'cf-score--pos' : 'cf-score--neg'}`}>
                    {fmt(row.score)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function NcaaFootball() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const rankings = useMemo(() => buildRankings(INITIAL_GAMES), []);

  const filtered = search.trim()
    ? rankings.filter(r => r.team.toLowerCase().includes(search.toLowerCase()))
    : rankings;

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
                <tr
                  key={row.team}
                  className={`cf-tr--clickable ${row.hasGames ? 'cf-tr--active' : 'cf-tr--idle'}`}
                  tabIndex={0}
                  role="button"
                  aria-label={`${row.team} detail`}
                  onClick={() => setSelected(row)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelected(row);
                    }
                  }}
                >
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

        {/* ── How the model works ── */}
        <section className="cf-explain">
          <h2 className="cf-explain-title">How the rating is calculated</h2>

          <p className="cf-explain-lead">
            Every game a team plays produces one number. A team's rating is just the sum of
            those numbers. What makes a game worth more or less is the <em>rank of the
            opponent</em> — so the rating and the ranks are solved together, each feeding
            the other until they agree.
          </p>

          <h3 className="cf-explain-h3">The two formulas</h3>
          <p className="cf-explain-p">
            Let <code>D</code> be the point differential (your points minus theirs) and
            <code> R</code> be the opponent's rank, from 1 to {TEAMS.length}. Wins and losses
            use deliberately different shapes:
          </p>

          <div className="cf-eq">
            <div className="cf-eq-row">
              <span className="cf-eq-label cf-eq-label--win">Win</span>
              <code className="cf-eq-math">value = ((140 − R) ÷ 139)<sup>2</sup> × D</code>
            </div>
            <div className="cf-eq-row">
              <span className="cf-eq-label cf-eq-label--loss">Loss</span>
              <code className="cf-eq-math">value = √(R ÷ 139) × D</code>
            </div>
          </div>

          <p className="cf-explain-p">
            The 139 and 140 are fixed constants carried over from the original spreadsheet
            ({TEAMS.length} teams, and one more than that). On a loss, <code>D</code> is
            negative, so the result is negative — no separate sign handling is needed.
          </p>

          <h3 className="cf-explain-h3">Why wins are squared</h3>
          <p className="cf-explain-p">
            The win multiplier <code>((140 − R) ÷ 139)<sup>2</sup></code> runs from
            <strong> 1.000</strong> for beating the #1 team down to
            <strong> 0.0000518</strong> for beating #{TEAMS.length}. Squaring makes that
            falloff steep rather than gradual: beating the top team is worth roughly
            <strong> 19,000×</strong> more per point of margin than beating the worst team.
            The practical effect is that running up the score on a bad opponent earns you
            almost nothing, while a narrow win over a good one is worth a great deal.
          </p>

          <div className="cf-scale">
            {[
              ['Beat #1', (Math.pow((140 - 1) / 139, 2)).toFixed(4)],
              ['Beat #25', (Math.pow((140 - 25) / 139, 2)).toFixed(4)],
              ['Beat #70', (Math.pow((140 - 70) / 139, 2)).toFixed(4)],
              ['Beat #130', (Math.pow((140 - 130) / 139, 2)).toFixed(4)],
            ].map(([label, val]) => (
              <div className="cf-scale-item" key={label}>
                <span className="cf-scale-label">{label}</span>
                <span className="cf-scale-val">×{val}</span>
              </div>
            ))}
          </div>

          <h3 className="cf-explain-h3">Why losses use a square root</h3>
          <p className="cf-explain-p">
            The loss multiplier <code>√(R ÷ 139)</code> runs the other direction, from
            <strong> 0.085</strong> for losing to #1 up to <strong>1.000</strong> for losing
            to #{TEAMS.length}. A square root is concave, so the penalty climbs fast at first
            and then flattens out. Losing to a top-10 team is nearly free; losing to anyone
            in the bottom half costs close to the full margin, and there is not much
            difference between losing to #90 and losing to #120 — both are bad.
          </p>

          <div className="cf-scale">
            {[
              ['Lost to #1', Math.sqrt(1 / 139).toFixed(4)],
              ['Lost to #25', Math.sqrt(25 / 139).toFixed(4)],
              ['Lost to #70', Math.sqrt(70 / 139).toFixed(4)],
              ['Lost to #130', Math.sqrt(130 / 139).toFixed(4)],
            ].map(([label, val]) => (
              <div className="cf-scale-item" key={label}>
                <span className="cf-scale-label">{label}</span>
                <span className="cf-scale-val">×{val}</span>
              </div>
            ))}
          </div>

          <h3 className="cf-explain-h3">Worked examples</h3>

          <div className="cf-work">
            <p className="cf-work-head">USC 42, San Jose State 26 — a win over the #91 team</p>
            <code className="cf-work-math">
              D = 42 − 26 = 16{'\n'}
              (140 − 91) ÷ 139 = 49 ÷ 139 = 0.352518{'\n'}
              0.352518<sup>2</sup> = 0.124269{'\n'}
              0.124269 × 16 = <strong>+1.9883</strong>
            </code>
          </div>

          <div className="cf-work">
            <p className="cf-work-head">Clemson 10, LSU 51 — a loss to the #32 team</p>
            <code className="cf-work-math">
              D = 10 − 51 = −41{'\n'}
              32 ÷ 139 = 0.230216{'\n'}
              √0.230216 = 0.479808{'\n'}
              0.479808 × −41 = <strong>−19.6721</strong>
            </code>
          </div>

          <p className="cf-explain-p">
            Note how asymmetric those are. USC's 16-point win over a mid-tier team earned
            about 2 points; Clemson's 41-point loss cost nearly 20. Blowout losses are
            punished far harder than blowout wins are rewarded, which is why one bad
            afternoon sinks a team so far down the table.
          </p>

          <h3 className="cf-explain-h3">Solving the circular reference</h3>
          <p className="cf-explain-p">
            There is a chicken-and-egg problem here: scoring a game needs the opponent's
            rank, but ranks come from scores. The model resolves it by iterating. Every team
            starts at rank {Math.ceil(TEAMS.length / 2)} — dead center, so no one is assumed
            good or bad. Then it repeatedly scores all games, re-sorts, and feeds the new
            ranks back in.
          </p>
          <p className="cf-explain-p">
            Moving each team straight onto its new rank each pass makes the loop oscillate
            forever and never settle. So each pass moves a team only {DAMPING * 100}% of the
            way toward its new position. That damping lets the system reach a fixed point —
            a set of ranks that reproduces itself — in about 30 passes. Everything is then
            snapped to whole-number ranks and allowed to settle again, which is what
            guarantees the opponent ranks shown when you click a team are the same ranks the
            formula actually used, and that a team's game values sum exactly to its rating.
          </p>

          <h3 className="cf-explain-h3">Two things worth knowing</h3>
          <p className="cf-explain-p">
            <strong>All FCS opponents are pooled into one entry.</strong> Every FCS game
            feeds the same bucket, so that entry absorbs a large negative score and settles
            near the bottom — which drives the win multiplier close to zero. Beating an FCS
            team is therefore worth almost nothing regardless of the margin, and the size of
            the blowout is effectively discarded.
          </p>
          <p className="cf-explain-p">
            <strong>Teams that have not played sit at exactly 0.</strong> That places them
            above every team with a losing score, so early in the season a team with no games
            will outrank a team that has played and lost. They are tracked, not yet rated.
          </p>
        </section>
      </div>

      {selected && <TeamDetail row={selected} onClose={() => setSelected(null)} />}
    </main>
  );
}
