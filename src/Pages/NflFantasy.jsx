import { useEffect, useRef, useState } from 'react';

export default function NflFantasy() {
  const vizRef = useRef(null);
  const [tableData, setTableData] = useState([]);
  const [headers, setHeaders] = useState([]);

  useEffect(() => {
    if (!vizRef.current) return;

    // TODO: add Tableau embed params
    vizRef.current.innerHTML = `
      <div class="tableauPlaceholder" style="position: relative; width: 100%;">
        <noscript>
          <a href="#">
            <img
              alt="NFL Fantasy Football Rankings"
              src=""
              style="border: none; width: 100%;"
            />
          </a>
        </noscript>
        <object class="tableauViz" style="display:none;">
          <param name="host_url" value="https%3A%2F%2Fpublic.tableau.com%2F" />
          <param name="embed_code_version" value="3" />
          <param name="path" value="" />
          <param name="toolbar" value="yes" />
          <param name="static_image" value="" />
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
    fetch('/nfl-fantasy.csv')
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
      <div className="container">
        <p className="eyebrow">NFL Fantasy</p>
        <h2 className="page-title">NFL Fantasy Football Rankings</h2>
        <p className="page-text">
          {/* TODO: add description */}
        </p>

        <section className="grid-main">
          <div className="card card-large">
            <div className="section-head">
              <div>
                <h3>Interactive Tableau Dashboard</h3>
                <p className="section-subtext">
                  {/* TODO: add subtext */}
                </p>
              </div>

              <a
                href=""
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
                {/* TODO: add description */}
              </p>

              <a
                href=""
                download
                className="text-link"
              >
                Download Excel File →
              </a>
            </div>

            <div className="card">
              <h3>Graphic Notes</h3>
              <p>
                {/* TODO: add notes */}
              </p>
            </div>
          </div>
        </section>

        <section className="card info-section">
          <div className="section-head">
            <div>
              <h3>How To Use the Model</h3>
              <p className="section-subtext">
                {/* TODO: add subtext */}
              </p>
            </div>
          </div>

          <div className="info-grid">
            <div className="info-block">
              <h4>1. </h4>
              <p>
                {/* TODO */}
              </p>
            </div>

            <div className="info-block">
              <h4>2. </h4>
              <p>
                {/* TODO */}
              </p>
            </div>

            <div className="info-block">
              <h4>3. </h4>
              <p>
                {/* TODO */}
              </p>
            </div>

            <div className="info-block">
              <h4>4. </h4>
              <p>
                {/* TODO */}
              </p>
            </div>
          </div>
        </section>

        <section className="card data-preview-card">
          <div className="section-head">
            <div>
              <h3>Spreadsheet Preview</h3>
              <p className="section-subtext">
                {/* TODO: add description */}
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
                {/* TODO: add credits description */}
              </p>
            </div>
          </div>

          <div className="credits-list">
            <p>
              {/* TODO: add credits */}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
