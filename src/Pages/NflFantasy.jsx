import { useEffect, useMemo, useState } from 'react';
import SEO from '../components/SEO';
import { ADP_SOURCES, loadAdpData, loadFantasyProjections } from '../lib/fantasyData';
import { LEAGUE_SIZES } from '../lib/fantasyDraftTargets';
import { SCORING_FORMATS } from '../lib/fantasyScoring';
import { buildLeverageRankings, DRAFT_RELEVANT_ADP_CUTOFF } from '../lib/fantasyLeverage';
import { buildFantasyRankings } from '../lib/fantasyValuation';
import './NflFantasy.css';

const POSITION_OPTIONS = ['All', 'QB', 'RB', 'WR', 'TE'];
const SCORING_OPTIONS = [
  { value: SCORING_FORMATS.PPR, label: 'PPR' },
  { value: SCORING_FORMATS.HALF_PPR, label: 'Half-PPR' },
  { value: SCORING_FORMATS.STANDARD, label: 'Standard' },
];
const FULL_TABLE_COLUMNS = [
  { key: 'sebRank', label: 'SEB Rank', align: 'number' },
  { key: 'player', label: 'Player' },
  { key: 'position', label: 'Pos.' },
  { key: 'team', label: 'Team' },
  { key: 'projectedFantasyPoints', label: 'Proj. Pts', align: 'number' },
  { key: 'valueAboveReplacement', label: 'VOR', align: 'number' },
  { key: 'adp', label: 'ADP', align: 'number' },
  { key: 'leverage', label: 'Leverage', align: 'number' },
];

const PAGE_SIZE = 12;
const HALF = PAGE_SIZE / 2;

function getDraftPicks(pickPosition, leagueSize, format) {
  return Array.from({ length: 15 }, (_, i) => {
    const round = i + 1;
    const overallPick = format === 'linear' || round % 2 === 1
      ? (round - 1) * leagueSize + pickPosition
      : round * leagueSize - pickPosition + 1;
    return { round, overallPick };
  });
}

// Value = your pick number - player's SEB rank
// Positive = picking them after the model would → steal
function getValueInfo(value) {
  if (value === null || value === undefined) return { label: 'N/A', tier: 'neutral' };
  if (value >= 10) return { label: 'Huge Steal', tier: 'huge-steal' };
  if (value >= 5)  return { label: 'Steal', tier: 'steal' };
  if (value >= 2)  return { label: 'Slight Steal', tier: 'slight-steal' };
  if (value >= -2) return { label: 'At Value', tier: 'at-value' };
  if (value >= -5) return { label: 'Slight Reach', tier: 'slight-reach' };
  if (value >= -10) return { label: 'Reach', tier: 'reach' };
  return { label: 'Big Reach', tier: 'big-reach' };
}

const fmt = (v) => (v === null || v === undefined ? '—' : v.toFixed(1));
const fmtLev = (v) => (v === null || v === undefined ? '—' : `${v > 0 ? '+' : ''}${v.toFixed(1)}`);

function compareValues(a, b, key) {
  if (typeof a[key] === 'string') return a[key].localeCompare(b[key]);
  return a[key] - b[key];
}

function LeverageValue({ value }) {
  const state = value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral';
  return <span className={`nfl-leverage nfl-leverage-${state}`}>{fmtLev(value)}</span>;
}

function ValueBadge({ value }) {
  const { label, tier } = getValueInfo(value);
  return <span className={`nfl-value-badge nfl-value-${tier}`}>{label}</span>;
}

export default function NflFantasy() {
  const [projectionPlayers, setProjectionPlayers] = useState([]);
  const [adpData, setAdpData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [scoringFormat, setScoringFormat] = useState(SCORING_FORMATS.PPR);
  const [adpSource, setAdpSource] = useState('Consensus');
  const [position, setPosition] = useState('All');
  const [leagueSize, setLeagueSize] = useState(12);
  const [draftRange, setDraftRange] = useState('draftRelevant');
  const [sortKey, setSortKey] = useState('sebRank');
  const [sortDirection, setSortDirection] = useState('asc');

  const [activeTab, setActiveTab] = useState('draft');
  const [pickPosition, setPickPosition] = useState(1);
  const [selectedRound, setSelectedRound] = useState(1);
  const [draftFormat, setDraftFormat] = useState('snake');
  const [pageOffset, setPageOffset] = useState(0);

  // Reset paging whenever the pick context or filters change
  useEffect(() => { setPageOffset(0); }, [selectedRound, position, pickPosition, draftFormat, leagueSize]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [proj, adp] = await Promise.all([loadFantasyProjections(), loadAdpData()]);
        if (!cancelled) { setProjectionPlayers(proj); setAdpData(adp); }
      } catch {
        if (!cancelled) setError('Could not load rankings data. Please refresh and try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const rankings = useMemo(
    () => (projectionPlayers.length ? buildFantasyRankings(projectionPlayers, scoringFormat) : []),
    [projectionPlayers, scoringFormat],
  );
  const leverageRankings = useMemo(
    () => (rankings.length ? buildLeverageRankings(rankings, adpData, adpSource) : []),
    [rankings, adpData, adpSource],
  );

  const myPicks = useMemo(
    () => getDraftPicks(pickPosition, leagueSize, draftFormat),
    [pickPosition, leagueSize, draftFormat],
  );

  const safeRound = Math.min(selectedRound, myPicks.length);
  const selectedOverallPick = myPicks[safeRound - 1]?.overallPick ?? 1;

  // Always 12 players (6 each side), pageable in either direction
  // Line shown only at pageOffset 0, between last ADP-below and first ADP-at-or-above the pick
  const draftAssistantData = useMemo(() => {
    const empty = { players: [], lineAfterIndex: null, canGoPrev: false, canGoNext: false };
    if (!leverageRankings.length) return empty;

    const pool = leverageRankings
      .filter((p) => p.adp !== null && (position === 'All' || p.position === position))
      .sort((a, b) => a.adp - b.adp);

    if (!pool.length) return empty;

    // Where the pick falls in the sorted ADP list
    const insertionPoint = pool.findIndex((p) => p.adp >= selectedOverallPick);
    const splitIdx = insertionPoint === -1 ? pool.length : insertionPoint;

    const rawStart = splitIdx - HALF + pageOffset * PAGE_SIZE;
    const startIdx = Math.max(0, Math.min(rawStart, pool.length - PAGE_SIZE));
    const endIdx = Math.min(pool.length, startIdx + PAGE_SIZE);
    const players = pool.slice(startIdx, endIdx);

    // Line sits after the last player with ADP < pick (only when centered)
    const rawLineAfter = splitIdx - startIdx - 1;
    const lineAfterIndex = pageOffset === 0 && rawLineAfter >= 0 && rawLineAfter < players.length - 1
      ? rawLineAfter
      : null;

    return {
      players,
      lineAfterIndex,
      canGoPrev: startIdx > 0,
      canGoNext: endIdx < pool.length,
    };
  }, [leverageRankings, selectedOverallPick, position, pageOffset]);

  const { players: pickTargets, lineAfterIndex, canGoPrev, canGoNext } = draftAssistantData;

  const visibleRankings = useMemo(() => {
    const filtered = leverageRankings.filter((p) => {
      const posMatch = position === 'All' || p.position === position;
      const relevant = p.adp !== null && p.adp <= DRAFT_RELEVANT_ADP_CUTOFF;
      return posMatch && (draftRange === 'allPlayers' || relevant);
    });
    return [...filtered].sort((a, b) => {
      const aNull = a[sortKey] === null || a[sortKey] === undefined;
      const bNull = b[sortKey] === null || b[sortKey] === undefined;
      if (aNull) return bNull ? 0 : 1;
      if (bNull) return -1;
      const cmp = compareValues(a, b, sortKey);
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [leverageRankings, position, draftRange, sortKey, sortDirection]);

  const toggleSort = (key) => {
    if (key === sortKey) setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDirection(key === 'player' || key === 'position' ? 'asc' : 'desc'); }
  };

  const pickOptions = Array.from({ length: leagueSize }, (_, i) => i + 1);

  return (
    <main className="page nfl-page">
      <SEO
        title="2026 NFL Fantasy Football Rankings & Draft Tool"
        path="/nfl-fantasy"
        description="Free 2026 NFL fantasy football draft rankings with ADP leverage and Value Above Replacement. Find undervalued players round by round and build a winning team from pick one."
        keywords={['nfl fantasy football rankings 2026', 'fantasy football draft rankings', 'fantasy football draft tool', 'value above replacement fantasy football', 'fantasy football ADP strategy', 'nfl fantasy draft advice', 'undervalued fantasy players']}
      />

      <div className="container">
        <header className="nfl-intro">
          <p className="eyebrow">NFL Fantasy</p>
          <h1 className="page-title">NFL Fantasy Football Rankings</h1>
          <p className="page-text">
            Find players the SEB model prefers at every stage of your draft, then use the full
            rankings to dig deeper.
          </p>
        </header>

        {/* Tab nav */}
        <div className="nfl-tabs" role="tablist">
          {[{ id: 'draft', label: 'Draft Guide' }, { id: 'weekly', label: 'Week by Week' }].map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`nfl-tab${activeTab === tab.id ? ' nfl-tab-active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="nfl-state" role="status">
            <span className="nfl-spinner" aria-hidden="true" />
            Loading NFL Fantasy rankings...
          </div>
        )}
        {error && <div className="nfl-state nfl-state-error" role="alert">{error}</div>}

        {/* Week by Week placeholder */}
        {!loading && !error && activeTab === 'weekly' && (
          <div className="card nfl-weekly-placeholder">
            <p className="eyebrow">Coming Soon</p>
            <h2>Week by Week Tools</h2>
            <p>
              Start/sit decisions, waiver wire targets, and weekly matchup analysis are on the way.
              Check back once the season starts.
            </p>
          </div>
        )}

        {/* Draft Guide */}
        {!loading && !error && activeTab === 'draft' && (
          <>
            <section className="grid-main nfl-main-grid" aria-labelledby="nfl-targets-title">
              <div className="card nfl-targets-card">
                <div className="section-head nfl-rankings-head">
                  <div>
                    <p className="eyebrow">Draft Assistant</p>
                    <h2 id="nfl-targets-title">Best Targets Around My Pick</h2>
                    <p className="section-subtext">
                      12 players closest by ADP to your pick, ordered by ADP.
                      Use the arrows to explore earlier or later in the board.
                    </p>
                  </div>
                  <span className="nfl-model-badge">Version 1 model</span>
                </div>

                {/* Controls */}
                <div className="nfl-controls nfl-main-controls" aria-label="Draft settings">
                  <label>
                    <span>Scoring format</span>
                    <select value={scoringFormat} onChange={(e) => setScoringFormat(e.target.value)}>
                      {SCORING_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </label>
                  <label>
                    <span>ADP source</span>
                    <select value={adpSource} onChange={(e) => setAdpSource(e.target.value)}>
                      {ADP_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </label>
                  <label>
                    <span>Position</span>
                    <select value={position} onChange={(e) => setPosition(e.target.value)}>
                      {POSITION_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </label>
                  <label>
                    <span>League size</span>
                    <select value={leagueSize} onChange={(e) => { setLeagueSize(Number(e.target.value)); setPickPosition(1); }}>
                      {LEAGUE_SIZES.map((sz) => <option key={sz} value={sz}>{sz} teams</option>)}
                    </select>
                  </label>
                  <label>
                    <span>My pick position</span>
                    <select value={pickPosition} onChange={(e) => setPickPosition(Number(e.target.value))}>
                      {pickOptions.map((p) => <option key={p} value={p}>Pick {p}</option>)}
                    </select>
                  </label>
                  <label>
                    <span>Draft format</span>
                    <select value={draftFormat} onChange={(e) => setDraftFormat(e.target.value)}>
                      <option value="snake">Snake</option>
                      <option value="linear">Linear (1, 11, 21...)</option>
                    </select>
                  </label>
                </div>

                {/* Snake draft pick row */}
                <div className="nfl-picks-row-wrap">
                  <p className="nfl-picks-label">
                    Your {draftFormat === 'snake' ? 'snake' : 'linear'} draft picks — click a round to view:
                  </p>
                  <div className="nfl-picks-row" role="tablist" aria-label="Draft rounds">
                    {myPicks.map(({ round, overallPick }) => (
                      <button
                        key={round}
                        role="tab"
                        aria-selected={selectedRound === round}
                        className={`nfl-pick-pill${selectedRound === round ? ' nfl-pick-pill-active' : ''}`}
                        onClick={() => setSelectedRound(round)}
                      >
                        <span className="nfl-pill-round">R{round}</span>
                        <span className="nfl-pill-pick">#{overallPick}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Current pick context + paging */}
                <div className="nfl-round-context">
                  <strong>Round {safeRound} — Pick #{selectedOverallPick}</strong>
                  {pageOffset !== 0 && (
                    <button className="nfl-back-to-pick" onClick={() => setPageOffset(0)}>
                      ↩ Back to pick
                    </button>
                  )}
                </div>

                {/* Paging nav */}
                <div className="nfl-paging">
                  <button
                    className="nfl-page-btn"
                    disabled={!canGoPrev}
                    onClick={() => setPageOffset((o) => o - 1)}
                  >
                    ← Earlier picks
                  </button>
                  <button
                    className="nfl-page-btn"
                    disabled={!canGoNext}
                    onClick={() => setPageOffset((o) => o + 1)}
                  >
                    Later picks →
                  </button>
                </div>

                {/* Targets table */}
                <div className="nfl-target-table-scroll">
                  <table className="nfl-table nfl-target-table">
                    <thead>
                      <tr>
                        <th>Player</th>
                        <th>Pos.</th>
                        <th>Team</th>
                        <th className="nfl-number">SEB</th>
                        <th className="nfl-number">ADP</th>
                        <th className="nfl-number">Leverage</th>
                        <th className="nfl-number">SEB Lev.</th>
                        <th>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pickTargets.map((player, idx) => {
                        const sebLev = selectedOverallPick - (player.sebRank ?? selectedOverallPick);
                        return (
                          <tr key={`${player.player}-${player.position}`}
                            className={lineAfterIndex !== null && idx === lineAfterIndex ? 'nfl-row-before-line' : ''}
                          >
                            <td className="nfl-player">{player.player}</td>
                            <td><span className="nfl-position">{player.position}</span></td>
                            <td>{player.team || '—'}</td>
                            <td className="nfl-number nfl-rank">{player.sebRank}</td>
                            <td className="nfl-number">{fmt(player.adp)}</td>
                            <td className="nfl-number"><LeverageValue value={player.leverage} /></td>
                            <td className="nfl-number"><LeverageValue value={sebLev} /></td>
                            <td><ValueBadge value={sebLev} /></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {!pickTargets.length && (
                  <p className="nfl-empty-state">No players match the current filters.</p>
                )}
              </div>

              <aside className="side-stack nfl-support-notes">
                <div className="card">
                  <h3>How picks are calculated</h3>
                  <p>
                    {draftFormat === 'snake'
                      ? `Snake draft: odd rounds go in order, even rounds reverse. Pick ${pickPosition} in round 1 becomes pick ${myPicks[1]?.overallPick} in round 2.`
                      : `Linear draft: your pick position stays the same every round. Pick ${pickPosition} means picks ${myPicks.slice(0, 3).map((p) => p.overallPick).join(', ')}...`}
                  </p>
                </div>
                <div className="card">
                  <h3>SEB Leverage</h3>
                  <p>
                    Your pick number minus the player's SEB Rank. At pick 10, a player ranked
                    8th is a +2 — you get them slightly after where the model thinks they belong.
                    The Value badge translates this number into plain English.
                  </p>
                </div>
                <div className="card">
                  <h3>Leverage (ADP)</h3>
                  <p>
                    ADP minus SEB Rank — the gap between where the market drafts a player and where
                    the model ranks them. Positive means the market is sleeping on them.
                  </p>
                </div>
              </aside>
            </section>

            {/* How to use */}
            <section className="card info-section nfl-how-to" aria-labelledby="nfl-how-to-title">
              <div className="section-head">
                <div>
                  <h2 id="nfl-how-to-title">How To Use the Draft Guide</h2>
                  <p className="section-subtext">A practical approach to building a winning team from your draft slot.</p>
                </div>
              </div>
              <div className="info-grid">
                <div className="info-block">
                  <h4>1. Set your draft slot</h4>
                  <p>
                    Enter your pick position, league size, and draft format. The guide
                    calculates every pick you will have across all 15 rounds.
                  </p>
                </div>
                <div className="info-block">
                  <h4>2. Click a round</h4>
                  <p>
                    Select any round pill to center the board on that pick. You see the 6
                    players with ADP just before your pick and the 6 just after, with a line
                    marking where your pick falls. Use the arrows to explore further up or down.
                  </p>
                </div>
                <div className="info-block">
                  <h4>3. Target steals</h4>
                  <p>
                    Focus on Steal and Huge Steal players. These are players the market is taking
                    later than the SEB model ranks them. That gap is where you build draft edges.
                  </p>
                </div>
                <div className="info-block">
                  <h4>4. Use your judgment</h4>
                  <p>
                    The model is a guide, not a rule. Balance the SEB Leverage signal with your
                    roster needs and what is actually happening in your draft room.
                  </p>
                </div>
              </div>
            </section>

            {/* Full rankings */}
            <section className="card nfl-rankings-card" aria-labelledby="nfl-rankings-title">
              <div className="section-head nfl-rankings-head">
                <div>
                  <p className="eyebrow">Full data</p>
                  <h2 id="nfl-rankings-title">Interactive Rankings</h2>
                  <p className="section-subtext">
                    {visibleRankings.length} players shown. Click any column to sort.
                  </p>
                </div>
              </div>
              <div className="nfl-table-settings">
                <label>
                  <span>Draft range</span>
                  <select value={draftRange} onChange={(e) => setDraftRange(e.target.value)}>
                    <option value="draftRelevant">Draft Relevant (ADP ≤ {DRAFT_RELEVANT_ADP_CUTOFF})</option>
                    <option value="allPlayers">All Players</option>
                  </select>
                </label>
              </div>
              <div className="nfl-table-scroll">
                <table className="nfl-table">
                  <thead>
                    <tr>
                      {FULL_TABLE_COLUMNS.map((col) => (
                        <th
                          key={col.key}
                          className={col.align === 'number' ? 'nfl-number' : undefined}
                          aria-sort={col.key === sortKey ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                        >
                          <button type="button" onClick={() => toggleSort(col.key)}>
                            {col.label}{col.key === sortKey ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : ''}
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRankings.map((player) => (
                      <tr key={`${player.player}-${player.position}`}>
                        <td className="nfl-rank">{player.sebRank}</td>
                        <td className="nfl-player">{player.player}</td>
                        <td><span className="nfl-position">{player.position}</span></td>
                        <td>{player.team || '—'}</td>
                        <td className="nfl-number">{fmt(player.projectedFantasyPoints)}</td>
                        <td className="nfl-number">{fmt(player.valueAboveReplacement)}</td>
                        <td className="nfl-number">{fmt(player.adp)}</td>
                        <td className="nfl-number"><LeverageValue value={player.leverage} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Glossary */}
            <section className="card nfl-model-explainer" aria-labelledby="nfl-model-title">
              <div>
                <p className="eyebrow">Model glossary</p>
                <h2 id="nfl-model-title">What Each Column Means</h2>
              </div>
              <div className="nfl-definition-grid">
                <div>
                  <h3>SEB Rank</h3>
                  <p>Overall player rank based on Value Above Replacement.</p>
                </div>
                <div>
                  <h3>VOR</h3>
                  <p>Projected points above the last startable player at the same position. Higher is better.</p>
                </div>
                <div>
                  <h3>ADP</h3>
                  <p>Average Draft Position from the selected market. Where the public is taking this player.</p>
                </div>
                <div>
                  <h3>Leverage</h3>
                  <p>ADP minus SEB Rank. Positive means the market is sleeping on this player relative to the model.</p>
                </div>
                <div>
                  <h3>SEB Leverage</h3>
                  <p>Your pick number minus SEB Rank. Positive means you are getting them after the model rank — a steal from your slot.</p>
                </div>
                <div>
                  <h3>Value</h3>
                  <p>Plain-English label from SEB Leverage. Huge Steal (+10 or more) through Big Reach (-10 or worse).</p>
                </div>
              </div>
            </section>

            {/* Credits */}
            <section className="card nfl-credits" aria-labelledby="nfl-credits-title">
              <h3 id="nfl-credits-title">Credits and Data Sources</h3>
              <div className="nfl-credits-grid">
                <div>
                  <h4>Fantasy Projections</h4>
                  <p>
                    Player projections are sourced from FantasyPros consensus expert forecasts,
                    aggregated across multiple statistical models to produce the season-long point
                    estimates used in VOR calculations.
                  </p>
                </div>
                <div>
                  <h4>ADP Data</h4>
                  <p>
                    Average Draft Position data is pulled from Sleeper, ESPN, Yahoo, and Underdog.
                    The Consensus option averages across all available sources to reduce platform bias.
                  </p>
                </div>
                <div>
                  <h4>VOR Methodology</h4>
                  <p>
                    Value Above Replacement is calculated relative to the last startable player at
                    each position in a standard league. The replacement threshold adjusts automatically
                    for your selected league size.
                  </p>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
