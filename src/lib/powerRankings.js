/**
 * Strength-of-schedule power rating engine.
 *
 * Every game produces one value; a team's rating is the sum of its games.
 * What a game is worth depends on the opponent's rank, so ranks and ratings
 * have to be solved together.
 *
 * Ported from the original spreadsheet, which hard-coded 139 and 140 for a
 * 139-team league. Those are just the team count and one more than it, so
 * they are derived here and the model works at any league size.
 */

// How far each pass may move a team toward its newly sorted position.
// Snapping teams straight onto their new rank (a value of 1) turns the feedback
// loop into a permanent oscillation — the ranks never settle, and the scores you
// display end up computed from a different set of ranks than the ones you show.
// Easing into each new position instead reaches a real fixed point.
const DAMPING = 0.25;

export function makeScorer(teamCount) {
  const M2 = teamCount;
  const M3 = teamCount + 1;

  return function gameScore(diff, opponentRank) {
    // Win:  ((M3 - opp_rank) / M2)^2 * diff   — squared, so quality wins spike
    // Loss: SQRT(opp_rank / M2) * diff        — diff is negative here
    return diff > 0
      ? Math.pow((M3 - opponentRank) / M2, 2) * diff
      : Math.sqrt(opponentRank / M2) * diff;
  };
}

function scoreAll(teams, games, teamSet, ranks, gameScore) {
  const scores = {};
  teams.forEach(t => { scores[t] = 0; });

  for (const { home, away, homePoints, awayPoints } of games) {
    if (!teamSet.has(home) || !teamSet.has(away)) continue;
    const diff = homePoints - awayPoints;
    scores[home] += gameScore(diff, ranks[away]);
    scores[away] += gameScore(-diff, ranks[home]);
  }
  return scores;
}

const H2H_SEP = '|'; // safe: no team name contains a pipe

/**
 * Who beat whom. A pair that split their meetings is left out — there is no
 * winner to defer to.
 */
function headToHead(games, teamSet, pooled) {
  const tally = new Map();
  const bump = (a, b, key) => {
    const k = a + H2H_SEP + b;
    const rec = tally.get(k) || { w: 0, l: 0 };
    rec[key]++;
    tally.set(k, rec);
  };

  for (const { home, away, homePoints, awayPoints } of games) {
    if (!teamSet.has(home) || !teamSet.has(away)) continue;
    if (homePoints === awayPoints) continue;
    // A pooled bucket stands in for many different opponents, so "it" beating
    // someone says nothing about one team being better than another.
    if (pooled?.has(home) || pooled?.has(away)) continue;
    const [winner, loser] = homePoints > awayPoints ? [home, away] : [away, home];
    bump(winner, loser, 'w');
    bump(loser, winner, 'l');
  }

  const beatenBy = new Set();
  for (const [k, { w, l }] of tally) {
    if (l > 0 && w === 0) beatenBy.add(k); // "a lost to b, and never beat them"
  }
  return beatenBy;
}

function rankOrder(teams, scores, beatenBy) {
  const order = [...teams].sort((a, b) => scores[b] - scores[a]);

  // Head-to-head outranks a hairline score gap. Two teams that played each
  // other have ratings that depend on each other's rank, which can leave them
  // swapping places forever with no stable ordering; deferring to the result on
  // the field breaks that and matches how anyone would actually rank them.
  // Bounded, since a rock-paper-scissors triangle has no valid ordering at all.
  if (beatenBy) {
    for (let pass = 0; pass < order.length; pass++) {
      let swapped = false;
      for (let i = 0; i < order.length - 1; i++) {
        if (beatenBy.has(order[i] + H2H_SEP + order[i + 1])) {
          [order[i], order[i + 1]] = [order[i + 1], order[i]];
          swapped = true;
        }
      }
      if (!swapped) break;
    }
  }

  const ranks = {};
  order.forEach((t, i) => { ranks[t] = i + 1; });
  return ranks;
}

function solveRanks(teams, games, teamSet, gameScore, beatenBy) {
  // Every team starts at the midpoint so nobody is assumed strong or weak.
  const mid = Math.ceil(teams.length / 2);
  const rating = {};
  teams.forEach(t => { rating[t] = mid; });

  // Phase 1: damped iteration on continuous ratings, settling in ~30 passes.
  for (let i = 0; i < 100; i++) {
    const scores = scoreAll(teams, games, teamSet, rating, gameScore);
    [...teams]
      .sort((a, b) => scores[b] - scores[a])
      .forEach((t, pos) => {
        rating[t] = (1 - DAMPING) * rating[t] + DAMPING * (pos + 1);
      });
  }

  // Phase 2: snap the settled ratings to whole-number ranks and let those
  // stabilize, so the rank the formula consumes is the rank shown on the page.
  //
  // Ranks are a discrete function of scores while scores are a continuous
  // function of ranks, so for two near-identical teams the pass can swap them
  // back and forth forever and no integer fixed point exists. When that
  // happens, keep whichever state is self-consistent — the one where no team
  // is ranked above another with a higher score — rather than whichever state
  // the loop happened to stop on.
  let ranks = rankOrder(
    teams,
    Object.fromEntries(teams.map(t => [t, -rating[t]])),
    beatenBy,
  );
  let scores = scoreAll(teams, games, teamSet, ranks, gameScore);

  let best = null;
  const seen = new Set();

  for (let i = 0; i < 50; i++) {
    const inversions = countInversions(teams, ranks, scores, beatenBy);
    if (best === null || inversions < best.inversions) {
      best = { ranks: { ...ranks }, scores: { ...scores }, inversions };
    }
    if (inversions === 0) break;

    const key = teams.map(t => ranks[t]).join(',');
    if (seen.has(key)) break; // cycling; keep the best state seen
    seen.add(key);

    const next = rankOrder(teams, scores, beatenBy);
    if (teams.every(t => next[t] === ranks[t])) break;
    ranks = next;
    scores = scoreAll(teams, games, teamSet, ranks, gameScore);
  }

  return { ranks: best.ranks, scores: best.scores };
}

/**
 * Adjacent pairs where the lower-ranked team actually scored higher. A pair
 * held in place by head-to-head doesn't count — that ordering is deliberate.
 */
function countInversions(teams, ranks, scores, beatenBy) {
  const byRank = [...teams].sort((a, b) => ranks[a] - ranks[b]);
  let n = 0;
  for (let i = 1; i < byRank.length; i++) {
    if (scores[byRank[i]] <= scores[byRank[i - 1]] + 1e-9) continue;
    if (beatenBy?.has(byRank[i] + H2H_SEP + byRank[i - 1])) continue;
    n++;
  }
  return n;
}

/**
 * @param {string[]} teams  every team tracked, including any pooled bucket
 * @param {Array}    games  { home, away, homePoints, awayPoints }
 * @param {string[]} pooled team names that stand in for many opponents (e.g. 'FCS')
 *                         and so are excluded from head-to-head tiebreaks
 * @returns rows sorted by rank, each with a per-game log that sums to `score`
 */
export function buildRankings(teams, games, { pooled = [] } = {}) {
  const teamSet = new Set(teams);
  const gameScore = makeScorer(teams.length);
  const beatenBy = headToHead(games, teamSet, new Set(pooled));
  const { ranks, scores } = solveRanks(teams, games, teamSet, gameScore, beatenBy);

  const logs = {};
  const records = {};
  teams.forEach(t => { logs[t] = []; records[t] = { w: 0, l: 0, t: 0 }; });

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
    else { records[home].t++; records[away].t++; }
  }

  return teams.map(t => ({
    team: t,
    rank: ranks[t],
    score: scores[t],
    record: records[t],
    games: logs[t],
    hasGames: logs[t].length > 0,
  })).sort((a, b) => a.rank - b.rank);
}
