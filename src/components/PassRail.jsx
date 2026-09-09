import React from 'react';

export function PassRail({ passes, activePassId, onSelectPass, onNewPass }) {
  return (
    <aside className="index-column">
      <div className="index-head">
        <span className="index-kicker">Secciones</span>
        <button type="button" className="btn btn--icon" onClick={onNewPass} title="Abrir nueva sección">+</button>
      </div>
      <div className="index-list">
        {!passes.length ? (
          <p className="index-empty">Aún no has abierto ninguna sección.<br/>Publica la primera con «+».</p>
        ) : (
          passes.map((p) => {
            const meterWidth = Math.min(100, (p.currentStars / p.starsPerLevel) * 100);
            return (
              <button
                key={p.id}
                type="button"
                className={`clip ${p.id === activePassId ? 'is-active' : ''}`}
                style={{ '--accent': p.color }}
                onClick={() => onSelectPass(p.id)}
              >
                <span className="clip-seal">{p.icon}</span>
                <span className="clip-info">
                  <span className="clip-name">{p.name}</span>
                  <span className="clip-level">Nivel {p.currentLevel}</span>
                </span>
                <span className="clip-meter">
                  <span className="clip-meter-fill" style={{ width: `${meterWidth}%` }} />
                </span>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}