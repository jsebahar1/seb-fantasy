export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container footer-inner">

        <div className="footer-left">
          <h3>SEB Fantasy</h3>
          <p>
            Data driven fantasy sports analytics focused on identifying
            leverage opportunities in March Madness, Fantasy Football,
            and college football rankings.
          </p>
        </div>

        <div className="footer-right">
          <h4>Resources</h4>

          <a
            href="https://kenpom.substack.com/p/the-2026-ncaa-tournament-odds"
            target="_blank"
            rel="noreferrer"
          >
            KenPom Tournament Odds
          </a>

          <a
            href="https://tournament.fantasysports.yahoo.com/mens-basketball-bracket/pickdistribution"
            target="_blank"
            rel="noreferrer"
          >
            Yahoo Pick Distribution
          </a>
        </div>

      </div>

      <div className="footer-bottom">
        <p>© {year} SEB Fantasy. All rights reserved.</p>
      </div>
    </footer>
  );
}