import React from 'react';

export function Masthead() {
  const today = new Date().toLocaleDateString('es-CR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const formattedDate = today.charAt(0).toUpperCase() + today.slice(1);

  const handleExport = () => {
    const raw = localStorage.getItem('pasesDeVida:data') || JSON.stringify({ battlePasses: [] });
    const blob = new Blob([raw], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pases-de-vida.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <header className="masthead">
      <div className="masthead-flag">
        <h1 className="masthead-title">Hola <span className="accent">de Vida</span></h1>
        <p className="masthead-tagline">Diario personal de hábitos, misiones y pequeñas victorias</p>
      </div>
      <div className="masthead-strip">
        <span className="masthead-date">{formattedDate}</span>
        <span className="masthead-edition">Edición personal · Tomo I</span>
        <button type="button" className="btn btn--ghost" onClick={handleExport} title="Exportar tus datos a un archivo">
          Exportar datos
        </button>
      </div>
    </header>
  );
}