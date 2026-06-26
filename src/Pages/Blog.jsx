import { Link } from 'react-router-dom';
import { blogPosts } from '../data/blogPosts';
import SEO from '../components/SEO';

export default function Blog() {
  return (
    <main className="page">
      <SEO
        title="Blog"
        path="/blog"
        description="Read the latest sports analytics insights, model updates, tournament bracket strategy, and fantasy football tips from Jake Sebahar at SEB Fantasy."
      />

      <div className="container">
        <p className="eyebrow">SEB Fantasy Blog</p>
        <h1 className="page-title">Blog Posts</h1>
        <p className="page-text">
          Updates on rankings, model improvements, release notes, and tournament strategy.
        </p>

        <div className="blog-list">
          {blogPosts.map((post) => (
            <article key={post.slug} className="card">
              <p className="meta-text">{post.date}</p>
              <h2 className="blog-card-title">{post.title}</h2>
              <p>{post.excerpt}</p>
              <Link to={`/blog/${post.slug}`} className="text-link">
                Read full post →
              </Link>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
