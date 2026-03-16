import { Routes, Route, NavLink } from 'react-router-dom';
import './App.css';

import Home from './Pages/Home.jsx';
import MarchMadness from './Pages/MarchMadness.jsx';
import NflFantasy from './Pages/NflFantasy.jsx';
import NcaaFootball from './Pages/NcaaFootball.jsx';
import Blog from './Pages/Blog.jsx';
import BlogPost from './Pages/BlogPost.jsx';

export default function App() {
  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="container header-inner">
          <NavLink to="/" className="brand-wrap">
            <img src="/logo.png" alt="SEB Fantasy logo" className="brand-logo" />
            <div>
              <h1 className="brand-title">SEB Fantasy</h1>
              <p className="brand-subtitle">Modern sports ratings and analytics</p>
            </div>
          </NavLink>

          <nav className="nav">
            <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-link nav-link-active' : 'nav-link'}>
              Home
            </NavLink>
            <NavLink to="/blog" className={({ isActive }) => isActive ? 'nav-link nav-link-active' : 'nav-link'}>
              Blog
            </NavLink>
            <NavLink to="/march-madness" className={({ isActive }) => isActive ? 'nav-link nav-link-active' : 'nav-link'}>
              March Madness
            </NavLink>
            <NavLink to="/nfl-fantasy" className={({ isActive }) => isActive ? 'nav-link nav-link-active' : 'nav-link'}>
              NFL Fantasy
            </NavLink>
            <NavLink to="/ncaa-football" className={({ isActive }) => isActive ? 'nav-link nav-link-active' : 'nav-link'}>
              NCAA Football
            </NavLink>
          </nav>
        </div>
      </header>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/march-madness" element={<MarchMadness />} />
        <Route path="/nfl-fantasy" element={<NflFantasy />} />
        <Route path="/ncaa-football" element={<NcaaFootball />} />
      </Routes>

      <footer className="site-footer">
        <div className="container footer-inner">
          <div className="footer-left">
            <img src="/logo.png" alt="SEB Fantasy logo" className="footer-logo" />
            <div>
              <p className="footer-brand">SEB Fantasy</p>
              <p className="footer-copy">
                Data-driven rankings, tools, and fantasy sports insights.
              </p>
            </div>
          </div>

          <div className="footer-links">
            <NavLink to="/" className="footer-link">Home</NavLink>
            <NavLink to="/blog" className="footer-link">Blog</NavLink>
            <NavLink to="/march-madness" className="footer-link">March Madness</NavLink>
            <NavLink to="/nfl-fantasy" className="footer-link">NFL Fantasy</NavLink>
            <NavLink to="/ncaa-football" className="footer-link">NCAA Football</NavLink>
          </div>
        </div>
      </footer>
    </div>
  );
}