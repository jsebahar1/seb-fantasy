/**
 * Conference standings and a College Football Playoff field built from them.
 *
 * Tiebreakers follow the shape the Power 4 leagues actually use: conference
 * winning percentage first, then head-to-head among the tied teams, then a
 * record against common conference opponents, then overall record, and finally
 * the power rating. The real conference handbooks differ in their later steps
 * and add things like division records and strength-of-schedule metrics; this
 * covers the cases that decide almost every tie in practice.
 */

const pct = ({ w, l, t }) => {
  const played = w + l + t;
  return played ? (w + t / 2) / played : 0;
};

function blank() {
  return { w: 0, l: 0, t: 0 };
}

function credit(rec, result) {
  if (result === 'w') rec.w++;
  else if (result === 'l') rec.l++;
  else rec.t++;
}

/**
 * Per-team conference and overall records, plus who each team beat inside the
 * conference, which is what the head-to-head steps read.
 */
function tallyConference(rankings, games, teamConference) {
  const conf = {}, overall = {}, beat = {};
  rankings.forEach(r => {
    conf[r.team] = blank();
    overall[r.team] = { w: r.record.w, l: r.record.l, t: r.record.t ?? 0 };
    beat[r.team] = new Set();
  });

  for (const { home, away, homePoints, awayPoints } of games) {
    const hc = teamConference[home], ac = teamConference[away];
    if (!hc || !ac || hc !== ac) continue;
    if (!conf[home] || !conf[away]) continue;

    const hr = homePoints > awayPoints ? 'w' : homePoints < awayPoints ? 'l' : 't';
    credit(conf[home], hr);
    credit(conf[away], hr === 'w' ? 'l' : hr === 'l' ? 'w' : 't');
    if (hr === 'w') beat[home].add(away);
    else if (hr === 'l') beat[away].add(home);
  }
  return { conf, overall, beat };
}

/** Record for `team` against every opponent in `group`, conference games only. */
function recordAgainst(team, group, games, teamConference) {
  const rec = blank();
  for (const { home, away, homePoints, awayPoints } of games) {
    if (teamConference[home] !== teamConference[away]) continue;
    const isHome = home === team, isAway = away === team;
    if (!isHome && !isAway) continue;
    const other = isHome ? away : home;
    if (!group.has(other)) continue;
    const mine = isHome ? homePoints : awayPoints;
    const theirs = isHome ? awayPoints : homePoints;
    credit(rec, mine > theirs ? 'w' : mine < theirs ? 'l' : 't');
  }
  return rec;
}

export function buildStandings({ rankings, games, conferences, teamConference, exclude = [] }) {
  const skip = new Set(exclude);
  const byTeam = Object.fromEntries(rankings.map(r => [r.team, r]));
  const { conf, overall, beat } = tallyConference(rankings, games, teamConference);

  return Object.entries(conferences).map(([name, teams]) => {
    const members = teams.filter(t => byTeam[t] && !skip.has(t));

    const sorted = [...members].sort((a, b) => {
      // 1. conference winning percentage
      const p = pct(conf[b]) - pct(conf[a]);
      if (Math.abs(p) > 1e-9) return p;

      // 2. head to head, when one of the tied pair beat the other
      if (beat[a].has(b) && !beat[b].has(a)) return -1;
      if (beat[b].has(a) && !beat[a].has(b)) return 1;

      // 3. record against the other teams on the same conference record
      const tiedWith = new Set(members.filter(t =>
        t !== a && t !== b && Math.abs(pct(conf[t]) - pct(conf[a])) < 1e-9));
      if (tiedWith.size) {
        const c = pct(recordAgainst(b, tiedWith, games, teamConference))
                - pct(recordAgainst(a, tiedWith, games, teamConference));
        if (Math.abs(c) > 1e-9) return c;
      }

      // 4. overall record, then 5. the power rating
      const o = pct(overall[b]) - pct(overall[a]);
      if (Math.abs(o) > 1e-9) return o;
      return byTeam[a].rank - byTeam[b].rank;
    });

    return {
      conference: name,
      teams: sorted.map((t, i) => ({
        team: t,
        place: i + 1,
        conf: conf[t],
        overall: overall[t],
        rank: byTeam[t].rank,
        score: byTeam[t].score,
      })),
    };
  });
}

// ── Playoff field ─────────────────────────────────────────────────────────────

export const POWER_FOUR = ['ACC', 'Big Ten', 'Big 12', 'SEC'];

/**
 * A 12-team field: the four Power 4 champions, the best Group of 6 team, Notre
 * Dame when they finish inside the top 12, and at-large spots by rating. Seeds
 * run 1 to 12 strictly on rating, so the top four byes are not reserved for
 * conference champions.
 */
export function buildPlayoffField({ standings, rankings, exclude = [] }) {
  const skip = new Set(exclude);
  const pool = rankings.filter(r => !skip.has(r.team) && r.hasGames);
  const byRank = [...pool].sort((a, b) => a.rank - b.rank);
  const standingsBy = Object.fromEntries(standings.map(s => [s.conference, s]));

  const field = [];
  const taken = new Set();
  const add = (team, reason) => {
    if (!team || taken.has(team)) return;
    taken.add(team);
    field.push({ team, reason });
  };

  // Power 4 champions: whoever sits atop each conference's standings
  for (const c of POWER_FOUR) {
    const champ = standingsBy[c]?.teams[0]?.team;
    add(champ, `${c} champion`);
  }

  // Group of 6: best rated team from any other conference, champion or not
  const g6 = byRank.find(r => {
    const c = standings.find(s => s.teams.some(t => t.team === r.team))?.conference;
    return c && !POWER_FOUR.includes(c) && c !== 'Independent' && c !== 'FCS';
  });
  if (g6) {
    const c = standings.find(s => s.teams.some(t => t.team === g6.team))?.conference;
    add(g6.team, `${c} highest ranked`);
  }

  // Notre Dame takes a bid outright when they land in the top 12
  const nd = pool.find(r => r.team === 'Notre Dame');
  if (nd && nd.rank <= 12) add('Notre Dame', 'Top 12 independent');

  // at-large by rating until the field is full
  for (const r of byRank) {
    if (field.length >= 12) break;
    add(r.team, 'At large');
  }

  const rankOf = Object.fromEntries(pool.map(r => [r.team, r.rank]));
  const seeded = field
    .slice(0, 12)
    .sort((a, b) => rankOf[a.team] - rankOf[b.team])
    .map((e, i) => ({ ...e, seed: i + 1, rank: rankOf[e.team] }));

  const firstRound = [
    [5, 12], [6, 11], [7, 10], [8, 9],
  ].map(([a, b]) => ({
    high: seeded.find(s => s.seed === a),
    low: seeded.find(s => s.seed === b),
  }));

  return {
    seeded,
    byes: seeded.filter(s => s.seed <= 4),
    firstRound,
    // teams that just missed, useful context next to the field
    nextOut: byRank.filter(r => !taken.has(r.team)).slice(0, 4),
  };
}
