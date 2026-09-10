import { useCallback, useMemo, useState } from 'react';
import SEO from '../components/SEO';
import PowerRankings from '../components/PowerRankings';
import RelatedRankings from '../components/RelatedRankings';
import { TEAMS, INITIAL_GAMES } from '../data/cfbGames';

// Bump LAST_UPDATED whenever new results are added; it feeds both the visible
// timestamp and dateModified in structured data.
const SEASON = 2026;
const LAST_UPDATED = '2026-09-08';
const SITE = 'https://sebfantasy.com';
const FBS_COUNT = TEAMS.length - 1; // TEAMS includes the pooled 'FCS' bucket

const UPDATED_LABEL = new Date(`${LAST_UPDATED}T12:00:00Z`).toLocaleDateString('en-US', {
  month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
});

export default function NcaaFootball() {
  const [rankings, setRankings] = useState([]);
  const onRankings = useCallback(setRankings, []);

  // 'FCS' is a pooled bucket rather than a real program, so it stays out of
  // anything presented to search engines as a team.
  const rated = rankings.filter(r => r.hasGames && r.team !== 'FCS');

  const structuredData = useMemo(() => ({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
          { '@type': 'ListItem', position: 2, name: `${SEASON} College Football Power Rankings`, item: `${SITE}/ncaa-football` },
        ],
      },
      {
        '@type': 'Dataset',
        name: `${SEASON} College Football Power Rankings`,
        description:
          `Strength-of-schedule adjusted power ratings for all ${FBS_COUNT} FBS teams, ` +
          "derived from every completed game. Each result is weighted by the opponent's rank, " +
          'so wins over strong teams and losses to weak ones move a team furthest.',
        url: `${SITE}/ncaa-football`,
        creator: { '@type': 'Person', name: 'Jake Sebahar' },
        isAccessibleForFree: true,
        dateModified: LAST_UPDATED,
        temporalCoverage: String(SEASON),
        measurementTechnique: 'Iterative strength-of-schedule weighted point differential',
        variableMeasured: [
          { '@type': 'PropertyValue', name: 'Power rating', description: 'Sum of opponent-weighted game values' },
          { '@type': 'PropertyValue', name: 'Rank', description: `Position from 1 to ${TEAMS.length}` },
          { '@type': 'PropertyValue', name: 'Record', description: 'Wins and losses' },
        ],
        keywords: ['college football', 'power rankings', 'FBS', 'strength of schedule', String(SEASON)],
      },
      ...(rated.length ? [{
        '@type': 'ItemList',
        name: `Top 25 College Football Power Rankings — ${SEASON}`,
        description: `The 25 highest-rated FBS teams as of ${UPDATED_LABEL}.`,
        itemListOrder: 'https://schema.org/ItemListOrderAscending',
        numberOfItems: Math.min(25, rated.length),
        itemListElement: rated.slice(0, 25).map((r, i) => ({
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
            name: 'How are these college football power rankings calculated?',
            acceptedAnswer: {
              '@type': 'Answer',
              text:
                "Every game produces a single value, and a team's rating is the sum of those values. " +
                'A win is worth ((140 − opponent rank) ÷ 139)² × point differential. A loss is worth ' +
                '√(opponent rank ÷ 139) × point differential, which is negative. Because scoring a game ' +
                "requires knowing the opponent's rank, the ranks and ratings are solved together by iteration.",
            },
          },
          {
            '@type': 'Question',
            name: 'Why is beating a top team worth so much more?',
            acceptedAnswer: {
              '@type': 'Answer',
              text:
                'The win multiplier is squared, so it falls off steeply. Beating the number one team carries a ' +
                'multiplier of 1.0, while beating the lowest ranked team carries roughly 0.00005 — about 19,000 ' +
                'times less per point of margin. Running up the score against a weak opponent earns almost nothing.',
            },
          },
          {
            '@type': 'Question',
            name: 'Why do blowout losses hurt more than blowout wins help?',
            acceptedAnswer: {
              '@type': 'Answer',
              text:
                'Losses use a square root rather than a square, so the penalty climbs quickly and then flattens. ' +
                'A 16 point win over a mid-tier team is worth about 2 points of rating, while a 41 point loss to a ' +
                'top-35 team costs nearly 20. One bad afternoon moves a team much further than one good one.',
            },
          },
          {
            '@type': 'Question',
            name: 'How are FCS opponents handled?',
            acceptedAnswer: {
              '@type': 'Answer',
              text:
                'All FCS opponents are pooled into a single entry. That entry absorbs a large negative rating and ' +
                'settles near the bottom, which drives the win multiplier close to zero. Beating an FCS team is ' +
                'therefore worth almost nothing regardless of the final margin.',
            },
          },
        ],
      },
    ],
  }), [rated]);

  const seoKeywords = useMemo(() => [
    `college football power rankings ${SEASON}`,
    'college football rankings',
    'CFB power rankings',
    'FBS power rankings',
    'college football computer rankings',
    'strength of schedule rankings',
    'ncaa football rankings',
    'college football analytics',
  ], []);

  return (
    <main className="page">
      <SEO
        title={`${SEASON} College Football Power Rankings — All ${FBS_COUNT} FBS Teams`}
        path="/ncaa-football"
        description={`Computer power rankings for all ${FBS_COUNT} FBS teams, updated ${UPDATED_LABEL}. Every result is weighted by opponent rank, so quality wins count and bad losses hurt. Full methodology and per-game math included.`}
        keywords={seoKeywords}
        modifiedDate={LAST_UPDATED}
        jsonLd={structuredData}
      />

      <div className="container">
        <div className="pr-hero">
          <p className="eyebrow">CFB Rankings</p>
          <h1 className="page-title">{SEASON} College Football Power Rankings</h1>
          <p className="pr-sub">
            A strength-adjusted computer model covering all {FBS_COUNT} FBS teams, where
            every win and loss is weighted by your opponent's rank. Beating a top team is
            worth more. Losing to a weak team costs more. Click any team to see the math
            behind its rating.
          </p>
          <p className="pr-updated">
            Updated <time dateTime={LAST_UPDATED}>{UPDATED_LABEL}</time>
            <span className="pr-modal-dot">·</span>
            {INITIAL_GAMES.length} games scored
          </p>
        </div>

        <PowerRankings
          teams={TEAMS}
          games={INITIAL_GAMES}
          onRankings={onRankings}
          tableHeading={`Full ${SEASON} FBS Power Rankings, 1–${FBS_COUNT}`}
          caption={`${SEASON} college football power rankings for all ${FBS_COUNT} FBS teams, listing each team's rank, win-loss record, and power rating as of ${UPDATED_LABEL}.`}
          example={{
            win: {
              title: 'USC 42, San Jose State 26 — a win over the #91 team',
              math:
                'D = 42 − 26 = 16\n' +
                '(140 − 91) ÷ 139 = 49 ÷ 139 = 0.352518\n' +
                '0.352518² = 0.124269\n' +
                '0.124269 × 16 = +1.9883',
            },
            loss: {
              title: 'Clemson 10, LSU 51 — a loss to the #32 team',
              math:
                'D = 10 − 51 = −41\n' +
                '32 ÷ 139 = 0.230216\n' +
                '√0.230216 = 0.479808\n' +
                '0.479808 × −41 = −19.6721',
            },
            note:
              "Note how asymmetric those are. USC's 16-point win over a mid-tier team earned " +
              "about 2 points; Clemson's 41-point loss cost nearly 20. Blowout losses are " +
              'punished far harder than blowout wins are rewarded, which is why one bad ' +
              'afternoon sinks a team so far down the table.',
          }}
          pooledNote={
            <>
              <strong>All FCS opponents are pooled into one entry.</strong> Every FCS game
              feeds the same bucket, so that entry absorbs a large negative score and settles
              near the bottom — which drives the win multiplier close to zero. Beating an FCS
              team is therefore worth almost nothing regardless of the margin, and the size of
              the blowout is effectively discarded.
            </>
          }
        />

        <RelatedRankings
          links={[
            {
              to: '/nfl-rankings',
              label: `${SEASON} NFL Power Rankings`,
              blurb: 'The same strength-adjusted model run over all 32 NFL teams.',
            },
            {
              to: '/march-madness',
              label: 'March Madness Bracket Strategy',
              blurb: 'Leverage-based bracket picks built on the same analytics approach.',
            },
          ]}
        />
      </div>
    </main>
  );
}
