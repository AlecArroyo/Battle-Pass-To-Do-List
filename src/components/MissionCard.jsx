// src/components/MissionCard.jsx
import React from 'react';
import { useCountdown } from '../hooks/useCountdown';

export function MissionCard({ mission, passColor, onComplete, onIncrement, onDelete, onDragStart }) {
    const timerData = useCountdown(mission.startDate, mission.endDate);
    const isCounter = mission.metricType === 'counter';
    const isDraggable = !mission.completed;

    return (
        <article
            className={`ad ${mission.completed ? 'is-complete' : ''}`}
            style={{ '--accent': passColor, backgroundColor: mission.color || '#f6efdd' }}
            draggable={isDraggable}
            onDragStart={isDraggable ? (e) => onDragStart(e, mission.id) : undefined}
        >
            <div className="ad-meta-top">
                {mission.orden > 0 && (
                    <span className="ad-order" title="Prioridad asignada">
                        #{mission.orden}
                    </span>
                )}
                <span className="ad-tag">
                    <div className='pt-1'>
                      {mission.starsValue}        
                    </div>

                    <span className="material-symbols-outlined ">stars</span>
                </span>
            </div>
            {isDraggable && <span className="ad-grip" title="Arrastrar para ordenar">⋮⋮</span>}

            <button
                type="button"
                className="ad-remove"
                title="Retirar misión"
                onClick={() => onDelete(mission.id)}
            >
                ✕
            </button>

            <h3>{mission.title}</h3>
            {mission.description && <p>{mission.description}</p>}

            {timerData && (
                <div className={`ad-timer is-${timerData.type}`}>
                    <span className="ad-timer-label">{timerData.label}</span>
                    <span className="ad-timer-clock">{timerData.clock}</span>
                </div>
            )}

            {isCounter ? (
                <>
                    <div className="ad-progress">
                        <div className="ad-bar">
                            <div
                                className="ad-bar-fill"
                                style={{ width: `${Math.min(100, (mission.currentValue / mission.targetValue) * 100)}%` }}
                            />
                        </div>
                        <span>{mission.currentValue} / {mission.targetValue} {mission.unit || ''}</span>
                    </div>
                    {!mission.completed ? (
                        <button
                            type="button"
                            className="btn btn--secondary"
                            onClick={() => onIncrement(mission.id)}
                        >
                            +1 {mission.unit || ''}
                        </button>
                    ) : (
                        <span className="ad-done">Cumplida ✓</span>
                    )}
                </>
            ) : (
                <>
                    {!mission.completed ? (
                        <button
                            type="button"
                            className="btn btn--complete"
                            onClick={() => onComplete(mission.id)}
                        >
                            Marcar cumplida
                        </button>
                    ) : (
                        <span className="ad-done">Cumplida ✓</span>
                    )}
                </>
            )}
        </article>
    );
}