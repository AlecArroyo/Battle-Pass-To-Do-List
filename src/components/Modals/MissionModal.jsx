import React, { useState } from 'react';
import { storage } from '../../services/storage';

const PASTEL_COLORS = [
  { value: '#f6efdd', title: 'Crema Papiro' },
  { value: '#f2dcd9', title: 'Rosa Pastel' },
  { value: '#d8e2dc', title: 'Verde Salvia' },
  { value: '#faedcb', title: 'Mostaza Suave' },
  { value: '#d0e1fd', title: 'Azul Vintage' },
  { value: '#e8dff5', title: 'Lavanda Tenue' },
  { value: '#f4b6a6', title: 'Salmón Pastel' },
  { value: '#b8e0d2', title: 'Turquesa Menta' },
  { value: '#a9cce3', title: 'Azul Cielo' },
  { value: '#c5d86d', title: 'Lima Pastel' },
  { value: '#f6c667', title: 'Amarillo Dorado' },
  { value: '#f3a683', title: 'Melocotón' },
  { value: '#b39ddb', title: 'Violeta Pastel' },
  { value: '#81c7c9', title: 'Aguamarina' },
];

export function MissionModal({ passId, onClose, onSave }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#f6efdd');
  const [orden, setOrden] = useState(0);
  const [starsValue, setStarsValue] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [metricType, setMetricType] = useState('boolean');
  const [unit, setUnit] = useState('');
  const [targetValue, setTargetValue] = useState(1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      title: title.trim(),
      description: description.trim(),
      color,
      orden: Number(orden) || 0,
      starsValue: Number(starsValue) || 1,
      metricType,
      unit: metricType === 'counter' ? unit : null,
      targetValue: metricType === 'counter' ? (Number(targetValue) || 1) : null,
      startDate: startDate ? new Date(startDate).toISOString() : null,
      endDate: endDate ? new Date(endDate).toISOString() : null,
    };

    const updatedPass = await storage.createMission(passId, payload);
    onSave(updatedPass);
  };

  return (
    <div className="sheet-overlay">
      <form className="sheet" onSubmit={handleSubmit}>
        <div className="sheet-head">
          <h2>Nueva misión</h2>
        </div>

        <label>Título de la misión
          <input type="text" required maxLength={60} value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej. Entrenar pierna 45 min" />
        </label>

        <label>Detalles
          <textarea maxLength={140} value={description} onChange={e => setDescription(e.target.value)} placeholder="Notas..." />
        </label>

        <label>Color de la tarjeta
          <div className="color-palette-selector">
            {PASTEL_COLORS.map(c => (
              <label key={c.value} className="color-option" style={{ '--c': c.value }} title={c.title}>
                <input type="radio" name="color" value={c.value} checked={color === c.value} onChange={() => setColor(c.value)} />
                <span className="color-swatch" />
              </label>
            ))}
          </div>
        </label>

        <div className="row">
          <label>Casilla / Prioridad (1 a 6, o 0)
            <input type="number" min="0" max="6" value={orden} onChange={e => setOrden(e.target.value)} />
          </label>
          <label>Recompensa (estrellas ★)
            <input type="number" min="1" max="10" value={starsValue} onChange={e => setStarsValue(e.target.value)} />
          </label>
        </div>

        <div className="row">
          <label>Inicio
            <input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </label>
          <label>Finalización
            <input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </label>
        </div>

        <fieldset className="choice-toggle">
          <legend>Tipo de misión</legend>
          <label className="choice">
            <input type="radio" checked={metricType === 'boolean'} onChange={() => setMetricType('boolean')} />
            <span>Sencilla — se cumple de una vez</span>
          </label>
          <label className="choice">
            <input type="radio" checked={metricType === 'counter'} onChange={() => setMetricType('counter')} />
            <span>Progresiva — avanza por conteo</span>
          </label>
        </fieldset>

        {metricType === 'counter' && (
          <div className="row">
            <label>Unidad
              <input type="text" placeholder="Ej. km, páginas" value={unit} onChange={e => setUnit(e.target.value)} />
            </label>
            <label>Meta
              <input type="number" min="1" value={targetValue} onChange={e => setTargetValue(e.target.value)} />
            </label>
          </div>
        )}

        <div className="sheet-actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn--primary">Publicar misión</button>
        </div>
      </form>
    </div>
  );
}