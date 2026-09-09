// src/App.jsx
import React, { useState, useEffect } from 'react';
import { storage } from './services/storage';

import { Masthead } from './components/Masthead';
import { PassRail } from './components/PassRail';
import { HeadlineBlock } from './components/HeadlineBlock';
import { PrizeBoard } from './components/PrizeBoard';
import { EditorialBoard } from './components/EditorialBoard';
import { Classifieds } from './components/Classifieds';
import { ToastLayer } from './components/ToastLayer';

import { PassModal } from './components/Modals/PassModal';
import { MissionModal } from './components/Modals/MissionModal';
import { LevelUpModal } from './components/Modals/LevelUpModal';

export default function App() {
  const [passes, setPasses] = useState([]);
  const [activePassId, setActivePassId] = useState(null);
  const [carouselPage, setCarouselPage] = useState(1);
  const [toasts, setToasts] = useState([]);

  // Modales
  const [passModalOpen, setPassModalOpen] = useState(false);
  const [editingPass, setEditingPass] = useState(null);
  const [missionModalOpen, setMissionModalOpen] = useState(false);
  const [levelUpPass, setLevelUpPass] = useState(null);

  useEffect(() => {
    storage.getBattlePasses().then((list) => {
      setPasses(list);
      if (list[0]) {
        setActivePassId(list[0].id);
        setCarouselPage(Math.ceil(list[0].currentLevel / 5) || 1);
      }
    });
  }, []);

  const activePass = passes.find(p => p.id === activePassId);

  const addToast = (title, message, icon = '📌', type = '') => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, title, message, icon, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const updateLocalPass = (updated) => {
    setPasses(prev => {
      const idx = prev.findIndex(p => p.id === updated.id);
      if (idx > -1) {
        const next = [...prev];
        next[idx] = updated;
        return next;
      }
      return [...prev, updated];
    });
  };

  const handleCompleteMission = async (missionId) => {
    if (!activePass) return;
    const prevLvl = activePass.currentLevel;
    const updated = await storage.completeMission(activePass.id, missionId);
    updateLocalPass(updated);
    if (updated.currentLevel > prevLvl) setLevelUpPass(updated);
  };

  const handleIncrementMission = async (missionId) => {
    if (!activePass) return;
    const prevLvl = activePass.currentLevel;
    const updated = await storage.incrementMission(activePass.id, missionId, 1);
    updateLocalPass(updated);
    if (updated.currentLevel > prevLvl) setLevelUpPass(updated);
  };

  const handleDeleteMission = async (missionId) => {
    if (!confirm('¿Retirar esta misión?')) return;
    const updated = await storage.deleteMission(activePass.id, missionId);
    updateLocalPass(updated);
  };

  const handleClaimReward = async (level) => {
    const reward = (activePass.rewards || []).find(r => r.level === Number(level));
    const updated = await storage.claimReward(activePass.id, level);
    updateLocalPass(updated);
    if (reward) addToast('Premio reclamado', `Obtuviste: ${reward.name}`, reward.icon, 'bulletin--reward');
  };

  const handleMoveMissionToSlot = async (missionId, targetSlot) => {
    if (!activePass) return;
    const dragged = activePass.missions.find(m => m.id === missionId);
    if (!dragged || Number(dragged.orden) === targetSlot) return;

    const previousSlot = Number(dragged.orden) || 0;

    // Si la casilla de destino ya estaba ocupada, intercambiamos
    if (targetSlot > 0) {
      const existing = activePass.missions.find(m => !m.completed && Number(m.orden) === targetSlot && m.id !== missionId);
      if (existing) {
        await storage.updateMission(activePass.id, existing.id, { ...existing, orden: previousSlot });
      }
    }

    const updated = await storage.updateMission(activePass.id, missionId, { ...dragged, orden: targetSlot });
    updateLocalPass(updated);

    addToast(
      'Orden de Edición',
      targetSlot > 0 ? `«${dragged.title}» colocada en Casilla #${targetSlot}` : `«${dragged.title}» desasignada`
    );
  };

  return (
    <>
      <div className="paper-texture"></div>

      <Masthead />

      <div className="broadsheet-grid">
        <PassRail
          passes={passes}
          activePassId={activePassId}
          onSelectPass={(id) => {
            setActivePassId(id);
            const p = passes.find(x => x.id === id);
            if (p) setCarouselPage(Math.ceil(p.currentLevel / 5) || 1);
          }}
          onNewPass={() => {
            setEditingPass(null);
            setPassModalOpen(true);
          }}
        />

        <main className="front-page">
          {!activePass ? (
            <div className="no-edition">
              <p className="no-edition-mark">✦</p>
              <h2>Sin sección activa</h2>
              <p>Elige o publica una nueva sección para empezar.</p>
              <button className="btn btn--primary" onClick={() => setPassModalOpen(true)}>
                Publicar sección
              </button>
            </div>
          ) : (
            <>
              <HeadlineBlock
                pass={activePass}
                onEdit={() => { setEditingPass(activePass); setPassModalOpen(true); }}
                onDelete={async () => {
                  if (!confirm('¿Eliminar esta sección?')) return;
                  await storage.deleteBattlePass(activePass.id);
                  const remaining = passes.filter(p => p.id !== activePass.id);
                  setPasses(remaining);
                  setActivePassId(remaining[0]?.id || null);
                }}
              />

              <PrizeBoard
                pass={activePass}
                page={carouselPage}
                setPage={setCarouselPage}
                onClaimReward={handleClaimReward}
              />

              <EditorialBoard
                pass={activePass}
                missions={activePass.missions || []}
                onComplete={handleCompleteMission}
                onIncrement={handleIncrementMission}
                onDelete={handleDeleteMission}
                onDropToSlot={handleMoveMissionToSlot}
              />

              <Classifieds
                pass={activePass}
                missions={activePass.missions || []}
                onNewMission={() => setMissionModalOpen(true)}
                onComplete={handleCompleteMission}
                onIncrement={handleIncrementMission}
                onDelete={handleDeleteMission}
                onDropToUnassigned={(id) => handleMoveMissionToSlot(id, 0)}
              />
            </>
          )}
        </main>
      </div>

      {/* Modales */}
      {passModalOpen && (
        <PassModal
          pass={editingPass}
          onClose={() => setPassModalOpen(false)}
          onSave={(saved) => {
            updateLocalPass(saved);
            if (!editingPass) setActivePassId(saved.id);
            setPassModalOpen(false);
          }}
        />
      )}

      {missionModalOpen && activePass && (
        <MissionModal
          passId={activePass.id}
          onClose={() => setMissionModalOpen(false)}
          onSave={(updatedPass) => {
            updateLocalPass(updatedPass);
            setMissionModalOpen(false);
          }}
        />
      )}

      {levelUpPass && (
        <LevelUpModal
          pass={levelUpPass}
          onClose={() => setLevelUpPass(null)}
        />
      )}

      <ToastLayer toasts={toasts} />
    </>
  );
}