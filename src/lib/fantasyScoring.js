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
export function calculateFantasyPoints(player, scoringFormat = SCORING_FORMATS.PPR, customWeights = null) {
  if (customWeights) {
    return (
      stat(player, 'passingYards')          * (customWeights.passingPtsPerYd    ?? 0.05)
      + stat(player, 'passingTouchdowns')   * (customWeights.passingTdPts        ?? 5)
      + stat(player, 'interceptions')       * (customWeights.interceptionPts      ?? -2)
      + stat(player, 'rushingYards')        * (customWeights.rushingPtsPerYd     ?? 0.1)
      + stat(player, 'rushingTouchdowns')   * (customWeights.rushingTdPts         ?? 6)
      + stat(player, 'receivingYards')      * (customWeights.receivingPtsPerYd   ?? 0.1)
      + stat(player, 'receivingTouchdowns') * (customWeights.receivingTdPts       ?? 6)
      + stat(player, 'receptions')          * (customWeights.receptionPts         ?? 1)
      + stat(player, 'fumblesLost')         * (customWeights.fumblesLostPts       ?? -2)
    );
  }

  if (!(scoringFormat in RECEPTION_POINTS)) {
    throw new Error(`Unsupported scoring format: ${scoringFormat}`);
  }

  return (
    stat(player, 'passingYards') * 0.05
    + stat(player, 'passingTouchdowns') * 5
    - stat(player, 'interceptions') * 2
    + stat(player, 'rushingYards') * 0.1
    + stat(player, 'rushingTouchdowns') * 6
    + stat(player, 'receivingYards') * 0.1
    + stat(player, 'receivingTouchdowns') * 6
    + stat(player, 'receptions') * RECEPTION_POINTS[scoringFormat]
    - stat(player, 'fumblesLost') * 2
  );
}
