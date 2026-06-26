import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { blogPosts } from '../data/blogPosts';
import SEO from '../components/SEO';

export default function BlogPost() {
  const { slug } = useParams();
  const post = blogPosts.find((item) => item.slug === slug);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!post) {
    return (
      <main className="page">
        <SEO title="Post Not Found" path={`/blog/${slug}`} />
        <div className="container">
          <h1 className="page-title">Post not found</h1>
          <Link to="/blog" className="text-link">← Back to blog</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <SEO
        title={post.title}
        path={`/blog/${post.slug}`}
        description={post.metaDescription || post.excerpt}
        image={post.image}
        type="article"
        publishedDate={post.publishedDate}
        keywords={post.keywords}
      />

      <div className="container narrow-container">
        <p className="meta-text">{post.date}</p>
        <h1 className="post-title">{post.title}</h1>

        <article className="post-card">
          {post.content.map((paragraph, index) => (
            <p key={index} className="post-paragraph">
              {paragraph}
            </p>
          ))}
        </article>

        {post.image && (
          <section className="card image-viewer">
            <div className="section-head">
              <div>
                <h3>Bracket Visualization</h3>
                <p className="section-subtext">Click the image to enlarge it.</p>
              </div>
            </div>

            <button
              type="button"
              className="image-button"
              onClick={() => setIsModalOpen(true)}
              aria-label="Enlarge bracket image"
            >
              <img
                src={post.image}
                alt="March Madness Bracket"
                className="bracket-image"
              />
            </button>
          </section>
        )}

        <Link to="/blog" className="text-link">← Back to blog</Link>
      </div>

      {isModalOpen && post.image && (
        <div
          className="image-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Enlarged bracket view"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="image-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="image-modal-close"
              onClick={() => setIsModalOpen(false)}
              aria-label="Close image"
            >
              ×
            </button>

            <div className="image-modal-scroll">
              <img
                src={post.image}
                alt="March Madness Bracket — enlarged view"
                className="bracket-image-large"
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
