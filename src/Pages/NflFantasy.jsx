import React, { useEffect, useMemo, useRef, useState } from 'react';
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
const BASE_TABLE_COLUMNS = [
  { key: 'sebRank',                label: 'SEB Rank',  align: 'number' },
  { key: 'player',                 label: 'Player' },
  { key: 'position',               label: 'Pos.' },
  { key: 'team',                   label: 'Team' },
  { key: 'projectedFantasyPoints', label: 'Proj. Pts', align: 'number' },
  { key: 'adp',                    label: 'ADP',       align: 'number' },
];

const DEFAULT_POSITION_WEIGHTS = { QB: 0.45, RB: 0.9, WR: 1.0, TE: 1.1 };
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

// FLEX is split 75% WR / 25% RB (only 1-2 RBs get real opportunity per game); superFlex always goes to QB
function computeReplacementLevels(leagueSize, rosterSlots) {
  const flexWr = Math.round(rosterSlots.FLEX * 0.75 * leagueSize);
  const flexRb = Math.round(rosterSlots.FLEX * 0.25 * leagueSize);
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
  replacementLevels,       updateReplacement,    resetReplacementLevels, unlockReplacementLevels,
  derivedReplacementLevels,
  posLocked,               setPosLocked,
  positionWeights,         updatePositionWeight, resetPositionWeights,
  effectivePositionWeights, qbIsElevated,
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
                  <RosterInput label="FLEX (RB/WR/TE)"     field="FLEX"      value={rosterSlots.FLEX}      onChange={updateRosterSlot}/>
                  <RosterInput label="Super Flex (any)" field="superFlex" value={rosterSlots.superFlex} onChange={updateRosterSlot} />
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
                      the <strong>ADP column will not reflect your league's actual draft board</strong>.{' '}
                      <strong>SEB Leverage</strong> (your pick vs. SEB Rank) and{' '}
                      <strong>Value</strong> (steal/reach tier) remain fully useful
                      because they are based on our rankings, not market ADP.
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
                  adjust your lineup. Most leagues should leave these alone. Unlock only if you
                  disagree with our FLEX split assumptions.
                </p>
                <label className="nfl-unlock-check">
                  <input
                    type="checkbox"
                    checked={!posLocked}
                    onChange={(e) => {
                      if (e.target.checked) unlockReplacementLevels();
                      else resetReplacementLevels();
                    }}
                  />
                  <span>I want to manually override position thresholds (not recommended)</span>
                </label>
              </div>

              <div className="nfl-weights-group">
                <div className="nfl-adv-section-head" style={{ marginBottom: '16px' }}>
                  <h4 style={{ margin: 0 }}>Projected Value Weights</h4>
                  <button className="nfl-reset-btn" onClick={resetPositionWeights}>Reset to defaults</button>
                </div>
                <div className="nfl-weights-grid">
                  <WeightInput label="QB weight" field="QB" hint={qbIsElevated ? `elevated to ${effectivePositionWeights.QB} (multi-QB/flex)` : 'base'} step={0.05} value={positionWeights.QB} onChange={updatePositionWeight} />
                  <WeightInput label="RB weight" field="RB" hint="multiplier" step={0.05} value={positionWeights.RB} onChange={updatePositionWeight} />
                  <WeightInput label="WR weight" field="WR" hint="multiplier" step={0.05} value={positionWeights.WR} onChange={updatePositionWeight} />
                  <WeightInput label="TE weight" field="TE" hint="multiplier" step={0.05} value={positionWeights.TE} onChange={updatePositionWeight} />
                </div>
                <p className="nfl-vorinfo" style={{ marginTop: '12px' }}>
                  Projected Value = weight × projected points. QB weight auto-elevates to 0.9
                  when you have multiple QB starters or a Super Flex slot.
                </p>
              </div>

              <div className={`nfl-weights-group${posLocked ? ' nfl-weights-disabled' : ''}`}>
                <div className="nfl-adv-section-head" style={{ marginBottom: '16px' }}>
                  <h4 style={{ margin: 0 }}>VOR Replacement Rank by Position</h4>
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
                <strong>How this affects rankings:</strong> Each threshold is (starters × league size).
                FLEX is split 75% WR / 25% RB. Only 1-2 RBs get real opportunity per game, so WR
                depth matters more. Super Flex always counts toward QB.
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

function PlayerModal({ player, effectiveWeights, scoringFormat, pickContext, positionWeights, onClose }) {
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
              <div><span>Proj. Pts</span><strong>{fmt(player.projectedFantasyPoints)}</strong></div>
              <div><span>Projected Value</span><strong>{positionWeights[player.position] != null ? fmt(positionWeights[player.position] * player.projectedFantasyPoints) : '—'}</strong></div>
              <div><span>VOR</span><strong>{fmt(player.valueAboveReplacement)}</strong></div>
              <div><span>ADP</span><strong>{player.adp != null ? player.adp.toFixed(1) : '—'}</strong></div>
              <div><span>Leverage (vs market)</span><strong><LeverageValue value={player.leverage} /></strong></div>
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

function ColumnGuide() {
  return (
    <section className="card nfl-model-explainer" aria-labelledby="nfl-model-title">
      <div>
        <p className="eyebrow">Column guide</p>
        <h2 id="nfl-model-title">What the Numbers Mean</h2>
      </div>
      <div className="nfl-definition-grid">
        <div>
          <h3>SEB Rank</h3>
          <p>The model's overall player order. Built on Value Above Replacement. The top-ranked player at each position is the one who pulls the farthest ahead of the last startable option at that spot.</p>
          <details className="nfl-learn-more">
            <summary>Learn more</summary>
            <p>All positions are ranked together by VOR. The player with the highest VOR gets SEB Rank 1 regardless of position. In Weighted Positions mode, VOR is replaced by Projected Value and the order shifts to reflect positional scarcity.</p>
          </details>
        </div>
        <div>
          <h3>Proj. Pts</h3>
          <p>The consensus projected fantasy points for the season, pulled from FantasyPros. This number aggregates forecasts from dozens of analysts into one figure so no single hot take throws off the model.</p>
          <details className="nfl-learn-more">
            <summary>Learn more</summary>
            <p><strong>Formula:</strong> Proj. Pts = (passing yards x 0.05) + (passing TD x 5) + (interceptions x -2) + (rushing yards x 0.1) + (rushing TD x 6) + (receiving yards x 0.1) + (receiving TD x 6) + (receptions x scoring format points) + (fumbles lost x -2).</p>
            <p>Standard defaults: 0.05 pts per passing yard, 0.1 pts per rushing or receiving yard, 5 pts per passing TD, 6 pts per rushing or receiving TD. Receptions add 1 pt (PPR), 0.5 pt (half PPR), or 0 (standard). Adjust all weights in Advanced Settings under Scoring Weights.</p>
          </details>
        </div>
        <div>
          <h3>VOR</h3>
          <p>Value Above Replacement. Points above the last expected starter at the same position. The bigger the number, the more that player separates himself from the pack.</p>
          <details className="nfl-learn-more">
            <summary>Learn more</summary>
            <p><strong>Formula:</strong> VOR = player projected points minus replacement player projected points.</p>
            <p>The replacement threshold scales with your league: QB threshold = (QB starters + SuperFlex) x league size, RB = (RB starters x league size) + 25% of FLEX spots, WR = (WR starters x league size) + 75% of FLEX spots, TE = TE starters x league size. Adjust all thresholds in Advanced Settings.</p>
          </details>
        </div>
        <div>
          <h3>Projected Value</h3>
          <p>Projected points multiplied by a position weight that reflects real lineup scarcity. Shown when you switch to Weighted Positions mode. Higher weight means that position is harder to replace on your roster.</p>
          <details className="nfl-learn-more">
            <summary>Learn more</summary>
            <p><strong>Formula:</strong> Projected Value = projected points x position weight.</p>
            <p>Default weights: QB 0.45, RB 0.9, WR 1.0, TE 1.1. QB weight automatically rises to 0.9 when your league uses multi-QB or SuperFlex. You can adjust all weights in Advanced Settings under Position Weights.</p>
          </details>
        </div>
        <div>
          <h3>ADP</h3>
          <p>Average Draft Position from your selected source. This is the actual consensus of thousands of real drafts happening right now, not a projection.</p>
          <details className="nfl-learn-more">
            <summary>Learn more</summary>
            <p>Sources: Sleeper, ESPN, Yahoo, and Underdog. The Consensus option averages across all four. Use Consensus unless your league runs on a specific platform where ADP behavior differs from the broader market.</p>
          </details>
        </div>
        <div>
          <h3>Leverage</h3>
          <p>ADP minus SEB Rank. Positive means the market is letting this player fall later than the model rates them. That gap is where you find value. Rankings tab only.</p>
          <details className="nfl-learn-more">
            <summary>Learn more</summary>
            <p><strong>Formula:</strong> Leverage = ADP minus SEB Rank.</p>
            <p>A Leverage of +10 means real drafters are taking this player 10 spots after where the model says they belong. A negative Leverage means the market is already ahead of the model on this player. Sort by Leverage descending to find the biggest market inefficiencies before your draft.</p>
          </details>
        </div>
        <div>
          <h3>SEB Leverage</h3>
          <p>Your pick number minus SEB Rank. Tells you whether a player is good value from your exact draft slot. Positive is a steal. Negative is a reach. Draft Guide tab only.</p>
          <details className="nfl-learn-more">
            <summary>Learn more</summary>
            <p><strong>Formula:</strong> SEB Leverage = your overall pick number minus player SEB Rank.</p>
            <p>At pick 24, a player ranked 18th gives you a SEB Leverage of +6. At pick 12, that same player is a -6. The Value badge translates SEB Leverage into seven plain-English tiers so you can read the board fast on draft day.</p>
          </details>
        </div>
        <div>
          <h3>Value</h3>
          <p>SEB Leverage converted into plain English. Seven tiers: Huge Steal (+10 or better), Steal (+5 to +9), Slight Steal (+1 to +4), At Value (0), Slight Reach (-1 to -4), Reach (-5 to -9), Big Reach (-10 or worse). Draft Guide tab only.</p>
        </div>
      </div>
    </section>
  );
}

function CreditsSection() {
  return (
    <section className="card nfl-credits" aria-labelledby="nfl-credits-title">
      <h3 id="nfl-credits-title">Data Sources</h3>
      <div className="nfl-credits-grid">
        <div>
          <h4>Player Projections</h4>
          <p>
            Consensus season projections from <a href="https://www.fantasypros.com/nfl/projections/qb.php?week=draft" target="_blank" rel="noreferrer" className="text-link">FantasyPros</a>, aggregated across dozens of analysts. No single hot take skews the numbers.
          </p>
        </div>
        <div>
          <h4>ADP Data</h4>
          <p>
            Draft position data sourced from <a href="https://fantasysixpack.net/fantasy-football-adp/" target="_blank" rel="noreferrer" className="text-link">Fantasy Six Pack</a>, covering Sleeper, ESPN, Yahoo, and Underdog. The Consensus option averages all four.
          </p>
        </div>
      </div>
      <div className="nfl-kd-note">
        <div className="nfl-kd-note-icon">K / D</div>
        <div>
          <strong>Kickers and Defenses are not ranked here.</strong>
          <p>
            Both are too unpredictable to sort before draft day. Save them for your last two rounds and use the late-round runs as a rough guide. FantasyPros has <a href="https://www.fantasypros.com/nfl/projections/k.php?week=draft" target="_blank" rel="noreferrer" className="text-link">kicker projections</a> and <a href="https://www.fantasypros.com/nfl/projections/dst.php?week=draft" target="_blank" rel="noreferrer" className="text-link">defense projections</a> on their site when you are ready.
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
  const [rankingMode,       setRankingMode]       = useState('vor');
  const [positionWeights,   setPositionWeights]   = useState({ ...DEFAULT_POSITION_WEIGHTS });

  // Keep receptionPts in sync with scoring format
  useEffect(() => {
    setScoringWeights((w) => ({ ...w, receptionPts: RECEPTION_POINTS_MAP[scoringFormat] ?? 1 }));
  }, [scoringFormat]);

  const effectiveWeights = scoringWeights;

  // Auto-compute replacement levels from league size + roster + format
  const derivedReplacementLevels = useMemo(
    () => computeReplacementLevels(leagueSize, rosterSlots),
    [leagueSize, rosterSlots],
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
  const unlockReplacementLevels = () => { setReplacementLevels({ ...derivedReplacementLevels }); setPosLocked(false); };
  const resetRosterSlots       = () => { setRosterSlots({ ...DEFAULT_ROSTER_SLOTS }); setNumRoundsOverride(null); };

  const qbIsElevated = rosterSlots.QB > 1 || rosterSlots.superFlex > 0;
  const effectivePositionWeights = useMemo(() => ({
    ...positionWeights,
    QB: qbIsElevated ? 0.9 : positionWeights.QB,
  }), [positionWeights, qbIsElevated]);

  const updatePositionWeight  = (pos, val) => setPositionWeights((w) => ({ ...w, [pos]: val }));
  const resetPositionWeights  = () => setPositionWeights({ ...DEFAULT_POSITION_WEIGHTS });


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

  // Re-rank by weight × projected pts when in weighted mode; sebRank and leverage update accordingly
  const weightedRankings = useMemo(
    () => rankings.length
      ? [...rankings]
          .map((p) => ({ ...p, projectedValue: (effectivePositionWeights[p.position] ?? 1) * p.projectedFantasyPoints }))
          .sort((a, b) => b.projectedValue - a.projectedValue || b.projectedFantasyPoints - a.projectedFantasyPoints || a.player.localeCompare(b.player))
          .map((p, i) => ({ ...p, sebRank: i + 1 }))
      : [],
    [rankings, effectivePositionWeights],
  );

  const activeRankings = rankingMode === 'weighted' ? weightedRankings : rankings;

  const leverageRankings = useMemo(
    () => (activeRankings.length ? buildLeverageRankings(activeRankings, adpData, adpSource) : []),
    [activeRankings, adpData, adpSource],
  );

  const displayRankings = useMemo(
    () => leverageRankings.map((p) => ({
      ...p,
      projectedValue: (effectivePositionWeights[p.position] ?? 1) * p.projectedFantasyPoints,
    })),
    [leverageRankings, effectivePositionWeights],
  );

  const myPicks = useMemo(
    () => getDraftPicks(pickPosition, leagueSize, draftFormat, numRounds),
    [pickPosition, leagueSize, draftFormat, numRounds],
  );

  const safeRound           = Math.min(selectedRound, myPicks.length);
  const selectedOverallPick = myPicks[safeRound - 1]?.overallPick ?? 1;

  const draftAssistantData = useMemo(() => {
    const empty = { players: [], lineAfterIndex: null };
    if (!displayRankings.length) return empty;

    const players = displayRankings
      .filter((p) => p.adp !== null && (position === 'All' || p.position === position))
      .sort((a, b) => a.adp - b.adp);
    if (!players.length) return empty;

    const insertionPoint = players.findIndex((p) => p.adp >= selectedOverallPick);
    const splitIdx = insertionPoint === -1 ? players.length : insertionPoint;
    const lineAfterIndex = splitIdx > 0 && splitIdx < players.length ? splitIdx - 1 : null;

    return { players, lineAfterIndex };
  }, [displayRankings, selectedOverallPick, position]);

  const { players: pickTargets, lineAfterIndex } = draftAssistantData;

  const visibleRankings = useMemo(() => {
    const filtered = displayRankings.filter((p) => {
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
  }, [displayRankings, position, draftRange, sortKey, sortDirection]);

  const toggleSort = (key) => {
    if (key === sortKey) setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDirection(key === 'player' || key === 'position' ? 'asc' : 'desc'); }
  };

  const pickOptions = Array.from({ length: leagueSize }, (_, i) => i + 1);

  const tableScrollRef = useRef(null);
  const pickLineRef    = useRef(null);

  useEffect(() => {
    const container = tableScrollRef.current;
    const line      = pickLineRef.current;
    if (!container || !line) return;
    const offset = line.offsetTop - container.offsetTop - Math.floor(container.clientHeight * 0.35);
    container.scrollTop = Math.max(0, offset);
  }, [selectedRound, position]);

  const advancedProps = {
    onClose: () => setShowAdvanced(false),
    scoringFormat, leagueSize,
    scoringWeights,          updateScoringWeight,      resetScoringWeights,
    replacementLevels,       updateReplacement,        resetReplacementLevels, unlockReplacementLevels,
    derivedReplacementLevels,
    posLocked,               setPosLocked,
    positionWeights,         updatePositionWeight,     resetPositionWeights,
    effectivePositionWeights, qbIsElevated,
    rosterSlots,             updateRosterSlot,         resetRosterSlots,
    numRoundsOverride,       setNumRoundsOverride,     autoRounds,
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
          positionWeights={positionWeights}
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
            <p>Start/sit decisions, waiver wire targets, and weekly matchup analysis are coming once the season kicks off. The same model that powers your draft will tell you who to start and who to drop every week.</p>
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
                    <h2 id="nfl-targets-title">Best Targets Around Your Pick</h2>
                    <p className="section-subtext">
                      The board around your pick, sorted by ADP. The green line marks your turn.
                      Use SEB Leverage to find steals before you land on the clock.
                      Click any player to pull up their full projection and model breakdown.
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
                <div className="nfl-mode-toggle-row">
                  <span className="nfl-mode-toggle-label">Value metric</span>
                  <div className="nfl-mode-toggle">
                    <button className={`nfl-mode-btn${rankingMode === 'vor' ? ' nfl-mode-btn-active' : ''}`} onClick={() => setRankingMode('vor')}>
                      Value over Replacement
                      <span className="nfl-tip-anchor" onClick={(e) => e.stopPropagation()}>?<span className="nfl-tip">Ranks players by how many points they project above the last expected starter at their position. The default mode and the most reliable signal for overall draft value.</span></span>
                    </button>
                    <button className={`nfl-mode-btn${rankingMode === 'weighted' ? ' nfl-mode-btn-active' : ''}`} onClick={() => setRankingMode('weighted')}>
                      Weighted Positions
                      <span className="nfl-tip-anchor" onClick={(e) => e.stopPropagation()}>?<span className="nfl-tip">Re-ranks players by projected points multiplied by a position scarcity weight (TE 1.1, WR 1.0, RB 0.9, QB 0.45). Adjust weights in Advanced Settings.</span></span>
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
                  <strong>Round {safeRound}, Pick #{selectedOverallPick}</strong>
                  <button
                    className="nfl-page-btn nfl-next-pick-btn"
                    disabled={safeRound >= myPicks.length}
                    onClick={() => setSelectedRound((r) => Math.min(r + 1, myPicks.length))}
                  >
                    Next pick →
                  </button>
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

                <div className="nfl-target-table-scroll" ref={tableScrollRef}>
                  <table className="nfl-table nfl-target-table">
                    <thead>
                      <tr>
                        <th>Player</th><th>Pos.</th><th>Team</th>
                        <th className="nfl-number">SEB</th>
                        <th className="nfl-number">ADP</th>
                        <th className="nfl-number">{rankingMode === 'vor' ? 'VOR' : 'Proj. Value'}</th>
                        <th className="nfl-number">SEB Leverage</th>
                        <th>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pickTargets.map((player, idx) => {
                        const sebLev = selectedOverallPick - (player.sebRank ?? selectedOverallPick);
                        const isPickRow = lineAfterIndex !== null && idx === lineAfterIndex + 1;
                        return (
                          <React.Fragment key={`${player.player}-${player.position}`}>
                            {isPickRow && (
                              <tr className="nfl-pick-separator" ref={pickLineRef}>
                                <td colSpan={8}>
                                  <span>Your Pick — Round {safeRound}, #{selectedOverallPick}</span>
                                </td>
                              </tr>
                            )}
                            <tr className={isPickRow ? 'nfl-row-after-line' : ''}>
                              <td>
                                <button className="nfl-player-btn" onClick={() => openPlayer(player, selectedOverallPick)}>
                                  {player.player}
                                </button>
                              </td>
                              <td><span className="nfl-position">{player.position}</span></td>
                              <td>{player.team || '—'}</td>
                              <td className="nfl-number nfl-rank">{player.sebRank}</td>
                              <td className="nfl-number">{fmt(player.adp)}</td>
                              <td className="nfl-number">{rankingMode === 'vor' ? fmt(player.valueAboveReplacement) : fmt(player.projectedValue)}</td>
                              <td className="nfl-number"><LeverageValue value={sebLev} /></td>
                              <td><ValueBadge value={sebLev} /></td>
                            </tr>
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {!pickTargets.length && <p className="nfl-empty-state">No players match the current filters.</p>}
              </div>
            </section>

            <section className="card info-section nfl-how-to" aria-labelledby="nfl-how-to-title">
              <div className="section-head">
                <div>
                  <h2 id="nfl-how-to-title">How To Use the Draft Guide</h2>
                  <p className="section-subtext">
                    Most fantasy drafts are won or lost in the middle rounds. Rounds 1 and 2
                    pick themselves. Rounds 8 through 14 are hard to find impact players. The real edge lives
                    in rounds 3 through 7, where one or two steals can separate a good team
                    from a great one. This guide tells you exactly where those steals are before you
                    go on the clock.
                  </p>
              </div>
                  <h3 className="nfl-how-to-subhead">Draft Guide Tips</h3>
                </div>
              <div className="info-grid">
                <div className="info-block">
                  <h4>1. Set your league</h4>
                  <p>Enter your pick position, league size, platform,and draft format at the top. The tool calculates every pick you hold across all {numRounds} rounds and adjusts the entire model to your exact setup. For snake drafts, the board flips direction each round, so your round 2 pick is near the end of the round. For linear, your spot stays the same every round. All your picks are shown as round pills above the board.</p>
                </div>
                <div className="info-block">
                  <h4>2. Get ready for your turn</h4>
                  <p>Click your next pick number to load the board around that pick. The green line marks your turn and should show you players that will likely be at the top of your draft board. Players above it will likely go before you, players below it are more likely to be there, but it is worth checking if anyone valuable fell. Use Earlier picks and Later picks to scroll around your slot if you want a wider view. Hit Next Pick to jump straight to your next round once you've made your choice.</p>
                </div>
                <div className="info-block">
                  <h4>3. Look for high SEB Leverage Players still on the board</h4>
                  <p>SEB Leverage is your pick number minus the player's SEB Rank. A +6 at pick 24 means the model rates that player as the 18th best overall. That is six spots of free value. The Value badge translates that number into plain English, from Huge Steal down to Big Reach. Look for Steal and above on the board around your pick before anyone else does.</p>
                </div>
                <div className="info-block">
                  <h4>4. Fill out your Positions</h4>
                  <p>Filter by roster positions to ensure you are targeting the right players for your team. Attempt to fill out each position on your roster with the best available players first before drafting backups. We recommend taking only WRs and RBs in the first two rounds and waiting to draft kickers and defense until the end of the draft.</p>
                </div>
                <div className="info-block">
                  <h4>5. Open a player before you decide</h4>
                  <p>Click any player's name to pull up their full profile. You will see their stat projections broken down by category, their scoring breakdown for your exact format, VOR, and a direct value grade from your pick slot. If the profile backs what you are already thinking, you have your answer.</p>
                </div>
                <div className="info-block">
                  <h4>6. Adjust the model to your league</h4>
                  <p>Open Advanced Settings to change roster spots, scoring weights, and position weights. Every tweak updates the model live. If your league uses SuperFlex, add it under Roster and Rounds. The QB weight will auto-adjust and the replacement thresholds will rebuild. The model is only as good as the setup you give it.</p>
                </div>
              </div>
            </section>

            <ColumnGuide />

            <CreditsSection />
          </>
        )}

        {/* ══ RANKINGS ══════════════════════════════════════════════════════════ */}
        {!loading && !error && activeTab === 'rankings' && (
          <>
            <section className="card nfl-rankings-card" aria-labelledby="nfl-rankings-title">
              <div className="section-head nfl-rankings-head">
                <div>
                  <p className="eyebrow">Full board</p>
                  <h2 id="nfl-rankings-title">Interactive Rankings</h2>
                  <p className="section-subtext">
                    {visibleRankings.length} players shown. Sort by any column to find the angles
                    that matter to you. Click any player's name to open their full projection and
                    model breakdown. Leverage here compares the market to the model regardless of
                    where you pick.
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
                <div className="nfl-mode-toggle-row">
                  <span className="nfl-mode-toggle-label">Value metric</span>
                  <div className="nfl-mode-toggle">
                    <button className={`nfl-mode-btn${rankingMode === 'vor' ? ' nfl-mode-btn-active' : ''}`} onClick={() => setRankingMode('vor')}>
                      VOR
                      <span className="nfl-tip-anchor" onClick={(e) => e.stopPropagation()}>?<span className="nfl-tip">Ranks players by how many points they project above the last expected starter at their position. The default mode and the most reliable signal for overall draft value.</span></span>
                    </button>
                    <button className={`nfl-mode-btn${rankingMode === 'weighted' ? ' nfl-mode-btn-active' : ''}`} onClick={() => setRankingMode('weighted')}>
                      Weighted Positions
                      <span className="nfl-tip-anchor" onClick={(e) => e.stopPropagation()}>?<span className="nfl-tip">Re-ranks players by projected points multiplied by a position scarcity weight (TE 1.1, WR 1.0, RB 0.9, QB 0.45). Adjust weights in Advanced Settings.</span></span>
                    </button>
                  </div>
                </div>
                <PosFilter />
              </div>

              <div className="nfl-table-scroll">
                {(() => {
                  const valueCol = rankingMode === 'vor'
                    ? { key: 'valueAboveReplacement', label: 'VOR' }
                    : { key: 'projectedValue',        label: 'Proj. Value' };
                  const cols = [
                    ...BASE_TABLE_COLUMNS,
                    { ...valueCol, align: 'number' },
                    { key: 'leverage', label: 'Leverage', align: 'number' },
                  ];
                  return (
                    <table className="nfl-table">
                      <thead>
                        <tr>
                          {cols.map((col) => (
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
                            <td className="nfl-number">{fmt(player.adp)}</td>
                            <td className="nfl-number">{fmt(rankingMode === 'vor' ? player.valueAboveReplacement : player.projectedValue)}</td>
                            <td className="nfl-number"><LeverageValue value={player.leverage} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  );
                })()}
              </div>
            </section>

            <ColumnGuide />

            <CreditsSection />
          </>
        )}
      </div>
    </main>
  );
}
