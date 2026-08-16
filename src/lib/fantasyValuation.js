import { calculateFantasyPoints, SCORING_FORMATS } from './fantasyScoring.js';

// Version 1 assumptions. Adjust these roster baselines here as the model evolves.
export const REPLACEMENT_LEVELS = Object.freeze({
  QB: 12,
  RB: 30,
  WR: 36,
  TE: 12,
});

const POSITION_ORDER = Object.freeze(Object.keys(REPLACEMENT_LEVELS));

const sortByProjectedPoints = (left, right) => (
  right.projectedFantasyPoints - left.projectedFantasyPoints
  || left.player.localeCompare(right.player)
);

const sortByValue = (left, right) => (
  right.valueAboveReplacement - left.valueAboveReplacement
  || right.projectedFantasyPoints - left.projectedFantasyPoints
  || left.player.localeCompare(right.player)
);

function createProjectedPlayers(players, scoringFormat) {
  return players
    .filter((player) => POSITION_ORDER.includes(player.position))
    .map((player) => ({
      ...player,
      projectedFantasyPoints: calculateFantasyPoints(player, scoringFormat),
    }));
}

function createReplacementBenchmarks(projectedPlayers) {
  return Object.fromEntries(POSITION_ORDER.map((position) => {
    const rankedAtPosition = projectedPlayers
      .filter((player) => player.position === position)
      .sort(sortByProjectedPoints);
    const replacementRank = REPLACEMENT_LEVELS[position];
    const replacementPlayer = rankedAtPosition[replacementRank - 1];

    if (!replacementPlayer) {
      throw new Error(`Cannot calculate ${position}${replacementRank}: not enough ${position} projections.`);
    }

    return [position, {
      player: replacementPlayer.player,
      rank: replacementRank,
      projectedFantasyPoints: replacementPlayer.projectedFantasyPoints,
    }];
  }));
}

/**
 * Returns the named replacement player and projected point benchmark for each position.
 * This is useful for model review while buildFantasyRankings remains the primary API.
 */
export function getReplacementBenchmarks(players, scoringFormat = SCORING_FORMATS.PPR) {
  return createReplacementBenchmarks(createProjectedPlayers(players, scoringFormat));
}

/**
 * Calculates projected points, Value Above Replacement, and a single SEB rank across
 * all supported fantasy positions for the selected scoring format.
 */
export function buildFantasyRankings(players, scoringFormat = SCORING_FORMATS.PPR) {
  const projectedPlayers = createProjectedPlayers(players, scoringFormat);
  const replacementBenchmarks = createReplacementBenchmarks(projectedPlayers);

  return projectedPlayers
    .map((player) => {
      const replacementFantasyPoints = replacementBenchmarks[player.position].projectedFantasyPoints;

      return {
        ...player,
        replacementFantasyPoints,
        valueAboveReplacement: player.projectedFantasyPoints - replacementFantasyPoints,
      };
    })
    .sort(sortByValue)
    .map((player, index) => ({ ...player, sebRank: index + 1 }));
}
