// src/components/EditorialBoard.jsx
import React, { useState } from 'react';
import { MissionCard } from './MissionCard';

export function EditorialBoard({ pass, missions, onComplete, onIncrement, onDelete, onDropToSlot }) {
  const [dragOverSlot, setDragOverSlot] = useState(null);

  const handleDragOver = (e, slotNum) => {
    e.preventDefault();
    setDragOverSlot(slotNum);
  };

  const handleDragLeave = (e, slotNum) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      if (dragOverSlot === slotNum) setDragOverSlot(null);
    }
  };

  const handleDrop = (e, slotNum) => {
    e.preventDefault();
    setDragOverSlot(null);
    const missionId = e.dataTransfer.getData('text/plain');
    if (missionId) onDropToSlot(missionId, slotNum);
  };

  const slots = [1, 2, 3, 4, 5, 6];

  return (
    <section className="editorial-board">
      <div className="editorial-board-head">
        <h2>Tablero de Formación <span className="classifieds-count">6 Casillas</span></h2>
        <p>Arrastra las misiones a las casillas numeradas para establecer tu orden de ejecución del día a día.</p>
      </div>

      <div className="board-slots-grid">
        {slots.map((num) => {
          const missionInSlot = missions.find(m => !m.completed && Number(m.orden) === num);

          return (
            <div
              key={num}
              className={`board-slot ${dragOverSlot === num ? 'is-dragover' : ''}`}
              onDragOver={(e) => handleDragOver(e, num)}
              onDragLeave={(e) => handleDragLeave(e, num)}
              onDrop={(e) => handleDrop(e, num)}
            >
              <div className="board-slot-watermark">
                <span className="watermark-number">{num}</span>
                <span className="watermark-label">Prioridad {num}</span>
              </div>

              {missionInSlot && (
                <MissionCard
                  mission={missionInSlot}
                  passColor={pass.color}
                  onComplete={onComplete}
                  onIncrement={onIncrement}
                  onDelete={onDelete}
                  onDragStart={(e, id) => e.dataTransfer.setData('text/plain', id)}
                />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}