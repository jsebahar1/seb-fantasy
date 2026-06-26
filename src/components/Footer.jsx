// src/components/Footer.jsx
import React from 'react';
import './Footer.css'; // Create this file for styling

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h4>SEB Fantasy</h4>
          <p>Analytical insights for sports and beyond.</p>
        </div>
        <div className="footer-section">
          <h4>Navigate</h4>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/march-madness">March Madness</a></li>
            <li><a href="/blog">Blog</a></li>
          </ul>
        </div>
        <div className="footer-section">
          <h4>Connect</h4>
          <p>© 2026 SEB Fantasy</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;