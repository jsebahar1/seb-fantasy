import { useEffect, useMemo, useState } from 'react';
import SEO from '../components/SEO';
import { ADP_SOURCES, loadAdpData, loadFantasyProjections } from '../lib/fantasyData';
import { getRoundTargets, getRoundAvailability, DRAFT_ROUNDS, LEAGUE_SIZES } from '../lib/fantasyDraftTargets';
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
const TABLE_COLUMNS = [
  { key: 'sebRank', label: 'SEB Rank', align: 'number' },
  { key: 'player', label: 'Player' },
  { key: 'position', label: 'Pos.' },
  { key: 'team', label: 'Team' },
  { key: 'projectedFantasyPoints', label: 'Proj. Pts', align: 'number' },
  { key: 'valueAboveReplacement', label: 'VOR', align: 'number' },
  { key: 'adp', label: 'ADP', align: 'number' },
  { key: 'leverage', label: 'Leverage', align: 'number' },
];

const formatNumber = (value) => (value === null || value === undefined ? '—' : value.toFixed(1));
const formatLeverage = (value) => (value === null || value === undefined ? '—' : `${value > 0 ? '+' : ''}${value.toFixed(1)}`);

function compareValues(left, right, key) {
  if (typeof left[key] === 'string') return left[key].localeCompare(right[key]);
  return left[key] - right[key];
}

function LeverageValue({ value }) {
  const state = value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral';
  return <span className={`nfl-leverage nfl-leverage-${state}`}>{formatLeverage(value)}</span>;
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
  const [draftRound, setDraftRound] = useState(1);
  const [draftRange, setDraftRange] = useState('draftRelevant');
  const [sortKey, setSortKey] = useState('sebRank');
  const [sortDirection, setSortDirection] = useState('asc');

  useEffect(() => {
    let cancelled = false;

    async function loadModelData() {
      try {
        const [loadedProjections, loadedAdp] = await Promise.all([loadFantasyProjections(), loadAdpData()]);
        if (!cancelled) {
          setProjectionPlayers(loadedProjections);
          setAdpData(loadedAdp);
        }
      } catch {
        if (!cancelled) setError('We could not load the current rankings data. Please refresh and try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadModelData();
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
  const roundAvailability = useMemo(
    () => getRoundAvailability(leagueSize, draftRound),
    [leagueSize, draftRound],
  );
  const roundTargets = useMemo(
    () => getRoundTargets(leverageRankings, { leagueSize, round: draftRound, position }),
    [leverageRankings, leagueSize, draftRound, position],
  );
  const visibleRankings = useMemo(() => {
    const filtered = leverageRankings.filter((player) => {
      const matchesPosition = position === 'All' || player.position === position;
      const isDraftRelevant = player.adp !== null && player.adp <= DRAFT_RELEVANT_ADP_CUTOFF;
      return matchesPosition && (draftRange === 'allPlayers' || isDraftRelevant);
    });

    return [...filtered].sort((left, right) => {
      const leftMissing = left[sortKey] === null || left[sortKey] === undefined;
      const rightMissing = right[sortKey] === null || right[sortKey] === undefined;
      if (leftMissing) return rightMissing ? 0 : 1;
      if (rightMissing) return -1;

      const comparison = compareValues(left, right, sortKey);
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [leverageRankings, position, draftRange, sortKey, sortDirection]);

  const toggleSort = (key) => {
    if (key === sortKey) setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDirection(key === 'player' || key === 'position' ? 'asc' : 'desc');
    }
  };

  return (
    <main className="page nfl-page">
      <SEO
        title="2026 NFL Fantasy Football Rankings & Draft Tool"
        path="/nfl-fantasy"
        description="Free 2026 NFL fantasy football draft rankings with ADP leverage and Value Above Replacement. Find undervalued players round by round and build a winning team from pick one."
        keywords={['nfl fantasy football rankings 2026', 'fantasy football draft rankings', 'fantasy football draft tool', 'value above replacement fantasy football', 'fantasy football ADP strategy', 'nfl fantasy draft advice', 'fantasy football draft helper', 'undervalued fantasy players']}
      />

      <div className="container">
        <header className="nfl-intro">
          <p className="eyebrow">NFL Fantasy</p>
          <h1 className="page-title">NFL Fantasy Football Rankings</h1>
          <p className="page-text">Find players the SEB model prefers at every stage of your draft, then use the full rankings to dig deeper.</p>
        </header>

        {loading && <div className="nfl-state" role="status"><span className="nfl-spinner" aria-hidden="true" />Loading NFL Fantasy rankings…</div>}
        {error && <div className="nfl-state nfl-state-error" role="alert">{error}</div>}

        {!loading && !error && (
          <>
            <section className="grid-main nfl-main-grid" aria-labelledby="nfl-targets-title">
              <div className="card nfl-targets-card">
                <div className="section-head nfl-rankings-head">
                  <div>
                    <p className="eyebrow">Draft assistant</p>
                    <h2 id="nfl-targets-title">Best Targets by Draft Round</h2>
                    <p className="section-subtext">The strongest model values among players who can realistically be available around your pick.</p>
                  </div>
                  <span className="nfl-model-badge">Version 1 model</span>
                </div>

                <div className="nfl-controls nfl-main-controls" aria-label="Draft target controls">
                  <label><span>Scoring format</span><select value={scoringFormat} onChange={(event) => setScoringFormat(event.target.value)}>{SCORING_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                  <label><span>ADP source</span><select value={adpSource} onChange={(event) => setAdpSource(event.target.value)}>{ADP_SOURCES.map((source) => <option key={source} value={source}>{source}</option>)}</select></label>
                  <label><span>Position</span><select value={position} onChange={(event) => setPosition(event.target.value)}>{POSITION_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
                  <label><span>League size</span><select value={leagueSize} onChange={(event) => setLeagueSize(Number(event.target.value))}>{LEAGUE_SIZES.map((size) => <option key={size} value={size}>{size} teams</option>)}</select></label>
                  <label><span>Draft round</span><select value={draftRound} onChange={(event) => setDraftRound(Number(event.target.value))}>{DRAFT_ROUNDS.map((round) => <option key={round} value={round}>Round {round}</option>)}</select></label>
                </div>

                <div className="nfl-round-context">
                  <strong>Round {draftRound}</strong>
                  <span>Expected picks: {roundAvailability.roundStart}–{roundAvailability.roundEnd}</span>
                  <span>Availability window: ADP {roundAvailability.minimumADP}–{roundAvailability.maximumADP}</span>
                </div>

                <div className="nfl-target-table-scroll">
                  <table className="nfl-table nfl-target-table">
                    <thead><tr><th>Player</th><th>Pos.</th><th>Team</th><th className="nfl-number">SEB</th><th className="nfl-number">ADP</th><th className="nfl-number">Leverage</th><th className="nfl-number">VOR</th><th>Availability</th></tr></thead>
                    <tbody>
                      {roundTargets.map((player) => (
                        <tr key={`${player.player}-${player.position}`}>
                          <td className="nfl-player">{player.player}</td><td><span className="nfl-position">{player.position}</span></td><td>{player.team || '—'}</td><td className="nfl-number nfl-rank">{player.sebRank}</td><td className="nfl-number">{formatNumber(player.adp)}</td><td className="nfl-number"><LeverageValue value={player.leverage} /></td><td className="nfl-number">{formatNumber(player.valueAboveReplacement)}</td><td><span className={`nfl-availability nfl-availability-${player.availabilityStatus}`}>{player.availabilityStatus === 'possibleFall' ? 'Possible Fall' : player.availabilityStatus === 'earlyReach' ? 'Early Reach' : 'Expected'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!roundTargets.length && <p className="nfl-empty-state">No players match this round&apos;s availability window and position filter.</p>}
              </div>

              <aside className="side-stack nfl-support-notes">
                <div className="card"><h3>Soft availability</h3><p>Players within {roundAvailability.availabilityOverlap} picks on either side of the expected round are included, because real drafts rarely follow ADP exactly.</p></div>
                <div className="card"><h3>Read the signal</h3><p>Positive leverage means the market is drafting a player later than SEB Rank. Negative leverage can still be useful when the player fits your roster plan.</p></div>
              </aside>
            </section>

            <section className="card info-section nfl-how-to" aria-labelledby="nfl-how-to-title">
              <div className="section-head"><div><h2 id="nfl-how-to-title">How To Use the Model</h2><p className="section-subtext">Use the tool as a practical guide while accounting for your league, roster, and draft room.</p></div></div>
              <div className="info-grid">
                <div className="info-block"><h4>1. Start With Your Round</h4><p>Choose your league size and upcoming round. The model includes players realistically available around that pick, not a rigid ADP bucket.</p></div>
                <div className="info-block"><h4>2. Look For Positive Leverage</h4><p>Positive leverage means SEB ranks a player earlier than the market. It highlights potential value, not a guaranteed outcome.</p></div>
                <div className="info-block"><h4>3. Consider Fringe Players</h4><p>Players just outside the expected range may still be available if your room reaches or lets a player fall.</p></div>
                <div className="info-block"><h4>4. Use Judgment</h4><p>Balance the model with your roster needs, league settings, and the choices already made in your draft.</p></div>
              </div>
            </section>

            <section className="card nfl-rankings-card" aria-labelledby="nfl-rankings-title">
              <div className="section-head nfl-rankings-head"><div><p className="eyebrow">Full data</p><h2 id="nfl-rankings-title">Interactive Rankings</h2><p className="section-subtext">{visibleRankings.length} players shown. Scoring, ADP source, and position use the settings above.</p></div></div>
              <div className="nfl-table-settings"><label><span>Draft range</span><select value={draftRange} onChange={(event) => setDraftRange(event.target.value)}><option value="draftRelevant">Draft Relevant (ADP ≤ {DRAFT_RELEVANT_ADP_CUTOFF})</option><option value="allPlayers">All Players</option></select></label></div>
              <div className="nfl-table-scroll"><table className="nfl-table"><thead><tr>{TABLE_COLUMNS.map((column) => <th key={column.key} className={column.align === 'number' ? 'nfl-number' : undefined} aria-sort={column.key === sortKey ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}><button type="button" onClick={() => toggleSort(column.key)}>{column.label}{column.key === sortKey ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : ''}</button></th>)}</tr></thead><tbody>{visibleRankings.map((player) => <tr key={`${player.player}-${player.position}`}><td className="nfl-rank">{player.sebRank}</td><td className="nfl-player">{player.player}</td><td><span className="nfl-position">{player.position}</span></td><td>{player.team || '—'}</td><td className="nfl-number">{formatNumber(player.projectedFantasyPoints)}</td><td className="nfl-number">{formatNumber(player.valueAboveReplacement)}</td><td className="nfl-number">{formatNumber(player.adp)}</td><td className="nfl-number"><LeverageValue value={player.leverage} /></td></tr>)}</tbody></table></div>
            </section>

            <section className="card nfl-model-explainer" aria-labelledby="nfl-model-title">
              <div><p className="eyebrow">Model glossary</p><h2 id="nfl-model-title">Built for smarter draft decisions</h2></div>
              <div className="nfl-definition-grid"><div><h3>SEB Rank</h3><p>Overall player rank based on Value Above Replacement.</p></div><div><h3>VOR</h3><p>Projected points above the replacement-level player at the same position.</p></div><div><h3>ADP</h3><p>The selected market&apos;s average draft position.</p></div><div><h3>Leverage</h3><p>ADP minus SEB Rank. Positive means the market drafts that player later than our model.</p></div></div>
            </section>

            <section className="card nfl-credits"><h3>Data Sources</h3><p>SEB Fantasy combines consensus statistical projections with multi-platform average draft position data. Rankings are calculated natively from the Version 1 scoring and Value Above Replacement model.</p></section>
          </>
        )}
      </div>
    </main>
  );
}
