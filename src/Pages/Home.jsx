import { Link } from 'react-router-dom';
import { blogPosts } from '../data/blogPosts';
import SEO from '../components/SEO';
import './Home.css';

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
  {
    path: '/ncaa-football',
    icon: '🏆',
    iconBg: 'linear-gradient(135deg, rgba(220,85,10,0.12) 0%, rgba(220,85,10,0.04) 100%)',
    live: false,
    badgeLabel: '○ Coming Soon',
    badgeType: 'soon',
    name: 'NCAA Football',
    desc: 'Data-driven CFB rankings and bowl predictions built on our custom efficiency and matchup-weighting model.',
  },
];

export default function Home() {
  const latestPost = blogPosts[0];
  const recentPosts = blogPosts.slice(1);

  return (
    <main className="home">
      <SEO
        path="/"
        description="Free tools to win your NFL fantasy football draft and March Madness bracket pool. VOR-based draft rankings, SEB Leverage, real-time ADP data from four platforms. No login required."
        keywords={['nfl fantasy draft tool 2026', 'fantasy football draft rankings', 'value over replacement fantasy football', 'fantasy football ADP strategy', 'march madness bracket strategy', 'sports analytics tools', 'how to win fantasy football draft']}
      />

      {/* ── HERO ───────────────────────────────────────────────── */}
      <section className="h-hero">
        <div className="h-hero-glow2" aria-hidden="true" />

        <div className="container">
          <div className="h-hero-grid">

            <div className="h-hero-copy">
              <span className="eyebrow">2026 Draft Season Is Here</span>
              <h1 className="h-hero-title">
                Know Who to<br />
                <span className="h-hero-green">Target. And When.</span>
              </h1>
              <p className="h-hero-sub">
                The SEB Draft Model ranks every player by Value Over Replacement,
                tracks your leverage at each pick in real time, and surfaces
                exactly who the market is sleeping on. Free. No login.
              </p>
              <div className="h-hero-btns">
                <Link to="/nfl-fantasy" className="h-btn-primary">
                  Try the Draft Model →
                </Link>
                <Link to="/blog" className="h-btn-ghost">
                  Read the Blog
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
                <strong>200+</strong>
                <span>Players Ranked</span>
              </div>
              <div className="h-stat-sep" aria-hidden="true" />
              <div className="h-stat">
                <strong>8</strong>
                <span>ADP Sources</span>
              </div>
              <div className="h-stat-sep" aria-hidden="true" />
              <div className="h-stat">
                <strong>96th</strong>
                <span>Percentile in 2026 Brackets</span>
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
