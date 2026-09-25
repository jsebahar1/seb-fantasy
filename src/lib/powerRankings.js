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
// loop into a permanent oscillation, the ranks never settle, and the scores you
// display end up computed from a different set of ranks than the ones you show.
// Easing into each new position instead reaches a real fixed point.
const DAMPING = 0.25;

// Exponents applied to the rank fraction. The defaults are the college shape:
// squaring makes a win over a good team spike, and a square root makes the loss
// penalty climb fast then flatten. A league with less spread between best and
// worst wants both closer to 1, where rank scales the margin directly.
export const CURVE_COLLEGE = { winExponent: 2, lossExponent: 0.5 };
export const CURVE_LINEAR = { winExponent: 1, lossExponent: 1 };

// Exact forms for the common exponents, so swapping in a curve cannot perturb
// existing numbers through a different floating point path.
function curve(base, exponent) {
  if (exponent === 1) return base;
  if (exponent === 2) return base * base;
  if (exponent === 0.5) return Math.sqrt(base);
  return Math.pow(base, exponent);
}

export function makeScorer(teamCount, { winExponent = 2, lossExponent = 0.5 } = {}) {
  const M2 = teamCount;
  const M3 = teamCount + 1;

  return function gameScore(diff, opponentRank) {
    // Win:  ((M3 - opp_rank) / M2)^winExponent  * diff
    // Loss: (opp_rank / M2)^lossExponent * diff , diff is negative here
    return diff > 0
      ? curve((M3 - opponentRank) / M2, winExponent) * diff
      : curve(opponentRank / M2, lossExponent) * diff;
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
 * Who beat whom. A pair that split their meetings is left out, there is no
 * winner to defer to.
 */
function headToHead(games, teamSet) {
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

  // Head-to-head outranks a score gap between neighbours, whatever its size.
  // Two teams that played each other have ratings that depend on each other's
  // rank, which can leave them swapping places forever with no stable ordering;
  // deferring to the result on the field breaks that and matches how anyone
  // would actually rank them. This applies to a pooled bucket too: if it beat
  // the team directly below it, it belongs ahead of them.
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

// How far a per-game value moves toward its newly computed target each pass,
// when solving with effective opponent ranks. Values are damped rather than
// scores: an effective rank is a step function of a leave-one-out score, and
// letting the values jump makes roughly half the table oscillate forever.
const VALUE_DAMPING = 0.2;

/**
 * Solve with "effective" opponent ranks: the rank an opponent would hold if the
 * game in question were removed from their record.
 *
 * Using an opponent's current rank lets a game inflate its own worth. Beating a
 * team drags them down, which makes the win look weaker, which drags them down
 * further. Scoring each game against the opponent's rank *without* that game
 * breaks the loop, so the result reflects who beat whom rather than the order
 * the feedback happened to settle into.
 */
function solveEffective(teams, games, teamSet, gameScore, beatenBy) {
  const N = teams.length;
  const index = Object.fromEntries(teams.map((t, i) => [t, i]));

  const G = [];
  for (const g of games) {
    if (!teamSet.has(g.home) || !teamSet.has(g.away)) continue;
    G.push({ h: index[g.home], a: index[g.away], diff: g.homePoints - g.awayPoints, ref: g });
  }

  const vh = new Float64Array(G.length);
  const va = new Float64Array(G.length);
  const mid = Math.ceil(N / 2);
  G.forEach((g, i) => { vh[i] = gameScore(g.diff, mid); va[i] = gameScore(-g.diff, mid); });

  const score = new Float64Array(N);
  const total = () => {
    score.fill(0);
    for (let i = 0; i < G.length; i++) { score[G[i].h] += vh[i]; score[G[i].a] += va[i]; }
  };
  total();

  // Sorted descending once per pass, so a leave-one-out rank is a binary search
  // rather than a scan over every team.
  let sorted = Float64Array.from(score).sort().reverse();
  const resort = () => { sorted = Float64Array.from(score).sort().reverse(); };

  // Teams strictly above `adj`, not counting `t` itself.
  const effRank = (t, adj) => {
    let lo = 0, hi = sorted.length;
    while (lo < hi) {
      const m = (lo + hi) >> 1;
      if (sorted[m] > adj) lo = m + 1; else hi = m;
    }
    return lo + 1 - (score[t] > adj ? 1 : 0);
  };

  let prev = null, stable = 0;
  for (let pass = 0; pass < 500 && stable < 25; pass++) {
    resort();
    for (let i = 0; i < G.length; i++) {
      const g = G[i];
      const tH = gameScore(g.diff, effRank(g.a, score[g.a] - va[i]));
      const tA = gameScore(-g.diff, effRank(g.h, score[g.h] - vh[i]));
      vh[i] = (1 - VALUE_DAMPING) * vh[i] + VALUE_DAMPING * tH;
      va[i] = (1 - VALUE_DAMPING) * va[i] + VALUE_DAMPING * tA;
    }
    total();
    const order = Array.from(score.keys()).sort((x, y) => score[y] - score[x]).join(',');
    stable = order === prev ? stable + 1 : 0;
    prev = order;
  }

  // Final pass with no damping, so every published value is exactly
  // gameScore(diff, effectiveRank) and a team's values sum to its rating.
  resort();
  const effH = new Int32Array(G.length), effA = new Int32Array(G.length);
  for (let i = 0; i < G.length; i++) {
    effA[i] = effRank(G[i].a, score[G[i].a] - va[i]);
    effH[i] = effRank(G[i].h, score[G[i].h] - vh[i]);
  }
  for (let i = 0; i < G.length; i++) {
    vh[i] = gameScore(G[i].diff, effA[i]);
    va[i] = gameScore(-G[i].diff, effH[i]);
  }
  total();

  const scores = Object.fromEntries(teams.map((t, i) => [t, score[i]]));
  const ranks = rankOrder(teams, scores, beatenBy);

  // effective opponent rank per game side, keyed for the log builder
  const effective = new Map();
  for (let i = 0; i < G.length; i++) {
    effective.set(G[i].ref, { home: effA[i], away: effH[i] });
  }
  return { ranks, scores, effective };
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
  // happens, keep whichever state is self-consistent, the one where no team
  // is ranked above another with a higher score, rather than whichever state
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
 * held in place by head-to-head doesn't count, that ordering is deliberate.
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
 * @param {string[]} pooled team names that stand in for many opponents (e.g. 'FCS').
 *                         Still eligible for head-to-head: if a pooled entry beat
 *                         a team and the two land adjacent, it ranks ahead.
 * @param {object}   curve  { winExponent, lossExponent }; defaults to the college
 *                         shape. Pass CURVE_LINEAR for a league with less spread.
 * @returns rows sorted by rank, each with a per-game log that sums to `score`
 */
export function buildRankings(teams, games, { pooled = [], curve: shape, effectiveOpponentRank = false } = {}) {
  const teamSet = new Set(teams);
  const gameScore = makeScorer(teams.length, shape);
  const beatenBy = headToHead(games, teamSet);
  const solved = effectiveOpponentRank
    ? solveEffective(teams, games, teamSet, gameScore, beatenBy)
    : solveRanks(teams, games, teamSet, gameScore, beatenBy);
  const { ranks, scores, effective } = solved;

  const logs = {};
  const records = {};
  teams.forEach(t => { logs[t] = []; records[t] = { w: 0, l: 0, t: 0 }; });

  for (const game of games) {
    const { home, away, homePoints, awayPoints, week } = game;
    if (!teamSet.has(home) || !teamSet.has(away)) continue;
    const diff = homePoints - awayPoints;

    // Which opponent rank the formula actually consumed. With effective ranks
    // that is the opponent's rank minus this game; otherwise it is their rank
    // as shown, and the two columns read the same.
    const eff = effective?.get(game);
    const rankForHome = eff ? eff.home : ranks[away];
    const rankForAway = eff ? eff.away : ranks[home];

    logs[home].push({
      opponent: away, atHome: true, oppRank: ranks[away], effRank: rankForHome, week,
      pointsFor: homePoints, pointsAgainst: awayPoints,
      result: diff > 0 ? 'W' : diff < 0 ? 'L' : 'T',
      value: gameScore(diff, rankForHome),
    });
    logs[away].push({
      opponent: home, atHome: false, oppRank: ranks[home], effRank: rankForAway, week,
      pointsFor: awayPoints, pointsAgainst: homePoints,
      result: diff < 0 ? 'W' : diff > 0 ? 'L' : 'T',
      value: gameScore(-diff, rankForAway),
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
