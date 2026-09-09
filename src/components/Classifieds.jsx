import React, { useState } from 'react';
import { MissionCard } from './MissionCard';

export function Classifieds({ pass, missions, onNewMission, onComplete, onIncrement, onDelete, onDropToUnassigned }) {
  const [isDragOver, setIsDragOver] = useState(false);

  const pendingUnassigned = missions
    .filter(m => !m.completed && (!m.orden || Number(m.orden) <= 0 || Number(m.orden) > 6))
    .sort((a, b) => (Number(a.orden) || 0) - (Number(b.orden) || 0));

  const completedMissions = missions.filter(m => m.completed);

  return (
    <section className="classifieds">
      <div className="classifieds-head">
        <h2>Misiones en espera <span className="classifieds-count">{pendingUnassigned.length}</span></h2>
        <button type="button" className="btn btn--primary" onClick={onNewMission}>Publicar misión</button>
      </div>

      <div
        className={`classifieds-grid unassigned-dropzone ${isDragOver ? 'is-dragover' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setIsDragOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          const id = e.dataTransfer.getData('text/plain');
          if (id) onDropToUnassigned(id);
        }}
      >
        {pendingUnassigned.length ? (
          pendingUnassigned.map(m => (
            <MissionCard
              key={m.id}
              mission={m}
              passColor={pass.color}
              onComplete={onComplete}
              onIncrement={onIncrement}
              onDelete={onDelete}
              onDragStart={(e, id) => e.dataTransfer.setData('text/plain', id)}
            />
          ))
        ) : (
          <p className="classifieds-empty">
            No hay misiones en espera. Arrastra una aquí para desasignarla o publica una nueva.
          </p>
        )}
      </div>

      {completedMissions.length > 0 && (
        <>
          <div className="classifieds-head" style={{ marginTop: 24 }}>
            <h2>Cumplidas <span className="classifieds-count" style={{ background: 'var(--paper-card)' }}>{completedMissions.length}</span></h2>
          </div>
          <div className="classifieds-grid is-done">
            {completedMissions.map(m => (
              <MissionCard
                key={m.id}
                mission={m}
                passColor={pass.color}
                onComplete={onComplete}
                onIncrement={onIncrement}
                onDelete={onDelete}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}