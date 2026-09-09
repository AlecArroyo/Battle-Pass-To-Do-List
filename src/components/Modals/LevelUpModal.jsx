// src/components/Modals/LevelUpModal.jsx
import React from 'react';

const PALETTE = ['#7c2430', '#9c6f22', '#3c5734', '#d8c495', '#241c12', '#f6efdd'];

export function LevelUpModal({ pass, onClose }) {
  if (!pass) return null;
  const reward = (pass.rewards || []).find(r => r.level === pass.currentLevel);

  return (
    <div className="sheet-overlay levelup-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="levelup-modal" role="dialog" aria-modal="true">
        <div className="levelup-sunburst"></div>
        <div className="levelup-confetti-stage">
          {Array.from({ length: 42 }).map((_, i) => (
            <span
              key={i}
              className="confetti-scrap"
              style={{
                '--confetti-color': PALETTE[i % PALETTE.length],
                '--x-start': `${Math.random() * 320}px`,
                '--x-end': `${Math.random() * 360 - 180}px`,
                '--dur': `${(1.8 + Math.random() * 1.4).toFixed(2)}s`,
                '--rot': `${Math.random() * 900 - 450}deg`,
                animationDelay: `${(Math.random() * 0.4).toFixed(2)}s`
              }}
            />
          ))}
        </div>

        <div className="levelup-frame">
          <div className="levelup-ribbon">¡EDICIÓN EXTRAORDINARIA!</div>
          <div className="levelup-seal-wrap">
            <div className="levelup-seal">{pass.icon || '⭐'}</div>
            <div className="levelup-badge-stamp">¡LOGRADO!</div>
          </div>

          <div className="levelup-heading">
            <span className="levelup-kicker">Has alcanzado el</span>
            <div className="levelup-level-display">
              <span className="levelup-lvl-text">NIVEL</span>
              <span className="levelup-number">{pass.currentLevel}</span>
            </div>
            <p className="levelup-section-name">{pass.name}</p>
          </div>

          {reward && reward.name && (
            <div className="levelup-reward">
              <span className="levelup-reward-tag">Recompensa desbloqueada</span>
              <div className="levelup-reward-detail">
                <span className="levelup-reward-icon">{reward.icon || '🎁'}</span>
                <strong>{reward.name}</strong>
              </div>
            </div>
          )}

          <button type="button" className="btn btn--primary btn--levelup" onClick={onClose}>
            ¡Continuar la jornada!
          </button>
        </div>
      </div>
    </div>
  );
}