import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="site-header">
      <div className="container header-inner">

        <Link to="/" className="logo">
          <img src="/logo.png" alt="SEB Fantasy Logo" />
          <span>SEB Fantasy</span>
        </Link>

        <nav className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/march-madness">March Madness</Link>
          <Link to="/blog">Blog</Link>
          <Link to="/nfl-fantasy">NFL Fantasy</Link>
          <Link to="/ncaa-football">NCAA Football</Link>
          <Link to="/about">About</Link>
        </nav>

      </div>
    </header>
  );
}