import React from 'react';

export function ToastLayer({ toasts }) {
  return (
    <div className="bulletin-layer">
      {toasts.map(t => (
        <div key={t.id} className={`bulletin is-visible ${t.type || ''}`}>
          <span className="bulletin-icon">{t.icon || '📌'}</span>
          <div>
            <strong>{t.title}</strong>
            <p>{t.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
}