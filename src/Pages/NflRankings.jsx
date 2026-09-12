import { useCallback, useMemo, useState } from 'react';
import SEO from '../components/SEO';
import PowerRankings from '../components/PowerRankings';
import RelatedRankings from '../components/RelatedRankings';
import { NFL_TEAMS, NFL_GAMES } from '../data/nflGames';

// Bump LAST_UPDATED whenever new results are added; it feeds both the visible
// timestamp and dateModified in structured data.
const SEASON = 2026;
const LAST_UPDATED = '2026-09-12';
const SITE = 'https://sebfantasy.com';

const UPDATED_LABEL = new Date(`${LAST_UPDATED}T12:00:00Z`).toLocaleDateString('en-US', {
  month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
});

export default function NflRankings() {
  const [rankings, setRankings] = useState([]);
  const onRankings = useCallback(setRankings, []);

  const rated = rankings.filter(r => r.hasGames);
  const hasData = NFL_GAMES.length > 0;

  const structuredData = useMemo(() => ({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
          { '@type': 'ListItem', position: 2, name: `${SEASON} NFL Power Rankings`, item: `${SITE}/nfl-rankings` },
        ],
      },
      {
        '@type': 'Dataset',
        name: `${SEASON} NFL Power Rankings`,
        description:
          'Strength-of-schedule adjusted power ratings for all 32 NFL teams, derived from ' +
          "every completed game. Each result is weighted by the opponent's rank, so wins " +
          'over strong teams and losses to weak ones move a team furthest.',
        url: `${SITE}/nfl-rankings`,
        creator: { '@type': 'Person', name: 'Jake Sebahar' },
        isAccessibleForFree: true,
        dateModified: LAST_UPDATED,
        temporalCoverage: String(SEASON),
        measurementTechnique: 'Iterative strength-of-schedule weighted point differential',
        variableMeasured: [
          { '@type': 'PropertyValue', name: 'Power rating', description: 'Sum of opponent-weighted game values' },
          { '@type': 'PropertyValue', name: 'Rank', description: 'Position from 1 to 32' },
          { '@type': 'PropertyValue', name: 'Record', description: 'Wins, losses and ties' },
        ],
        keywords: ['NFL', 'power rankings', 'strength of schedule', String(SEASON)],
      },
      ...(rated.length ? [{
        '@type': 'ItemList',
        name: `NFL Power Rankings — ${SEASON}`,
        description: `All 32 NFL teams ranked by power rating as of ${UPDATED_LABEL}.`,
        itemListOrder: 'https://schema.org/ItemListOrderAscending',
        numberOfItems: rated.length,
        itemListElement: rated.map((r, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: r.team,
          item: { '@type': 'SportsTeam', name: r.team, sport: 'American Football' },
        })),
      }] : []),
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'How are these NFL power rankings calculated?',
            acceptedAnswer: {
              '@type': 'Answer',
              text:
                "Every game produces a single value, and a team's rating is the sum of those " +
                'values. A win is worth ((33 − opponent rank) ÷ 32)² × point differential. A ' +
                'loss is worth √(opponent rank ÷ 32) × point differential, which is negative. ' +
                "Because scoring a game requires knowing the opponent's rank, the ranks and " +
                'ratings are solved together by iteration.',
            },
          },
          {
            '@type': 'Question',
            name: 'Are these power rankings based on opinion?',
            acceptedAnswer: {
              '@type': 'Answer',
              text:
                'No. Nothing is entered by hand except the final scores. The rankings are ' +
                'computed entirely from game results and margins, weighted by opponent ' +
                'strength, so there is no voting or subjective adjustment.',
            },
          },
          {
            '@type': 'Question',
            name: 'Why do blowout losses hurt more than blowout wins help?',
            acceptedAnswer: {
              '@type': 'Answer',
              text:
                'Wins use a squared multiplier and losses use a square root. The square root ' +
                'is concave, so the penalty climbs quickly and then flattens, while the ' +
                'squared win multiplier falls off steeply. One bad loss moves a team further ' +
                'than one good win.',
            },
          },
        ],
      },
    ],
  }), [rated]);

  const seoKeywords = useMemo(() => [
    `NFL power rankings ${SEASON}`,
    'NFL power rankings',
    'NFL computer rankings',
    'NFL team rankings',
    'NFL strength of schedule',
    'NFL analytics',
    'NFL rankings by record',
  ], []);

  return (
    <main className="page">
      <SEO
        title={`${SEASON} NFL Power Rankings — All 32 Teams`}
        path="/nfl-rankings"
        description={`Computer NFL power rankings for all 32 teams, updated ${UPDATED_LABEL}. Every result is weighted by opponent rank, so quality wins count and bad losses hurt. No voting, no opinion — full methodology and per-game math included.`}
        keywords={seoKeywords}
        modifiedDate={LAST_UPDATED}
        jsonLd={structuredData}
        noindex={!hasData}
      />

      <div className="container">
        <div className="pr-hero">
          <p className="eyebrow">NFL Rankings</p>
          <h1 className="page-title">{SEASON} NFL Power Rankings</h1>
          <p className="pr-sub">
            The same strength-adjusted model behind the college rankings, run over all 32
            NFL teams. Every win and loss is weighted by your opponent's rank — beating a
            top team is worth more, losing to a weak one costs more. No voting, no opinion.
            Click any team to see the math behind its rating.
          </p>
          <p className="pr-updated">
            Updated <time dateTime={LAST_UPDATED}>{UPDATED_LABEL}</time>
            <span className="pr-modal-dot">·</span>
            {NFL_GAMES.length} {NFL_GAMES.length === 1 ? 'game' : 'games'} scored
          </p>
        </div>

        {!hasData && (
          <div className="pr-notice">
            <strong>No results yet for the {SEASON} season.</strong> Every team sits at 0.00
            until games are added — the table below shows the model standing by. Rankings
            will populate as soon as scores are in.
          </div>
        )}

        <PowerRankings
          teams={NFL_TEAMS}
          games={NFL_GAMES}
          onRankings={onRankings}
          searchLabel="Search team…"
          tableHeading={`Full ${SEASON} NFL Power Rankings, 1–32`}
          caption={`${SEASON} NFL power rankings for all 32 teams, listing each team's rank, record, and power rating as of ${UPDATED_LABEL}.`}
          example={{
            win: {
              title: 'A 7-point win over the #4 team',
              math:
                'D = 7\n' +
                '(33 − 4) ÷ 32 = 29 ÷ 32 = 0.906250\n' +
                '0.906250² = 0.821289\n' +
                '0.821289 × 7 = +5.7490',
            },
            loss: {
              title: 'A 21-point loss to the #28 team',
              math:
                'D = −21\n' +
                '28 ÷ 32 = 0.875000\n' +
                '√0.875000 = 0.935414\n' +
                '0.935414 × −21 = −19.6437',
            },
            note:
              'Note how asymmetric those are. A solid win over a good team is worth under 6 ' +
              'points; a blowout loss to a bad one costs nearly 20. In a 17-game season that ' +
              'gap is what separates the contenders from everyone else.',
          }}
        />

        <RelatedRankings
          links={[
            {
              to: '/ncaa-football',
              label: `${SEASON} College Football Power Rankings`,
              blurb: 'The same model run over every FBS team, updated through the current week.',
            },
            {
              to: '/nfl-fantasy',
              label: 'NFL Fantasy Tools',
              blurb: 'ADP leverage rankings and draft targets for your fantasy league.',
            },
          ]}
        />
      </div>
    </main>
  );
}
