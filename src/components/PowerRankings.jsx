import { useEffect, useMemo, useState } from 'react';
import { rankBadgeClass } from '../lib/rankBadge';
import './PowerRankings.css';

/**
 * Shared power-rankings view: searchable table, per-team detail dialog, and
 * a methodology explainer whose numbers are derived from the league size.
 *
 * Used by both the college football and NFL pages, which differ only in their
 * team list, game data, and surrounding copy.
 */

function fmt(n) {
  return `${n >= 0 ? '+' : ''}${n.toFixed(4)}`;
}

function Logo({ team, logos, size = 20, className = 'pr-logo-inline' }) {
  const src = logos?.[team];
  if (!src) return null;
  return (
    <img
      src={src}
      alt=""
      className={className}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
    />
  );
}

function formatRecord(rec) {
  return rec.t > 0 ? `${rec.w}–${rec.l}–${rec.t}` : `${rec.w}–${rec.l}`;
}

function teamLabel(team, labels) {
  return labels?.[team] ?? team;
}

const DEFAULT_RANK_FILTERS = [
  { value: '10', label: 'Top 10' },
  { value: '25', label: 'Top 25' },
  { value: '50', label: 'Top 50' },
];

function matchesRecordFilter(record, filter) {
  if (filter === 'undefeated') return record.l === 0;
  const games = record.w + record.l + record.t;
  const twiceWinValue = (2 * record.w) + record.t;
  if (filter === 'winning') return twiceWinValue > games;
  if (filter === 'even') return twiceWinValue === games;
  if (filter === 'losing') return twiceWinValue < games;
  return true;
}

function divisionsForConference(options, divisionMap, conferenceMap, conference) {
  if (!options?.length || conference === 'all') return options ?? [];

  return options.filter(division => Object.keys(divisionMap ?? {}).some(team => (
    divisionMap[team] === division && conferenceMap?.[team] === conference
  )));
}

// ── Team detail dialog ────────────────────────────────────────────────────────
function TeamDetail({ row, upcoming, teamLabels, teamLogos, onClose }) {
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="pr-modal-backdrop" onClick={onClose}>
      <div
        className="pr-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`${teamLabel(row.team, teamLabels)} rating detail`}
        onClick={e => e.stopPropagation()}
      >
        <button className="pr-modal-close" onClick={onClose} aria-label="Close">×</button>

        <div className="pr-modal-head">
          <span className="pr-modal-rank">#{row.rank}</span>
          <Logo team={row.team} logos={teamLogos} size={38} className="pr-modal-logo" />
          <div>
            <h3 className="pr-modal-team">{teamLabel(row.team, teamLabels)}</h3>
            <p className="pr-modal-meta">
              {formatRecord(row.record)}
              <span className="pr-modal-dot">·</span>
              <span className={row.score >= 0 ? 'pr-score--pos' : 'pr-score--neg'}>
                {fmt(row.score)}
              </span>
            </p>
          </div>
        </div>

        {row.games.length === 0 ? (
          <p className="pr-modal-empty">No games played yet.</p>
        ) : (
          <div className="pr-modal-table-wrap">
            <table className="pr-modal-table">
              <thead>
                <tr>
                  <th className="pr-mt-wk">Wk</th>
                  <th>Opponent</th>
                  <th className="pr-mt-num">Rank</th>
                  <th className="pr-mt-num">Score</th>
                  <th className="pr-mt-res">Res</th>
                  <th className="pr-mt-num">Points</th>
                </tr>
              </thead>
              <tbody>
                {row.games.map((g, i) => (
                  <tr key={i}>
                    <td className="pr-mt-wk">{g.week ?? ''}</td>
                    <td className="pr-mt-opp">
                      <span className="pr-mt-loc">{g.atHome ? 'vs' : '@'}</span>
                      <Logo team={g.opponent} logos={teamLogos} />
                      {teamLabel(g.opponent, teamLabels)}
                    </td>
                    <td className="pr-mt-num">{g.oppRank}</td>
                    <td className="pr-mt-num">{g.pointsFor}–{g.pointsAgainst}</td>
                    <td className="pr-mt-res">
                      <span className={`pr-res pr-res--${g.result.toLowerCase()}`}>{g.result}</span>
                    </td>
                    <td className={`pr-mt-num ${g.value >= 0 ? 'pr-score--pos' : 'pr-score--neg'}`}>
                      {fmt(g.value)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={5}>Total</td>
                  <td className={`pr-mt-num ${row.score >= 0 ? 'pr-score--pos' : 'pr-score--neg'}`}>
                    {fmt(row.score)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {upcoming?.length > 0 && (
          <div className="pr-upcoming">
            <p className="pr-upcoming-head">Upcoming</p>
            <ul className="pr-upcoming-list">
              {upcoming.map((g, i) => (
                <li key={i} className="pr-upcoming-row">
                  <span className="pr-upcoming-wk">{g.week != null ? `Wk ${g.week}` : ''}</span>
                  <span className="pr-mt-loc">{g.atHome ? 'vs' : '@'}</span>
                  <Logo team={g.opponent} logos={teamLogos} />
                  <span className="pr-upcoming-opp">{teamLabel(g.opponent, teamLabels)}</span>
                  <span className="pr-upcoming-rank">
                    {g.oppRank ? `#${g.oppRank}` : ''}
                  </span>
                  <span className="pr-upcoming-rec">{g.oppRecord ?? ''}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Worked examples pulled from real results, so they can never drift out of date
 * the way hand-written ones do. Picks the most valuable win and the costliest
 * loss in the data, which also happens to show the win/loss asymmetry clearly.
 */
function deriveExamples(rankings, N, pooled, { winExponent = 2, lossExponent = 0.5 } = {}) {
  const M3 = N + 1;
  const skip = new Set(pooled ?? []);
  let bestWin = null;
  let worstLoss = null;

  for (const row of rankings) {
    // A pooled bucket is not a real team, so it never headlines an example.
    if (skip.has(row.team)) continue;
    for (const g of row.games) {
      const entry = { team: row.team, ...g };
      if (g.result === 'W' && (!bestWin || g.value > bestWin.value)) bestWin = entry;
      if (g.result === 'L' && (!worstLoss || g.value < worstLoss.value)) worstLoss = entry;
    }
  }
  if (!bestWin || !worstLoss) return null;

  const line = (g) => `${g.team} ${g.pointsFor}, ${g.opponent} ${g.pointsAgainst}`;
  const signed = (v) => `${v >= 0 ? '+' : ''}${v.toFixed(4)}`;

  const wD = bestWin.pointsFor - bestWin.pointsAgainst;
  const wFrac = (M3 - bestWin.oppRank) / N;
  const lD = worstLoss.pointsFor - worstLoss.pointsAgainst;
  const lFrac = worstLoss.oppRank / N;

  return {
    win: {
      title: `${line(bestWin)}. A win over the #${bestWin.oppRank} team`,
      math:
        `D = ${bestWin.pointsFor} - ${bestWin.pointsAgainst} = ${wD}\n` +
        `(${M3} - ${bestWin.oppRank}) / ${N} = ${M3 - bestWin.oppRank} / ${N} = ${wFrac.toFixed(6)}\n` +
        (winExponent === 1
          ? ''
          : `${wFrac.toFixed(6)} ${winExponent === 2 ? 'squared' : '^' + winExponent} = ${Math.pow(wFrac, winExponent).toFixed(6)}\n`) +
        `${Math.pow(wFrac, winExponent).toFixed(6)} x ${wD} = ${signed(bestWin.value)}`,
    },
    loss: {
      title: `${line(worstLoss)}. A loss to the #${worstLoss.oppRank} team`,
      math:
        `D = ${worstLoss.pointsFor} - ${worstLoss.pointsAgainst} = ${lD}\n` +
        `${worstLoss.oppRank} / ${N} = ${lFrac.toFixed(6)}\n` +
        (lossExponent === 1
          ? ''
          : `${lossExponent === 0.5 ? 'square root of ' : '^' + lossExponent + ' of '}${lFrac.toFixed(6)} = ${Math.pow(lFrac, lossExponent).toFixed(6)}\n`) +
        `${Math.pow(lFrac, lossExponent).toFixed(6)} x ${lD} = ${signed(worstLoss.value)}`,
    },
    note:
      `Those two are worth comparing. The best win in the data is worth ` +
      `${bestWin.value.toFixed(2)} points of rating. The worst loss costs ` +
      `${Math.abs(worstLoss.value).toFixed(2)}. Losses move a team further than wins do, ` +
      `which is why one bad afternoon undoes several good ones.`,
  };
}

// ── Methodology explainer ─────────────────────────────────────────────────────
function Explainer({ rankings, pooled, pooledNote, curve }) {
  const N = rankings.length;
  const { winExponent = 2, lossExponent = 0.5 } = curve ?? {};
  const example = deriveExamples(rankings, N, pooled, curve);
  const M3 = N + 1;
  const win = r => Math.pow((M3 - r) / N, winExponent);
  const loss = r => Math.pow(r / N, lossExponent);
  const sup = e => (e === 1 ? null : <sup>{e === 0.5 ? '½' : e}</sup>);
  const ratio = Math.round(win(1) / win(N));

  // Sample points spread across the table, skipping any that collide.
  const marks = [...new Set([1, Math.round(N * 0.18), Math.round(N * 0.5), N - Math.max(1, Math.round(N * 0.06))])]
    .filter(r => r >= 1 && r <= N);

  return (
    <section className="pr-explain">
      <h2 className="pr-explain-title">How the rating is calculated</h2>

      <p className="pr-explain-lead">
        Every game a team plays produces one number. A team's rating is just the sum of
        those numbers. What makes a game worth more or less is the <em>rank of the
        opponent</em>. The rating and the ranks get solved together, each feeding the
        other until they agree.
      </p>

      <h3 className="pr-explain-h3">The two formulas</h3>
      <p className="pr-explain-p">
        Let <code>D</code> be the point differential (your points minus theirs) and
        <code> R</code> be the opponent's rank, from 1 to {N}. Wins and losses use
        deliberately different shapes:
      </p>

      <div className="pr-eq">
        <div className="pr-eq-row">
          <span className="pr-eq-label pr-eq-label--win">Win</span>
          <code className="pr-eq-math">value = (({M3} − R) ÷ {N}){sup(winExponent)} × D</code>
        </div>
        <div className="pr-eq-row">
          <span className="pr-eq-label pr-eq-label--loss">Loss</span>
          <code className="pr-eq-math">
            value = {lossExponent === 0.5 ? '√' : ''}(R ÷ {N}){lossExponent === 0.5 ? null : sup(lossExponent)} × D
          </code>
        </div>
      </div>

      <p className="pr-explain-p">
        The {N} and {M3} are the league size and one more than it. On a loss,
        <code> D</code> is negative, so the result is negative. No separate sign
        handling is needed.
      </p>

      <h3 className="pr-explain-h3">
        {winExponent === 1 ? 'How the win multiplier scales' : 'Why wins are squared'}
      </h3>
      <p className="pr-explain-p">
        The win multiplier <code>(({M3} − R) ÷ {N}){sup(winExponent)}</code> runs from
        <strong> {win(1).toFixed(4)}</strong> for beating the #1 team down to
        <strong> {win(N).toFixed(6)}</strong> for beating #{N}. Beating the top team is
        worth <strong>{ratio.toLocaleString()}×</strong> more per point of margin than
        beating the worst one.{' '}
        {winExponent === 1
          ? 'Because the multiplier is linear, that gap tracks the rank gap directly. Opponent quality matters, but it does not overwhelm the margin the way a steeper curve would.'
          : 'Squaring makes that falloff steep rather than gradual, so running up the score on a bad opponent earns almost nothing while a narrow win over a good one is worth a great deal.'}
      </p>

      <div className="pr-scale">
        {marks.map(r => (
          <div className="pr-scale-item" key={r}>
            <span className="pr-scale-label">Beat #{r}</span>
            <span className="pr-scale-val">×{win(r).toFixed(4)}</span>
          </div>
        ))}
      </div>

      <h3 className="pr-explain-h3">
        {lossExponent === 1 ? 'How the loss multiplier scales' : 'Why losses use a square root'}
      </h3>
      <p className="pr-explain-p">
        The loss multiplier <code>
          {lossExponent === 0.5 ? '√' : ''}(R ÷ {N}){lossExponent === 0.5 ? null : sup(lossExponent)}
        </code> runs the other direction, from
        <strong> {loss(1).toFixed(4)}</strong> for losing to #1 up to
        <strong> {loss(N).toFixed(4)}</strong> for losing to #{N}. A square root is
        concave, so the penalty climbs fast at first and then flattens out. Losing to a
        top team is nearly free; losing to anyone in the bottom half costs close to the
        full margin. There is little difference between the bad losses. They are all bad.
      </p>

      <div className="pr-scale">
        {marks.map(r => (
          <div className="pr-scale-item" key={r}>
            <span className="pr-scale-label">Lost to #{r}</span>
            <span className="pr-scale-val">×{loss(r).toFixed(4)}</span>
          </div>
        ))}
      </div>

      {example && (
        <>
          <h3 className="pr-explain-h3">Worked examples</h3>
          {example.win && (
            <div className="pr-work">
              <p className="pr-work-head">{example.win.title}</p>
              <code className="pr-work-math">{example.win.math}</code>
            </div>
          )}
          {example.loss && (
            <div className="pr-work">
              <p className="pr-work-head">{example.loss.title}</p>
              <code className="pr-work-math">{example.loss.math}</code>
            </div>
          )}
          {example.note && <p className="pr-explain-p">{example.note}</p>}
        </>
      )}

      <h3 className="pr-explain-h3">Solving the circular reference</h3>
      <p className="pr-explain-p">
        There is a chicken-and-egg problem here: scoring a game needs the opponent's
        rank, but ranks come from scores. The model resolves it by iterating. Every team
        starts at rank {Math.ceil(N / 2)}, dead center, so no one is assumed good or bad. Then it repeatedly scores all games, re-sorts, and feeds the new ranks
        back in.
      </p>
      <p className="pr-explain-p">
        Moving each team straight onto its new rank each pass makes the loop oscillate
        forever and never settle. So each pass moves a team only 25% of the way toward
        its new position. That damping lets the system reach a fixed point, a set of
        ranks that reproduces itself, in about 30 passes. Everything is then snapped to
        whole-number ranks and allowed to settle again, which guarantees the opponent
        ranks shown when you click a team are the same ranks the formula actually used,
        and that a team's game values sum exactly to its rating.
      </p>

      {pooledNote && (
        <>
          <h3 className="pr-explain-h3">Two things worth knowing</h3>
          <p className="pr-explain-p">{pooledNote}</p>
        </>
      )}
      <p className="pr-explain-p">
        <strong>Teams that have not played sit at exactly 0.</strong> That places them
        above every team with a losing score, so early in the season a team with no
        games will outrank a team that has played and lost. They are tracked, not yet
        rated.
      </p>
    </section>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────
export default function PowerRankings({
  rankings,
  upcomingGames,
  tableHeading,
  caption,
  searchLabel = 'Search team…',
  curve,
  pooled,
  pooledNote,
  teamLabels,
  teamLogos,
  conferenceMap,
  conferenceOptions,
  divisionMap,
  divisionOptions,
  rankOptions = DEFAULT_RANK_FILTERS,
  rankBadgeCutoffs,
}) {
  const [search, setSearch] = useState('');
  const [conferenceFilter, setConferenceFilter] = useState('all');
  const [divisionFilter, setDivisionFilter] = useState('all');
  const [rankFilter, setRankFilter] = useState('all');
  const [recordFilter, setRecordFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const hasConferenceFilter = Boolean(conferenceMap && conferenceOptions?.length);
  const hasDivisionFilter = Boolean(divisionMap && divisionOptions?.length);
  const hasTableFilters = hasConferenceFilter || hasDivisionFilter;

  const availableDivisionOptions = useMemo(() => divisionsForConference(
    divisionOptions,
    divisionMap,
    conferenceMap,
    conferenceFilter,
  ), [divisionOptions, divisionMap, conferenceMap, conferenceFilter]);

  // Opponent rank and record are read off the current standings, so the
  // schedule shows who a team still has to play and how good they are today.
  const scheduleByTeam = useMemo(() => {
    const byTeam = Object.fromEntries(rankings.map(r => [r.team, r]));
    const out = {};
    const add = (team, opponent, atHome, week) => {
      const opp = byTeam[opponent];
      (out[team] ??= []).push({
        opponent,
        atHome,
        week,
        oppRank: opp?.rank ?? null,
        oppRecord: opp?.hasGames ? formatRecord(opp.record) : null,
      });
    };
    for (const { home, away, week } of upcomingGames ?? []) {
      if (byTeam[home]) add(home, away, true, week);
      if (byTeam[away]) add(away, home, false, week);
    }
    return out;
  }, [rankings, upcomingGames]);

  const filtered = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();
    const rankLimit = rankFilter === 'all' ? Infinity : Number(rankFilter);

    return rankings.filter(row => {
      const displayedName = teamLabel(row.team, teamLabels).toLowerCase();
      if (searchTerm && !displayedName.includes(searchTerm)) return false;
      if (conferenceFilter !== 'all' && conferenceMap?.[row.team] !== conferenceFilter) {
        return false;
      }
      if (divisionFilter !== 'all' && divisionMap?.[row.team] !== divisionFilter) {
        return false;
      }
      if (row.rank > rankLimit) return false;
      if (!matchesRecordFilter(row.record, recordFilter)) return false;
      return true;
    });
  }, [
    rankings,
    search,
    teamLabels,
    conferenceFilter,
    conferenceMap,
    divisionFilter,
    divisionMap,
    rankFilter,
    recordFilter,
  ]);

  function handleConferenceChange(event) {
    const nextConference = event.target.value;
    setConferenceFilter(nextConference);

    const nextDivisions = divisionsForConference(
      divisionOptions,
      divisionMap,
      conferenceMap,
      nextConference,
    );
    if (divisionFilter !== 'all' && !nextDivisions.includes(divisionFilter)) {
      setDivisionFilter('all');
    }
  }

  return (
    <>
      <div className="pr-controls">
        <div className="pr-search-wrap">
          <input
            className="pr-search"
            type="text"
            placeholder={searchLabel}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="pr-clear" onClick={() => setSearch('')} aria-label="Clear team search">
              ×
            </button>
          )}
        </div>

        {hasTableFilters && (
          <>
            {hasConferenceFilter && (
              <select
                className="pr-filter-select pr-filter-select--conference"
                aria-label="Filter teams by conference"
                value={conferenceFilter}
                onChange={handleConferenceChange}
              >
                <option value="all">All Conferences</option>
                {conferenceOptions.map(conference => (
                  <option key={conference} value={conference}>{conference}</option>
                ))}
              </select>
            )}

            {hasDivisionFilter && (
              <select
                className="pr-filter-select pr-filter-select--division"
                aria-label="Filter teams by division"
                value={divisionFilter}
                onChange={event => setDivisionFilter(event.target.value)}
              >
                <option value="all">All Divisions</option>
                {availableDivisionOptions.map(division => (
                  <option key={division} value={division}>{division}</option>
                ))}
              </select>
            )}

            <select
              className="pr-filter-select"
              aria-label="Filter teams by overall rank"
              value={rankFilter}
              onChange={event => setRankFilter(event.target.value)}
            >
              <option value="all">All Teams</option>
              {rankOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            <select
              className="pr-filter-select"
              aria-label="Filter teams by record"
              value={recordFilter}
              onChange={event => setRecordFilter(event.target.value)}
            >
              <option value="all">All Records</option>
              <option value="undefeated">Undefeated</option>
              <option value="winning">Winning Record</option>
              <option value="even">.500</option>
              <option value="losing">Losing Record</option>
            </select>
          </>
        )}
      </div>

      {tableHeading && <h2 className="pr-table-heading">{tableHeading}</h2>}

      <div className="pr-table-wrap">
        <table className="pr-table">
          {caption && <caption className="pr-sr-only">{caption}</caption>}
          <thead>
            <tr>
              <th className="pr-th-rank">Rank</th>
              <th className="pr-th-team">Team</th>
              <th className="pr-th-record">Record</th>
              <th className="pr-th-score">Score</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(row => (
              <tr
                key={row.team}
                className={`pr-tr--clickable ${row.hasGames ? 'pr-tr--active' : 'pr-tr--idle'}`}
                tabIndex={0}
                role="button"
                aria-label={`${teamLabel(row.team, teamLabels)} detail`}
                onClick={() => setSelected(row)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelected(row);
                  }
                }}
              >
                <td>
                  <span className={rankBadgeClass(row.rank, rankBadgeCutoffs)}>{row.rank}</span>
                </td>
                <td className="pr-td-team">
                  <span className="pr-team-cell">
                    <span>{teamLabel(row.team, teamLabels)}</span>
                    {teamLogos?.[row.team] && (
                      <img
                        src={teamLogos[row.team]}
                        alt=""
                        className="pr-team-logo"
                        width="24"
                        height="24"
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                  </span>
                </td>
                <td className="pr-td-record">
                  {row.hasGames
                    ? formatRecord(row.record)
                    : <span className="pr-idle">0–0</span>}
                </td>
                <td className="pr-td-score">
                  {row.hasGames
                    ? <span className={row.score >= 0 ? 'pr-score--pos' : 'pr-score--neg'}>
                        {fmt(row.score)}
                      </span>
                    : <span className="pr-idle">–</span>}
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="pr-empty">
                  {hasTableFilters
                    ? 'No teams match the selected filters.'
                    : `No teams match "${search}"`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Explainer rankings={rankings} pooled={pooled} pooledNote={pooledNote} curve={curve} />

      {selected && (
        <TeamDetail
          row={selected}
          upcoming={scheduleByTeam[selected.team]}
          teamLabels={teamLabels}
          teamLogos={teamLogos}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
