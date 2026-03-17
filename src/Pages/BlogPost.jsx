import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { blogPosts } from '../data/blogPosts';

export default function BlogPost() {
  const { slug } = useParams();
  const post = blogPosts.find((item) => item.slug === slug);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!post) {
    return (
      <main className="page">
        <div className="container">
          <h2 className="page-title">Post not found</h2>
          <Link to="/blog" className="text-link">Back to blog</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
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
                <p className="section-subtext">
                  Click the image to enlarge it.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="image-button"
              onClick={() => setIsModalOpen(true)}
            >
              <img
                src={post.image}
                alt="March Madness Bracket"
                className="bracket-image"
              />
            </button>
          </section>
        )}

        <Link to="/blog" className="text-link">
          ← Back to blog
        </Link>
      </div>

      {isModalOpen && post.image && (
        <div className="image-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div
            className="image-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="image-modal-close"
              onClick={() => setIsModalOpen(false)}
            >
              ×
            </button>

            <div className="image-modal-scroll">
              <img
                src={post.image}
                alt="March Madness Bracket Large View"
                className="bracket-image-large"
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}