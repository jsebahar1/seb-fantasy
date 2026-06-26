import SEO from '../components/SEO';
import './About.css';

const CARDS = [
  {
    icon: '📊',
    iconBg: 'linear-gradient(135deg, rgba(132,198,42,0.15) 0%, rgba(114,177,31,0.05) 100%)',
    title: 'About Me',
    body: "I'm a data analytics enthusiast with a strong background in statistics and machine learning. I started SEB Fantasy to apply rigorous analytical methods to the sports I love — and help others make smarter, more informed decisions at every stage of the fantasy season.",
  },
  {
    icon: '🏀',
    iconBg: 'linear-gradient(135deg, rgba(13,45,98,0.12) 0%, rgba(13,45,98,0.04) 100%)',
    title: 'Sports Background',
    body: "I'm a lifelong fan of basketball and football, with a deep interest in the statistical underpinnings of player performance. From dissecting March Madness seedings to evaluating fantasy football waiver wire pickups, I approach every game as a data problem worth solving.",
  },
  {
    icon: '🎯',
    iconBg: 'linear-gradient(135deg, rgba(220,85,10,0.12) 0%, rgba(220,85,10,0.04) 100%)',
    title: 'The Mission',
    body: 'SEB Fantasy exists to make data-driven analytics accessible to every fantasy sports player — not just the ones with data science backgrounds. The models are built to give you a real, quantifiable edge over the public in every competition you enter.',
  },
];

export default function About() {
  return (
    <main className="about">
      <SEO
        title="About"
        path="/about"
        description="Meet Jake Sebahar — the data analytics enthusiast and fantasy sports strategist behind SEB Fantasy's advanced models for March Madness, NFL Fantasy, and CFB."
        keywords={['Jake Sebahar', 'SEB Fantasy', 'sports analytics', 'data-driven fantasy sports', 'March Madness model creator']}
      />

      {/* ── INTRO (dark) ─────────────────────────────── */}
      <section className="ab-intro">
        <div className="container">
          <div className="ab-intro-grid">

            <div className="ab-intro-copy">
              <span className="eyebrow">About SEB Fantasy</span>
              <h1 className="ab-intro-title">Hi, I'm Jake.</h1>
              <p className="ab-intro-lead">
                Data analytics enthusiast and fantasy sports strategist
                behind SEB Fantasy.
              </p>
              <p className="ab-intro-text">
                I'm passionate about merging data science with sports to find
                the edges that others miss. Every model I build starts with a
                simple question: where is the public wrong, and how can we
                profit from it?
              </p>
            </div>

            <div className="ab-photo-wrap">
              <div className="ab-photo-frame">
                <img
                  src="/Gradphoto.JPG"
                  alt="Jake Sebahar"
                  className="ab-photo"
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── CARDS (light) ───────────────────────────── */}
      <section className="ab-sections">
        <div className="container">
          <div className="ab-section-head">
            <p className="eyebrow">The Story</p>
            <h2 className="ab-section-title">Analytics Meets Fandom</h2>
            <p className="ab-section-sub">
              A background in data, a love of sports, and one clear goal —
              give every player a real statistical edge.
            </p>
          </div>

          <div className="ab-cards">
            {CARDS.map((card) => (
              <div key={card.title} className="card">
                <div
                  className="ab-card-icon"
                  style={{ background: card.iconBg }}
                  aria-hidden="true"
                >
                  {card.icon}
                </div>
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
