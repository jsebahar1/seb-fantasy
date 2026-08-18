import SEO from '../components/SEO';
import './About.css';

const CARDS = [
  {
    icon: '📊',
    iconBg: 'linear-gradient(135deg, rgba(132,198,42,0.15) 0%, rgba(114,177,31,0.05) 100%)',
    title: 'What We Do',
    body: "We use data to find the edges that most fantasy players never see. Every model we build starts with the same question: where is the public getting it wrong, and how do you profit from it?",
  },
  {
    icon: '🏀',
    iconBg: 'linear-gradient(135deg, rgba(13,45,98,0.12) 0%, rgba(13,45,98,0.04) 100%)',
    title: 'Sports Background',
    body: "We grew up watching basketball and football and never stopped caring about the numbers behind the games. From March Madness brackets to waiver wire decisions, we treat every fantasy call like a data problem worth solving.",
  },
  {
    icon: '🎯',
    iconBg: 'linear-gradient(135deg, rgba(220,85,10,0.12) 0%, rgba(220,85,10,0.04) 100%)',
    title: 'The Mission',
    body: "SEB Fantasy was built so that anyone can use data to their advantage, not just people with a stats background. We want to give you a real leg up on the rest of your league.",
  },
];

const TEAM = [
  {
    name: 'Jake Sebahar',
    role: 'Founder and Lead Analyst',
    photo: '/Gradphoto.JPG',
    photoAlt: 'Jake Sebahar',
    bio: "Jake built the models behind SEB Fantasy. He has a background in statistics and machine learning and spends his time turning raw sports data into strategies that actually work in your league.",
  },
  {
    name: 'Nick Sebahar',
    role: 'Sports Analytics and Strategy',
    photo: '/Nickphoto.png',
    photoAlt: 'Nick Sebahar',
    bio: "Nick is Jake’s younger brother who brings real sports instincts to the team. He combines a passion for sports with a quantitative, data-driven approach to building smarter models and making more informed decisions.",
  },
];

export default function About() {
  return (
    <main className="about">
      <SEO
        title="About"
        path="/about"
        description="SEB Fantasy was built by Jake and Nick Sebahar to give fantasy players a real data edge. Learn how the models work and what drives the picks."
        keywords={['Jake Sebahar', 'Nick Sebahar', 'SEB Fantasy', 'fantasy sports analytics', 'sports analytics tools', 'march madness model creator', 'nfl fantasy analytics']}
      />

      {/* Team hero */}
      <section className="ab-team">
        <div className="container">
          <div className="ab-team-head">
            <p className="eyebrow ab-team-eyebrow">The Team</p>
            <h1 className="ab-team-title">Meet the People Behind the Models</h1>
            <p className="ab-team-sub">
              Two brothers with one goal: give every fantasy player an edge that actually makes a difference.
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
                      className={`ab-member-photo${member.name === 'Nick Sebahar' ? ' ab-member-photo--nick' : ''}`}
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

      {/* Story cards */}
      <section className="ab-sections">
        <div className="container">
          <div className="ab-section-head">
            <p className="eyebrow">The Story</p>
            <h2 className="ab-section-title">Analytics Meets Fandom</h2>
            <p className="ab-section-sub">
              A love of sports and a background in data, pointed at one thing: helping you win.
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
