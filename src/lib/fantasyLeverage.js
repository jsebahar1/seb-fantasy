import {
  ADP_SOURCES,
  DEFAULT_ADP_SOURCE,
  getAdpValue,
} from './fantasyData.js';

const NAME_SUFFIXES = new Set(['jr', 'sr', 'ii', 'iii', 'iv', 'v']);
const FIRST_NAME_ALIASES = Object.freeze({
  mike: 'michael',
  matt: 'matthew',
  kenny: 'kenneth',
  josh: 'joshua',
  mitch: 'mitchell',
});

// A future UI should use this as its default filter, without removing deeper players.
export const DRAFT_RELEVANT_ADP_CUTOFF = 200;

/**
 * Produces a conservative comparison key for common player-name variations.
 * Apostrophes and periods are removed, hyphens become spaces, and terminal
 * generational suffixes are ignored. The original display name is never changed.
 */
export function normalizePlayerName(name) {
  const tokens = String(name ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[.'’]/g, '')
    .replace(/[-_]/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);

  while (NAME_SUFFIXES.has(tokens.at(-1))) tokens.pop();
  if (FIRST_NAME_ALIASES[tokens[0]]) tokens[0] = FIRST_NAME_ALIASES[tokens[0]];
  return tokens.join(' ');
}

export function createPlayerMatchKey(name, position) {
  const normalizedName = normalizePlayerName(name);
  const normalizedPosition = String(position ?? '').trim().toUpperCase();

  return normalizedName && normalizedPosition
    ? `${normalizedName}|${normalizedPosition}`
    : null;
}

function indexAdpPlayers(adpData) {
  return adpData.reduce((index, player) => {
    const key = createPlayerMatchKey(player.Player, player.Position);
    if (!key) return index;

    const matchingPlayers = index.get(key) ?? [];
    matchingPlayers.push(player);
    index.set(key, matchingPlayers);
    return index;
  }, new Map());
}

/**
 * Matches ranked projection players to ADP with a name-and-position key.
 * Ambiguous duplicate keys are intentionally left unmatched for review.
 */
export function matchRankingsToAdp(rankings, adpData) {
  const adpIndex = indexAdpPlayers(adpData);
  const matchedAdpPlayers = new Set();

  const matches = rankings.map((ranking) => {
    const key = createPlayerMatchKey(ranking.player, ranking.position);
    const candidates = key ? adpIndex.get(key) ?? [] : [];
    const adpPlayer = candidates.length === 1 ? candidates[0] : null;

    if (adpPlayer) matchedAdpPlayers.add(adpPlayer);
    return { ranking, adpPlayer };
  });

  return {
    matches,
    unmatchedRankedPlayers: matches
      .filter(({ adpPlayer }) => !adpPlayer)
      .map(({ ranking }) => ranking),
    unmatchedAdpPlayers: adpData.filter((player) => !matchedAdpPlayers.has(player)),
  };
}

/** Returns both directions of unmatched records without discarding them. */
export function getUnmatchedPlayers(rankings, adpData) {
  const { unmatchedRankedPlayers, unmatchedAdpPlayers } = matchRankingsToAdp(rankings, adpData);
  return { unmatchedRankedPlayers, unmatchedAdpPlayers };
}

/**
 * Adds an ADP value and leverage to the existing SEB rankings. ADP selection does
 * not recalculate projected points, VOR, or sebRank.
 */
export function buildLeverageRankings(rankings, adpData, adpSource = DEFAULT_ADP_SOURCE) {
  if (!ADP_SOURCES.includes(adpSource)) {
    throw new Error(`Unsupported ADP source: ${adpSource}`);
  }

  return matchRankingsToAdp(rankings, adpData).matches.map(({ ranking, adpPlayer }) => {
    const adp = adpPlayer ? getAdpValue(adpPlayer, adpSource) : null;

    return {
      ...ranking,
      adp,
      adpSource,
      leverage: adp === null ? null : adp - ranking.sebRank,
    };
  });
}

/** Sorts by highest positive leverage first, retaining SEB Rank on each player. */
export function sortByLeverage(players) {
  return [...players].sort((left, right) => {
    if (left.leverage === null) return right.leverage === null ? left.sebRank - right.sebRank : 1;
    if (right.leverage === null) return -1;

    return right.leverage - left.leverage || left.sebRank - right.sebRank;
  });
}
