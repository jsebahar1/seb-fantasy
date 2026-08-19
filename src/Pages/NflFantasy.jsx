import { useEffect, useMemo, useState } from 'react';
import SEO from '../components/SEO';
import { ADP_SOURCES, loadAdpData, loadFantasyProjections } from '../lib/fantasyData';
import { LEAGUE_SIZES } from '../lib/fantasyDraftTargets';
import { SCORING_FORMATS } from '../lib/fantasyScoring';
import { buildLeverageRankings, DRAFT_RELEVANT_ADP_CUTOFF } from '../lib/fantasyLeverage';
import { buildFantasyRankings } from '../lib/fantasyValuation';
import './NflFantasy.css';

// ─── Constants ───────────────────────────────────────────────────────────────

const POSITION_OPTIONS = ['All', 'QB', 'RB', 'WR', 'TE'];
const SCORING_OPTIONS = [
  { value: SCORING_FORMATS.PPR, label: 'PPR' },
  { value: SCORING_FORMATS.HALF_PPR, label: 'Half-PPR' },
  { value: SCORING_FORMATS.STANDARD, label: 'Standard' },
];
const FORMAT_LABELS = {
  [SCORING_FORMATS.PPR]: 'PPR',
  [SCORING_FORMATS.HALF_PPR]: 'Half-PPR',
  [SCORING_FORMATS.STANDARD]: 'Standard',
};
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
const RECEPTION_POINTS_MAP = {
  [SCORING_FORMATS.PPR]: 1,
  [SCORING_FORMATS.HALF_PPR]: 0.5,
  [SCORING_FORMATS.STANDARD]: 0,
};
const STAT_DEFS = [
  { key: 'passingYards',       label: 'Passing Yards',    pts: (v) => v / 25 },
  { key: 'passingTouchdowns',  label: 'Passing TDs',      pts: (v) => v * 4 },
  { key: 'interceptions',      label: 'Interceptions',    pts: (v) => v * -2 },
  { key: 'rushingAttempts',    label: 'Rush Attempts',    pts: null },
  { key: 'rushingYards',       label: 'Rush Yards',       pts: (v) => v / 10 },
  { key: 'rushingTouchdowns',  label: 'Rush TDs',         pts: (v) => v * 6 },
  { key: 'receptions',         label: 'Receptions',       pts: (v, rec) => v * rec },
  { key: 'receivingYards',     label: 'Receiving Yards',  pts: (v) => v / 10 },
  { key: 'receivingTouchdowns',label: 'Receiving TDs',    pts: (v) => v * 6 },
  { key: 'fumblesLost',        label: 'Fumbles Lost',     pts: (v) => v * -2 },
];
const PAGE_SIZE = 12;
const HALF = PAGE_SIZE / 2;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDraftPicks(pickPosition, leagueSize, format) {
  return Array.from({ length: 15 }, (_, i) => {
    const round = i + 1;
    const overallPick = format === 'linear' || round % 2 === 1
      ? (round - 1) * leagueSize + pickPosition
      : round * leagueSize - pickPosition + 1;
    return { round, overallPick };
  });
}

function getValueInfo(value) {
  if (value === null || value === undefined) return { label: 'N/A', tier: 'neutral' };
  if (value >= 10)  return { label: 'Huge Steal',   tier: 'huge-steal' };
  if (value >= 5)   return { label: 'Steal',         tier: 'steal' };
  if (value >= 2)   return { label: 'Slight Steal',  tier: 'slight-steal' };
  if (value >= -2)  return { label: 'At Value',      tier: 'at-value' };
  if (value >= -5)  return { label: 'Slight Reach',  tier: 'slight-reach' };
  if (value >= -10) return { label: 'Reach',         tier: 'reach' };
  return { label: 'Big Reach', tier: 'big-reach' };
}

function getStatBreakdown(player, scoringFormat) {
  const recPts = RECEPTION_POINTS_MAP[scoringFormat] ?? 1;
  return STAT_DEFS
    .filter((d) => (player[d.key] ?? 0) !== 0)
    .map((d) => ({
      key: d.key,
      label: d.label,
      value: player[d.key] ?? 0,
      points: d.pts ? d.pts(player[d.key] ?? 0, recPts) : null,
    }));
}

function compareValues(a, b, key) {
  if (typeof a[key] === 'string') return a[key].localeCompare(b[key]);
  return a[key] - b[key];
}

const fmt = (v) => (v === null || v === undefined ? '—' : v.toFixed(1));
const fmtLev = (v) => (v === null || v === undefined ? '—' : `${v > 0 ? '+' : ''}${v.toFixed(1)}`);
const fmtPts = (v) => (v === null ? '—' : `${v > 0 ? '+' : ''}${v.toFixed(1)}`);

// ─── Sub-components ───────────────────────────────────────────────────────────

function LeverageValue({ value }) {
  const state = value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral';
  return <span className={`nfl-leverage nfl-leverage-${state}`}>{fmtLev(value)}</span>;
}

function ValueBadge({ value }) {
  const { label, tier } = getValueInfo(value);
  return <span className={`nfl-value-badge nfl-value-${tier}`}>{label}</span>;
}

function PlayerModal({ player, scoringFormat, pickContext, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!player) return null;

  const stats = getStatBreakdown(player, scoringFormat);
  const sebLev = pickContext != null ? pickContext - player.sebRank : null;
  const { label: valueLabel, tier: valueTier } = sebLev != null ? getValueInfo(sebLev) : {};

  return (
    <div
      className="nfl-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${player.player} player profile`}
    >
      <div className="nfl-modal" onClick={(e) => e.stopPropagation()}>
        <button className="nfl-modal-close" onClick={onClose} aria-label="Close">×</button>

        <div className="nfl-modal-header">
          <span className="nfl-position nfl-modal-pos">{player.position}</span>
          <div>
            <h2 className="nfl-modal-name">{player.player}</h2>
            <p className="nfl-modal-team">{player.team || 'Free Agent'}</p>
          </div>
        </div>

        <div className="nfl-modal-body">
          <div className="nfl-modal-section">
            <h3>Projected Stats</h3>
            <table className="nfl-modal-stats-table">
              <thead>
                <tr>
                  <th>Stat</th>
                  <th>Projected</th>
                  <th>Points</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((s) => (
                  <tr key={s.key}>
                    <td>{s.label}</td>
                    <td>{s.value.toFixed(1)}</td>
                    <td className={s.points !== null && s.points < 0 ? 'nfl-modal-pts-neg' : 'nfl-modal-pts-pos'}>
                      {s.points !== null ? fmtPts(s.points) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2}>Total ({FORMAT_LABELS[scoringFormat]})</td>
                  <td>{player.projectedFantasyPoints.toFixed(1)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="nfl-modal-section">
            <h3>Model Metrics</h3>
            <div className="nfl-modal-metrics">
              <div>
                <span>SEB Rank</span>
                <strong>#{player.sebRank}</strong>
              </div>
              <div>
                <span>VOR</span>
                <strong>{fmt(player.valueAboveReplacement)}</strong>
              </div>
              <div>
                <span>ADP</span>
                <strong>{player.adp != null ? player.adp.toFixed(1) : '—'}</strong>
              </div>
              <div>
                <span>Leverage</span>
                <strong><LeverageValue value={player.leverage} /></strong>
              </div>
              {sebLev !== null && (
                <>
                  <div>
                    <span>SEB Leverage (Pick #{pickContext})</span>
                    <strong><LeverageValue value={sebLev} /></strong>
                  </div>
                  <div className="nfl-metric-full">
                    <span>Value at Pick #{pickContext}</span>
                    <strong><span className={`nfl-value-badge nfl-value-${valueTier}`}>{valueLabel}</span></strong>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function NflFantasy() {
  const [projectionPlayers, setProjectionPlayers] = useState([]);
  const [adpData, setAdpData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Settings
  const [scoringFormat, setScoringFormat] = useState(SCORING_FORMATS.PPR);
  const [adpSource, setAdpSource] = useState('Consensus');
  const [position, setPosition] = useState('All');
  const [leagueSize, setLeagueSize] = useState(12);
  const [draftRange, setDraftRange] = useState('draftRelevant');
  const [sortKey, setSortKey] = useState('sebRank');
  const [sortDirection, setSortDirection] = useState('asc');

  // Navigation
  const [activeTab, setActiveTab] = useState('draft');
  const [pickPosition, setPickPosition] = useState(1);
  const [selectedRound, setSelectedRound] = useState(1);
  const [draftFormat, setDraftFormat] = useState('snake');
  const [pageOffset, setPageOffset] = useState(0);

  // Player profile modal
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [modalPickContext, setModalPickContext] = useState(null);

  const openPlayer = (player, pickContext = null) => {
    setSelectedPlayer(player);
    setModalPickContext(pickContext);
  };
  const closePlayer = () => { setSelectedPlayer(null); setModalPickContext(null); };

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

  const draftAssistantData = useMemo(() => {
    const empty = { players: [], lineAfterIndex: null, canGoPrev: false, canGoNext: false };
    if (!leverageRankings.length) return empty;

    const pool = leverageRankings
      .filter((p) => p.adp !== null && (position === 'All' || p.position === position))
      .sort((a, b) => a.adp - b.adp);

    if (!pool.length) return empty;

    const insertionPoint = pool.findIndex((p) => p.adp >= selectedOverallPick);
    const splitIdx = insertionPoint === -1 ? pool.length : insertionPoint;
    const rawStart = splitIdx - HALF + pageOffset * PAGE_SIZE;
    const startIdx = Math.max(0, Math.min(rawStart, pool.length - PAGE_SIZE));
    const endIdx = Math.min(pool.length, startIdx + PAGE_SIZE);
    const players = pool.slice(startIdx, endIdx);

    const rawLineAfter = splitIdx - startIdx - 1;
    const lineAfterIndex = pageOffset === 0 && rawLineAfter >= 0 && rawLineAfter < players.length - 1
      ? rawLineAfter : null;

    return { players, lineAfterIndex, canGoPrev: startIdx > 0, canGoNext: endIdx < pool.length };
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

  const TABS = [
    { id: 'draft', label: 'Draft Guide' },
    { id: 'rankings', label: 'Rankings' },
    { id: 'weekly', label: 'Week by Week' },
  ];

  return (
    <main className="page nfl-page">
      <SEO
        title="2026 NFL Fantasy Football Rankings & Draft Tool"
        path="/nfl-fantasy"
        description="Free 2026 NFL fantasy football draft rankings with ADP leverage and Value Above Replacement. Find undervalued players round by round and build a winning team from pick one."
        keywords={['nfl fantasy football rankings 2026', 'fantasy football draft rankings', 'fantasy football draft tool', 'value above replacement fantasy football', 'fantasy football ADP strategy', 'nfl fantasy draft advice', 'undervalued fantasy players']}
      />

      {selectedPlayer && (
        <PlayerModal
          player={selectedPlayer}
          scoringFormat={scoringFormat}
          pickContext={modalPickContext}
          onClose={closePlayer}
        />
      )}

      <div className="container">
        <header className="nfl-intro">
          <p className="eyebrow">NFL Fantasy</p>
          <h1 className="page-title">NFL Fantasy Football Rankings</h1>
          <p className="page-text">
            Set your draft slot, pick a round, and see exactly who is likely to be sitting on
            the board when your turn comes. The SEB model flags where the market is wrong so
            you can walk into draft day with a plan and come out ahead of it.
          </p>
        </header>

        <div className="nfl-tabs" role="tablist">
          {TABS.map((tab) => (
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

        {/* ── Week by Week ── */}
        {!loading && !error && activeTab === 'weekly' && (
          <div className="card nfl-weekly-placeholder">
            <p className="eyebrow">Coming Soon</p>
            <h2>Week by Week Tools</h2>
            <p>
              Start/sit decisions, waiver wire targets, and weekly matchup analysis are on the way.
              Check back once the season kicks off.
            </p>
          </div>
        )}

        {/* ── Draft Guide ── */}
        {!loading && !error && activeTab === 'draft' && (
          <>
            <section aria-labelledby="nfl-targets-title">
              <div className="card nfl-targets-card">
                <div className="section-head nfl-rankings-head">
                  <div>
                    <p className="eyebrow">Draft Assistant</p>
                    <h2 id="nfl-targets-title">Best Targets Around My Pick</h2>
                    <p className="section-subtext">
                      The board around your pick, sorted by ADP. The green line marks where your
                      turn falls. Click any player to pull up their full projection and model breakdown.
                    </p>
                  </div>
                  <span className="nfl-model-badge">Version 1 model</span>
                </div>

                {/* Preset controls */}
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

                {/* Round pills */}
                <div className="nfl-picks-row-wrap">
                  <p className="nfl-picks-label">
                    Your {draftFormat === 'snake' ? 'snake' : 'linear'} draft picks
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

                {/* Position quick-filter */}
                <div className="nfl-pos-filter-row" role="group" aria-label="Filter by position">
                  <span className="nfl-pos-filter-label">Position</span>
                  {POSITION_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      className={`nfl-pos-btn${position === opt ? ' nfl-pos-btn-active' : ''}`}
                      onClick={() => setPosition(opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                {/* Pick context */}
                <div className="nfl-round-context">
                  <strong>Round {safeRound} — Pick #{selectedOverallPick}</strong>
                  {pageOffset !== 0 && (
                    <button className="nfl-back-to-pick" onClick={() => setPageOffset(0)}>
                      Back to pick
                    </button>
                  )}
                </div>

                {/* Value legend */}
                <div className="nfl-value-legend" aria-label="Value scale">
                  <span className="nfl-value-legend-label">Value scale:</span>
                  {[
                    { tier: 'huge-steal', label: 'Huge Steal' },
                    { tier: 'steal', label: 'Steal' },
                    { tier: 'slight-steal', label: 'Slight Steal' },
                    { tier: 'at-value', label: 'At Value' },
                    { tier: 'slight-reach', label: 'Slight Reach' },
                    { tier: 'reach', label: 'Reach' },
                    { tier: 'big-reach', label: 'Big Reach' },
                  ].map(({ tier, label }) => (
                    <span key={tier} className={`nfl-value-badge nfl-value-${tier}`}>{label}</span>
                  ))}
                </div>

                {/* Paging */}
                <div className="nfl-paging">
                  <button className="nfl-page-btn" disabled={!canGoPrev} onClick={() => setPageOffset((o) => o - 1)}>
                    Earlier picks
                  </button>
                  <button className="nfl-page-btn" disabled={!canGoNext} onClick={() => setPageOffset((o) => o + 1)}>
                    Later picks
                  </button>
                </div>

                {/* Board table */}
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
                          <tr
                            key={`${player.player}-${player.position}`}
                            className={lineAfterIndex !== null && idx === lineAfterIndex ? 'nfl-row-before-line' : ''}
                          >
                            <td>
                              <button
                                className="nfl-player-btn"
                                onClick={() => openPlayer(player, selectedOverallPick)}
                              >
                                {player.player}
                              </button>
                            </td>
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
            </section>

            {/* Notes row */}
            <div className="nfl-notes-row">
              <div className="card">
                <h3>How your picks are calculated</h3>
                <p>
                  {draftFormat === 'snake'
                    ? `Snake drafts flip direction each round. Pick ${pickPosition} in round 1 becomes pick ${myPicks[1]?.overallPick} in round 2, then ${myPicks[2]?.overallPick} in round 3. The pills above show all 15 of your picks so you can plan before you sit down.`
                    : `Linear drafts keep your position every round. Pick ${pickPosition} stays pick ${pickPosition} straight through, so your picks are ${myPicks.slice(0, 4).map((p) => p.overallPick).join(', ')} and so on.`}
                </p>
              </div>
              <div className="card">
                <h3>What SEB Leverage means</h3>
                <p>
                  Take your pick number and subtract the player's SEB Rank. At pick 10, a player
                  ranked 8th scores a +2. You grabbed value. The same player at pick 5 would be
                  a -3. You paid up. The Value badge converts that number into plain English.
                </p>
              </div>
              <div className="card">
                <h3>What Leverage (ADP) means</h3>
                <p>
                  This compares the market to the model, regardless of where you pick. A positive
                  number means the market is consistently taking that player later than the SEB model
                  ranks them. Combine it with SEB Leverage to find players you can target a round late.
                </p>
              </div>
            </div>

            {/* How to use */}
            <section className="card info-section nfl-how-to" aria-labelledby="nfl-how-to-title">
              <div className="section-head">
                <div>
                  <h2 id="nfl-how-to-title">How To Use the Draft Guide</h2>
                  <p className="section-subtext">
                    Most fantasy drafts are won or lost in the middle rounds. Early picks are
                    obvious. Late picks are a gamble. Rounds 3 through 7 are where rosters get
                    built or broken, and that is exactly where this tool is designed to help.
                  </p>
                </div>
              </div>
              <div className="info-grid">
                <div className="info-block">
                  <h4>1. Lock in your spot</h4>
                  <p>
                    Enter your pick position, league size, and draft format. The tool maps out every
                    pick you hold across all 15 rounds. Round 4 in a snake looks completely different
                    than round 4 in a linear draft, so get this right first.
                  </p>
                </div>
                <div className="info-block">
                  <h4>2. Click a round, see the board</h4>
                  <p>
                    Pick any round pill to pull up the board around that pick. Six players are going
                    just before your turn, six are going just after, and the green line shows where you
                    sit. Use the buttons to scout further up or down the board.
                  </p>
                </div>
                <div className="info-block">
                  <h4>3. Hunt for the steals</h4>
                  <p>
                    A Steal or Huge Steal means the market is consistently letting that player slide
                    past where the SEB model ranks them. You do not need to nail every pick. Find two
                    or three of those spots and you will come out ahead.
                  </p>
                </div>
                <div className="info-block">
                  <h4>4. Dig into a player</h4>
                  <p>
                    Click any player's name to open their full profile. You will see the stat
                    projections that drive their ranking, the points breakdown by category, and all
                    the model metrics including their value from your exact pick slot.
                  </p>
                </div>
              </div>
            </section>
          </>
        )}

        {/* ── Rankings tab ── */}
        {!loading && !error && activeTab === 'rankings' && (
          <>
            <section className="card nfl-rankings-card" aria-labelledby="nfl-rankings-title">
              <div className="section-head nfl-rankings-head">
                <div>
                  <p className="eyebrow">Full data</p>
                  <h2 id="nfl-rankings-title">Interactive Rankings</h2>
                  <p className="section-subtext">
                    The full model output. {visibleRankings.length} players shown. Click any column
                    header to sort, or click a player's name to see their full projection breakdown.
                  </p>
                </div>
              </div>

              {/* Rankings controls */}
              <div className="nfl-rankings-controls">
                <div className="nfl-controls" aria-label="Rankings settings">
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
                    <span>Draft range</span>
                    <select value={draftRange} onChange={(e) => setDraftRange(e.target.value)}>
                      <option value="draftRelevant">Draft Relevant (ADP up to {DRAFT_RELEVANT_ADP_CUTOFF})</option>
                      <option value="allPlayers">All Players</option>
                    </select>
                  </label>
                </div>
                <div className="nfl-pos-filter-row" role="group" aria-label="Filter by position">
                  <span className="nfl-pos-filter-label">Position</span>
                  {POSITION_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      className={`nfl-pos-btn${position === opt ? ' nfl-pos-btn-active' : ''}`}
                      onClick={() => setPosition(opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
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
                        <td>
                          <button className="nfl-player-btn" onClick={() => openPlayer(player, null)}>
                            {player.player}
                          </button>
                        </td>
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
                <p className="eyebrow">Column guide</p>
                <h2 id="nfl-model-title">What the Numbers Mean</h2>
              </div>
              <div className="nfl-definition-grid">
                <div>
                  <h3>SEB Rank</h3>
                  <p>The model's overall pecking order. Built on how much fantasy value each player adds above the last startable option at their position.</p>
                </div>
                <div>
                  <h3>VOR</h3>
                  <p>Points above the replacement-level player at the same position. The bigger the number, the more that player separates himself from the pack.</p>
                </div>
                <div>
                  <h3>ADP</h3>
                  <p>Average Draft Position from the source you selected. This is what thousands of real drafts are doing with this player right now.</p>
                </div>
                <div>
                  <h3>Leverage</h3>
                  <p>ADP minus SEB Rank. A positive number means the market is drafting this player after where the model ranks them. That is where you find value.</p>
                </div>
                <div>
                  <h3>SEB Leverage</h3>
                  <p>Your pick number minus SEB Rank. This one is personal. It tells you whether that player is good value from your specific draft slot. Only shown on the Draft Guide tab.</p>
                </div>
                <div>
                  <h3>Value</h3>
                  <p>SEB Leverage translated into plain English. Seven tiers from Huge Steal (plus 10 or more) down to Big Reach (minus 10 or worse). Only shown on the Draft Guide tab.</p>
                </div>
              </div>
            </section>

            {/* Credits */}
            <section className="card nfl-credits" aria-labelledby="nfl-credits-title">
              <h3 id="nfl-credits-title">Data Sources</h3>
              <div className="nfl-credits-grid">
                <div>
                  <h4>Fantasy Projections</h4>
                  <p>
                    Player projections come from{' '}
                    <a
                      href="https://www.fantasypros.com/nfl/projections/qb.php?week=draft"
                      target="_blank"
                      rel="noreferrer"
                      className="text-link"
                    >
                      FantasyPros
                    </a>
                    , which aggregates forecasts from dozens of experts to build the consensus
                    numbers behind VOR and SEB Rank. They do this well and deserve the credit.
                    Check out their full projection sheets directly on their site.
                  </p>
                </div>
                <div>
                  <h4>ADP Data</h4>
                  <p>
                    Average Draft Position data comes from Sleeper, ESPN, Yahoo, and Underdog.
                    The Consensus option averages across all of them to give you the clearest
                    picture of where the market is sitting.
                  </p>
                </div>
                <div>
                  <h4>VOR Methodology</h4>
                  <p>
                    Value Above Replacement is calculated against the last startable player at
                    each position in a standard league. The replacement threshold shifts
                    automatically based on the league size you set.
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
