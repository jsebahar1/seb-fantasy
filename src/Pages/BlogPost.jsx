import { useParams, Link } from 'react-router-dom';
import { blogPosts } from '../data/blogPosts';

export default function BlogPost() {
  const { slug } = useParams();
  const post = blogPosts.find((item) => item.slug === slug);

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

        <Link to="/blog" className="text-link">
          ← Back to blog
        </Link>
      </div>
    </main>
  );
}