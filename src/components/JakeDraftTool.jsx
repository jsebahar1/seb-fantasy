import { useState } from 'react';
import { JAKE_DRAFT } from '../data/draftGuide';

const POS_COLORS = { QB: 'pos-qb', RB: 'pos-rb', WR: 'pos-wr', TE: 'pos-te', DE: 'pos-de', LB: 'pos-lb' };

function PosBadge({ pos }) {
  return <span className={`nfl-position jdt-pos ${POS_COLORS[pos] ?? ''}`}>{pos}</span>;
}

function TierList({ label, items, tier }) {
  if (!items || items.length === 0) return null;
  return (
    <div className={`jdt-tier jdt-tier--${tier}`}>
      <p className="jdt-tier-label">{label}</p>
      <ul className="jdt-tier-list">
        {items.map((name, i) => (
          <li key={i} className="jdt-tier-item">{name}</li>
        ))}
      </ul>
    </div>
  );
}

function PositionCard({ pos, data }) {
  const hasContent = data.targets.length || data.fallbacks.length || data.avoids.length;
  return (
    <div className="jdt-pos-card">
      <div className={`jdt-pos-card-head jdt-head--${pos.toLowerCase()}`}>
        <span className="jdt-pos-card-label">{pos}</span>
      </div>
      {hasContent ? (
        <div className="jdt-pos-card-body">
          <TierList label="Targets" items={data.targets} tier="target" />
          <TierList label="Fallbacks" items={data.fallbacks} tier="fallback" />
          <TierList label="Avoid" items={data.avoids} tier="avoid" />
        </div>
      ) : (
        <p className="jdt-empty">Coming soon</p>
      )}
    </div>
  );
}

export default function JakeDraftTool() {
  const [round, setRound] = useState(1);
  const data = JAKE_DRAFT.find(r => r.round === round) ?? JAKE_DRAFT[0];

  const specialRounds = { 17: 'D/ST', 18: 'K', 19: 'IDP' };

  return (
    <div className="jdt-wrap">
      {/* Header */}
      <div className="card jdt-header-card">
        <div className="jdt-header-text">
          <p className="eyebrow">Jake's Picks</p>
          <h2>Jake's 2026 Draft Playbook</h2>
          <p className="section-subtext">
            Round-by-round targets, fallbacks, and players to avoid — with a positional strategy note for each pick. Updated before the season.
          </p>
        </div>
      </div>

      {/* Round selector */}
      <div className="jdt-round-nav" role="tablist" aria-label="Draft rounds">
        {JAKE_DRAFT.map(({ round: r, type, label }) => {
          const isSpecial = type === 'special' || type === 'idp';
          const pillLabel = isSpecial ? (label ?? `R${r}`) : r;
          return (
            <button
              key={r}
              role="tab"
              aria-selected={round === r}
              className={`jdt-round-pill${round === r ? ' jdt-round-pill--active' : ''}${isSpecial ? ' jdt-round-pill--special' : ''}`}
              onClick={() => setRound(r)}
            >
              {isSpecial ? pillLabel : `R${pillLabel}`}
            </button>
          );
        })}
      </div>

      {/* Round content */}
      <div className="card jdt-round-card">

        {/* Strategy note */}
        {data.strategy && (
          <div className="jdt-strategy">
            <span className="jdt-strategy-label">Strategy</span>
            <p className="jdt-strategy-text">{data.strategy}</p>
          </div>
        )}

        {/* ── Pool (Round 1) ── */}
        {data.type === 'pool' && (
          <div className="jdt-pool">
            <p className="jdt-pool-note">Take the highest available player on this list. Cross them off as picks are made.</p>
            <ol className="jdt-pool-list">
              {data.players.map(({ rank, name, pos, team }) => (
                <li key={rank} className="jdt-pool-row">
                  <span className="jdt-pool-rank">{rank}</span>
                  <PosBadge pos={pos} />
                  <span className="jdt-pool-name">{name}</span>
                  <span className="jdt-pool-team">{team}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* ── Tiered by position (Rounds 2–16) ── */}
        {data.type === 'tiered' && (
          <div className="jdt-positions-grid">
            {['QB', 'RB', 'WR', 'TE'].map(pos => (
              <PositionCard key={pos} pos={pos} data={data.positions[pos]} />
            ))}
          </div>
        )}

        {/* ── Special (Defense / Kicker) ── */}
        {data.type === 'special' && (
          <div className="jdt-special">
            <h3 className="jdt-special-heading">{data.heading}</h3>
            {data.players && data.players.length > 0 ? (
              <ol className="jdt-pool-list jdt-special-list">
                {data.players.map(p => (
                  <li key={p.rank} className="jdt-pool-row">
                    <span className="jdt-pool-rank">{p.rank}</span>
                    <span className="jdt-pool-name">{p.name}</span>
                    <span className="jdt-pool-team">{p.team}</span>
                    {p.score != null && <span className="jdt-special-score">{p.score}</span>}
                    {p.opp != null && <span className="jdt-special-opp">{p.opp}</span>}
                  </li>
                ))}
              </ol>
            ) : (data.targets.length || data.fallbacks.length || data.avoids.length) ? (
              <div className="jdt-special-tiers">
                <TierList label="Targets" items={data.targets} tier="target" />
                <TierList label="Fallbacks" items={data.fallbacks} tier="fallback" />
                <TierList label="Avoid" items={data.avoids} tier="avoid" />
              </div>
            ) : (
              <p className="jdt-empty">Targets will be filled in closer to the season.</p>
            )}
          </div>
        )}

        {/* ── IDP (Round 19) ── */}
        {data.type === 'idp' && (
          <div className="jdt-idp">
            <h3 className="jdt-special-heading">{data.heading}</h3>
            <div className="jdt-idp-options">
              {data.targets.map(({ name, pos, team, note }) => (
                <div key={name} className="jdt-idp-card jdt-idp-card--primary">
                  <PosBadge pos={pos} />
                  <span className="jdt-idp-name">{name}</span>
                  <span className="jdt-idp-team">{team}</span>
                  <span className="jdt-idp-note jdt-idp-note--primary">{note}</span>
                </div>
              ))}
              {data.fallback && (
                <div className="jdt-idp-card jdt-idp-card--fallback">
                  <PosBadge pos={data.fallback.pos} />
                  <span className="jdt-idp-name">{data.fallback.name}</span>
                  <span className="jdt-idp-team">{data.fallback.team}</span>
                  <span className="jdt-idp-note">{data.fallback.note}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
