import { useMemo } from 'react';
import { buildStandings } from '../lib/cfbStandings';

function formatRecord({ w, l, t }) {
  return t > 0 ? `${w}–${l}–${t}` : `${w}–${l}`;
}

function Logo({ team, logos }) {
  const src = logos?.[team];
  if (!src) return null;
  return <img src={src} alt="" className="pr-logo-inline" width={20} height={20} loading="lazy" decoding="async" />;
}

export default function ConferenceStandings({
  rankings, games, conferences, teamConference, teamLogos, exclude = [], season,
  heading, note, orderBy = 'group', extraRecords = [],
}) {
  const standings = useMemo(
    () => buildStandings({ rankings, games, conferences, teamConference, exclude, orderBy }),
    [rankings, games, conferences, teamConference, exclude, orderBy],
  );

  // Record against opponents sharing a grouping, read off each team's game log.
  const subRecord = (team, map) => {
    const mine = map?.[team];
    const rec = { w: 0, l: 0, t: 0 };
    if (!mine) return rec;
    const row = rankings.find(r => r.team === team);
    for (const g of row?.games ?? []) {
      if (map[g.opponent] !== mine) continue;
      if (g.result === 'W') rec.w++;
      else if (g.result === 'L') rec.l++;
      else rec.t++;
    }
    return rec;
  };

  return (
    <>
      <h2 className="pr-table-heading">{heading ?? `${season} Conference Standings`}</h2>

      <p className="pr-explain-p pr-conf-note">
        {note ?? (orderBy === 'overall'
          ? 'Teams are ordered by overall record. Ties are broken by head-to-head, then by record against the other teams on the same record, then by the in-group record, and finally by power rating.'
          : 'Teams are ordered by conference record first. Ties are broken by head-to-head, then by record against the other teams on the same conference record, then by overall record, and finally by power rating.')}
      </p>

      <div className="pr-standings-grid">
        {standings.map(({ conference, teams }) => (
          <section key={conference} className="pr-standings-card">
            <h3 className="pr-standings-conf">{conference}</h3>
            <table className="pr-standings-table">
              <thead>
                <tr>
                  <th className="pr-mt-num">#</th>
                  <th>Team</th>
                  <th className="pr-mt-res">Overall</th>
                  {extraRecords.map(r => (
                    <th key={r.label} className="pr-mt-res">{r.label}</th>
                  ))}
                  <th className="pr-mt-num">Rank</th>
                </tr>
              </thead>
              <tbody>
                {teams.map(t => (
                  <tr key={t.team} className={t.place === 1 ? 'pr-standings-leader' : undefined}>
                    <td className="pr-mt-num">{t.place}</td>
                    <td className="pr-mt-opp">
                      <Logo team={t.team} logos={teamLogos} />
                      {t.team}
                    </td>
                    <td className="pr-mt-res">{formatRecord(t.overall)}</td>
                    {extraRecords.map(r => (
                      <td key={r.label} className="pr-mt-res pr-mt-conf">
                        {formatRecord(subRecord(t.team, r.map))}
                      </td>
                    ))}
                    <td className="pr-mt-num">{t.rank}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>
    </>
  );
}
