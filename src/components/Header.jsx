import { NavLink } from 'react-router-dom';
import { siteConfig } from '../data/siteConfig';

export default function Header() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <NavLink to="/" className="brand-wrap" aria-label={`${siteConfig.name} home`}>
          <img src={siteConfig.logo} alt={`${siteConfig.name} logo`} className="brand-logo" />
          <div>
            <p className="brand-title">{siteConfig.name}</p>
            <p className="brand-subtitle">{siteConfig.tagline}</p>
          </div>
        </NavLink>

        <nav className="nav" aria-label="Main navigation">
          {siteConfig.nav.map(({ label, path, end }) => (
            <NavLink
              key={path}
              to={path}
              end={end}
              className={({ isActive }) => (isActive ? 'nav-link nav-link-active' : 'nav-link')}
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
