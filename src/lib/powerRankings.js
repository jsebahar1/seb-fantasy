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

function rankOrder(teams, scores) {
  const ranks = {};
  [...teams]
    .sort((a, b) => scores[b] - scores[a])
    .forEach((t, i) => { ranks[t] = i + 1; });
  return ranks;
}

function solveRanks(teams, games, teamSet, gameScore) {
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
  let ranks = rankOrder(teams, Object.fromEntries(teams.map(t => [t, -rating[t]])));
  let scores = scoreAll(teams, games, teamSet, ranks, gameScore);

  for (let i = 0; i < 50; i++) {
    const next = rankOrder(teams, scores);
    if (teams.every(t => next[t] === ranks[t])) break;
    ranks = next;
    scores = scoreAll(teams, games, teamSet, ranks, gameScore);
  }

  return { ranks, scores };
}

/**
 * @param {string[]} teams  every team tracked, including any pooled bucket
 * @param {Array}    games  { home, away, homePoints, awayPoints }
 * @returns rows sorted by rank, each with a per-game log that sums to `score`
 */
export function buildRankings(teams, games) {
  const teamSet = new Set(teams);
  const gameScore = makeScorer(teams.length);
  const { ranks, scores } = solveRanks(teams, games, teamSet, gameScore);

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
