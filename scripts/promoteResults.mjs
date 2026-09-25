/**
 * Move played games out of a schedule file and into a results file.
 *
 * Every pasted result must resolve to exactly one scheduled game for that week,
 * which is what catches a misread matchup before it reaches the data. Re-pasted
 * batches are fine: a game already recorded is skipped, and only reported if the
 * score disagrees with what is stored. Nothing is written unless every line
 * resolves, so a partial batch never lands.
 *
 * Usage from a node --input-type=module one-liner:
 *
 *   const { promote, nflAlias, CFB_ALIAS } = await import('./scripts/promoteResults.mjs');
 *   promote({ results: [['Falcons', 35, 'Packers', 14]], week: 3,
 *             schedPath: 'src/data/nflSchedule.js',
 *             gamesPath: 'src/data/nflGames.js',
 *             teams: NFL_TEAMS, alias: nflAlias(NFL_TEAMS) });
 *
 * `results` rows are [awayName, awayPoints, homeName, homePoints] using whatever
 * names the source listing uses; the alias map normalises them.
 */
import fs from 'fs';

/** Source-listing name -> the exact name used in the college TEAMS array. */
export const CFB_ALIAS = {
  'Ohio St.': 'Ohio State', 'Penn St.': 'Penn State', 'Kent St.': 'Kent State',
  'Iowa St.': 'Iowa State', 'Texas St.': 'Texas State', 'Kansas St.': 'Kansas State',
  'Arizona St.': 'Arizona State', 'Eastern Mich.': 'Eastern Michigan',
  'Central Mich.': 'Central Michigan', 'Western Mich.': 'Western Michigan',
  'Michigan St.': 'Michigan State', 'Oklahoma St.': 'Oklahoma State',
  'Oregon St.': 'Oregon State', 'Washington St.': 'Washington State',
  'Mississippi St.': 'Mississippi State', 'Florida St.': 'Florida State',
  'Boise St.': 'Boise State', 'Ball St.': 'Ball State', 'Colorado St.': 'Colorado State',
  'Georgia St.': 'Georgia State', 'Kennesaw St.': 'Kennesaw State',
  'Arkansas St.': 'Arkansas State', 'Missouri St.': 'Missouri State',
  'San Diego St.': 'San Diego State', 'San Jose St.': 'San Jose State',
  'North Dakota St.': 'North Dakota State', 'Sacramento St.': 'Sacramento State',
  'Fresno St.': 'Fresno State', 'New Mexico St.': 'New Mexico State',
  'Jacksonville St.': 'Jacksonville State', 'Utah St.': 'Utah State',
  'Southern California': 'USC', 'Massachusetts': 'UMass', 'ULM': 'Louisiana Monroe',
  'Fla. Atlantic': 'Florida Atlantic', 'App State': 'Appalachian State',
  'Middle Tenn.': 'Middle Tennessee', 'South Fla.': 'South Florida',
  'Southern Miss.': 'Southern Miss', 'Ga. Southern': 'Georgia Southern',
  'NIU': 'Northern Illinois', 'Army West Point': 'Army',
  'Western Ky.': 'Western Kentucky',
};

/** NFL listings use nicknames, and the last word of each full name is unique. */
export function nflAlias(teams) {
  const out = {};
  for (const t of teams) out[t.split(' ').pop()] = t;
  return out;
}

export function promote({ results, week, schedPath, gamesPath, teams, alias = {}, pooled = 'FCS' }) {
  const known = new Set(teams);
  const resolve = n => {
    const a = alias[n] ?? n;
    return known.has(a) ? a : pooled;
  };

  let lines = fs.readFileSync(schedPath, 'utf8').split('\n');
  const gamesSrc = fs.readFileSync(gamesPath, 'utf8');
  const gameLines = gamesSrc.split('\n');

  const promoted = [], skipped = [], conflicts = [], problems = [];

  for (const [awayRaw, ap, homeRaw, hp] of results) {
    const home = resolve(homeRaw), away = resolve(awayRaw);
    const tags = [`home: '${home}',`, `away: '${away}',`, `week: ${week} `];
    const has = l => tags.every(t => l.includes(t));

    const already = gameLines.filter(has);
    if (already.length) {
      const m = already[0].match(/homePoints:\s*(\d+),\s*awayPoints:\s*(\d+)/);
      if (m && (+m[1] !== hp || +m[2] !== ap)) {
        conflicts.push(`${away} at ${home} wk${week}: recorded ${m[1]}-${m[2]}, pasted ${hp}-${ap}`);
      } else {
        skipped.push(`${away} at ${home}`);
      }
      continue;
    }

    const hit = lines.filter(has);
    if (hit.length !== 1) {
      problems.push(`${awayRaw} at ${homeRaw} -> ${away} at ${home}: ${hit.length} scheduled, 0 recorded`);
      continue;
    }
    lines.splice(lines.indexOf(hit[0]), 1);
    promoted.push({ home, away, hp, ap });
  }

  if (conflicts.length) {
    console.error('SCORE CONFLICT, nothing written:');
    conflicts.forEach(c => console.error('  ' + c));
    process.exit(1);
  }
  if (problems.length) {
    console.error('UNMATCHED, nothing written:');
    problems.forEach(p => console.error('  ' + p));
    process.exit(1);
  }

  fs.writeFileSync(schedPath, lines.join('\n'));

  const pad = (s, n) => (s + ',').padEnd(n);
  const rows = promoted.map(g =>
    `  { home: ${pad("'" + g.home + "'", 24)} away: ${pad("'" + g.away + "'", 23)}` +
    ` homePoints: ${String(g.hp).padStart(2)}, awayPoints: ${String(g.ap).padStart(2)}, week: ${week} },`);
  const marker = `// Week ${week}`;
  const insert = (gamesSrc.includes(marker) ? '' : `  ${marker}\n`) + rows.join('\n') + '\n';
  const i = gamesSrc.lastIndexOf('];');
  fs.writeFileSync(gamesPath, gamesSrc.slice(0, i) + insert + gamesSrc.slice(i));

  return { promoted: promoted.length, skipped };
}

/** Append scheduled matchups, as [awayName, homeName] pairs, to a schedule file. */
export function addSchedule({ pairs, week, schedPath, teams, alias = {}, pooled = 'FCS' }) {
  const known = new Set(teams);
  const resolve = n => {
    const a = alias[n] ?? n;
    return known.has(a) ? a : pooled;
  };
  const seen = {};
  const games = pairs.map(([a, h]) => {
    const g = { home: resolve(h), away: resolve(a) };
    for (const t of [g.home, g.away]) if (t !== pooled) seen[t] = (seen[t] || 0) + 1;
    return g;
  });
  const twice = Object.entries(seen).filter(([, c]) => c > 1);
  if (twice.length) {
    console.error(`week ${week}: team scheduled twice: ` + twice.map(([t, c]) => `${t} x${c}`).join(', '));
    process.exit(1);
  }
  const pad = (s, n) => (s + ',').padEnd(n);
  const rows = games.map(g =>
    `  { home: ${pad("'" + g.home + "'", 26)} away: ${pad("'" + g.away + "'", 26)} week: ${week} },`);
  const src = fs.readFileSync(schedPath, 'utf8');
  const i = src.lastIndexOf('];');
  fs.writeFileSync(schedPath, src.slice(0, i) + rows.join('\n') + '\n' + src.slice(i));
  return { added: games.length, teams: Object.keys(seen).length, byes: teams.filter(t => t !== pooled && !seen[t]) };
}
