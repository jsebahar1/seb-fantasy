import { Link } from 'react-router-dom';

/**
 * Cross-links between the power-rankings pages. These share a model and an
 * audience, so linking them builds a topical cluster and keeps neither page
 * orphaned from the other.
 */
export default function RelatedRankings({ links }) {
  if (!links?.length) return null;

  return (
    <nav className="pr-related" aria-label="Related rankings">
      <h2 className="pr-related-title">More power rankings</h2>
      <div className="pr-related-grid">
        {links.map(({ to, label, blurb }) => (
          <Link key={to} to={to} className="pr-related-card">
            <span className="pr-related-label">{label}</span>
            <span className="pr-related-blurb">{blurb}</span>
            <span className="pr-related-arrow" aria-hidden="true">→</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
