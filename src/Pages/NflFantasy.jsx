import { useEffect, useMemo, useState } from 'react';
import SEO from '../components/SEO';
import { ADP_SOURCES, loadAdpData, loadFantasyProjections } from '../lib/fantasyData';
import { LEAGUE_SIZES } from '../lib/fantasyDraftTargets';
import { SCORING_FORMATS } from '../lib/fantasyScoring';
import { buildLeverageRankings, DRAFT_RELEVANT_ADP_CUTOFF } from '../lib/fantasyLeverage';
import { buildFantasyRankings } from '../lib/fantasyValuation';
import './NflFantasy.css';

// ─── Constants ────────────────────────────────────────────────────────────────

const POSITION_OPTIONS = ['All', 'QB', 'RB', 'WR', 'TE'];
const SCORING_OPTIONS = [
  { value: SCORING_FORMATS.PPR,      label: 'PPR' },
  { value: SCORING_FORMATS.HALF_PPR, label: 'Half-PPR' },
  { value: SCORING_FORMATS.STANDARD, label: 'Standard' },
];
const FORMAT_LABELS = {
  [SCORING_FORMATS.PPR]:      'PPR',
  [SCORING_FORMATS.HALF_PPR]: 'Half-PPR',
  [SCORING_FORMATS.STANDARD]: 'Standard',
};
const FULL_TABLE_COLUMNS = [
  { key: 'sebRank',                label: 'SEB Rank',  align: 'number' },
  { key: 'player',                 label: 'Player' },
  { key: 'position',               label: 'Pos.' },
  { key: 'team',                   label: 'Team' },
  { key: 'projectedFantasyPoints', label: 'Proj. Pts', align: 'number' },
  { key: 'valueAboveReplacement',  label: 'VOR',       align: 'number' },
  { key: 'adp',                    label: 'ADP',       align: 'number' },
  { key: 'leverage',               label: 'Leverage',  align: 'number' },
];
const RECEPTION_POINTS_MAP = {
  [SCORING_FORMATS.PPR]:      1,
  [SCORING_FORMATS.HALF_PPR]: 0.5,
  [SCORING_FORMATS.STANDARD]: 0,
};

const buildDefaultWeights = (scoringFormat) => ({
  passingPtsPerYd:    0.05,
  passingTdPts:          5,
  interceptionPts:      -2,
  rushingPtsPerYd:     0.1,
  rushingTdPts:          6,
  receivingPtsPerYd:   0.1,
  receivingTdPts:        6,
  receptionPts:        RECEPTION_POINTS_MAP[scoringFormat] ?? 1,
  fumblesLostPts:       -2,
});

// FLEX is split between RB and WR based on format; TE never gets flex; superFlex always goes to QB
const FLEX_WR_FRACTION = {
  [SCORING_FORMATS.PPR]:      0.75,
  [SCORING_FORMATS.HALF_PPR]: 0.50,
  [SCORING_FORMATS.STANDARD]: 0.25,
};

function computeReplacementLevels(leagueSize, rosterSlots, scoringFormat) {
  const wrFrac = FLEX_WR_FRACTION[scoringFormat] ?? 0.75;
  const flexWr = Math.round(rosterSlots.FLEX * wrFrac * leagueSize);
  const flexRb = Math.round(rosterSlots.FLEX * (1 - wrFrac) * leagueSize);
  return {
    QB: Math.round((rosterSlots.QB + (rosterSlots.superFlex ?? 0)) * leagueSize),
    RB: Math.round(rosterSlots.RB * leagueSize) + flexRb,
    WR: Math.round(rosterSlots.WR * leagueSize) + flexWr,
    TE: Math.round(rosterSlots.TE * leagueSize),
  };
}

const DEFAULT_ROSTER_SLOTS = { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, superFlex: 0, benchSpots: 7 };

const PAGE_SIZE = 12;
const HALF      = PAGE_SIZE / 2;

const MAIN_TABS = [
  { id: 'draft',    label: 'Draft Guide' },
  { id: 'rankings', label: 'Rankings' },
  { id: 'weekly',   label: 'Week by Week' },
];
const ADVANCED_TABS = [
  { id: 'scoring',   label: 'Scoring Weights' },
  { id: 'roster',    label: 'Roster & Rounds' },
  { id: 'positions', label: 'Position Weights' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDraftPicks(pickPosition, leagueSize, format, numRounds) {
  return Array.from({ length: numRounds }, (_, i) => {
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

function getStatBreakdown(player, effectiveWeights) {
  const w = effectiveWeights;
  const defs = [
    { key: 'passingYards',        label: 'Passing Yards',   pts: (v) => v * (w.passingPtsPerYd    ?? 0.05) },
    { key: 'passingTouchdowns',   label: 'Passing TDs',     pts: (v) => v * (w.passingTdPts        ?? 5)   },
    { key: 'interceptions',       label: 'Interceptions',   pts: (v) => v * (w.interceptionPts     ?? -2)  },
    { key: 'rushingAttempts',     label: 'Rush Attempts',   pts: null },
    { key: 'rushingYards',        label: 'Rush Yards',      pts: (v) => v * (w.rushingPtsPerYd     ?? 0.1) },
    { key: 'rushingTouchdowns',   label: 'Rush TDs',        pts: (v) => v * (w.rushingTdPts        ?? 6)   },
    { key: 'receptions',          label: 'Receptions',      pts: (v) => v * (w.receptionPts        ?? 1)   },
    { key: 'receivingYards',      label: 'Receiving Yards', pts: (v) => v * (w.receivingPtsPerYd   ?? 0.1) },
    { key: 'receivingTouchdowns', label: 'Receiving TDs',   pts: (v) => v * (w.receivingTdPts      ?? 6)   },
    { key: 'fumblesLost',         label: 'Fumbles Lost',    pts: (v) => v * (w.fumblesLostPts      ?? -2)  },
  ];
  return defs
    .filter((d) => (player[d.key] ?? 0) !== 0)
    .map((d) => ({
      key:    d.key,
      label:  d.label,
      value:  player[d.key] ?? 0,
      points: d.pts ? d.pts(player[d.key] ?? 0) : null,
    }));
}

function compareValues(a, b, key) {
  if (typeof a[key] === 'string') return a[key].localeCompare(b[key]);
  return a[key] - b[key];
}

const fmt    = (v) => (v === null || v === undefined ? '—' : v.toFixed(1));
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

function WeightInput({ label, value, field, onChange, hint, step = 0.5 }) {
  return (
    <div className="nfl-weight-field">
      <label>
        <span className="nfl-weight-label">{label}</span>
        {hint && <span className="nfl-weight-hint">{hint}</span>}
        <input
          type="number"
          step={step}
          value={value}
          onChange={(e) => onChange(field, Number(e.target.value))}
          className="nfl-weight-input"
        />
      </label>
    </div>
  );
}

function RosterInput({ label, value, field, onChange, note }) {
  return (
    <div className="nfl-roster-field">
      <label>
        <span className="nfl-roster-label">{label}</span>
        {note && <span className="nfl-weight-hint">{note}</span>}
        <input
          type="number"
          min="0"
          max="20"
          step="1"
          value={value}
          onChange={(e) => onChange(field, Math.max(0, Number(e.target.value)))}
          className="nfl-weight-input"
        />
      </label>
    </div>
  );
}

function AdvancedSettingsModal({
  onClose,
  scoringFormat,
  leagueSize,
  scoringWeights,          updateScoringWeight,  resetScoringWeights,
  replacementLevels,       updateReplacement,    resetReplacementLevels,
  derivedReplacementLevels,
  posLocked,               setPosLocked,
  rosterSlots,             updateRosterSlot,     resetRosterSlots,
  numRoundsOverride,       setNumRoundsOverride, autoRounds,
}) {
  const [advancedTab, setAdvancedTab] = useState('scoring');

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="nfl-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Advanced Settings">
      <div className="nfl-adv-modal" onClick={(e) => e.stopPropagation()}>

        <div className="nfl-adv-modal-head">
          <h2 className="nfl-adv-modal-title">Advanced Settings</h2>
          <button className="nfl-modal-close nfl-adv-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="nfl-sub-tabs" role="tablist">
          {ADVANCED_TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={advancedTab === t.id}
              className={`nfl-sub-tab${advancedTab === t.id ? ' nfl-sub-tab-active' : ''}`}
              onClick={() => setAdvancedTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="nfl-adv-modal-body">

          {/* ── Scoring Weights ── */}
          {advancedTab === 'scoring' && (
            <>
              <div className="nfl-adv-section-head">
                <p>
                  For yardage stats, enter how many yards equal one point (e.g., 25 means 1 pt per
                  25 passing yards). These are the factual scoring rules for your league.
                </p>
                <div className="nfl-adv-head-actions">
                  <button className="nfl-reset-btn" onClick={resetScoringWeights}>
                    Reset to {FORMAT_LABELS[scoringFormat]} defaults
                  </button>
                </div>
              </div>

              <div className="nfl-weights-sections">
                <div className="nfl-weights-group">
                  <h4>Passing</h4>
                  <div className="nfl-weights-grid">
                    <WeightInput label="Pts per yard" field="passingPtsPerYd" hint="pts per yd" step={0.01} value={scoringWeights.passingPtsPerYd}  onChange={updateScoringWeight} />
                    <WeightInput label="TD points"    field="passingTdPts"    hint="pts per TD" step={0.5}  value={scoringWeights.passingTdPts}      onChange={updateScoringWeight} />
                  </div>
                </div>
                <div className="nfl-weights-group">
                  <h4>Rushing</h4>
                  <div className="nfl-weights-grid">
                    <WeightInput label="Pts per yard" field="rushingPtsPerYd" hint="pts per yd" step={0.01} value={scoringWeights.rushingPtsPerYd}  onChange={updateScoringWeight} />
                    <WeightInput label="TD points"    field="rushingTdPts"    hint="pts per TD" step={0.5}  value={scoringWeights.rushingTdPts}      onChange={updateScoringWeight} />
                  </div>
                </div>
                <div className="nfl-weights-group">
                  <h4>Receiving</h4>
                  <div className="nfl-weights-grid">
                    <WeightInput label="Pts per yard" field="receivingPtsPerYd" hint="pts per yd" step={0.01} value={scoringWeights.receivingPtsPerYd} onChange={updateScoringWeight} />
                    <WeightInput label="TD points"    field="receivingTdPts"    hint="pts per TD" step={0.5}  value={scoringWeights.receivingTdPts}     onChange={updateScoringWeight} />
                    <WeightInput label="Receptions"   field="receptionPts"      hint="pts per rec" step={0.5} value={scoringWeights.receptionPts}       onChange={updateScoringWeight} />
                  </div>
                </div>
                <div className="nfl-weights-group">
                  <h4>Turnovers</h4>
                  <div className="nfl-weights-grid">
                    <WeightInput label="Interceptions" field="interceptionPts" hint="neg = penalty" step={0.5} value={scoringWeights.interceptionPts} onChange={updateScoringWeight} />
                    <WeightInput label="Fumbles lost"  field="fumblesLostPts"  hint="neg = penalty" step={0.5} value={scoringWeights.fumblesLostPts}  onChange={updateScoringWeight} />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── Roster & Rounds ── */}
          {advancedTab === 'roster' && (
            <>
              <div className="nfl-adv-section-head">
                <p>
                  Set your starting lineup requirements and draft length. These settings will feed
                  replacement level calculations once position weight automation is live.
                </p>
                <div className="nfl-adv-head-actions">
                  <button className="nfl-reset-btn" onClick={resetRosterSlots}>Reset to defaults</button>
                </div>
              </div>

              <div className="nfl-weights-group">
                <h4>Starting Lineup</h4>
                <div className="nfl-weights-grid">
                  <RosterInput label="QB starters"      field="QB"        value={rosterSlots.QB}        onChange={updateRosterSlot} />
                  <RosterInput label="RB starters"      field="RB"        value={rosterSlots.RB}        onChange={updateRosterSlot} />
                  <RosterInput label="WR starters"      field="WR"        value={rosterSlots.WR}        onChange={updateRosterSlot} />
                  <RosterInput label="TE starters"      field="TE"        value={rosterSlots.TE}        onChange={updateRosterSlot} />
                  <RosterInput label="FLEX (RB/WR)"     field="FLEX"      value={rosterSlots.FLEX}      onChange={updateRosterSlot} note="RB or WR only" />
                  <RosterInput label="Super Flex (any)" field="superFlex" value={rosterSlots.superFlex} onChange={updateRosterSlot} note="Any position" />
                </div>
              </div>

              <div className="nfl-weights-group">
                <h4>Bench</h4>
                <div className="nfl-weights-grid">
                  <RosterInput label="Bench spots" field="benchSpots" value={rosterSlots.benchSpots} onChange={updateRosterSlot} note="Non-starting roster spots" />
                </div>
              </div>

              {(rosterSlots.QB > 1 || rosterSlots.superFlex > 0) && (
                <div className="nfl-adp-disclaimer">
                  <div className="nfl-adp-disclaimer-icon">!</div>
                  <div className="nfl-adp-disclaimer-text">
                    <strong>ADP &amp; Leverage heads-up</strong>
                    <p>
                      Our ADP data is sourced from standard 1-QB leagues. With{' '}
                      {rosterSlots.QB > 1 && `${rosterSlots.QB} QB starters`}
                      {rosterSlots.QB > 1 && rosterSlots.superFlex > 0 && ' and '}
                      {rosterSlots.superFlex > 0 && 'a Super Flex slot'},
                      the <strong>ADP column will not reflect your league's actual draft board</strong>{' '}
                      and <strong>Leverage (ADP − SEB Rank) loses its meaning</strong>.{' '}
                      <strong>SEB Leverage</strong> (your pick vs. SEB Rank) and{' '}
                      <strong>Value</strong> (steal/reach tier) remain fully useful —
                      they're based on our rankings, not market ADP.
                    </p>
                  </div>
                </div>
              )}

              <div className="nfl-weights-group nfl-rounds-group">
                <h4>Draft Length</h4>
                <div className="nfl-rounds-row">
                  <div className="nfl-roster-field">
                    <label>
                      <span className="nfl-roster-label">Number of rounds</span>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        step="1"
                        value={numRoundsOverride ?? autoRounds}
                        onChange={(e) => setNumRoundsOverride(Math.max(1, Number(e.target.value)))}
                        className="nfl-weight-input"
                      />
                    </label>
                  </div>
                  <div className="nfl-rounds-tip">
                    <strong>Auto: {autoRounds} rounds</strong> (starters + bench).
                    {numRoundsOverride !== null && (
                      <> <button className="nfl-reset-inline-btn" onClick={() => setNumRoundsOverride(null)}>Reset to auto</button></>
                    )}
                    <br />We recommend leaving 2 rounds for kicker &amp; defense since those positions
                    aren't ranked here.
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── Position Weights ── */}
          {advancedTab === 'positions' && (
            <>
              <div className="nfl-pos-lock-msg">
                <p>
                  Replacement thresholds are auto-calculated from your league size and roster settings
                  and drive how VOR and SEB Rank are computed. The values below update live as you
                  adjust your lineup. Most leagues should leave these alone — unlock only if you
                  disagree with our FLEX split assumptions.
                </p>
                <label className="nfl-unlock-check">
                  <input
                    type="checkbox"
                    checked={!posLocked}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setReplacementLevels({ ...derivedReplacementLevels });
                        setPosLocked(false);
                      } else {
                        resetReplacementLevels();
                      }
                    }}
                  />
                  <span>I want to manually override position thresholds (not recommended)</span>
                </label>
              </div>

              <div className={`nfl-weights-group${posLocked ? ' nfl-weights-disabled' : ''}`}>
                <div className="nfl-adv-section-head" style={{ marginBottom: '16px' }}>
                  <h4 style={{ margin: 0 }}>Replacement Rank by Position</h4>
                  {!posLocked && (
                    <button className="nfl-reset-btn" onClick={resetReplacementLevels}>Reset to auto</button>
                  )}
                </div>
                <div className="nfl-weights-grid">
                  {['QB', 'RB', 'WR', 'TE'].map((pos) => (
                    <div key={pos} className="nfl-weight-field">
                      <label>
                        <span className="nfl-weight-label">{pos} replacement rank</span>
                        <span className="nfl-weight-hint">auto: {derivedReplacementLevels[pos]}</span>
                        <input
                          type="number" min="1" max="300" step="1"
                          disabled={posLocked}
                          value={posLocked ? derivedReplacementLevels[pos] : replacementLevels[pos]}
                          onChange={(e) => updateReplacement(pos, Number(e.target.value))}
                          className="nfl-weight-input"
                        />
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="nfl-vorinfo">
                <strong>How this affects rankings:</strong> The threshold for each position is{' '}
                (starters × league size) + FLEX allocation. FLEX is split {' '}
                {scoringFormat === 'ppr' ? '75% WR / 25% RB' : scoringFormat === 'halfPpr' ? '50% WR / 50% RB' : '25% WR / 75% RB'}{' '}
                based on your scoring format. Super Flex always counts toward QB.
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

function PlayerModal({ player, effectiveWeights, scoringFormat, pickContext, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!player) return null;

  const stats  = getStatBreakdown(player, effectiveWeights);
  const sebLev = pickContext != null ? pickContext - player.sebRank : null;
  const { label: valueLabel, tier: valueTier } = sebLev != null ? getValueInfo(sebLev) : {};

  return (
    <div className="nfl-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label={`${player.player} player profile`}>
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
                <tr><th>Stat</th><th>Projected</th><th>Points</th></tr>
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
              <div><span>SEB Rank</span><strong>#{player.sebRank}</strong></div>
              <div><span>VOR</span><strong>{fmt(player.valueAboveReplacement)}</strong></div>
              <div><span>ADP</span><strong>{player.adp != null ? player.adp.toFixed(1) : '—'}</strong></div>
              <div><span>Leverage</span><strong><LeverageValue value={player.leverage} /></strong></div>
              {sebLev !== null && (
                <>
                  <div><span>SEB Leverage (Pick #{pickContext})</span><strong><LeverageValue value={sebLev} /></strong></div>
                  <div className="nfl-metric-full">
                    <span>Value at Pick #{pickContext}</span>
                    <span className={`nfl-value-badge nfl-value-${valueTier}`}>{valueLabel}</span>
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

function CreditsSection() {
  return (
    <section className="card nfl-credits" aria-labelledby="nfl-credits-title">
      <h3 id="nfl-credits-title">Data Sources</h3>
      <div className="nfl-credits-grid">
        <div>
          <h4>Fantasy Projections</h4>
          <p>
            Player projections come from{' '}
            <a href="https://www.fantasypros.com/nfl/projections/qb.php?week=draft" target="_blank" rel="noreferrer" className="text-link">
              FantasyPros
            </a>
            , which aggregates forecasts from dozens of experts into a single consensus number.
            They do this well and deserve the credit.
          </p>
        </div>
        <div>
          <h4>ADP Data</h4>
          <p>
            Average Draft Position data comes from Sleeper, ESPN, Yahoo, and Underdog.
            The Consensus option averages across all four for the clearest market picture.
          </p>
        </div>
        <div>
          <h4>VOR Methodology</h4>
          <p>
            Value Above Replacement is calculated against the last startable player at each position.
            Adjust the threshold in Advanced Settings to match your league's roster rules.
          </p>
        </div>
      </div>
      <div className="nfl-kd-note">
        <div className="nfl-kd-note-icon">K / D</div>
        <div>
          <strong>Kickers and Defenses are not included in this tool.</strong>
          <p>
            Both positions are too volatile to rank meaningfully before draft day. Pick them in
            your final two rounds. FantasyPros has{' '}
            <a href="https://www.fantasypros.com/nfl/projections/k.php?week=draft" target="_blank" rel="noreferrer" className="text-link">
              kicker projections
            </a>
            {' '}and{' '}
            <a href="https://www.fantasypros.com/nfl/projections/dst.php?week=draft" target="_blank" rel="noreferrer" className="text-link">
              defense projections
            </a>
            {' '}on their site when you are ready.
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function NflFantasy() {
  const [projectionPlayers, setProjectionPlayers] = useState([]);
  const [adpData,  setAdpData]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  // Standard settings
  const [scoringFormat, setScoringFormat] = useState(SCORING_FORMATS.PPR);
  const [adpSource,     setAdpSource]     = useState('Consensus');
  const [position,      setPosition]      = useState('All');
  const [leagueSize,    setLeagueSize]    = useState(12);
  const [draftRange,    setDraftRange]    = useState('draftRelevant');
  const [sortKey,       setSortKey]       = useState('sebRank');
  const [sortDirection, setSortDirection] = useState('asc');

  // Navigation
  const [activeTab,     setActiveTab]     = useState('draft');
  const [pickPosition,  setPickPosition]  = useState(1);
  const [selectedRound, setSelectedRound] = useState(1);
  const [draftFormat,   setDraftFormat]   = useState('snake');
  const [pageOffset,    setPageOffset]    = useState(0);

  // Modals
  const [selectedPlayer,  setSelectedPlayer]  = useState(null);
  const [modalPickContext, setModalPickContext] = useState(null);
  const [showAdvanced,    setShowAdvanced]    = useState(false);

  // Advanced settings state
  const [scoringWeights,    setScoringWeights]    = useState(() => buildDefaultWeights(SCORING_FORMATS.PPR));
  const [replacementLevels, setReplacementLevels] = useState({});
  const [rosterSlots,       setRosterSlots]       = useState({ ...DEFAULT_ROSTER_SLOTS });
  const [posLocked,         setPosLocked]         = useState(true);
  const [numRoundsOverride, setNumRoundsOverride] = useState(null);

  // Keep receptionPts in sync with scoring format
  useEffect(() => {
    setScoringWeights((w) => ({ ...w, receptionPts: RECEPTION_POINTS_MAP[scoringFormat] ?? 1 }));
  }, [scoringFormat]);

  const effectiveWeights = scoringWeights;

  // Auto-compute replacement levels from league size + roster + format
  const derivedReplacementLevels = useMemo(
    () => computeReplacementLevels(leagueSize, rosterSlots, scoringFormat),
    [leagueSize, rosterSlots, scoringFormat],
  );
  const effectiveReplacementLevels = posLocked ? derivedReplacementLevels : replacementLevels;

  // Auto-compute draft rounds from starters + bench
  const totalStarters = rosterSlots.QB + rosterSlots.RB + rosterSlots.WR + rosterSlots.TE
    + rosterSlots.FLEX + (rosterSlots.superFlex ?? 0);
  const autoRounds = totalStarters + (rosterSlots.benchSpots ?? 7);
  const numRounds  = numRoundsOverride ?? autoRounds;

  const openPlayer  = (player, pickCtx = null) => { setSelectedPlayer(player); setModalPickContext(pickCtx); };
  const closePlayer = () => { setSelectedPlayer(null); setModalPickContext(null); };

  const updateScoringWeight    = (field, val) => setScoringWeights((w) => ({ ...w, [field]: val }));
  const updateReplacement      = (pos,   val) => setReplacementLevels((r) => ({ ...r, [pos]: val }));
  const updateRosterSlot       = (slot,  val) => setRosterSlots((r) => ({ ...r, [slot]: val }));
  const resetScoringWeights    = () => setScoringWeights(buildDefaultWeights(scoringFormat));
  const resetReplacementLevels = () => setPosLocked(true);
  const resetRosterSlots       = () => { setRosterSlots({ ...DEFAULT_ROSTER_SLOTS }); setNumRoundsOverride(null); };


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
    () => projectionPlayers.length
      ? buildFantasyRankings(projectionPlayers, scoringFormat, scoringWeights, effectiveReplacementLevels)
      : [],
    [projectionPlayers, scoringFormat, scoringWeights, effectiveReplacementLevels],
  );

  const leverageRankings = useMemo(
    () => (rankings.length ? buildLeverageRankings(rankings, adpData, adpSource) : []),
    [rankings, adpData, adpSource],
  );

  const myPicks = useMemo(
    () => getDraftPicks(pickPosition, leagueSize, draftFormat, numRounds),
    [pickPosition, leagueSize, draftFormat, numRounds],
  );

  const safeRound           = Math.min(selectedRound, myPicks.length);
  const selectedOverallPick = myPicks[safeRound - 1]?.overallPick ?? 1;

  const draftAssistantData = useMemo(() => {
    const empty = { players: [], lineAfterIndex: null, canGoPrev: false, canGoNext: false };
    if (!leverageRankings.length) return empty;

    const pool = leverageRankings
      .filter((p) => p.adp !== null && (position === 'All' || p.position === position))
      .sort((a, b) => a.adp - b.adp);
    if (!pool.length) return empty;

    const insertionPoint = pool.findIndex((p) => p.adp >= selectedOverallPick);
    const splitIdx  = insertionPoint === -1 ? pool.length : insertionPoint;
    const rawStart  = splitIdx - HALF + pageOffset * PAGE_SIZE;
    const startIdx  = Math.max(0, Math.min(rawStart, pool.length - PAGE_SIZE));
    const endIdx    = Math.min(pool.length, startIdx + PAGE_SIZE);
    const players   = pool.slice(startIdx, endIdx);

    const rawLineAfter   = splitIdx - startIdx - 1;
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
      const aNull = a[sortKey] == null;
      const bNull = b[sortKey] == null;
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

  const advancedProps = {
    onClose: () => setShowAdvanced(false),
    scoringFormat, leagueSize,
    scoringWeights,          updateScoringWeight,  resetScoringWeights,
    replacementLevels,       updateReplacement,    resetReplacementLevels,
    derivedReplacementLevels,
    posLocked,               setPosLocked,
    rosterSlots,             updateRosterSlot,     resetRosterSlots,
    numRoundsOverride,       setNumRoundsOverride, autoRounds,
  };

  const PosFilter = () => (
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
  );

  return (
    <main className="page nfl-page">
      <SEO
        title="2026 NFL Fantasy Football Rankings & Draft Tool"
        path="/nfl-fantasy"
        description="Free 2026 NFL fantasy football draft rankings with ADP leverage and Value Above Replacement. Find undervalued players round by round and build a winning team from pick one."
        keywords={['nfl fantasy football rankings 2026', 'fantasy football draft rankings', 'fantasy football draft tool', 'value above replacement fantasy football', 'fantasy football ADP strategy', 'nfl fantasy draft advice', 'undervalued fantasy players']}
      />

      {showAdvanced && <AdvancedSettingsModal {...advancedProps} />}

      {selectedPlayer && (
        <PlayerModal
          player={selectedPlayer}
          effectiveWeights={effectiveWeights}
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
          {MAIN_TABS.map((tab) => (
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

        {/* ══ WEEK BY WEEK ══════════════════════════════════════════════════════ */}
        {!loading && !error && activeTab === 'weekly' && (
          <div className="card nfl-weekly-placeholder">
            <p className="eyebrow">Coming Soon</p>
            <h2>Week by Week Tools</h2>
            <p>Start/sit decisions, waiver wire targets, and weekly matchup analysis are on the way. Check back once the season kicks off.</p>
          </div>
        )}

        {/* ══ DRAFT GUIDE ═══════════════════════════════════════════════════════ */}
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
                  <div className="nfl-adv-btn-cell">
                    <button className="nfl-adv-btn" onClick={() => setShowAdvanced(true)}>
                      Advanced Settings
                    </button>
                  </div>
                </div>

                <div className="nfl-picks-row-wrap">
                  <p className="nfl-picks-label">Your {draftFormat === 'snake' ? 'snake' : 'linear'} draft picks</p>
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

                <PosFilter />

                <div className="nfl-round-context">
                  <strong>Round {safeRound} — Pick #{selectedOverallPick}</strong>
                  {pageOffset !== 0 && (
                    <button className="nfl-back-to-pick" onClick={() => setPageOffset(0)}>Back to pick</button>
                  )}
                </div>

                <div className="nfl-value-legend" aria-label="Value scale">
                  <span className="nfl-value-legend-label">Value scale:</span>
                  {[
                    { tier: 'huge-steal',   label: 'Huge Steal' },
                    { tier: 'steal',        label: 'Steal' },
                    { tier: 'slight-steal', label: 'Slight Steal' },
                    { tier: 'at-value',     label: 'At Value' },
                    { tier: 'slight-reach', label: 'Slight Reach' },
                    { tier: 'reach',        label: 'Reach' },
                    { tier: 'big-reach',    label: 'Big Reach' },
                  ].map(({ tier, label }) => (
                    <span key={tier} className={`nfl-value-badge nfl-value-${tier}`}>{label}</span>
                  ))}
                </div>

                <div className="nfl-paging">
                  <button className="nfl-page-btn" disabled={!canGoPrev} onClick={() => setPageOffset((o) => o - 1)}>Earlier picks</button>
                  <button className="nfl-page-btn" disabled={!canGoNext} onClick={() => setPageOffset((o) => o + 1)}>Later picks</button>
                </div>

                <div className="nfl-target-table-scroll">
                  <table className="nfl-table nfl-target-table">
                    <thead>
                      <tr>
                        <th>Player</th><th>Pos.</th><th>Team</th>
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
                              <button className="nfl-player-btn" onClick={() => openPlayer(player, selectedOverallPick)}>
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
                {!pickTargets.length && <p className="nfl-empty-state">No players match the current filters.</p>}
              </div>
            </section>

            <div className="nfl-notes-row">
              <div className="card">
                <h3>How your picks are calculated</h3>
                <p>
                  {draftFormat === 'snake'
                    ? `Snake drafts flip direction each round. Pick ${pickPosition} in round 1 becomes pick ${myPicks[1]?.overallPick ?? '—'} in round 2. The pills above show all ${numRounds} of your picks.`
                    : `Linear drafts keep your position every round. Pick ${pickPosition} stays pick ${pickPosition} straight through, so your picks are ${myPicks.slice(0, 4).map((p) => p.overallPick).join(', ')} and so on.`}
                </p>
              </div>
              <div className="card">
                <h3>What SEB Leverage means</h3>
                <p>
                  Take your pick number and subtract the player's SEB Rank. At pick 10, a player
                  ranked 8th scores a +2. You grabbed value. The same player at pick 5 is a -3.
                  The Value badge converts that number into plain English.
                </p>
              </div>
              <div className="card">
                <h3>What Leverage (ADP) means</h3>
                <p>
                  Compares the market to the model regardless of where you pick. A positive
                  number means the market is consistently taking that player later than SEB ranks them.
                  Combine it with SEB Leverage to target players a round late.
                </p>
              </div>
            </div>

            <section className="card info-section nfl-how-to" aria-labelledby="nfl-how-to-title">
              <div className="section-head">
                <div>
                  <h2 id="nfl-how-to-title">How To Use the Draft Guide</h2>
                  <p className="section-subtext">
                    Most fantasy drafts are won or lost in the middle rounds. Early picks are
                    obvious. Late picks are a gamble. Rounds 3 through 7 are where rosters get
                    built or broken.
                  </p>
                </div>
              </div>
              <div className="info-grid">
                <div className="info-block">
                  <h4>1. Lock in your spot</h4>
                  <p>Enter your pick position, league size, and draft format. The tool maps out every pick you hold across all {numRounds} rounds.</p>
                </div>
                <div className="info-block">
                  <h4>2. Click a round, see the board</h4>
                  <p>Pick any round pill to pull up the board around that pick. Six players go before your turn, six after, and the green line shows where you sit.</p>
                </div>
                <div className="info-block">
                  <h4>3. Hunt for the steals</h4>
                  <p>A Steal or Huge Steal means the market is consistently letting that player slide past where the model ranks them. Find two or three and you come out ahead.</p>
                </div>
                <div className="info-block">
                  <h4>4. Dig into a player</h4>
                  <p>Click any player's name to open their full profile — stat projections, points breakdown, and all model metrics including value from your exact pick slot.</p>
                </div>
              </div>
            </section>

            <CreditsSection />
          </>
        )}

        {/* ══ RANKINGS ══════════════════════════════════════════════════════════ */}
        {!loading && !error && activeTab === 'rankings' && (
          <>
            <section className="card nfl-rankings-card" aria-labelledby="nfl-rankings-title">
              <div className="section-head nfl-rankings-head">
                <div>
                  <p className="eyebrow">Full data</p>
                  <h2 id="nfl-rankings-title">Interactive Rankings</h2>
                  <p className="section-subtext">
                    {visibleRankings.length} players shown. Click any column header to sort,
                    or click a player's name to see their full projection breakdown.
                  </p>
                </div>
              </div>

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
                  <div className="nfl-adv-btn-cell">
                    <button className="nfl-adv-btn" onClick={() => setShowAdvanced(true)}>
                      Advanced Settings
                    </button>
                  </div>
                </div>
                <PosFilter />
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

            <section className="card nfl-model-explainer" aria-labelledby="nfl-model-title">
              <div>
                <p className="eyebrow">Column guide</p>
                <h2 id="nfl-model-title">What the Numbers Mean</h2>
              </div>
              <div className="nfl-definition-grid">
                <div><h3>SEB Rank</h3><p>The model's overall pecking order, built on how much fantasy value each player adds above the last startable option at their position.</p></div>
                <div><h3>VOR</h3><p>Points above the replacement-level player at the same position. The bigger the number, the more that player separates himself from the pack.</p></div>
                <div><h3>ADP</h3><p>Average Draft Position from the source you selected. This is what thousands of real drafts are doing with this player right now.</p></div>
                <div><h3>Leverage</h3><p>ADP minus SEB Rank. Positive means the market is drafting this player after where the model ranks them. That is where you find value.</p></div>
                <div><h3>SEB Leverage</h3><p>Your pick number minus SEB Rank. Tells you whether that player is good value from your specific draft slot. Draft Guide tab only.</p></div>
                <div><h3>Value</h3><p>SEB Leverage in plain English. Seven tiers from Huge Steal (plus 10 or more) down to Big Reach (minus 10 or worse). Draft Guide tab only.</p></div>
              </div>
            </section>

            <CreditsSection />
          </>
        )}
      </div>
    </main>
  );
}
