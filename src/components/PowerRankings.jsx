import { useEffect, useMemo, useState } from 'react';
import { buildRankings } from '../lib/powerRankings';
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

function formatRecord(rec) {
  return rec.t > 0 ? `${rec.w}–${rec.l}–${rec.t}` : `${rec.w}–${rec.l}`;
}

// ── Team detail dialog ────────────────────────────────────────────────────────
function TeamDetail({ row, onClose }) {
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
        aria-label={`${row.team} rating detail`}
        onClick={e => e.stopPropagation()}
      >
        <button className="pr-modal-close" onClick={onClose} aria-label="Close">×</button>

        <div className="pr-modal-head">
          <span className="pr-modal-rank">#{row.rank}</span>
          <div>
            <h3 className="pr-modal-team">{row.team}</h3>
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
                    <td className="pr-mt-opp">
                      <span className="pr-mt-loc">{g.atHome ? 'vs' : '@'}</span>
                      {g.opponent}
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
                  <td colSpan={4}>Total</td>
                  <td className={`pr-mt-num ${row.score >= 0 ? 'pr-score--pos' : 'pr-score--neg'}`}>
                    {fmt(row.score)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Methodology explainer ─────────────────────────────────────────────────────
function Explainer({ teams, example, pooledNote }) {
  const N = teams.length;
  const M3 = N + 1;
  const win = r => Math.pow((M3 - r) / N, 2);
  const loss = r => Math.sqrt(r / N);
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
        opponent</em> — so the rating and the ranks are solved together, each feeding
        the other until they agree.
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
          <code className="pr-eq-math">value = (({M3} − R) ÷ {N})<sup>2</sup> × D</code>
        </div>
        <div className="pr-eq-row">
          <span className="pr-eq-label pr-eq-label--loss">Loss</span>
          <code className="pr-eq-math">value = √(R ÷ {N}) × D</code>
        </div>
      </div>

      <p className="pr-explain-p">
        The {N} and {M3} are the league size and one more than it. On a loss,
        <code> D</code> is negative, so the result is negative — no separate sign
        handling is needed.
      </p>

      <h3 className="pr-explain-h3">Why wins are squared</h3>
      <p className="pr-explain-p">
        The win multiplier <code>(({M3} − R) ÷ {N})<sup>2</sup></code> runs from
        <strong> {win(1).toFixed(4)}</strong> for beating the #1 team down to
        <strong> {win(N).toFixed(6)}</strong> for beating #{N}. Squaring makes that
        falloff steep rather than gradual: beating the top team is worth roughly
        <strong> {ratio.toLocaleString()}×</strong> more per point of margin than
        beating the worst team. The practical effect is that running up the score on a
        bad opponent earns you almost nothing, while a narrow win over a good one is
        worth a great deal.
      </p>

      <div className="pr-scale">
        {marks.map(r => (
          <div className="pr-scale-item" key={r}>
            <span className="pr-scale-label">Beat #{r}</span>
            <span className="pr-scale-val">×{win(r).toFixed(4)}</span>
          </div>
        ))}
      </div>

      <h3 className="pr-explain-h3">Why losses use a square root</h3>
      <p className="pr-explain-p">
        The loss multiplier <code>√(R ÷ {N})</code> runs the other direction, from
        <strong> {loss(1).toFixed(4)}</strong> for losing to #1 up to
        <strong> {loss(N).toFixed(4)}</strong> for losing to #{N}. A square root is
        concave, so the penalty climbs fast at first and then flattens out. Losing to a
        top team is nearly free; losing to anyone in the bottom half costs close to the
        full margin, and there is little difference between the bad losses — they are
        all bad.
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
        starts at rank {Math.ceil(N / 2)} — dead center, so no one is assumed good or
        bad. Then it repeatedly scores all games, re-sorts, and feeds the new ranks
        back in.
      </p>
      <p className="pr-explain-p">
        Moving each team straight onto its new rank each pass makes the loop oscillate
        forever and never settle. So each pass moves a team only 25% of the way toward
        its new position. That damping lets the system reach a fixed point — a set of
        ranks that reproduces itself — in about 30 passes. Everything is then snapped to
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
  teams,
  games,
  tableHeading,
  caption,
  searchLabel = 'Search team…',
  example,
  pooled,
  pooledNote,
  onRankings,
}) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const rankings = useMemo(() => buildRankings(teams, games, { pooled }), [teams, games, pooled]);

  useEffect(() => { onRankings?.(rankings); }, [rankings, onRankings]);

  const filtered = search.trim()
    ? rankings.filter(r => r.team.toLowerCase().includes(search.toLowerCase()))
    : rankings;

  function rankClass(rank) {
    if (rank <= 3) return 'pr-rank pr-rank--top3';
    if (rank <= 10) return 'pr-rank pr-rank--top10';
    if (rank <= 25) return 'pr-rank pr-rank--top25';
    return 'pr-rank';
  }

  return (
    <>
      <div className="pr-controls">
        <input
          className="pr-search"
          type="text"
          placeholder={searchLabel}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && <button className="pr-clear" onClick={() => setSearch('')}>×</button>}
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
                aria-label={`${row.team} detail`}
                onClick={() => setSelected(row)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelected(row);
                  }
                }}
              >
                <td><span className={rankClass(row.rank)}>{row.rank}</span></td>
                <td className="pr-td-team">{row.team}</td>
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
                    : <span className="pr-idle">—</span>}
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="pr-empty">No teams match "{search}"</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Explainer teams={teams} example={example} pooledNote={pooledNote} />

      {selected && <TeamDetail row={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
