---
name: update-games
description: Add college football or NFL game results and schedules to the power rankings data. Use whenever the user pastes scores, final results, or an upcoming slate for either sport. Handles promoting played games out of the schedule file, bumping the page date, and running the integrity checks.
---

# Updating games

Results and schedules live in four data files. Played games go in the results
file; matchups that have not happened go in the schedule file with no scores.

| Sport | Results | Schedule | Page |
|---|---|---|---|
| College | `src/data/cfbGames.js` | `src/data/cfbSchedule.js` | `src/Pages/NcaaFootball.jsx` |
| NFL | `src/data/nflGames.js` | `src/data/nflSchedule.js` | `src/Pages/NflRankings.jsx` |

Never put a played game in the schedule file, and never put a 0-0 placeholder in
the results file. The engine reads equal scores as a tie and credits it to both
records.

## Adding results

Use `promote` from `scripts/promoteResults.mjs`. It refuses to write anything
unless every pasted line resolves, so a misread matchup fails loudly instead of
landing quietly.

```js
const { promote, CFB_ALIAS, nflAlias } = await import('./scripts/promoteResults.mjs');
const d = await import('./src/data/cfbGames.js');

const r = promote({
  results: [['Iowa St.', 10, 'BYU', 24]],   // [away, awayPts, home, homePts]
  week: 6,
  schedPath: 'src/data/cfbSchedule.js',
  gamesPath: 'src/data/cfbGames.js',
  pagePath: 'src/Pages/NcaaFootball.jsx',   // bumps LAST_UPDATED for you
  teams: d.TEAMS,
  alias: CFB_ALIAS,
});
console.log(r.promoted, r.skipped.length, r.dateBumped);
```

For the NFL, pass `alias: nflAlias(NFL_TEAMS)`; listings use nicknames and the
last word of each full name is unique across the league.

**Always pass `pagePath`.** It rewrites `LAST_UPDATED`, which drives both the
visible "Updated" date and `dateModified` in the structured data. It only fires
when something actually landed, so a batch of pure repeats will not claim the
page was refreshed.

### What the promoter protects against

- A game already recorded is skipped, and reported as a conflict only if the
  stored score disagrees with the paste.
- The same game listed twice in one paste is collapsed, and flagged only if the
  two copies disagree.
- A matchup found in neither the schedule nor the results aborts the run. That
  almost always means home and away were read backwards.

## Adding a schedule

```js
const { addSchedule, nflAlias } = await import('./scripts/promoteResults.mjs');
addSchedule({
  pairs: [['Patriots', 'Bears'], ['Steelers', 'Saints']],  // [away, home]
  week: 7,
  schedPath: 'src/data/nflSchedule.js',
  teams: NFL_TEAMS,
  alias: nflAlias(NFL_TEAMS),
});
```

It refuses to write if a team appears twice in one week, and returns the bye
teams it derived so you can sanity-check them against the source.

## Reading a pasted slate

Listings put the **away team first**, then its score, then the home team and its
score. Numbers before a team name are AP rankings and are not data. Ignore
times, dates, `FINAL`, betting lines, and trailing site navigation.

Any college opponent not in `TEAMS` resolves to the pooled `'FCS'` entry. Check
that list in the output: a real FBS team landing in the bucket means an alias is
missing from `CFB_ALIAS`, which silently discards the game. `Florida St.` and
`Umass` have both caused this.

## After every update

```
npx vite build
```

Then run the integrity checks. All of these should hold:

- `logsum` 0: every team's game values sum to its rating
- `value vs formula` 0: each value equals `gameScore(diff, effRank)`
- `in both` 0: no matchup sits in the schedule and results files at once
- duplicate rows 0
- unknown team names 0
- college season totals: 137 teams at 12 games, San Jose State at 13 (they
  travel to Hawaii, which earns a thirteenth game)

Inversions are **not** necessarily bugs. A team can rank above another with a
better rating when it won head-to-head and the two are adjacent. Check whether
the pair played before treating one as a problem.

## Reporting back

Say how many games landed and how many were repeats, name what is still
outstanding for that week, and call out results where the margin credit or the
effective opponent rank explains something surprising. A blowout worth almost
nothing, or a one-point win that paid well, is usually the interesting part.
