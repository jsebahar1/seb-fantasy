import { NavLink } from 'react-router-dom';
import { siteConfig } from '../data/siteConfig';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div className="footer-brand-wrap">
          <img src={siteConfig.logo} alt={`${siteConfig.name} logo`} className="footer-logo" />
          <div>
            <p className="footer-brand">{siteConfig.name}</p>
            <p className="footer-tagline">{siteConfig.description}</p>
          </div>
        </div>

        <nav className="footer-links" aria-label="Footer navigation">
          {siteConfig.footerLinks.map(({ label, path }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) => (isActive ? 'footer-link active' : 'footer-link')}
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="footer-bottom">
        <p>© {year} {siteConfig.name}. All rights reserved.</p>
      </div>
    </footer>
  );
}
