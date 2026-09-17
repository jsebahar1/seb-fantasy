import { useEffect, useMemo, useState } from 'react';
import { rankBadgeClass } from '../lib/rankBadge';

/**
 * Ranks groups of teams (conferences, divisions) by the average rank of their
 * members, and shows how the group has done against everyone outside it.
 *
 * Props
 *   groups        { 'AFC East': ['Buffalo Bills', ...], ... }
 *   extraRecords  [{ label: 'Div', map: teamToDivision }] adds a per-team record
 *                 column counting only games where both teams share that group.
 *   outsideLabel  header for the group's record against teams outside it.
 */

function formatRecord({ w, l, t }) {
  return t > 0 ? `${w}–${l}–${t}` : `${w}–${l}`;
}

const blank = () => ({ w: 0, l: 0, t: 0 });

function credit(rec, result) {
  if (result === 'w') rec.w++;
  else if (result === 'l') rec.l++;
  else rec.t++;
}

function buildGroupRows(rankings, games, groups, extraRecords) {
  const byTeam = Object.fromEntries(rankings.map(r => [r.team, r]));
  const teamGroup = Object.fromEntries(
    Object.entries(groups).flatMap(([name, teams]) => teams.map(t => [t, name])),
  );

  // Group-level record against teams from a different group.
  const outside = {};
  Object.keys(groups).forEach(g => { outside[g] = blank(); });

  // One per-team tally per configured record column.
  const perTeam = extraRecords.map(() => {
    const m = {};
    rankings.forEach(r => { m[r.team] = blank(); });
    return m;
  });

  for (const { home, away, homePoints, awayPoints } of games) {
    if (homePoints === undefined || awayPoints === undefined) continue;
    const homeResult = homePoints > awayPoints ? 'w' : homePoints < awayPoints ? 'l' : 't';
    const awayResult = homeResult === 'w' ? 'l' : homeResult === 'l' ? 'w' : 't';

    extraRecords.forEach(({ map }, i) => {
      const h = map[home];
      const a = map[away];
      if (!h || !a || h !== a) return; // only games inside the same group count
      if (perTeam[i][home]) credit(perTeam[i][home], homeResult);
      if (perTeam[i][away]) credit(perTeam[i][away], awayResult);
    });

    const hg = teamGroup[home];
    const ag = teamGroup[away];
    if (!hg || !ag || hg === ag) continue;
    credit(outside[hg], homeResult);
    credit(outside[ag], awayResult);
  }

  const rows = Object.entries(groups).map(([name, teams]) => {
    const members = teams
      .map(t => byTeam[t])
      .filter(Boolean)
      .map(m => ({
        ...m,
        extras: extraRecords.map((_, i) => perTeam[i][m.team] ?? blank()),
      }))
      .sort((a, b) => a.rank - b.rank);

    const avgRank = members.length
      ? members.reduce((sum, m) => sum + m.rank, 0) / members.length
      : Infinity;
    const rec = outside[name];
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

function GroupDetail({ row, extraRecords, outsideLabel, onClose }) {
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
              {formatRecord(row.record)} {outsideLabel.toLowerCase()}
            </p>
          </div>
        </div>

        <div className="pr-modal-table-wrap">
          <table className="pr-modal-table">
            <thead>
              <tr>
                <th className="pr-mt-num">Rank</th>
                <th>Team</th>
                <th className="pr-mt-res">Overall</th>
                {extraRecords.map(r => (
                  <th key={r.label} className="pr-mt-res">{r.label}</th>
                ))}
                <th className="pr-mt-num">Rating</th>
              </tr>
            </thead>
            <tbody>
              {row.members.map(m => (
                <tr key={m.team}>
                  <td className="pr-mt-num">{m.rank}</td>
                  <td className="pr-mt-opp">{m.team}</td>
                  <td className="pr-mt-res">
                    {m.hasGames ? formatRecord(m.record) : '0–0'}
                  </td>
                  {m.extras.map((rec, i) => (
                    <td key={i} className="pr-mt-res pr-mt-conf">{formatRecord(rec)}</td>
                  ))}
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

export default function GroupRankings({
  rankings,
  games,
  groups,
  extraRecords = [],
  groupNoun = 'Conference',
  outsideLabel = 'Non-Conf',
  heading,
  caption,
  note,
}) {
  const [selected, setSelected] = useState(null);
  const rows = useMemo(
    () => buildGroupRows(rankings, games, groups, extraRecords),
    [rankings, games, groups, extraRecords],
  );

  return (
    <>
      <h2 className="pr-table-heading">{heading}</h2>

      <div className="pr-table-wrap">
        <table className="pr-table">
          {caption && <caption className="pr-sr-only">{caption}</caption>}
          <thead>
            <tr>
              <th className="pr-th-rank">Rank</th>
              <th className="pr-th-team">{groupNoun}</th>
              <th className="pr-th-num">Teams</th>
              <th className="pr-th-num">Avg Rank</th>
              <th className="pr-th-team">Best Team</th>
              <th className="pr-th-record">{outsideLabel}</th>
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
                <td><span className={rankBadgeClass(row.rank)}>{row.rank}</span></td>
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

      {note && <p className="pr-explain-p pr-conf-note">{note}</p>}

      {selected && (
        <GroupDetail
          row={selected}
          extraRecords={extraRecords}
          outsideLabel={outsideLabel}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
