import { Routes, Route } from 'react-router-dom';
import './App.css';

import Header from './components/Header';
import Footer from './components/Footer';
import Home from './Pages/Home';
import MarchMadness from './Pages/MarchMadness';
import NflFantasy from './Pages/NflFantasy';
import NcaaFootball from './Pages/NcaaFootball';
import Blog from './Pages/Blog';
import BlogPost from './Pages/BlogPost';
import About from './Pages/About';

export default function App() {
  return (
    <div className="site-shell">
      <Header />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/march-madness" element={<MarchMadness />} />
        <Route path="/nfl-fantasy" element={<NflFantasy />} />
        <Route path="/ncaa-football" element={<NcaaFootball />} />
        <Route path="/about" element={<About />} />
      </Routes>

      <Footer />
    </div>
  );
}
