import { useMemo, useState } from 'react';
import SEO from '../components/SEO';
import PowerRankings from '../components/PowerRankings';
import RelatedRankings from '../components/RelatedRankings';
import RankingPrinciples from '../components/RankingPrinciples';
import GroupRankings from '../components/GroupRankings';
import {
  NFL_CONFERENCES, NFL_DIVISIONS, TEAM_CONFERENCE, TEAM_DIVISION,
} from '../data/nflStructure';
import { buildRankings, CURVE_LINEAR } from '../lib/powerRankings';
import { NFL_TEAMS, NFL_GAMES } from '../data/nflGames';
import { NFL_UPCOMING } from '../data/nflSchedule';
import { NFL_LOGOS } from '../data/nflLogos';

// Bump LAST_UPDATED whenever new results are added; it feeds both the visible
// timestamp and dateModified in structured data.
const SEASON = 2026;
const LAST_UPDATED = '2026-09-21';
const SITE = 'https://sebfantasy.com';

const UPDATED_LABEL = new Date(`${LAST_UPDATED}T12:00:00Z`).toLocaleDateString('en-US', {
  month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
});

// Both grouping tabs show the same three records per team.
const NFL_RECORDS = [
  { label: 'Conf', map: TEAM_CONFERENCE },
  { label: 'Div', map: TEAM_DIVISION },
];

const NFL_CONFERENCE_FILTERS = Object.keys(NFL_CONFERENCES);
const NFL_DIVISION_FILTERS = Object.keys(NFL_DIVISIONS);
const NFL_RANK_FILTERS = [
  { value: '5', label: 'Top 5' },
  { value: '10', label: 'Top 10' },
  { value: '16', label: 'Top 16' },
];
const NFL_RANK_BADGE_CUTOFFS = [3, 8, 15, 25];

export default function NflRankings() {
  const [tab, setTab] = useState('teams');
  const rankings = useMemo(
    () => buildRankings(NFL_TEAMS, NFL_GAMES, { curve: CURVE_LINEAR }), [],
  );

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
        name: `NFL Power Rankings, ${SEASON}`,
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
        title={`${SEASON} NFL Power Rankings: All 32 Teams`}
        path="/nfl-rankings"
        description={`Computer NFL power rankings for all 32 teams, updated ${UPDATED_LABEL}. Every result is weighted by opponent rank, so quality wins count and bad losses hurt. No voting and no opinion. Full methodology and per-game math included.`}
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
            All 32 teams start the season at zero. It does not matter who won last year
            or who the league put in prime time. The only input is the final score, and
            the only way to move is to play. Click any team to see exactly how it got
            where it is.
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
            until games are added. The table below shows the model standing by. Rankings
            will populate as soon as scores are in.
          </div>
        )}

        <RankingPrinciples league="nfl" />

        <div className="pr-tabs" role="tablist" aria-label="Ranking view">
          {[
            { id: 'teams', label: 'Team Rankings' },
            { id: 'conference', label: 'Conference Rankings' },
            { id: 'division', label: 'Division Rankings' },
          ].map(t => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              className={`pr-tab${tab === t.id ? ' pr-tab--active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'conference' && (
          <GroupRankings
            rankings={rankings}
            games={NFL_GAMES}
            groups={NFL_CONFERENCES}
            extraRecords={NFL_RECORDS}
            groupNoun="Conference"
            outsideLabel="Inter-Conf"
            heading={`${SEASON} AFC vs NFC`}
            caption={`${SEASON} NFL conference rankings by the average power ranking of their teams, as of ${UPDATED_LABEL}.`}
            note={
              'Conferences are ranked on the average power ranking of all 16 teams, so ' +
              'depth counts as much as the team at the top. The record shown is against ' +
              'the other conference, since those are the only games that compare the two. ' +
              'Click a conference to see every team with its overall, conference and ' +
              'division record.'
            }
          />
        )}

        {tab === 'division' && (
          <GroupRankings
            rankings={rankings}
            games={NFL_GAMES}
            groups={NFL_DIVISIONS}
            extraRecords={NFL_RECORDS}
            groupNoun="Division"
            outsideLabel="Non-Div"
            heading={`${SEASON} NFL Division Rankings, 1\u20138`}
            caption={`${SEASON} NFL division rankings by the average power ranking of their four teams, as of ${UPDATED_LABEL}.`}
            note={
              'All eight divisions are ranked on the average power ranking of their four ' +
              'teams. The record shown is against teams outside the division. Division ' +
              'games also count toward the conference record, the way they do in the ' +
              'standings.'
            }
          />
        )}

        <div hidden={tab !== 'teams'}>
        <PowerRankings
          rankings={rankings}
          extraRecords={NFL_RECORDS}
          curve={CURVE_LINEAR}
          upcomingGames={NFL_UPCOMING}
          searchLabel="Search team…"
          teamLogos={NFL_LOGOS}
          conferenceMap={TEAM_CONFERENCE}
          conferenceOptions={NFL_CONFERENCE_FILTERS}
          divisionMap={TEAM_DIVISION}
          divisionOptions={NFL_DIVISION_FILTERS}
          rankOptions={NFL_RANK_FILTERS}
          rankBadgeCutoffs={NFL_RANK_BADGE_CUTOFFS}
          tableHeading={`Full ${SEASON} NFL Power Rankings, 1–32`}
          caption={`${SEASON} NFL power rankings for all 32 teams, listing each team's rank, record, and power rating as of ${UPDATED_LABEL}.`}
        />
        </div>

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
