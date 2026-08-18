import { Link } from 'react-router-dom';
import { blogPosts } from '../data/blogPosts';
import SEO from '../components/SEO';

export default function Blog() {
  return (
    <main className="page">
      <SEO
        title="Fantasy Sports Strategy Blog"
        path="/blog"
        description="March Madness bracket tips, NFL fantasy football draft advice, and sports analytics breakdowns from Jake and Nick Sebahar. Updated every season with new model results."
        keywords={['fantasy sports blog', 'march madness bracket tips', 'nfl fantasy football advice', 'sports analytics blog', 'fantasy football strategy', 'march madness strategy guide', 'fantasy sports tips']}
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
