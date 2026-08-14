import SEO from '../components/SEO';
import './About.css';

const CARDS = [
  {
    icon: '📊',
    iconBg: 'linear-gradient(135deg, rgba(132,198,42,0.15) 0%, rgba(114,177,31,0.05) 100%)',
    title: 'About the Site',
    body: "SEB Fantasy applies rigorous analytical methods to sports — helping you make smarter decisions at every stage of the fantasy season. Every model starts with the same question: where is the public wrong, and how can we profit from it?",
  },
  {
    icon: '🏀',
    iconBg: 'linear-gradient(135deg, rgba(13,45,98,0.12) 0%, rgba(13,45,98,0.04) 100%)',
    title: 'Sports Background',
    body: "Lifelong fans of basketball and football with a deep interest in the statistical underpinnings of player performance. From dissecting March Madness seedings to evaluating waiver wire pickups, we approach every game as a data problem worth solving.",
  },
  {
    icon: '🎯',
    iconBg: 'linear-gradient(135deg, rgba(220,85,10,0.12) 0%, rgba(220,85,10,0.04) 100%)',
    title: 'The Mission',
    body: 'SEB Fantasy exists to make data-driven analytics accessible to every fantasy player — not just those with data science backgrounds. Our models are built to give you a real, quantifiable edge over the public in every competition you enter.',
  },
];

const TEAM = [
  {
    name: 'Jake Sebahar',
    role: 'Founder & Lead Analyst',
    photo: '/Gradphoto.JPG',
    photoAlt: 'Jake Sebahar',
    bio: "Jake is the primary model builder behind SEB Fantasy, bringing a background in statistics and machine learning to every analysis. He translates complex data into actionable strategies that give fantasy players a real edge over the field.",
  },
  {
    name: 'Nick Sebahar',
    role: 'Sports Strategy & Analysis',
    photo: null,
    photoAlt: 'Nick Sebahar',
    bio: "Nick brings deep sports knowledge and strategic insight to the team, contributing to game analysis, betting theory, and the overall direction of SEB Fantasy's models. His read on the game is the gut check behind every number.",
  },
];

export default function About() {
  return (
    <main className="about">
      <SEO
        title="About"
        path="/about"
        description="Meet Jake and Nick Sebahar — the brothers behind SEB Fantasy's data-driven models for March Madness, NFL Fantasy, and NCAA Football."
        keywords={['Jake Sebahar', 'Nick Sebahar', 'SEB Fantasy', 'sports analytics', 'data-driven fantasy sports', 'March Madness model']}
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

      {/* ── STORY CARDS (light) ─────────────────────── */}
      <section className="ab-sections">
        <div className="container">
          <div className="ab-section-head">
            <p className="eyebrow">The Story</p>
            <h2 className="ab-section-title">Analytics Meets Fandom</h2>
            <p className="ab-section-sub">
              A background in data, a love of sports, and one clear goal: to
              give every viewer a real statistical edge.
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

      {/* ── TEAM (dark) ──────────────────────────────── */}
      <section className="ab-team">
        <div className="container">
          <div className="ab-team-head">
            <p className="eyebrow ab-team-eyebrow">The Team</p>
            <h2 className="ab-team-title">Meet the People Behind the Models</h2>
            <p className="ab-team-sub">
              Two brothers, one goal — give every fantasy player an analytical edge.
            </p>
          </div>

          <div className="ab-team-grid">
            {TEAM.map((member) => (
              <div key={member.name} className="ab-member">
                <div className="ab-member-photo-wrap">
                  {member.photo ? (
                    <img
                      src={member.photo}
                      alt={member.photoAlt}
                      className="ab-member-photo"
                    />
                  ) : (
                    <div className="ab-member-placeholder" aria-label={`${member.name} photo coming soon`}>
                      <span className="ab-member-placeholder-icon" aria-hidden="true">📸</span>
                      <p>Photo coming soon</p>
                    </div>
                  )}
                </div>
                <div className="ab-member-info">
                  <h3 className="ab-member-name">{member.name}</h3>
                  <p className="ab-member-role">{member.role}</p>
                  <p className="ab-member-bio">{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
