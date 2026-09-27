import { useMemo } from 'react';
import { buildStandings, buildPlayoffField } from '../lib/cfbStandings';

function Logo({ team, logos, size = 22 }) {
  const src = logos?.[team];
  if (!src) return null;
  return <img src={src} alt="" className="pr-logo-inline" width={size} height={size} loading="lazy" decoding="async" />;
}

function Slot({ entry, logos }) {
  if (!entry) return <div className="pr-bracket-slot pr-bracket-slot--empty">TBD</div>;
  return (
    <div className="pr-bracket-slot">
      <span className="pr-bracket-seed">{entry.seed}</span>
      <Logo team={entry.team} logos={logos} />
      <span className="pr-bracket-team">{entry.team}</span>
      <span className="pr-bracket-rank">#{entry.rank}</span>
    </div>
  );
}

export default function PlayoffBracket({
  rankings, games, conferences, teamConference, teamLogos, exclude = [], season,
}) {
  const field = useMemo(() => {
    const standings = buildStandings({ rankings, games, conferences, teamConference, exclude });
    return buildPlayoffField({ standings, rankings, exclude });
  }, [rankings, games, conferences, teamConference, exclude]);

  return (
    <>
      <h2 className="pr-table-heading">{season} SEB Playoff Bracket</h2>

      <p className="pr-explain-p pr-conf-note">
        The 12-team field as the rankings on this page would set it today. The ACC, Big
        Ten, Big 12 and SEC champions take automatic bids, with the champion read as
        whoever sits atop that conference's standings. The highest rated team from the
        other six conferences takes a bid whether or not they win their league, and Notre
        Dame takes one if they land inside the top 12. Everything left is filled by
        rating. Seeds run 1 to 12 strictly on rating, so a bye is earned by where a team
        is rated rather than by winning a conference.
      </p>

      <h3 className="pr-explain-h3">Byes and the quarterfinal they feed</h3>
      <div className="pr-bracket-grid">
        {field.quarterfinals.map(q => (
          <div key={q.bye?.seed} className="pr-bracket-path">
            <div className="pr-bracket-bye">
              <span className="pr-bracket-seed pr-bracket-seed--bye">{q.bye?.seed}</span>
              <Logo team={q.bye?.team} logos={teamLogos} size={30} />
              <div>
                <p className="pr-bracket-bye-team">{q.bye?.team}</p>
                <p className="pr-bracket-bye-why">{q.bye?.reason}</p>
              </div>
            </div>

            <p className="pr-bracket-plays">plays the winner of</p>

            <div className="pr-bracket-game">
              <Slot entry={q.high} logos={teamLogos} />
              <span className="pr-bracket-vs">vs</span>
              <Slot entry={q.low} logos={teamLogos} />
            </div>
          </div>
        ))}
      </div>

      <h3 className="pr-explain-h3">How each team got in</h3>
      <div className="pr-table-wrap">
        <table className="pr-table">
          <thead>
            <tr>
              <th className="pr-th-rank">Seed</th>
              <th className="pr-th-team">Team</th>
              <th className="pr-th-num">Rank</th>
              <th className="pr-th-team">Bid</th>
            </tr>
          </thead>
          <tbody>
            {field.seeded.map(s => (
              <tr key={s.team} className="pr-tr--active">
                <td><span className={`pr-rank${s.seed <= 4 ? ' pr-rank--top3' : ''}`}>{s.seed}</span></td>
                <td className="pr-td-team">
                  <span className="pr-team-cell">
                    <span>{s.team}</span>
                    <Logo team={s.team} logos={teamLogos} size={24} />
                  </span>
                </td>
                <td className="pr-td-num">{s.rank}</td>
                <td className="pr-td-best">{s.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {field.nextOut.length > 0 && (
        <p className="pr-explain-p pr-conf-note">
          <strong>First teams out:</strong>{' '}
          {field.nextOut.map(r => `#${r.rank} ${r.team}`).join(', ')}.
        </p>
      )}
    </>
  );
}
