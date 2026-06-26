import { Link } from 'react-router-dom';
import { blogPosts } from '../data/blogPosts';
import SEO from '../components/SEO';
import './Home.css';

const TOOLS = [
  {
    path: '/march-madness',
    icon: '🏀',
    iconBg: 'linear-gradient(135deg, rgba(132,198,42,0.16) 0%, rgba(114,177,31,0.06) 100%)',
    live: true,
    name: 'March Madness',
    desc: 'Our Advanced Leverage Model finds where the public misprices teams and builds the optimal bracket to beat the field.',
  },
  {
    path: '/nfl-fantasy',
    icon: '🏈',
    iconBg: 'linear-gradient(135deg, rgba(13,45,98,0.12) 0%, rgba(13,45,98,0.04) 100%)',
    live: false,
    name: 'NFL Fantasy',
    desc: 'Weekly rankings, waiver wire targets, and start/sit guidance powered by historical performance models.',
  },
  {
    path: '/ncaa-football',
    icon: '🏆',
    iconBg: 'linear-gradient(135deg, rgba(220,85,10,0.12) 0%, rgba(220,85,10,0.04) 100%)',
    live: false,
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
        description="SEB Fantasy uses advanced statistical models to help you win at March Madness, NFL Fantasy Football, and NCAA Football. Get the data edge the public doesn't have."
      />

      {/* ── HERO ───────────────────────────────────────────────── */}
      <section className="h-hero">
        <div className="h-hero-glow2" aria-hidden="true" />

        <div className="container">
          <div className="h-hero-grid">

            <div className="h-hero-copy">
              <span className="eyebrow">Data-Driven Sports Analytics</span>
              <h1 className="h-hero-title">
                Win More.<br />
                <span className="h-hero-green">Play Smarter.</span>
              </h1>
              <p className="h-hero-sub">
                Advanced analytics for March Madness, NFL Fantasy, and College
                Football. Built to give you the edge the public doesn't have.
              </p>
              <div className="h-hero-btns">
                <Link to="/march-madness" className="h-btn-primary">
                  Explore March Madness
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
                <strong>96th</strong>
                <span>Percentile — 2026 Brackets</span>
              </div>
              <div className="h-stat-sep" aria-hidden="true" />
              <div className="h-stat">
                <strong>3</strong>
                <span>Sports Covered</span>
              </div>
              <div className="h-stat-sep" aria-hidden="true" />
              <div className="h-stat">
                <strong>100%</strong>
                <span>Data-Driven</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TOOLS ──────────────────────────────────────────────── */}
      <section className="h-tools">
        <div className="container">
          <div className="h-section-head">
            <p className="eyebrow">Our Models</p>
            <h2 className="h-section-title">Built to Beat the Field</h2>
            <p className="h-section-sub">
              Advanced statistical models that identify where the public is wrong
              — and where the real value lies.
            </p>
          </div>

          <div className="h-tools-grid">
            {TOOLS.map((tool) => (
              <Link key={tool.path} to={tool.path} className="h-tool-card">
                <div
                  className="h-tool-icon"
                  style={{ background: tool.iconBg }}
                  aria-hidden="true"
                >
                  {tool.icon}
                </div>
                <span className={`h-tool-badge h-tool-badge--${tool.live ? 'live' : 'soon'}`}>
                  {tool.live ? '● Live' : '○ Coming Soon'}
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
              <p className="h-featured-label">Featured Post</p>
              <p className="h-featured-date">{latestPost.date}</p>
              <h3 className="h-featured-title">{latestPost.title}</h3>
              <p className="h-featured-excerpt">
                {latestPost.metaDescription || latestPost.excerpt}
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
