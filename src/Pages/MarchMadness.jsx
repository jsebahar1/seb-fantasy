import { useEffect, useRef, useState } from 'react';
import SEO from '../components/SEO';

export default function MarchMadness() {
  const vizRef = useRef(null);
  const [tableData, setTableData] = useState([]);
  const [headers, setHeaders] = useState([]);

  useEffect(() => {
    if (!vizRef.current) return;

    vizRef.current.innerHTML = `
      <div class="tableauPlaceholder" style="position: relative; width: 100%;">
        <noscript>
          <a href="#">
            <img
              alt="Effective Leverage for March Madness For Every Round"
              src="https://public.tableau.com/static/images/PG/PG74ZXPXW/1_rss.png"
              style="border: none; width: 100%;"
            />
          </a>
        </noscript>
        <object class="tableauViz" style="display:none;">
          <param name="host_url" value="https%3A%2F%2Fpublic.tableau.com%2F" />
          <param name="embed_code_version" value="3" />
          <param name="path" value="shared/PG74ZXPXW" />
          <param name="toolbar" value="yes" />
          <param name="static_image" value="https://public.tableau.com/static/images/PG/PG74ZXPXW/1.png" />
          <param name="animate_transition" value="yes" />
          <param name="display_static_image" value="yes" />
          <param name="display_spinner" value="yes" />
          <param name="display_overlay" value="yes" />
          <param name="display_count" value="yes" />
          <param name="language" value="en-US" />
          <param name="filter" value="publish=yes" />
        </object>
      </div>
    `;

    const vizElement = vizRef.current.getElementsByTagName('object')[0];
    if (vizElement) {
      vizElement.style.width = '100%';
      vizElement.style.height = '850px';
    }

    const oldScript = document.getElementById('tableau-embed-script');
    if (oldScript) {
      oldScript.remove();
    }

    const scriptElement = document.createElement('script');
    scriptElement.id = 'tableau-embed-script';
    scriptElement.src = 'https://public.tableau.com/javascripts/api/viz_v1.js';
    scriptElement.async = true;
    vizRef.current.appendChild(scriptElement);
  }, []);

  useEffect(() => {
    fetch('/march-madness-leverage.csv')
      .then((response) => response.text())
      .then((text) => {
        const rows = text
          .trim()
          .split('\n')
          .map((row) => row.split(','));

        if (rows.length > 0) {
          setHeaders(rows[0]);
          setTableData(rows.slice(1, 26));
        }
      })
      .catch((error) => {
        console.error('Error loading CSV:', error);
      });
  }, []);

  return (
    <main className="page">
      <SEO
        title="March Madness Optimal Bracket"
        path="/march-madness"
        description="The SEB Fantasy Advanced Leverage Model finds where the public misprices teams in March Madness. Free interactive Tableau dashboard and downloadable bracket spreadsheet."
      />
      <div className="container">
        <p className="eyebrow">March Madness</p>
        <h1 className="page-title">March Madness Optimal Bracket</h1>
        <p className="page-text">
          Want to beat all your co-workers in the Bracket Challenge? <br />
          Our March Madness Advanced Leverage
          Model identifies the optimal picking strategy to beat all of your friends. While everyone else is worried about picking the perfect bracket, 
          you're coming away with the prize pot.
           Use our interactive dashboard to find where the
          real bracket value is and download the full spreadsheet to work with
          the data yourself. <br />
        </p>

        <section className="grid-main">
          <div className="card card-large">
            <div className="section-head">
              <div>
                <h3>Interactive Tableau Dashboard</h3>
                <p className="section-subtext">
                  Explore the effective leverage of each team in every round of the tournament.
                </p>
              </div>

              <a
                href="/2026%20March%20Madness%20Optimal%20Bracket.xlsx"
                download
                className="button-primary"
              >
                Download Spreadsheet
              </a>
            </div>

            <div className="tableau-wrap">
              <div ref={vizRef} />
            </div>
          </div>

          <div className="side-stack">
            <div className="card">
              <h3>Spreadsheet Access</h3>
              <p>
                Download the spreadsheet directly to work with the data outside
                the dashboard. A preview of the data is shown below.
              </p>

              <a
                href="/2026%20March%20Madness%20Optimal%20Bracket.xlsx"
                download
                className="text-link"
              >
                Download Excel File →
              </a>
            </div>

            <div className="card">
              <h3>Graphic Notes</h3>
              <p>
                Any team with very low leverage may not show up in the dashboard to prevent clutter. Download the spreadsheet to see all teams and metrics.<br/>
                For Reference: Round of 32 means the potential to make it to the Round of 32 and so on for the later rounds. <br/>
              </p>
            </div>
          </div>
        </section>

        <section className="card info-section">
          <div className="section-head">
            <div>
              <h3>How To Use the Model</h3>
              <p className="section-subtext">
                Use the dashboard round filter to focus on one round at a time and compare teams based on effective leverage.
              </p>
            </div>
          </div>

          <div className="info-grid">
            <div className="info-block">
              <h4>1. Change your Perception</h4>
              <p>
                I want you to change the way you think about filling out a March Madness bracket. Most people try to get every pick right and worry about the historic odds of a 12 seed beating a 5 seed. But to beat all your friends, we need to look at the point system. 
                Correctly guessing a 12 seed upset in the first round is worth 1 point. Correctly guessing the champion is worth 63 points. So you tell me what we should worry about.
              </p>
            </div>

            <div className="info-block">
              <h4>2. Start with the Champion</h4>
              <p>
                The most important thing is to get your champion right. The champion pick is worth as many points than the entire first round combined, so you want to make sure you have the best possible pick there. Use the dashboard to find the team with the highest effective leverage in the championship round that the public is underestimating. Then work backwards from there to fill out the rest of your bracket.
              </p>
            </div>

            <div className="info-block">
              <h4>3. Be Careful with Popular Teams</h4>
              <p>
                The Favorite, a team like Duke, is going to be heavily picked by the public, so their leverage will be low. That doesn't mean you should have them losing in the second round. Decide when they will lose based on your personal judgement, even if the leverage says they are not a good pick.
              </p>
            </div>

            <div className="info-block">
              <h4>4. Have Fun with the First Round</h4>
              <p>
                The model will likely point out a lot of leverage from lower seeds in the first round. Don't be afraid to have fun and pick some upsets there. But be catious because the model will tell you to pick a lot more upsets than will likely happen.
              </p>
            </div>
          </div>
        </section>

        <section className="card data-preview-card">
          <div className="section-head">
            <div>
              <h3>Spreadsheet Preview</h3>
              <p className="section-subtext">
                Showing the first 25 rows from dataset for your understanding. Download the full file to see all teams and metrics.
                <br />KenPom Win Percentage is a key input in this model and is based off the Ken Pomeroys genius analytics
                and ratings. <br />The Yahoo pick percentage is based on real-time data from Yahoo and is used to identify where the public may be over or under valuing certain teams.
                <br />Leverage is the key metric here and combines a team’s probability of advancing with how overpicked or underpicked they are by the public to identify where the real bracket value is in each round.
                <br />Effective Leverage is the leverage multiplied by the probability of advancing to show the expected value of each pick.
              </p>
            </div>
          </div>

          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  {headers.map((header, index) => (
                    <th key={index}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card info-section">
          <div className="section-head">
            <div>
              <h3>Credits</h3>
              <p className="section-subtext">
                This model uses publicly available data sources that help power the underlying win probabilities and public pick percentages.
              </p>
            </div>
          </div>

          <div className="credits-list">
            <p>
              Special thanks to{' '}
              <a
                href="https://kenpom.substack.com/p/the-2026-ncaa-tournament-odds"
                target="_blank"
                rel="noreferrer"
                className="text-link"
              >
                KenPom
              </a>{' '}
              for the tournament odds and efficiency-based inputs used in the model.
            </p>

            <p>
              Public pick percentage data is sourced from{' '}
              <a
                href="https://tournament.fantasysports.yahoo.com/mens-basketball-bracket/pickdistribution"
                target="_blank"
                rel="noreferrer"
                className="text-link"
              >
                Yahoo Fantasy Bracket Pick Distribution
              </a>.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}