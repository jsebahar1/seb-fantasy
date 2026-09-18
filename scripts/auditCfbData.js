import { TEAMS, INITIAL_GAMES } from '../src/data/cfbGames.js';
import { UPCOMING_GAMES } from '../src/data/cfbSchedule.js';
import { CONFERENCES, TEAM_CONFERENCE } from '../src/data/cfbConferences.js';

const POOLED_TEAM = 'FCS';
const LARGE_SCORE = 70;
const LARGE_MARGIN = 60;

const teamSet = new Set(TEAMS);
const realTeams = TEAMS.filter(team => team !== POOLED_TEAM);
const realTeamSet = new Set(realTeams);

const categories = [
  { name: 'Team-name consistency', errors: [] },
  { name: 'Conference integrity', errors: [] },
  { name: 'Completed-game integrity', errors: [] },
  { name: 'Upcoming-schedule integrity', errors: [] },
  { name: 'Completed/upcoming overlap', errors: [] },
];

const categoryByName = Object.fromEntries(
  categories.map(category => [category.name, category]),
);

const warnings = [];

function addError(categoryName, message) {
  categoryByName[categoryName].errors.push(message);
}

function gameLocation(dataName, index, game) {
  return `${dataName}[${index}] (entry ${index + 1}, week ${String(game.week)})`;
}

function matchup(game) {
  return `${String(game.away)} at ${String(game.home)}`;
}

function unorderedMatchupKey(game) {
  return [game.home, game.away].sort().join('\u0000');
}

function stableRowKey(row) {
  const sortedRow = Object.fromEntries(
    Object.keys(row).sort().map(key => [key, row[key]]),
  );
  return JSON.stringify(sortedRow);
}

function findExactDuplicates(games, dataName, categoryName) {
  const firstIndexByRow = new Map();

  games.forEach((game, index) => {
    const key = stableRowKey(game);
    const firstIndex = firstIndexByRow.get(key);

    if (firstIndex !== undefined) {
      addError(
        categoryName,
        `Exact duplicate: ${gameLocation(dataName, firstIndex, games[firstIndex])} and ` +
          `${gameLocation(dataName, index, game)} both contain ${JSON.stringify(game)}.`,
      );
    } else {
      firstIndexByRow.set(key, index);
    }
  });
}

function findReversedDuplicates(games, dataName, categoryName) {
  for (let firstIndex = 0; firstIndex < games.length; firstIndex++) {
    const first = games[firstIndex];

    for (let secondIndex = firstIndex + 1; secondIndex < games.length; secondIndex++) {
      const second = games[secondIndex];
      const reversed = first.week === second.week &&
        first.home === second.away &&
        first.away === second.home;

      if (reversed) {
        addError(
          categoryName,
          `Reversed duplicate matchup: ${gameLocation(dataName, firstIndex, first)} ` +
            `(${matchup(first)}) and ${gameLocation(dataName, secondIndex, second)} ` +
            `(${matchup(second)}).`,
        );
      }
    }
  }
}

function findMultipleGamesInWeek(games, dataName, categoryName) {
  const appearances = new Map();

  games.forEach((game, index) => {
    for (const side of ['home', 'away']) {
      const team = game[side];
      if (!realTeamSet.has(team) || !Number.isInteger(game.week)) continue;

      const key = `${team}\u0000${game.week}`;
      const appearance = appearances.get(key) ?? { team, week: game.week, entries: [] };
      appearance.entries.push({ game, index });
      appearances.set(key, appearance);
    }
  });

  for (const { team, week, entries } of appearances.values()) {
    if (entries.length < 2) continue;

    const locations = entries
      .map(({ game, index }) => `${gameLocation(dataName, index, game)} (${matchup(game)})`)
      .join('; ');

    addError(
      categoryName,
      `${team} appears in ${entries.length} games in week ${week}: ${locations}.`,
    );
  }
}

function checkTeamReferences(games, dataName, label) {
  games.forEach((game, index) => {
    for (const side of ['home', 'away']) {
      if (!teamSet.has(game[side])) {
        addError(
          'Team-name consistency',
          `Unknown ${label} ${side} team ${JSON.stringify(game[side])} in ` +
            `${gameLocation(dataName, index, game)} (${matchup(game)}).`,
        );
      }
    }
  });
}

function checkCompletedGames() {
  INITIAL_GAMES.forEach((game, index) => {
    const location = gameLocation('INITIAL_GAMES', index, game);

    if (game.home === game.away) {
      addError(
        'Completed-game integrity',
        `Self-game in ${location}: ${JSON.stringify(game.home)} is both home and away.`,
      );
    }

    for (const field of ['homePoints', 'awayPoints']) {
      if (!Number.isFinite(game[field]) || game[field] < 0) {
        addError(
          'Completed-game integrity',
          `Invalid ${field} in ${location} (${matchup(game)}): ${String(game[field])}. ` +
            'Scores must be finite nonnegative numbers.',
        );
      }
    }

    if (!Number.isInteger(game.week) || game.week < 0) {
      addError(
        'Completed-game integrity',
        `Invalid week in ${location} (${matchup(game)}): ${String(game.week)}. ` +
          'Week must be a nonnegative integer.',
      );
    }
  });

  findExactDuplicates(INITIAL_GAMES, 'INITIAL_GAMES', 'Completed-game integrity');
  findReversedDuplicates(INITIAL_GAMES, 'INITIAL_GAMES', 'Completed-game integrity');
  findMultipleGamesInWeek(INITIAL_GAMES, 'INITIAL_GAMES', 'Completed-game integrity');
}

function checkUpcomingGames() {
  UPCOMING_GAMES.forEach((game, index) => {
    const location = gameLocation('UPCOMING_GAMES', index, game);

    if (game.home === game.away) {
      addError(
        'Upcoming-schedule integrity',
        `Self-game in ${location}: ${JSON.stringify(game.home)} is both home and away.`,
      );
    }

    if (!Number.isInteger(game.week) || game.week < 0) {
      addError(
        'Upcoming-schedule integrity',
        `Invalid week in ${location} (${matchup(game)}): ${String(game.week)}. ` +
          'Week must be a nonnegative integer.',
      );
    }
  });

  findExactDuplicates(UPCOMING_GAMES, 'UPCOMING_GAMES', 'Upcoming-schedule integrity');
  findReversedDuplicates(UPCOMING_GAMES, 'UPCOMING_GAMES', 'Upcoming-schedule integrity');
  findMultipleGamesInWeek(UPCOMING_GAMES, 'UPCOMING_GAMES', 'Upcoming-schedule integrity');
}

function checkConferences() {
  const assignmentsByTeam = new Map();

  for (const [conference, teams] of Object.entries(CONFERENCES)) {
    teams.forEach((team, index) => {
      const location = `CONFERENCES[${JSON.stringify(conference)}][${index}]`;

      if (!teamSet.has(team)) {
        addError(
          'Team-name consistency',
          `Unknown conference team ${JSON.stringify(team)} in ${location}.`,
        );
      }

      const assignments = assignmentsByTeam.get(team) ?? [];
      assignments.push({ conference, location });
      assignmentsByTeam.set(team, assignments);
    });
  }

  for (const team of realTeams) {
    const assignments = assignmentsByTeam.get(team) ?? [];
    const distinctConferences = [...new Set(assignments.map(item => item.conference))];

    if (assignments.length === 0) {
      addError(
        'Conference integrity',
        `${team} is in TEAMS but missing from CONFERENCES.`,
      );
      continue;
    }

    if (distinctConferences.length > 1) {
      addError(
        'Conference integrity',
        `${team} is assigned to multiple conferences: ${assignments
          .map(item => `${item.conference} at ${item.location}`)
          .join('; ')}.`,
      );
    } else if (assignments.length > 1) {
      addError(
        'Conference integrity',
        `${team} is listed ${assignments.length} times in ${distinctConferences[0]}: ` +
          `${assignments.map(item => item.location).join(', ')}.`,
      );
    }
  }

  for (const [team, assignments] of assignmentsByTeam) {
    if (assignments.length !== 1) continue;

    const expectedConference = assignments[0].conference;
    if (TEAM_CONFERENCE[team] !== expectedConference) {
      addError(
        'Conference integrity',
        `TEAM_CONFERENCE[${JSON.stringify(team)}] is ${JSON.stringify(TEAM_CONFERENCE[team])}, ` +
          `but CONFERENCES assigns the team to ${JSON.stringify(expectedConference)}.`,
      );
    }
  }

  for (const [team, conference] of Object.entries(TEAM_CONFERENCE)) {
    const assignments = assignmentsByTeam.get(team) ?? [];
    const represented = assignments.some(item => item.conference === conference);

    if (!teamSet.has(team)) {
      addError(
        'Team-name consistency',
        `TEAM_CONFERENCE contains unknown team ${JSON.stringify(team)}.`,
      );
    }

    if (!represented) {
      addError(
        'Conference integrity',
        `TEAM_CONFERENCE maps ${JSON.stringify(team)} to ${JSON.stringify(conference)}, ` +
          'but that membership is not present in CONFERENCES.',
      );
    }
  }
}

function checkCompletedUpcomingOverlap() {
  const completedByPair = new Map();
  const upcomingByPair = new Map();

  INITIAL_GAMES.forEach((game, index) => {
    if (game.home === POOLED_TEAM || game.away === POOLED_TEAM) return;
    const key = unorderedMatchupKey(game);
    const entries = completedByPair.get(key) ?? [];
    entries.push({ game, index });
    completedByPair.set(key, entries);
  });

  UPCOMING_GAMES.forEach((game, index) => {
    if (game.home === POOLED_TEAM || game.away === POOLED_TEAM) return;
    const key = unorderedMatchupKey(game);
    const entries = upcomingByPair.get(key) ?? [];
    entries.push({ game, index });
    upcomingByPair.set(key, entries);
  });

  for (const [key, completedEntries] of completedByPair) {
    const upcomingEntries = upcomingByPair.get(key);
    if (!upcomingEntries) continue;

    const completedLocations = completedEntries
      .map(({ game, index }) => `${gameLocation('INITIAL_GAMES', index, game)} (${matchup(game)})`)
      .join('; ');
    const upcomingLocations = upcomingEntries
      .map(({ game, index }) => `${gameLocation('UPCOMING_GAMES', index, game)} (${matchup(game)})`)
      .join('; ');

    addError(
      'Completed/upcoming overlap',
      `Real-team matchup appears in both datasets: completed ${completedLocations}; ` +
        `upcoming ${upcomingLocations}.`,
    );
  }
}

function addGameCountWarnings() {
  const gameCounts = Object.fromEntries(realTeams.map(team => [team, 0]));

  for (const game of INITIAL_GAMES) {
    if (realTeamSet.has(game.home)) gameCounts[game.home]++;
    if (realTeamSet.has(game.away)) gameCounts[game.away]++;
  }

  const frequency = new Map();
  for (const count of Object.values(gameCounts)) {
    frequency.set(count, (frequency.get(count) ?? 0) + 1);
  }

  const expectedCount = [...frequency.entries()]
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0];
  const unusualGroups = new Map();

  for (const [team, count] of Object.entries(gameCounts)) {
    if (count === expectedCount) continue;
    const teams = unusualGroups.get(count) ?? [];
    teams.push(team);
    unusualGroups.set(count, teams);
  }

  for (const [count, teams] of [...unusualGroups.entries()].sort((a, b) => a[0] - b[0])) {
    warnings.push(
      `Unusual completed-game count: the modal real-team count is ${expectedCount}, ` +
        `but ${teams.join(', ')} ${teams.length === 1 ? 'has' : 'have'} ${count}.`,
    );
  }
}

function addLargeScoreWarnings() {
  INITIAL_GAMES.forEach((game, index) => {
    const margin = Math.abs(game.homePoints - game.awayPoints);
    const highestScore = Math.max(game.homePoints, game.awayPoints);

    if (highestScore >= LARGE_SCORE || margin >= LARGE_MARGIN) {
      warnings.push(
        `Large score or margin in ${gameLocation('INITIAL_GAMES', index, game)}: ` +
          `${game.away} ${game.awayPoints}, ${game.home} ${game.homePoints} ` +
          `(highest score ${highestScore}, margin ${margin}; warning thresholds are ` +
          `${LARGE_SCORE} points or a ${LARGE_MARGIN}-point margin).`,
      );
    }
  });
}

function addPooledFcsWarnings() {
  const completedByWeek = new Map();
  const upcomingByWeek = new Map();

  for (const game of INITIAL_GAMES) {
    if (game.home !== POOLED_TEAM && game.away !== POOLED_TEAM) continue;
    completedByWeek.set(game.week, (completedByWeek.get(game.week) ?? 0) + 1);
  }

  for (const game of UPCOMING_GAMES) {
    if (game.home !== POOLED_TEAM && game.away !== POOLED_TEAM) continue;
    upcomingByWeek.set(game.week, (upcomingByWeek.get(game.week) ?? 0) + 1);
  }

  for (const [week, count] of completedByWeek) {
    if (count > 1) {
      warnings.push(
        `Pooled FCS bucket appears in ${count} completed games in week ${week}. ` +
          'This is allowed because it represents multiple real FCS schools.',
      );
    }
  }

  for (const [week, count] of upcomingByWeek) {
    if (count > 1) {
      warnings.push(
        `Pooled FCS bucket appears in ${count} scheduled games in week ${week}. ` +
          'This is allowed because it represents multiple real FCS schools.',
      );
    }
  }

  const completedPairs = new Map();
  INITIAL_GAMES.forEach((game, index) => {
    if (game.home !== POOLED_TEAM && game.away !== POOLED_TEAM) return;
    const realTeam = game.home === POOLED_TEAM ? game.away : game.home;
    completedPairs.set(realTeam, { game, index });
  });

  UPCOMING_GAMES.forEach((game, index) => {
    if (game.home !== POOLED_TEAM && game.away !== POOLED_TEAM) return;
    const realTeam = game.home === POOLED_TEAM ? game.away : game.home;
    const completed = completedPairs.get(realTeam);
    if (!completed) return;

    warnings.push(
      `Allowed pooled-FCS reuse for ${realTeam}: ` +
        `${gameLocation('INITIAL_GAMES', completed.index, completed.game)} and ` +
        `${gameLocation('UPCOMING_GAMES', index, game)} may represent different FCS schools.`,
    );
  });
}

function printResults() {
  const totalErrors = categories.reduce((sum, category) => sum + category.errors.length, 0);

  console.log('============================================================');
  console.log('NCAA FOOTBALL DATA INTEGRITY AUDIT');
  console.log('Read-only inspection: no project data is modified.');
  console.log('============================================================');
  console.log(`Canonical teams: ${TEAMS.length} total (${realTeams.length} real, 1 pooled FCS)`);
  console.log(`Completed games: ${INITIAL_GAMES.length}`);
  console.log(`Upcoming games: ${UPCOMING_GAMES.length}`);
  console.log(`Conference groups: ${Object.keys(CONFERENCES).length}`);
  console.log('');

  for (const category of categories) {
    const status = category.errors.length === 0 ? 'PASS' : 'FAIL';
    console.log(`[${status}] ${category.name}`);

    for (const error of category.errors) {
      console.log(`  ERROR: ${error}`);
    }
  }

  console.log('');
  console.log(`WARNINGS (${warnings.length}; warnings do not cause failure)`);
  if (warnings.length === 0) {
    console.log('  None.');
  } else {
    warnings.forEach(warning => console.log(`  WARNING: ${warning}`));
  }

  console.log('');
  console.log('============================================================');
  console.log(totalErrors === 0
    ? 'OVERALL PASS: no data-integrity errors found.'
    : `OVERALL FAIL: ${totalErrors} data-integrity error(s) found.`);
  console.log('============================================================');

  globalThis.process.exitCode = totalErrors === 0 ? 0 : 1;
}

checkTeamReferences(INITIAL_GAMES, 'INITIAL_GAMES', 'completed-game');
checkTeamReferences(UPCOMING_GAMES, 'UPCOMING_GAMES', 'scheduled-game');
checkConferences();
checkCompletedGames();
checkUpcomingGames();
checkCompletedUpcomingOverlap();

addGameCountWarnings();
addLargeScoreWarnings();
addPooledFcsWarnings();

printResults();
