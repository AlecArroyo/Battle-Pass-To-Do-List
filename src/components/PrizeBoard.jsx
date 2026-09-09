// src/components/PrizeBoard.jsx
import React from 'react';

export function PrizeBoard({ pass, page, setPage, onClaimReward }) {
  const maxDefinedLevel = pass.maxLevel || 20;
  const totalPages = Math.max(1, Math.ceil(maxDefinedLevel / 5));
  const startLevel = (page - 1) * 5 + 1;

  const tickets = Array.from({ length: 5 }, (_, i) => {
    const lvl = startLevel + i;
    if (lvl > maxDefinedLevel) {
      return (
        <div key={lvl} className="ticket is-locked is-end">
          <div className="ticket-head"><span>Fin</span></div>
          <div className="ticket-body"><div className="ticket-empty">Fin de la sección</div></div>
        </div>
      );
    }

    const isUnlocked = lvl <= pass.currentLevel;
    const reward = (pass.rewards || []).find(r => r.level === lvl);

    return (
      <div key={lvl} className={`ticket ${isUnlocked ? 'is-reached' : 'is-locked'}`}>
        <div className="ticket-head"><span>Nivel {lvl}</span></div>
        <div className="ticket-body">
          {reward ? (
            <>
              <div className="ticket-icon">{reward.icon || '🎁'}</div>
              <div className="ticket-name">{reward.name}</div>
            </>
          ) : (
            <>
              <div className="ticket-icon" style={{ opacity: 0.3 }}>🎁</div>
              <div className="ticket-empty">Sin premio asignado</div>
            </>
          )}

          {!isUnlocked && <span className="stamp stamp--locked">Bloqueado</span>}
          {isUnlocked && reward && !reward.claimed && (
            <button
              type="button"
              className="btn btn--claim"
              onClick={() => onClaimReward(lvl)}
            >
              Reclamar premio
            </button>
          )}
          {isUnlocked && reward && reward.claimed && (
            <span className="stamp stamp--claimed">Reclamado</span>
          )}
          {isUnlocked && !reward && (
            <span className="stamp stamp--achieved">Logrado</span>
          )}
        </div>
      </div>
    );
  });

  return (
    <section className="prize-board">
      <div className="prize-board-head">
        <h2 className="prize-board-title">Cartelera de premios</h2>
        <div className="prize-nav">
          <button
            type="button"
            className="btn btn--icon"
            disabled={page === 1}
            style={{ opacity: page === 1 ? 0.4 : 1 }}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            ❮
          </button>
          <span className="prize-page">Página {page} de {totalPages}</span>
          <button
            type="button"
            className="btn btn--icon"
            disabled={page === totalPages}
            style={{ opacity: page === totalPages ? 0.4 : 1 }}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          >
            ❯
          </button>
        </div>
      </div>
      <div className="prize-grid">{tickets}</div>
    </section>
  );
}