import { Link } from 'react-router-dom';
import { blogPosts } from '../data/blogPosts';
import SEO from '../components/SEO';
import { TEAMS, INITIAL_GAMES } from '../data/cfbGames';
import { NFL_TEAMS, NFL_GAMES } from '../data/nflGames';
import { CONFERENCES } from '../data/cfbConferences';
import './Home.css';

// Counts come straight from the data so the homepage cannot drift out of date.
const TEAMS_RANKED = (TEAMS.length - 1) + NFL_TEAMS.length; // less the pooled FCS entry
const GAMES_SCORED = INITIAL_GAMES.length + NFL_GAMES.length;
const CONFERENCE_COUNT = Object.keys(CONFERENCES).length;

const NFL_FEATURES = [
  {
    label: 'VOR Rankings',
    desc: 'Ranks every player by how much they outscore the last expected starter at their position, not just raw projected points.',
  },
  {
    label: 'SEB Leverage',
    desc: 'Shows how many spots the model values a player above or below your current pick number, round by round.',
  },
  {
    label: 'ADP Leverage',
    desc: 'Surfaces where the market is wrong across Sleeper, ESPN, Yahoo, and Underdog.',
  },
  {
    label: 'Free, No Login',
    desc: 'No account needed. Open it on your phone at the draft table and use it in real time.',
  },
];

const TOOLS = [
  {
    path: '/ncaa-football',
    icon: '🏆',
    iconBg: 'linear-gradient(135deg, rgba(220,85,10,0.12) 0%, rgba(220,85,10,0.04) 100%)',
    live: true,
    badgeLabel: '● Live',
    badgeType: 'live',
    name: 'College Football Rankings',
    desc: 'All 139 teams ranked off results alone. No preseason poll and no voters, so every team starts at zero and has to earn its spot. Conference rankings too.',
  },
  {
    path: '/nfl-rankings',
    icon: '🏈',
    iconBg: 'linear-gradient(135deg, rgba(13,45,98,0.12) 0%, rgba(13,45,98,0.04) 100%)',
    live: true,
    badgeLabel: 'New for 2026',
    badgeType: 'new',
    name: 'NFL Power Rankings',
    desc: 'The same model run over all 32 teams. Last year counts for nothing. Beat a good team and you climb, lose to a bad one and you drop.',
  },
  {
    path: '/nfl-fantasy',
    icon: '🏈',
    iconBg: 'linear-gradient(135deg, rgba(132,198,42,0.18) 0%, rgba(114,177,31,0.07) 100%)',
    live: true,
    badgeLabel: 'New for 2026',
    badgeType: 'new',
    name: 'NFL Fantasy Draft Model',
    desc: 'VOR-based rankings and real-time leverage at your exact pick. Know who the market is sleeping on before the clock starts.',
  },
  {
    path: '/march-madness',
    icon: '🏀',
    iconBg: 'linear-gradient(135deg, rgba(13,45,98,0.12) 0%, rgba(13,45,98,0.04) 100%)',
    live: true,
    badgeLabel: '● Live',
    badgeType: 'live',
    name: 'March Madness',
    desc: 'Our Advanced Leverage Model finds where the public misprices teams and builds the optimal bracket to beat the field. 96th percentile in 2026.',
  },
];

export default function Home() {
  const latestPost = blogPosts[0];
  const recentPosts = blogPosts.slice(1);

  return (
    <main className="home">
      <SEO
        path="/"
        description="Unbiased college football and NFL power rankings. No preseason poll and no voters, so every team starts at zero and is ranked only on games played. Plus free fantasy draft and March Madness tools."
        keywords={['college football power rankings', 'nfl power rankings', 'unbiased football rankings', 'computer football rankings', 'no preseason poll rankings', 'conference rankings college football', 'nfl fantasy draft tool 2026', 'march madness bracket strategy']}
      />

      {/* ── HERO ───────────────────────────────────────────────── */}
      <section className="h-hero">
        <div className="h-hero-glow2" aria-hidden="true" />

        <div className="container">
          <div className="h-hero-grid">

            <div className="h-hero-copy">
              <span className="eyebrow">2026 College Football and NFL</span>
              <h1 className="h-hero-title">
                Every Team<br />
                <span className="h-hero-green">Starts at Zero.</span>
              </h1>
              <p className="h-hero-sub">
                No preseason poll. No voters. No committee. Just the final score of games
                that have actually been played, run through the same formula for every
                team. Beat a good team and you climb. Lose to a bad one and you drop.
              </p>
              <div className="h-hero-btns">
                <Link to="/ncaa-football" className="h-btn-primary">
                  College Football Rankings →
                </Link>
                <Link to="/nfl-rankings" className="h-btn-ghost">
                  NFL Power Rankings →
                </Link>
              </div>
            </div>

            <div className="h-hero-visual">
              <div className="h-hero-logo-wrap">
                <img src="/logo.png" alt="SEB Fantasy" className="h-hero-logo" />
              </div>
            </div>

          </div>
        </div>

        {/* Stats strip */}
        <div className="h-stats-bar">
          <div className="container">
            <div className="h-stats">
              <div className="h-stat">
                <strong>{TEAMS_RANKED}</strong>
                <span>Teams Ranked</span>
              </div>
              <div className="h-stat-sep" aria-hidden="true" />
              <div className="h-stat">
                <strong>{GAMES_SCORED}</strong>
                <span>Games Scored</span>
              </div>
              <div className="h-stat-sep" aria-hidden="true" />
              <div className="h-stat">
                <strong>0</strong>
                <span>Votes Cast</span>
              </div>
              <div className="h-stat-sep" aria-hidden="true" />
              <div className="h-stat">
                <strong>100%</strong>
                <span>Free</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RANKINGS PHILOSOPHY */}
      <section className="h-unbiased">
        <div className="container">
          <div className="h-unbiased-head">
            <p className="eyebrow">Power Rankings</p>
            <h2 className="h-section-title">Rankings that owe nobody a favor</h2>
            <p className="h-section-sub">
              Most rankings start with a poll written before anyone plays. Ours start at zero.
            </p>
          </div>

          <div className="h-unbiased-grid">
            <div className="h-unbiased-card">
              <p className="h-unbiased-label">The problem</p>
              <p className="h-unbiased-body">
                A preseason poll is a guess. It runs on last year's record, returning
                starters, and name recognition. Then it sticks. A team ranked in August
                has to lose several times to drop, and a team left off has to win a pile
                of games to climb. Teams spend months ranked above teams they never
                played and never beat.
              </p>
            </div>

            <div className="h-unbiased-card">
              <p className="h-unbiased-label">What we do instead</p>
              <p className="h-unbiased-body">
                Every team opens at 0.00. Nobody gets credit for a reputation. From
                there the only thing that counts is the final score of games actually
                played, run through one formula that treats all teams the same. Week 1
                is worth the same to everybody.
              </p>
            </div>

            <div className="h-unbiased-card">
              <p className="h-unbiased-label">Why it holds up</p>
              <p className="h-unbiased-body">
                No votes and no committee, so there is nothing to lobby. Beating a good
                team is worth a lot, losing to a bad one costs a lot, and running up the
                score on a weak opponent earns close to nothing. Click any team and you
                can check the math on every game it played.
              </p>
            </div>
          </div>

          <div className="h-unbiased-btns">
            <Link to="/ncaa-football" className="h-btn-primary">College Football Rankings →</Link>
            <Link to="/nfl-rankings" className="h-btn-primary">NFL Power Rankings →</Link>
          </div>
        </div>
      </section>

      {/* ── NFL SPOTLIGHT ───────────────────────────────────────── */}
      <section className="h-nfl-spot">
        <div className="container">
          <div className="h-nfl-grid">

            <div className="h-nfl-copy">
              <span className="eyebrow h-nfl-eyebrow">NFL Fantasy Draft Model</span>
              <h2 className="h-nfl-title">Draft day just got a lot less stressful.</h2>
              <p className="h-nfl-sub">
                Most tools give you a ranked list and leave you to figure out the
                rest. This one tells you who the market is undervaluing at the
                exact pick where you can grab them. Set your league settings, step
                through each round, and let the board show you where the value is.
              </p>
              <Link to="/nfl-fantasy" className="h-btn-primary">
                Open the Draft Model →
              </Link>
            </div>

            <div className="h-nfl-feats">
              {NFL_FEATURES.map((f) => (
                <div key={f.label} className="h-nfl-feat">
                  <p className="h-nfl-feat-label">{f.label}</p>
                  <p className="h-nfl-feat-desc">{f.desc}</p>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ── TOOLS ──────────────────────────────────────────────── */}
      <section className="h-tools">
        <div className="container">
          <div className="h-section-head">
            <p className="eyebrow">Our Models</p>
            <h2 className="h-section-title">Everything We've Built</h2>
            <p className="h-section-sub">
              Each model is built to find the edge the public hasn't found yet.
            </p>
          </div>

          <div className="h-tools-grid">
            {TOOLS.map((tool) => (
              <Link
                key={tool.path}
                to={tool.path}
                className={`h-tool-card${tool.badgeType === 'new' ? ' h-tool-card--featured' : ''}`}
              >
                <div
                  className="h-tool-icon"
                  style={{ background: tool.iconBg }}
                  aria-hidden="true"
                >
                  {tool.icon}
                </div>
                <span className={`h-tool-badge h-tool-badge--${tool.badgeType}`}>
                  {tool.badgeLabel}
                </span>
                <h3 className="h-tool-name">{tool.name}</h3>
                <p className="h-tool-desc">{tool.desc}</p>
                <span className="h-tool-cta">
                  {tool.live ? 'Open Model →' : 'Preview →'}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── BLOG ───────────────────────────────────────────────── */}
      <section className="h-blog">
        <div className="container">
          <div className="h-blog-head">
            <div>
              <p className="eyebrow">Latest Insights</p>
              <h2 className="h-section-title">From the Blog</h2>
            </div>
            <Link to="/blog" className="h-btn-outline">View All Posts →</Link>
          </div>

          <div className="h-blog-grid">
            {/* Featured post */}
            <Link to={`/blog/${latestPost.slug}`} className="h-featured">
              <p className="h-featured-label">Latest Post</p>
              <p className="h-featured-date">{latestPost.date}</p>
              <h3 className="h-featured-title">{latestPost.title}</h3>
              <p className="h-featured-excerpt">
                {latestPost.excerpt}
              </p>
              <span className="h-featured-cta">Read full post →</span>
            </Link>

            {/* Recent posts */}
            <div className="h-recents">
              {recentPosts.map((post) => (
                <Link key={post.slug} to={`/blog/${post.slug}`} className="h-recent">
                  <p className="h-recent-date">{post.date}</p>
                  <p className="h-recent-title">{post.title}</p>
                </Link>
              ))}
              <Link to="/blog" className="h-recent h-recent--more">
                <p className="h-recent-title">View all posts →</p>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
