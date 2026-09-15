import { useEffect, useMemo, useState } from 'react';
import { CONFERENCES, TEAM_CONFERENCE } from '../data/cfbConferences';

/**
 * Conferences ordered by the average rank of their members, alongside how they
 * have fared against everyone outside the league.
 */

function formatRecord({ w, l, t }) {
  return t > 0 ? `${w}–${l}–${t}` : `${w}–${l}`;
}

function buildConferenceRows(rankings, games) {
  const byTeam = Object.fromEntries(rankings.map(r => [r.team, r]));

  const records = {};
  Object.keys(CONFERENCES).forEach(c => { records[c] = { w: 0, l: 0, t: 0 }; });

  // Only games between teams from different conferences say anything about how
  // one league stacks up against another.
  for (const { home, away, homePoints, awayPoints } of games) {
    const hc = TEAM_CONFERENCE[home];
    const ac = TEAM_CONFERENCE[away];
    if (!hc || !ac || hc === ac) continue;

    if (homePoints > awayPoints) { records[hc].w++; records[ac].l++; }
    else if (awayPoints > homePoints) { records[ac].w++; records[hc].l++; }
    else { records[hc].t++; records[ac].t++; }
  }

  const rows = Object.entries(CONFERENCES).map(([name, teams]) => {
    const members = teams
      .map(t => byTeam[t])
      .filter(Boolean)
      .sort((a, b) => a.rank - b.rank);
    const avgRank = members.length
      ? members.reduce((sum, m) => sum + m.rank, 0) / members.length
      : Infinity;
    const rec = records[name];
    const decided = rec.w + rec.l;

    return {
      name,
      members,
      avgRank,
      record: rec,
      winPct: decided ? rec.w / decided : null,
      best: members[0] ?? null,
    };
  });

  return rows
    .sort((a, b) => a.avgRank - b.avgRank)
    .map((r, i) => ({ ...r, rank: i + 1 }));
}

function ConferenceDetail({ row, onClose }) {
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
        aria-label={`${row.name} detail`}
        onClick={e => e.stopPropagation()}
      >
        <button className="pr-modal-close" onClick={onClose} aria-label="Close">×</button>

        <div className="pr-modal-head">
          <span className="pr-modal-rank">#{row.rank}</span>
          <div>
            <h3 className="pr-modal-team">{row.name}</h3>
            <p className="pr-modal-meta">
              {row.members.length} teams
              <span className="pr-modal-dot">·</span>
              avg rank {row.avgRank.toFixed(1)}
              <span className="pr-modal-dot">·</span>
              {formatRecord(row.record)} non-conf
            </p>
          </div>
        </div>

        <div className="pr-modal-table-wrap">
          <table className="pr-modal-table">
            <thead>
              <tr>
                <th className="pr-mt-num">Rank</th>
                <th>Team</th>
                <th className="pr-mt-res">Record</th>
                <th className="pr-mt-num">Rating</th>
              </tr>
            </thead>
            <tbody>
              {row.members.map(m => (
                <tr key={m.team}>
                  <td className="pr-mt-num">{m.rank}</td>
                  <td className="pr-mt-opp">{m.team}</td>
                  <td className="pr-mt-res">{m.hasGames ? formatRecord(m.record) : '0–0'}</td>
                  <td className={`pr-mt-num ${m.score >= 0 ? 'pr-score--pos' : 'pr-score--neg'}`}>
                    {m.score >= 0 ? '+' : ''}{m.score.toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function ConferenceRankings({ rankings, games, season, updatedLabel }) {
  const [selected, setSelected] = useState(null);
  const rows = useMemo(() => buildConferenceRows(rankings, games), [rankings, games]);

  function rankClass(rank) {
    if (rank <= 3) return 'pr-rank pr-rank--top3';
    if (rank <= 5) return 'pr-rank pr-rank--top10';
    return 'pr-rank';
  }

  return (
    <>
      <h2 className="pr-table-heading">
        {season} Conference Power Rankings, 1–{rows.length}
      </h2>

      <div className="pr-table-wrap">
        <table className="pr-table">
          <caption className="pr-sr-only">
            {season} college football conference rankings, ordered by the average power
            ranking of each league's members, with records against non-conference
            opponents as of {updatedLabel}.
          </caption>
          <thead>
            <tr>
              <th className="pr-th-rank">Rank</th>
              <th className="pr-th-team">Conference</th>
              <th className="pr-th-num">Teams</th>
              <th className="pr-th-num">Avg Rank</th>
              <th className="pr-th-team">Best Team</th>
              <th className="pr-th-record">Non-Conf</th>
              <th className="pr-th-score">Win %</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr
                key={row.name}
                className="pr-tr--clickable pr-tr--active"
                tabIndex={0}
                role="button"
                aria-label={`${row.name} detail`}
                onClick={() => setSelected(row)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelected(row);
                  }
                }}
              >
                <td><span className={rankClass(row.rank)}>{row.rank}</span></td>
                <td className="pr-td-team">{row.name}</td>
                <td className="pr-td-num">{row.members.length}</td>
                <td className="pr-td-num">{row.avgRank.toFixed(1)}</td>
                <td className="pr-td-best">
                  {row.best ? <>#{row.best.rank} {row.best.team}</> : '–'}
                </td>
                <td className="pr-td-record">{formatRecord(row.record)}</td>
                <td className="pr-td-score">
                  {row.winPct === null
                    ? <span className="pr-idle">–</span>
                    : <span className={row.winPct >= 0.5 ? 'pr-score--pos' : 'pr-score--neg'}>
                        {(row.winPct * 100).toFixed(1)}%
                      </span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="pr-explain-p pr-conf-note">
        Conferences are ordered by the average power ranking of every member, so a
        league is only as strong as its full membership rather than its best few teams.
        The non-conference record counts only games against teams from another league.
        Those are the games that actually compare one league to another.
      </p>

      {selected && <ConferenceDetail row={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
