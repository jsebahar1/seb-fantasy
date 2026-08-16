const PROJECTION_FILES = [
  { path: '/data/qb-projections.csv', position: 'QB' },
  { path: '/data/rb-projections.csv', position: 'RB' },
  { path: '/data/wr-projections.csv', position: 'WR' },
  { path: '/data/te-projections.csv', position: 'TE' },
];

export const ADP_SOURCES = Object.freeze([
  'Sleeper',
  'ESPN',
  'Yahoo!',
  'CBS',
  'Fantrax',
  'FFPC',
  'BB10s',
  'NFFC',
  'Underdog',
  'Consensus',
]);

export const DEFAULT_ADP_SOURCE = 'Consensus';

const emptyStats = () => ({
  passingYards: 0,
  passingTouchdowns: 0,
  interceptions: 0,
  rushingAttempts: 0,
  rushingYards: 0,
  rushingTouchdowns: 0,
  receptions: 0,
  receivingYards: 0,
  receivingTouchdowns: 0,
  fumblesLost: 0,
});

const cleanText = (value) => String(value ?? '').replace(/\u00a0/g, ' ').trim();

const numberOrZero = (value) => {
  const parsed = Number(cleanText(value));
  return Number.isFinite(parsed) ? parsed : 0;
};

const numberOrNull = (value) => {
  const text = cleanText(value);
  if (!text) return null;

  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
};

/**
 * Parses a CSV string into rows. This supports quoted values and escaped quotes,
 * which keeps player names and source fields safe to consume without a dependency.
 */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === ',' && !quoted) {
      row.push(cell);
      cell = '';
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && text[index + 1] === '\n') index += 1;
      row.push(cell);
      if (row.some((value) => cleanText(value))) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += character;
    }
  }

  row.push(cell);
  if (row.some((value) => cleanText(value))) rows.push(row);
  return rows;
}

function createPlayer(row, position) {
  const player = cleanText(row[0]);
  if (!player) return null;

  const normalized = {
    player,
    team: cleanText(row[1]),
    position,
    ...emptyStats(),
  };

  if (position === 'QB') {
    normalized.passingYards = numberOrZero(row[4]);
    normalized.passingTouchdowns = numberOrZero(row[5]);
    normalized.interceptions = numberOrZero(row[6]);
    normalized.rushingAttempts = numberOrZero(row[7]);
    normalized.rushingYards = numberOrZero(row[8]);
    normalized.rushingTouchdowns = numberOrZero(row[9]);
    normalized.fumblesLost = numberOrZero(row[10]);
  }

  if (position === 'RB') {
    normalized.rushingAttempts = numberOrZero(row[2]);
    normalized.rushingYards = numberOrZero(row[3]);
    normalized.rushingTouchdowns = numberOrZero(row[4]);
    normalized.receptions = numberOrZero(row[5]);
    normalized.receivingYards = numberOrZero(row[6]);
    normalized.receivingTouchdowns = numberOrZero(row[7]);
    normalized.fumblesLost = numberOrZero(row[8]);
  }

  if (position === 'WR') {
    normalized.receptions = numberOrZero(row[2]);
    normalized.receivingYards = numberOrZero(row[3]);
    normalized.receivingTouchdowns = numberOrZero(row[4]);
    normalized.rushingAttempts = numberOrZero(row[5]);
    normalized.rushingYards = numberOrZero(row[6]);
    normalized.rushingTouchdowns = numberOrZero(row[7]);
    normalized.fumblesLost = numberOrZero(row[8]);
  }

  if (position === 'TE') {
    normalized.receptions = numberOrZero(row[2]);
    normalized.receivingYards = numberOrZero(row[3]);
    normalized.receivingTouchdowns = numberOrZero(row[4]);
    normalized.fumblesLost = numberOrZero(row[5]);
  }

  return normalized;
}

async function fetchCsv(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Unable to load fantasy data from ${path}.`);
  return response.text();
}

/** Loads and combines all consensus projections into normalized player objects. */
export async function loadFantasyProjections() {
  const projectionGroups = await Promise.all(
    PROJECTION_FILES.map(async ({ path, position }) => {
      const rows = parseCsv(await fetchCsv(path));
      return rows.slice(1).map((row) => createPlayer(row, position)).filter(Boolean);
    }),
  );

  return projectionGroups.flat();
}

/** Loads ADP values while retaining each source for future source selection. */
export async function loadAdpData() {
  const rows = parseCsv(await fetchCsv('/data/adp.csv'));
  const headers = rows[0] ?? [];

  return rows.slice(1).map((row) => {
    const values = Object.fromEntries(headers.map((header, index) => [cleanText(header), row[index]]));
    const player = cleanText(values.Player);
    if (!player) return null;

    const adp = {
      Player: player,
      Position: cleanText(values.Position),
      Team: cleanText(values.Team),
    };

    ADP_SOURCES.forEach((source) => {
      adp[source] = numberOrNull(values[source]);
    });

    return adp;
  }).filter(Boolean);
}

/** Returns an ADP value for the requested source, defaulting to Consensus. */
export function getAdpValue(adpPlayer, source = DEFAULT_ADP_SOURCE) {
  if (!ADP_SOURCES.includes(source)) {
    throw new Error(`Unsupported ADP source: ${source}`);
  }

  return adpPlayer?.[source] ?? null;
}
