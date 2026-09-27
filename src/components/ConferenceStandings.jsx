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
}) {
  const standings = useMemo(
    () => buildStandings({ rankings, games, conferences, teamConference, exclude }),
    [rankings, games, conferences, teamConference, exclude],
  );

  return (
    <>
      <h2 className="pr-table-heading">{season} Conference Standings</h2>

      <p className="pr-explain-p pr-conf-note">
        Teams are ordered by conference record first. Ties are broken by head-to-head,
        then by record against the other teams on the same conference record, then by
        overall record, and finally by power rating. Conference play is still early, so
        most leagues are separated by only a game or two.
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
                  <th className="pr-mt-res">Conf</th>
                  <th className="pr-mt-res">Overall</th>
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
                    <td className="pr-mt-res">{formatRecord(t.conf)}</td>
                    <td className="pr-mt-res pr-mt-conf">{formatRecord(t.overall)}</td>
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
