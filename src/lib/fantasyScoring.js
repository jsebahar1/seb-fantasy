export const SCORING_FORMATS = Object.freeze({
  PPR: 'ppr',
  HALF_PPR: 'halfPpr',
  STANDARD: 'standard',
});

const RECEPTION_POINTS = {
  [SCORING_FORMATS.PPR]: 1,
  [SCORING_FORMATS.HALF_PPR]: 0.5,
  [SCORING_FORMATS.STANDARD]: 0,
};

const stat = (player, key) => Number(player?.[key]) || 0;

/** Calculates projected fantasy points from normalized stats, never CSV FPTS. */
export function calculateFantasyPoints(player, scoringFormat = SCORING_FORMATS.PPR) {
  if (!(scoringFormat in RECEPTION_POINTS)) {
    throw new Error(`Unsupported scoring format: ${scoringFormat}`);
  }

  return (
    stat(player, 'passingYards') / 25
    + stat(player, 'passingTouchdowns') * 4
    - stat(player, 'interceptions') * 2
    + stat(player, 'rushingYards') / 10
    + stat(player, 'rushingTouchdowns') * 6
    + stat(player, 'receivingYards') / 10
    + stat(player, 'receivingTouchdowns') * 6
    + stat(player, 'receptions') * RECEPTION_POINTS[scoringFormat]
    - stat(player, 'fumblesLost') * 2
  );
}
