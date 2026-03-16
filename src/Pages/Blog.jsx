import { Link } from 'react-router-dom';
import { blogPosts } from '../data/blogPosts';

export default function Blog() {
  return (
    <main className="page">
      <div className="container">
        <p className="eyebrow">SEB Fantasy Blog</p>
        <h2 className="page-title">Blog Posts</h2>
        <p className="page-text">
          Updates on rankings, model improvements, release notes, and tournament strategy.
        </p>

        <div className="blog-list">
          {blogPosts.map((post) => (
            <article key={post.slug} className="card">
              <p className="meta-text">{post.date}</p>
              <h3>{post.title}</h3>
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