import { Link } from 'react-router-dom';
import { blogPosts } from '../data/blogPosts';

export default function Home() {
  const latestPost = blogPosts[0];

  return (
    <main className="page">
      <div className="container">
        <section className="hero hero-light">
          <div className="hero-copy">
            <p className="eyebrow">Data-driven sports metrics</p>
            <h2 className="hero-title">Welcome to SEB Fantasy</h2>
            <p className="hero-text">
              Elevate your fantasy sports game with data-driven insights 
              and proven strategies. Whether you're competing in March Madness 
              brackets or Fantasy Football leagues, our advanced analytics help 
              you make informed decisions and dominate the competition.
            </p>

            <div className="hero-actions">
              <Link to="/march-madness" className="button-primary">
                Explore March Madness
              </Link>
              <Link to="/blog" className="button-secondary">
                Read the Blog
              </Link>
            </div>
          </div>

          <div className="hero-panel">
            <img src="/logo.png" alt="SEB Fantasy logo" className="hero-logo" />
          </div>
        </section>

        <section className="grid-two">
          <div className="card">
            <h3>About the site</h3>
            <p>
             SEB Fantasy is a data-driven platform designed
              to give you an edge in fantasy sports. Our algorithms 
              analyze player performance, team statistics, and historical 
              data to provide accurate rankings for March Madness, 
              Fantasy Football, and College Football. Developed by Jake 
              Sebahar, a data analytics student and fantasy sports enthusiast,
               these metrics have been refined over years of testing 
               and proven to deliver results.
            </p>
          </div>

          <div className="card">
            <h3>Latest Blog Post</h3>
            <p className="meta-text">{latestPost.date}</p>
            <h4 className="blog-card-title">{latestPost.title}</h4>
            <p>{latestPost.excerpt}</p>
            <Link to={`/blog/${latestPost.slug}`} className="text-link">
              Read full post →
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}