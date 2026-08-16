export const LEAGUE_SIZES = Object.freeze([8, 10, 12, 14, 16]);
export const DRAFT_ROUNDS = Object.freeze(Array.from({ length: 15 }, (_, index) => index + 1));
export const DEFAULT_ROUND_TARGET_COUNT = 18;

/** Returns the expected pick range and soft ADP availability window for a draft round. */
export function getRoundAvailability(leagueSize, round) {
  const roundStart = ((round - 1) * leagueSize) + 1;
  const roundEnd = round * leagueSize;
  const availabilityOverlap = leagueSize / 2;

  return {
    roundStart,
    roundEnd,
    availabilityOverlap,
    minimumADP: Math.max(1, roundStart - availabilityOverlap),
    maximumADP: roundEnd + availabilityOverlap,
  };
}

/**
 * Selects realistic round candidates from already-ranked, ADP-enriched players.
 * The soft window intentionally includes nearby ADPs that can fall or rise in drafts.
 */
export function getRoundTargets(rankings, {
  leagueSize,
  round,
  position = 'All',
  limit = DEFAULT_ROUND_TARGET_COUNT,
}) {
  const availability = getRoundAvailability(leagueSize, round);

  return rankings
    .filter((player) => {
      const matchesPosition = position === 'All' || player.position === position;
      const hasAvailableAdp = player.adp !== null
        && player.adp >= availability.minimumADP
        && player.adp <= availability.maximumADP;
      return matchesPosition && hasAvailableAdp;
    })
    .sort((left, right) => (
      right.leverage - left.leverage
      || left.sebRank - right.sebRank
      || left.player.localeCompare(right.player)
    ))
    .slice(0, limit)
    .map((player) => ({
      ...player,
      availabilityStatus: player.adp < availability.roundStart
        ? 'possibleFall'
        : player.adp > availability.roundEnd
          ? 'earlyReach'
          : 'expected',
    }));
}
