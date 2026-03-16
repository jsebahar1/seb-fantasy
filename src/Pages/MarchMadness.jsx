export default function MarchMadness() {
  return (
    <main className="page">
      <div className="container">
        <p className="eyebrow">March Madness</p>
        <h2 className="page-title">March Madness Ratings</h2>
        <p className="page-text">
          This page will hold your Tableau dashboard, spreadsheet preview, Excel download link,
          and explanation of your advanced leverage model.
        </p>

        <section className="grid-main">
          <div className="card card-large">
            <h3>Tableau Dashboard</h3>
            <div className="placeholder-box">
              <div>
                <p className="placeholder-title">Dashboard goes here</p>
                <p className="placeholder-text">
                  We will embed your Tableau dashboard here when it is ready.
                </p>
              </div>
            </div>
          </div>

          <div className="side-stack">
            <div className="card">
              <h3>Spreadsheet Access</h3>
              <p>
                This area can contain a spreadsheet preview and a separate Excel download button.
              </p>
            </div>

            <div className="card">
              <h3>Model Notes</h3>
              <p>
                Explain your formula, update schedule, assumptions, and notes on the ratings here.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}