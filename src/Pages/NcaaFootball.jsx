import { useMemo, useState } from 'react';
import SEO from '../components/SEO';
import PowerRankings from '../components/PowerRankings';
import RelatedRankings from '../components/RelatedRankings';
import GroupRankings from '../components/GroupRankings';
import RankingPrinciples from '../components/RankingPrinciples';
import { buildRankings } from '../lib/powerRankings';
import { TEAMS, INITIAL_GAMES } from '../data/cfbGames';
import { UPCOMING_GAMES } from '../data/cfbSchedule';
import { CONFERENCES, TEAM_CONFERENCE } from '../data/cfbConferences';
import { CFB_LOGOS } from '../data/cfbLogos';

// Bump LAST_UPDATED whenever new results are added; it feeds both the visible
// timestamp and dateModified in structured data.
const SEASON = 2026;
const LAST_UPDATED = '2026-09-24';
const SITE = 'https://sebfantasy.com';
const MODEL_COUNT = TEAMS.length;
const FBS_COUNT = TEAMS.length - 1; // TEAMS includes the pooled 'FCS' bucket
const POOLED = ['FCS'];
const CFB_RECORDS = [{ label: 'Conf', map: TEAM_CONFERENCE }];
const CFB_CONFERENCES = Object.keys(CONFERENCES).filter(name => name !== 'FCS');
const CFB_TEAM_LABELS = { FCS: 'FCS' };

const UPDATED_LABEL = new Date(`${LAST_UPDATED}T12:00:00Z`).toLocaleDateString('en-US', {
  month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
});

export default function NcaaFootball() {
  const [tab, setTab] = useState('teams');
  const rankings = useMemo(
    () => buildRankings(TEAMS, INITIAL_GAMES, {
      pooled: POOLED,
      effectiveOpponentRank: true,
    }), [],
  );

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
          `Strength-of-schedule adjusted power ratings for ${FBS_COUNT} FBS teams plus ` +
          `one pooled FCS entry (${MODEL_COUNT} model entries total), ` +
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
        name: `Top 25 College Football Power Rankings, ${SEASON}`,
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
                '√(opponent rank ÷ 139) × point differential, which is negative. The opponent rank used ' +
                'is their effective rank, meaning their rank with that game removed from their record, ' +
                'so a game cannot inflate its own value. Ranks and ratings are solved together by iteration.',
            },
          },
          {
            '@type': 'Question',
            name: 'What is an effective opponent rank?',
            acceptedAnswer: {
              '@type': 'Answer',
              text:
                "Each game is scored against the opponent's rank with that game removed from " +
                'their record. Using their current rank would let a game inflate its own worth: ' +
                'beating a team drags them down the table, which makes the win look weaker, which ' +
                'drags them down again. Removing the game first breaks that loop. Clicking any team ' +
                'shows the effective rank used for every game it played.',
            },
          },
          {
            '@type': 'Question',
            name: 'Why is beating a top team worth so much more?',
            acceptedAnswer: {
              '@type': 'Answer',
              text:
                'The win multiplier is squared, so it falls off steeply. Beating the number one team carries a ' +
                'multiplier of 1.0, while beating the lowest ranked team carries roughly 0.00005, about 19,000 ' +
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
        title={`${SEASON} College Football Power Rankings: ${MODEL_COUNT} Model Entries`}
        path="/ncaa-football"
        description={`Computer power rankings for ${FBS_COUNT} FBS teams plus one pooled FCS entry (${MODEL_COUNT} model entries), updated ${UPDATED_LABEL}. Every result is weighted by opponent rank, so quality wins count and bad losses hurt.`}
        keywords={seoKeywords}
        modifiedDate={LAST_UPDATED}
        jsonLd={structuredData}
      />

      <div className="container">
        <div className="pr-hero">
          <p className="eyebrow">CFB Rankings</p>
          <h1 className="page-title">{SEASON} College Football Power Rankings</h1>
          <p className="pr-sub">
            Every team starts the season at zero. No preseason poll, no votes, no
            committee. The only thing that moves a team is playing games, and the only
            input is the final score. Beat a good team and you climb. Lose to a bad one
            and you fall. Click any team to see exactly how it got where it is.
          </p>
          <p className="pr-updated">
            Updated <time dateTime={LAST_UPDATED}>{UPDATED_LABEL}</time>
            <span className="pr-modal-dot">·</span>
            {INITIAL_GAMES.length} games scored
          </p>
        </div>

        <RankingPrinciples league="college" />

        <div className="pr-tabs" role="tablist" aria-label="Ranking view">
          {[
            { id: 'teams', label: 'Team Rankings' },
            { id: 'conferences', label: 'Conference Rankings' },
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

        {tab === 'conferences' && (
          <GroupRankings
            rankings={rankings}
            games={INITIAL_GAMES}
            groups={CONFERENCES}
            extraRecords={CFB_RECORDS}
            groupNoun="Conference"
            outsideLabel="Non-Conf"
            heading={`${SEASON} Conference Power Rankings`}
            caption={`${SEASON} college football conference rankings, ordered by the average power ranking of each league's members, as of ${UPDATED_LABEL}.`}
            note={
              'Conferences are ordered by the average power ranking of every member, so a ' +
              'league is only as strong as its full membership rather than its best few ' +
              'teams. The non-conference record counts only games against teams from ' +
              'another league. Those are the games that actually compare one league to ' +
              'another.'
            }
          />
        )}

        <div hidden={tab !== 'teams'}>
        <PowerRankings
          rankings={rankings}
          upcomingGames={UPCOMING_GAMES}
          pooled={POOLED}
          teamLabels={CFB_TEAM_LABELS}
          teamLogos={CFB_LOGOS}
          conferenceMap={TEAM_CONFERENCE}
          conferenceOptions={CFB_CONFERENCES}
          tableHeading={`${SEASON} College Football Power Rankings, 1–${MODEL_COUNT-1}`}
          caption={`${SEASON} college football power rankings for ${MODEL_COUNT} model entries—${FBS_COUNT} FBS teams and one pooled FCS entry—listing each entry's rank, record, and power rating as of ${UPDATED_LABEL}.`}
          pooledNote={
            <>
              <strong>All FCS opponents are pooled into one entry.</strong> Every FCS game
              feeds the same bucket, so that entry absorbs a large negative score and settles
              near the bottom, which drives the win multiplier close to zero. Beating an FCS
              team is therefore worth almost nothing regardless of the margin, and the size of
              the blowout is effectively discarded.
            </>
          }
        />
        </div>

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
