import React, { useState, useEffect } from 'react';
import { storage } from '../../services/storage';

export function PassModal({ pass, onClose, onSave }) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('⭐');
  const [color, setColor] = useState('#7c2430');
  const [description, setDescription] = useState('');
  const [starsPerLevel, setStarsPerLevel] = useState(10);
  const [maxLevel, setMaxLevel] = useState(20);
  const [rewardsMap, setRewardsMap] = useState({});

  useEffect(() => {
    if (pass) {
      setName(pass.name || '');
      setIcon(pass.icon || '⭐');
      setColor(pass.color || '#7c2430');
      setDescription(pass.description || '');
      setStarsPerLevel(pass.starsPerLevel || 10);
      setMaxLevel(pass.maxLevel || 20);

      const map = {};
      (pass.rewards || []).forEach(r => { map[r.level] = { name: r.name, icon: r.icon }; });
      setRewardsMap(map);
    }
  }, [pass]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const rewards = Object.entries(rewardsMap)
      .filter(([lvl, r]) => Number(lvl) <= maxLevel && r.name?.trim())
      .map(([lvl, r]) => {
        const prevClaimed = pass?.rewards?.find(x => x.level === Number(lvl))?.claimed || false;
        return { level: Number(lvl), name: r.name.trim(), icon: r.icon || '🎁', claimed: prevClaimed };
      });

    const payload = {
      name: name.trim(),
      icon: icon.trim() || '⭐',
      color,
      description: description.trim(),
      starsPerLevel: Number(starsPerLevel) || 10,
      maxLevel: Number(maxLevel) || 20,
      rewards
    };

    const saved = pass
      ? await storage.updateBattlePass(pass.id, payload)
      : await storage.createBattlePass(payload);

    onSave(saved);
  };

  return (
    <div className="sheet-overlay">
      <form className="sheet sheet--lg" onSubmit={handleSubmit}>
        <div className="sheet-head">
          <h2>{pass ? 'Editar sección' : 'Nueva sección'}</h2>
        </div>

        <label>Nombre de la sección
          <input type="text" required maxLength={40} value={name} onChange={e => setName(e.target.value)} placeholder="Ej. Gimnasio..." />
        </label>

        <div className="row">
          <label>Símbolo
            <input type="text" maxLength={4} value={icon} onChange={e => setIcon(e.target.value)} />
          </label>
          <label>Color de acento
            <input type="color" value={color} onChange={e => setColor(e.target.value)} />
          </label>
        </div>

        <label>Descripción
          <textarea maxLength={140} value={description} onChange={e => setDescription(e.target.value)} />
        </label>

        <div className="row">
          <label>Estrellas por nivel
            <input type="number" min="1" max="50" value={starsPerLevel} onChange={e => setStarsPerLevel(e.target.value)} />
          </label>
          <label>Total de niveles
            <input type="number" min="1" max="100" value={maxLevel} onChange={e => setMaxLevel(Number(e.target.value) || 20)} />
          </label>
        </div>

        <fieldset className="prize-editor">
          <legend>Premios por nivel</legend>
          <p className="prize-editor-help">Asigna una recompensa para los niveles que quieras celebrar:</p>
          <div className="prize-editor-list">
            {Array.from({ length: Math.min(100, Math.max(1, maxLevel)) }, (_, i) => {
              const lvl = i + 1;
              const r = rewardsMap[lvl] || { name: '', icon: '🎁' };
              return (
                <div key={lvl} className="prize-row">
                  <span className="prize-row-level">Nv. {lvl}</span>
                  <input
                    type="text"
                    className="prize-icon-input"
                    value={r.icon}
                    maxLength={4}
                    onChange={e => setRewardsMap(prev => ({ ...prev, [lvl]: { ...prev[lvl], icon: e.target.value } }))}
                  />
                  <input
                    type="text"
                    className="prize-name-input"
                    placeholder={`Premio del nivel ${lvl}...`}
                    value={r.name}
                    onChange={e => setRewardsMap(prev => ({ ...prev, [lvl]: { ...prev[lvl], name: e.target.value } }))}
                  />
                </div>
              );
            })}
          </div>
        </fieldset>

        <div className="sheet-actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn--primary">{pass ? 'Guardar cambios' : 'Publicar sección'}</button>
        </div>
      </form>
    </div>
  );
}