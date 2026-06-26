import SEO from '../components/SEO';

export default function NcaaFootball() {
  return (
    <main className="page">
      <SEO
        title="NCAA Football Rankings"
        path="/ncaa-football"
        description="Data-driven CFB rankings and analytics from SEB Fantasy. Coming soon."
      />

      <div className="container">
        <p className="eyebrow">CFB Rankings</p>
        <h1 className="page-title">CFB Rankings</h1>

        <div className="card">
          <p className="page-text">This page is currently under construction. Check back soon.</p>
        </div>
      </div>
    </main>
  );
}
