import React from 'react';

export function HeadlineBlock({ pass, onEdit, onDelete }) {
  const ticks = Array.from({ length: pass.starsPerLevel }, (_, i) => {
    const isFilled = i < pass.currentStars;
    // 👇 Es el último tick conseguido (siempre que tengamos al menos 1 estrella)
    const isLastFilled = pass.currentStars > 0 && i === pass.currentStars ;

    return (
      <span
        key={i}
        className={`tick ${isFilled ? 'is-filled' : ''} ${isLastFilled ? 'is-blinking' : ''}`}
      />
    );
  });

  return (
    <section className="headline-block" style={{ '--accent': pass.color }}>
      <div className="headline-top">
        <div className="headline-id">
          <span className="headline-seal">{pass.icon}</span>
          <div>
            <h1 className="headline-title">{pass.name}</h1>
            <p className="headline-desc">{pass.description || 'Sin descripción asignada.'}</p>
          </div>
        </div>
        <div className="headline-actions">
          <button type="button" className="btn btn--icon" onClick={onEdit} title="Editar sección">✎</button>
          <button type="button" className="btn btn--icon btn--danger" onClick={onDelete} title="Eliminar sección">🗑</button>
        </div>
      </div>
      
      <div className="circulation">
        <span className="circulation-badge">Nivel {pass.currentLevel} de {pass.maxLevel}</span>
        <div className="circulation-ticks">{ticks}</div>
        <span className="circulation-count">{pass.currentStars} / {pass.starsPerLevel} ★</span>
      </div>
    </section>
  );
}