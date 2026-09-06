/* =====================================================================
   CONFIG
   ===================================================================== */
const CONFIG = {
  storageMode: 'api',
  apiBaseUrl: 'https://pasesdevida-api-bag0daa3cscjhthb.mexicocentral-01.azurewebsites.net/api',
};

/* =====================================================================
   ADAPTADORES DE ALMACENAMIENTO
   ===================================================================== */
class StorageAdapter {
  async getBattlePasses(){ throw new Error('No implementado'); }
  async createBattlePass(data){ throw new Error('No implementado'); }
  async updateBattlePass(id, data){ throw new Error('No implementado'); }
  async deleteBattlePass(id){ throw new Error('No implementado'); }
  async createMission(battlePassId, data){ throw new Error('No implementado'); }
  async updateMission(battlePassId, missionId, data){ throw new Error('No implementado'); }
  async deleteMission(battlePassId, missionId){ throw new Error('No implementado'); }
  async completeMission(battlePassId, missionId){ throw new Error('No implementado'); }
  async incrementMission(battlePassId, missionId, amount){ throw new Error('No implementado'); }
  async saveReward(battlePassId, level, rewardData){ throw new Error('No implementado'); }
  async claimReward(battlePassId, level){ throw new Error('No implementado'); }
}

class LocalStorageAdapter extends StorageAdapter {
  constructor(key = 'pasesDeVida:data'){
    super();
    this.key = key;
  }
  _read(){
    const raw = localStorage.getItem(this.key);
    return raw ? JSON.parse(raw) : { battlePasses: [] };
  }
  _write(data){
    localStorage.setItem(this.key, JSON.stringify(data));
  }
  _findPass(data, id){
    const pass = data.battlePasses.find(p => p.id === id);
    if(!pass) throw new Error('Pase de batalla no encontrado');
    if(!pass.rewards) pass.rewards = [];
    if(!pass.maxLevel) pass.maxLevel = 20;
    return pass;
  }
  _findMission(pass, id){
    const mission = pass.missions.find(m => m.id === id);
    if(!mission) throw new Error('Misión no encontrada');
    return mission;
  }
  _addStars(pass, stars){
    pass.totalStarsEarned += stars;
    pass.currentStars += stars;
    while(pass.currentStars >= pass.starsPerLevel && (pass.maxLevel === null || pass.currentLevel < pass.maxLevel)){
      pass.currentStars -= pass.starsPerLevel;
      pass.currentLevel += 1;
    }
    if(pass.maxLevel !== null && pass.currentLevel >= pass.maxLevel){
      pass.currentLevel = pass.maxLevel;
      pass.currentStars = pass.starsPerLevel;
    }
  }

  async getBattlePasses(){
    const data = this._read();
    data.battlePasses.forEach(p => {
      if(!p.rewards) p.rewards = [];
      if(!p.maxLevel) p.maxLevel = 20;
    });
    return data.battlePasses;
  }

  async createBattlePass({ name, icon, color, description, starsPerLevel, maxLevel, rewards }){
    const data = this._read();
    const now = new Date().toISOString();
    const pass = {
      id: crypto.randomUUID(),
      name,
      icon: icon || '⭐',
      color: color || '#7c2430',
      description: description || '',
      starsPerLevel: Math.max(1, Number(starsPerLevel) || 10),
      maxLevel: Math.max(1, Number(maxLevel) || 20),
      currentLevel: 1,
      currentStars: 0,
      totalStarsEarned: 0,
      createdAt: now,
      updatedAt: now,
      missions: [],
      rewards: Array.isArray(rewards) ? rewards : []
    };
    data.battlePasses.push(pass);
    this._write(data);
    return pass;
  }

  async updateBattlePass(id, updates){
    const data = this._read();
    const pass = this._findPass(data, id);
    if(updates.maxLevel !== undefined){
      updates.maxLevel = Math.max(1, Number(updates.maxLevel) || 20);
    }
    Object.assign(pass, updates, { updatedAt: new Date().toISOString() });
    this._write(data);
    return pass;
  }

  async deleteBattlePass(id){
    const data = this._read();
    data.battlePasses = data.battlePasses.filter(p => p.id !== id);
    this._write(data);
    return null;
  }

  async createMission(battlePassId, { title, description, starsValue, metricType, unit, targetValue, orden, startDate, endDate, color }){
    const data = this._read();
    const pass = this._findPass(data, battlePassId);
    const isCounter = metricType === 'counter';
    pass.missions.push({
      id: crypto.randomUUID(),
      title,
      description: description || '',
      starsValue: Math.max(1, Number(starsValue) || 1),
      metricType: isCounter ? 'counter' : 'boolean',
      unit: isCounter ? (unit || 'veces') : null,
      targetValue: isCounter ? Math.max(1, Number(targetValue) || 1) : null,
      orden: Number(orden) || 0,
      startDate: startDate || null,
      endDate: endDate || null,
      color: color || '#f6efdd',
      currentValue: 0,
      completed: false,
      completedAt: null,
      createdAt: new Date().toISOString()
    });
    pass.updatedAt = new Date().toISOString();
    this._write(data);
    return pass;
  }

  async updateMission(battlePassId, missionId, updates){
    const data = this._read();
    const pass = this._findPass(data, battlePassId);
    const mission = this._findMission(pass, missionId);
    Object.assign(mission, updates);
    pass.updatedAt = new Date().toISOString();
    this._write(data);
    return pass;
  }

  async deleteMission(battlePassId, missionId){
    const data = this._read();
    const pass = this._findPass(data, battlePassId);
    pass.missions = pass.missions.filter(m => m.id !== missionId);
    pass.updatedAt = new Date().toISOString();
    this._write(data);
    return pass;
  }

  async completeMission(battlePassId, missionId){
    const data = this._read();
    const pass = this._findPass(data, battlePassId);
    const mission = this._findMission(pass, missionId);
    if(!mission.completed){
      mission.completed = true;
      mission.completedAt = new Date().toISOString();
      if(mission.metricType === 'counter') mission.currentValue = mission.targetValue;
      this._addStars(pass, mission.starsValue);
      pass.updatedAt = new Date().toISOString();
      this._write(data);
    }
    return pass;
  }

  async incrementMission(battlePassId, missionId, amount = 1){
    const data = this._read();
    const pass = this._findPass(data, battlePassId);
    const mission = this._findMission(pass, missionId);
    if(!mission.completed && mission.metricType === 'counter'){
      mission.currentValue = Math.min(mission.targetValue, mission.currentValue + amount);
      if(mission.currentValue >= mission.targetValue){
        mission.completed = true;
        mission.completedAt = new Date().toISOString();
        this._addStars(pass, mission.starsValue);
      }
      pass.updatedAt = new Date().toISOString();
      this._write(data);
    }
    return pass;
  }

  async saveReward(battlePassId, level, { name, icon }){
    const data = this._read();
    const pass = this._findPass(data, battlePassId);
    let reward = pass.rewards.find(r => r.level === Number(level));
    if(reward){
      reward.name = name;
      reward.icon = icon || '🎁';
    } else {
      pass.rewards.push({
        level: Number(level),
        name,
        icon: icon || '🎁',
        claimed: false
      });
    }
    pass.updatedAt = new Date().toISOString();
    this._write(data);
    return pass;
  }

  async claimReward(battlePassId, level){
    const data = this._read();
    const pass = this._findPass(data, battlePassId);
    const reward = pass.rewards.find(r => r.level === Number(level));
    if(reward && !reward.claimed){
      reward.claimed = true;
      pass.updatedAt = new Date().toISOString();
      this._write(data);
    }
    return pass;
  }
}

class ApiStorageAdapter extends StorageAdapter {
  constructor(baseUrl){
    super();
    this.baseUrl = baseUrl;
  }

  async _req(path, options = {}){
    const res = await fetch(`${this.baseUrl}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    if(!res.ok) throw new Error(`Error de API (${res.status})`);
    if(res.status === 204) return null;
    return res.json();
  }
  getBattlePasses(){ return this._req('/battlepasses'); }
  createBattlePass(data){ return this._req('/battlepasses', { method:'POST', body: JSON.stringify(data) }); }
  updateBattlePass(id, data){ return this._req(`/battlepasses/${id}`, { method:'PUT', body: JSON.stringify(data) }); }
  deleteBattlePass(id){ return this._req(`/battlepasses/${id}`, { method:'DELETE' }); }
  createMission(bpId, data){ return this._req(`/battlepasses/${bpId}/missions`, { method:'POST', body: JSON.stringify(data) }); }
  updateMission(bpId, mId, data){ return this._req(`/battlepasses/${bpId}/missions/${mId}`, { method:'PUT', body: JSON.stringify(data) }); }
  deleteMission(bpId, mId){ return this._req(`/battlepasses/${bpId}/missions/${mId}`, { method:'DELETE' }); }
  completeMission(bpId, mId){ return this._req(`/battlepasses/${bpId}/missions/${mId}/complete`, { method:'POST' }); }
  incrementMission(bpId, mId, amount){ return this._req(`/battlepasses/${bpId}/missions/${mId}/progress`, { method:'POST', body: JSON.stringify({ amount }) }); }
  saveReward(bpId, level, data){ return this._req(`/battlepasses/${bpId}/rewards/${level}`, { method:'POST', body: JSON.stringify(data) }); }
  claimReward(bpId, level){ return this._req(`/battlepasses/${bpId}/rewards/${level}/claim`, { method:'POST' }); }
}

const storage = CONFIG.storageMode === 'api'
  ? new ApiStorageAdapter(CONFIG.apiBaseUrl)
  : new LocalStorageAdapter();

/* =====================================================================
   ESTADO Y VARIABLES
   ===================================================================== */
const state = {
  passes: [],
  activePassId: null,
  carouselPage: 1
};

let currentEditingPass = null;
let currentDraggedMissionId = null;

function escapeHtml(str = ''){
  return String(str).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

function replacePass(updatedPass){
  const idx = state.passes.findIndex(p => p.id === updatedPass.id);
  if(idx > -1) state.passes[idx] = updatedPass;
  else state.passes.push(updatedPass);
}

function setDateline(){
  const el = document.getElementById('datelineText');
  if(!el) return;
  const today = new Date();
  const formatted = today.toLocaleDateString('es-CR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  el.textContent = formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function render(){
  renderRail();
  renderHud();
}

function renderRail(){
  const list = document.getElementById('railList');
  if(!state.passes.length){
    list.innerHTML = `<p class="index-empty">Aún no has abierto ninguna sección.<br>Publica la primera con «+».</p>`;
    return;
  }
  list.innerHTML = state.passes.map(p => `
    <button class="clip ${p.id === state.activePassId ? 'is-active' : ''}" data-action="select-pass" data-pass="${p.id}" style="--accent:${p.color}">
      <span class="clip-seal">${p.icon}</span>
      <span class="clip-info">
        <span class="clip-name">${escapeHtml(p.name)}</span>
        <span class="clip-level">Nivel ${p.currentLevel}</span>
      </span>
      <span class="clip-meter"><span class="clip-meter-fill" style="width:${(p.currentStars / p.starsPerLevel) * 100}%"></span></span>
    </button>
  `).join('');
}

/* =====================================================================
   LÓGICA DEL COUNTDOWN / CRONÓMETRO
   ===================================================================== */
function formatCountdownData(startDateStr, endDateStr){
  if(!endDateStr) return null;

  const now = Date.now();
  const end = new Date(endDateStr).getTime();
  const start = startDateStr ? new Date(startDateStr).getTime() : null;

  if(start && now < start){
    const diff = Math.max(0, start - now);
    return {
      type: 'starting',
      label: 'Inicia en',
      clock: formatDuration(diff)
    };
  }

  if(now < end){
    const diff = Math.max(0, end - now);
    return {
      type: 'running',
      label: 'Termina en',
      clock: formatDuration(diff)
    };
  }

  return {
    type: 'expired',
    label: 'Plazo',
    clock: 'Expirada'
  };
}

function formatDuration(ms){
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n) => String(n).padStart(2, '0');

  if(days > 0){
    return `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function updateLiveTimers(){
  document.querySelectorAll('[data-timer-box]').forEach(box => {
    const startStr = box.dataset.start;
    const endStr = box.dataset.end;
    const data = formatCountdownData(startStr, endStr);
    if(!data) return;

    box.className = `ad-timer is-${data.type}`;
    const labelEl = box.querySelector('.ad-timer-label');
    const clockEl = box.querySelector('.ad-timer-clock');
    if(labelEl) labelEl.textContent = data.label;
    if(clockEl) clockEl.textContent = data.clock;
  });
}

/* =====================================================================
   RENDER DE TARJETA DE MISIÓN (CON COLOR DE FONDO PERSONALIZADO)
   ===================================================================== */
function adCard(pass, m){
  const isCounter = m.metricType === 'counter';
  const timerData = formatCountdownData(m.startDate, m.endDate);
  const isDraggable = !m.completed;
  const cardBgColor = m.color || '#f6efdd';

  return `
    <article class="ad ${m.completed ? 'is-complete' : ''}" 
             style="--accent:${pass.color}; background-color: ${cardBgColor};"
             ${isDraggable ? `draggable="true" data-draggable-mission="${m.id}" data-pass="${pass.id}"` : ''}>
      <div class="ad-meta-top">
        ${m.orden > 0 ? `<span class="ad-order" title="Prioridad asignada">#${m.orden}</span>` : ''}
        <span class="ad-tag">+${m.starsValue}★</span>
      </div>
      ${isDraggable ? `<span class="ad-grip" title="Arrastrar para ordenar">⋮⋮</span>` : ''}
      <button class="ad-remove" data-action="delete-mission" data-pass="${pass.id}" data-mission="${m.id}" title="Retirar misión" aria-label="Retirar misión">✕</button>
      <h3>${escapeHtml(m.title)}</h3>
      ${m.description ? `<p>${escapeHtml(m.description)}</p>` : ''}
      
      ${timerData ? `
        <div class="ad-timer is-${timerData.type}" data-timer-box data-start="${m.startDate || ''}" data-end="${m.endDate || ''}">
          <span class="ad-timer-label">${timerData.label}</span>
          <span class="ad-timer-clock">${timerData.clock}</span>
        </div>
      ` : ''}

      ${isCounter ? `
        <div class="ad-progress">
          <div class="ad-bar"><div class="ad-bar-fill" style="width:${Math.min(100, (m.currentValue / m.targetValue) * 100)}%;"></div></div>
          <span>${m.currentValue} / ${m.targetValue} ${escapeHtml(m.unit || '')}</span>
        </div>
        ${!m.completed ? `<button class="btn btn--secondary" data-action="increment-mission" data-pass="${pass.id}" data-mission="${m.id}">+1 ${escapeHtml(m.unit || '')}</button>` : '<span class="ad-done">Cumplida ✓</span>'}
      ` : `
        ${!m.completed ? `<button class="btn btn--complete" data-action="complete-mission" data-pass="${pass.id}" data-mission="${m.id}">Marcar cumplida</button>` : '<span class="ad-done">Cumplida ✓</span>'}
      `}
    </article>
  `;
}

function renderHud(){
  const hud = document.getElementById('hud');
  const pass = state.passes.find(p => p.id === state.activePassId);

  if(!pass){
    hud.innerHTML = `
      <div class="no-edition">
        <p class="no-edition-mark">✦</p>
        <h2>Sin sección activa</h2>
        <p>Elige o publica una nueva sección para empezar a acumular estrellas y subir de nivel en tus hábitos.</p>
        <button class="btn btn--primary" id="btnEmptyNewPass">Publicar mi primera sección</button>
      </div>`;
    document.getElementById('btnEmptyNewPass')?.addEventListener('click', () => openPassModal());
    return;
  }

  const ticks = Array.from({ length: pass.starsPerLevel }, (_, i) =>
    `<span class="tick ${i < pass.currentStars ? 'is-filled' : ''}"></span>`
  ).join('');

  // Cartelera de premios (5 por página)
  const maxDefinedLevel = pass.maxLevel || 20;
  const totalPages = Math.ceil(maxDefinedLevel / 5);
  if(state.carouselPage > totalPages) state.carouselPage = totalPages;
  if(state.carouselPage < 1) state.carouselPage = 1;

  const startLevel = (state.carouselPage - 1) * 5 + 1;
  const levelCardsHtml = Array.from({ length: 5 }, (_, i) => {
    const lvl = startLevel + i;
    if(lvl > maxDefinedLevel) {
      return `
        <div class="ticket is-locked is-end">
          <div class="ticket-head"><span>Fin</span></div>
          <div class="ticket-body"><div class="ticket-empty">Fin de la sección</div></div>
        </div>
      `;
    }

    const isUnlocked = lvl <= pass.currentLevel;
    const reward = (pass.rewards || []).find(r => r.level === lvl);

    let statusBtn = '';
    if(!isUnlocked){
      statusBtn = `<span class="stamp stamp--locked">Bloqueado</span>`;
    } else if(reward && !reward.claimed){
      statusBtn = `<button class="btn btn--claim" data-action="claim-reward" data-pass="${pass.id}" data-level="${lvl}">Reclamar premio</button>`;
    } else if(reward && reward.claimed){
      statusBtn = `<span class="stamp stamp--claimed">Reclamado</span>`;
    } else {
      statusBtn = `<span class="stamp stamp--achieved">Logrado</span>`;
    }

    return `
      <div class="ticket ${isUnlocked ? 'is-reached' : 'is-locked'}">
        <div class="ticket-head"><span>Nivel ${lvl}</span></div>
        <div class="ticket-body">
          ${reward ? `
            <div class="ticket-icon">${reward.icon}</div>
            <div class="ticket-name">${escapeHtml(reward.name)}</div>
          ` : `
            <div class="ticket-icon" style="opacity:0.3;">🎁</div>
            <div class="ticket-empty">Sin premio asignado</div>
          `}
          ${statusBtn}
        </div>
      </div>
    `;
  }).join('');

  // Separar misiones en casillas (1 a 6), sin asignar (0) y cumplidas
  const pendingMissions = (pass.missions || []).filter(m => !m.completed);
  const doneMissions = (pass.missions || []).filter(m => m.completed);

  // Construcción de las 6 casillas del tablero
  let slotsHtml = '';
  for(let slotNum = 1; slotNum <= 6; slotNum++){
    const missionInSlot = pendingMissions.find(m => Number(m.orden) === slotNum);
    slotsHtml += `
      <div class="board-slot" data-slot="${slotNum}" data-pass="${pass.id}">
        <div class="board-slot-watermark">
          <span class="watermark-number">${slotNum}</span>
          <span class="watermark-label">Prioridad ${slotNum}</span>
        </div>
        ${missionInSlot ? adCard(pass, missionInSlot) : ''}
      </div>
    `;
  }

  // Misiones pendientes no asignadas a las casillas 1-6
  const unassignedMissions = pendingMissions
    .filter(m => !m.orden || Number(m.orden) <= 0 || Number(m.orden) > 6)
    .sort((a, b) => (Number(a.orden) || 0) - (Number(b.orden) || 0));

  hud.innerHTML = `
    <section class="headline-block" style="--accent:${pass.color}">
      <div class="headline-top">
        <div class="headline-id">
          <span class="headline-seal">${pass.icon}</span>
          <div>
            <h1 class="headline-title">${escapeHtml(pass.name)}</h1>
            <p class="headline-desc">${escapeHtml(pass.description || 'Sin descripción asignada.')}</p>
          </div>
        </div>
        <div class="headline-actions">
          <button class="btn btn--icon" data-action="edit-pass" data-pass="${pass.id}" title="Editar sección">✎</button>
          <button class="btn btn--icon btn--danger" data-action="delete-pass" data-pass="${pass.id}" title="Eliminar sección">🗑</button>
        </div>
      </div>
      <div class="circulation">
        <span class="circulation-badge">Nivel ${pass.currentLevel} de ${pass.maxLevel}</span>
        <div class="circulation-ticks">${ticks}</div>
        <span class="circulation-count">${pass.currentStars} / ${pass.starsPerLevel} ★</span>
      </div>
    </section>

    <!-- CARTELERA DE PREMIOS -->
    <section class="prize-board">
      <div class="prize-board-head">
        <h2 class="prize-board-title">Cartelera de premios</h2>
        <div class="prize-nav">
          <button class="btn btn--icon" data-action="prev-page" ${state.carouselPage === 1 ? 'disabled style="opacity:0.4;"' : ''}>❮</button>
          <span class="prize-page">Página ${state.carouselPage} de ${totalPages}</span>
          <button class="btn btn--icon" data-action="next-page" ${state.carouselPage === totalPages ? 'disabled style="opacity:0.4;"' : ''}>❯</button>
        </div>
      </div>
      <div class="prize-grid">
        ${levelCardsHtml}
      </div>
    </section>

    <!-- TABLERO DE PRIORIDADES (EDITORIAL BOARD) -->
    <section class="editorial-board">
      <div class="editorial-board-head">
        <h2>Tablero de Formación <span class="classifieds-count">6 Casillas</span></h2>
        <p>Arrastra las misiones a las casillas numeradas para establecer tu orden de ejecución del día a día.</p>
      </div>
      <div class="board-slots-grid">
        ${slotsHtml}
      </div>
    </section>

    <!-- MISIONES EN ESPERA / SIN CASILLA -->
    <section class="classifieds">
      <div class="classifieds-head">
        <h2>Misiones en espera <span class="classifieds-count">${unassignedMissions.length}</span></h2>
        <button class="btn btn--primary" data-action="new-mission" data-pass="${pass.id}">Publicar misión</button>
      </div>
      <div class="classifieds-grid unassigned-dropzone" data-slot="0" data-pass="${pass.id}">
        ${unassignedMissions.length ? unassignedMissions.map(m => adCard(pass, m)).join('') : '<p class="classifieds-empty">No hay misiones en espera. Arrastra una aquí para desasignarla del tablero o publica una nueva.</p>'}
      </div>

      ${doneMissions.length ? `
        <div class="classifieds-head" style="margin-top: 24px;">
          <h2>Cumplidas <span class="classifieds-count" style="background:var(--paper-card);">${doneMissions.length}</span></h2>
        </div>
        <div class="classifieds-grid is-done">
          ${doneMissions.map(m => adCard(pass, m)).join('')}
        </div>
      ` : ''}
    </section>
  `;

  attachDragAndDropHandlers();
}

/* =====================================================================
   MANEJO DE DRAG & DROP
   ===================================================================== */
function attachDragAndDropHandlers(){
  const draggableCards = document.querySelectorAll('[data-draggable-mission]');
  const dropTargets = document.querySelectorAll('[data-slot]');

  draggableCards.forEach(card => {
    card.addEventListener('dragstart', (e) => {
      currentDraggedMissionId = card.dataset.draggableMission;
      e.dataTransfer.setData('text/plain', currentDraggedMissionId);
      e.dataTransfer.effectAllowed = 'move';
      card.classList.add('is-dragging');
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('is-dragging');
      document.querySelectorAll('.is-dragover').forEach(el => el.classList.remove('is-dragover'));
    });
  });

  dropTargets.forEach(target => {
    target.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      target.classList.add('is-dragover');
    });

    target.addEventListener('dragleave', (e) => {
      if(!target.contains(e.relatedTarget)){
        target.classList.remove('is-dragover');
      }
    });

    target.addEventListener('drop', async (e) => {
      e.preventDefault();
      target.classList.remove('is-dragover');

      const missionId = e.dataTransfer.getData('text/plain') || currentDraggedMissionId;
      const targetSlot = Number(target.dataset.slot) || 0;
      const passId = target.dataset.pass || state.activePassId;

      if(!missionId || !passId) return;

      await handleMoveMissionToSlot(passId, missionId, targetSlot);
    });
  });
}

/**
 * Construye el payload completo de una misión para enviar en un PUT.
 */
function buildMissionPayload(mission, overrides = {}){
  return {
    title: mission.title,
    description: mission.description,
    starsValue: mission.starsValue,
    metricType: mission.metricType,
    unit: mission.unit,
    targetValue: mission.targetValue,
    orden: mission.orden,
    startDate: mission.startDate,
    endDate: mission.endDate,
    color: mission.color || '#f6efdd',
    currentValue: mission.currentValue,
    completed: mission.completed,
    completedAt: mission.completedAt,
    ...overrides
  };
}

async function handleMoveMissionToSlot(passId, missionId, targetSlot){
  const pass = state.passes.find(p => p.id === passId);
  if(!pass) return;

  const draggedMission = pass.missions.find(m => m.id === missionId);
  if(!draggedMission) return;

  const previousSlot = Number(draggedMission.orden) || 0;
  if(previousSlot === targetSlot) return;

  // Intercambiar orden si el destino ya está ocupado
  if(targetSlot > 0){
    const existingInSlot = pass.missions.find(m => !m.completed && Number(m.orden) === targetSlot && m.id !== missionId);
    if(existingInSlot){
      existingInSlot.orden = previousSlot;
      await storage.updateMission(passId, existingInSlot.id, buildMissionPayload(existingInSlot));
    }
  }

  draggedMission.orden = targetSlot;
  const updatedPass = await storage.updateMission(passId, missionId, buildMissionPayload(draggedMission));
  replacePass(updatedPass);

  const toastMsg = targetSlot > 0 
    ? `«${draggedMission.title}» colocada en Casilla #${targetSlot}`
    : `«${draggedMission.title}» movida a Misiones en Espera`;

  celebrateOrderUpdate(toastMsg);
  render();
}

/* =====================================================================
   CELEBRACIONES Y BOLETINES
   ===================================================================== */
function celebrateLevelUp(pass){
  const layer = document.getElementById('toastLayer');
  const toast = document.createElement('div');
  toast.className = 'bulletin';
  toast.style.setProperty('--accent', pass.color);
  toast.innerHTML = `
    <span class="bulletin-icon">${pass.icon}</span>
    <div>
      <strong>Sube de nivel</strong>
      <p>${escapeHtml(pass.name)} · Nivel ${pass.currentLevel}</p>
    </div>
  `;
  layer.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('is-visible'));
  setTimeout(() => {
    toast.classList.remove('is-visible');
    setTimeout(() => toast.remove(), 350);
  }, 3200);
}

function celebrateRewardClaim(reward){
  const layer = document.getElementById('toastLayer');
  const toast = document.createElement('div');
  toast.className = 'bulletin bulletin--reward';
  toast.innerHTML = `
    <span class="bulletin-icon">${reward.icon}</span>
    <div>
      <strong>Premio reclamado</strong>
      <p>Obtuviste: ${escapeHtml(reward.name)}</p>
    </div>
  `;
  layer.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('is-visible'));
  setTimeout(() => {
    toast.classList.remove('is-visible');
    setTimeout(() => toast.remove(), 350);
  }, 3200);
}

function celebrateOrderUpdate(message){
  const layer = document.getElementById('toastLayer');
  const toast = document.createElement('div');
  toast.className = 'bulletin';
  toast.innerHTML = `
    <span class="bulletin-icon">📌</span>
    <div>
      <strong>Orden de Edición</strong>
      <p>${escapeHtml(message)}</p>
    </div>
  `;
  layer.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('is-visible'));
  setTimeout(() => {
    toast.classList.remove('is-visible');
    setTimeout(() => toast.remove(), 350);
  }, 2400);
}

/* =====================================================================
   MANEJO DE EVENTOS Y ACCIONES
   ===================================================================== */
async function handleComplete(passId, missionId){
  const prevLevel = state.passes.find(p => p.id === passId)?.currentLevel ?? 0;
  const updated = await storage.completeMission(passId, missionId);
  replacePass(updated);
  if(updated.currentLevel > prevLevel) celebrateLevelUp(updated);
  render();
}

async function handleIncrement(passId, missionId){
  const prevLevel = state.passes.find(p => p.id === passId)?.currentLevel ?? 0;
  const updated = await storage.incrementMission(passId, missionId, 1);
  replacePass(updated);
  if(updated.currentLevel > prevLevel) celebrateLevelUp(updated);
  render();
}

document.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-action]');
  if(!el) return;
  const action = el.dataset.action;
  const passId = el.dataset.pass;
  const missionId = el.dataset.mission;
  const level = el.dataset.level;

  try{
    switch(action){
      case 'select-pass':
        state.activePassId = passId;
        const selectedPass = state.passes.find(p => p.id === passId);
        if(selectedPass){
          state.carouselPage = Math.ceil(selectedPass.currentLevel / 5) || 1;
        }
        render();
        break;
      case 'prev-page':
        if(state.carouselPage > 1){
          state.carouselPage--;
          render();
        }
        break;
      case 'next-page':
        state.carouselPage++;
        render();
        break;
      case 'edit-reward':
        openRewardModal(passId, level);
        break;
      case 'claim-reward': {
        const pass = state.passes.find(p => p.id === passId);
        const reward = (pass?.rewards || []).find(r => r.level === Number(level));
        const updated = await storage.claimReward(passId, level);
        replacePass(updated);
        if(reward) celebrateRewardClaim(reward);
        render();
        break;
      }
      case 'new-mission':
        openMissionModal(passId);
        break;
      case 'complete-mission':
        await handleComplete(passId, missionId);
        break;
      case 'increment-mission':
        await handleIncrement(passId, missionId);
        break;
      case 'delete-mission': {
        if(!confirm('¿Retirar esta misión?')) break;
        const updated = await storage.deleteMission(passId, missionId);
        replacePass(updated);
        render();
        break;
      }
      case 'edit-pass':
        openPassModal(state.passes.find(p => p.id === passId));
        break;
      case 'delete-pass': {
        if(!confirm('¿Eliminar esta sección y todas sus misiones?')) break;
        await storage.deleteBattlePass(passId);
        state.passes = state.passes.filter(p => p.id !== passId);
        if(state.activePassId === passId) state.activePassId = state.passes[0]?.id ?? null;
        render();
        break;
      }
    }
  }catch(err){
    console.error(err);
    alert(err.message || 'Ocurrió un error');
  }
});

/* =====================================================================
   FICHAS / MODALES
   ===================================================================== */
const modalPass = document.getElementById('modalPass');
const formPass = document.getElementById('formPass');
const modalMission = document.getElementById('modalMission');
const formMission = document.getElementById('formMission');
const modalReward = document.getElementById('modalReward');
const formReward = document.getElementById('formReward');
const inputMaxLevel = document.getElementById('inputMaxLevel');

function closeModals(){
  modalPass.hidden = true;
  modalMission.hidden = true;
  modalReward.hidden = true;
}

document.querySelectorAll('[data-close-modal]').forEach(btn => btn.addEventListener('click', closeModals));
document.getElementById('btnNewPass').addEventListener('click', () => openPassModal());

function renderRewardsEditorList(){
  const listContainer = document.getElementById('rewardsEditorList');
  const totalLevels = Math.min(100, Math.max(1, Number(inputMaxLevel.value) || 20));

  const rewardsMap = new Map();
  if(currentEditingPass && currentEditingPass.rewards){
    currentEditingPass.rewards.forEach(r => rewardsMap.set(Number(r.level), r));
  }

  const currentRows = listContainer.querySelectorAll('.prize-row');
  currentRows.forEach(row => {
    const lvl = Number(row.dataset.level);
    const icon = row.querySelector('.prize-icon-input').value;
    const name = row.querySelector('.prize-name-input').value;
    if(name || icon){
      rewardsMap.set(lvl, { level: lvl, name, icon });
    }
  });

  let html = '';
  for(let lvl = 1; lvl <= totalLevels; lvl++){
    const existing = rewardsMap.get(lvl) || { name: '', icon: '🎁' };
    html += `
      <div class="prize-row" data-level="${lvl}">
        <span class="prize-row-level">Nv. ${lvl}</span>
        <input type="text" class="prize-icon-input" placeholder="🎁" value="${escapeHtml(existing.icon || '🎁')}" maxlength="4">
        <input type="text" class="prize-name-input" placeholder="Premio del nivel ${lvl}..." value="${escapeHtml(existing.name || '')}">
      </div>
    `;
  }
  listContainer.innerHTML = html;
}

inputMaxLevel.addEventListener('input', () => {
  renderRewardsEditorList();
});

function openPassModal(pass = null){
  formPass.reset();
  currentEditingPass = pass;

  if(pass){
    formPass.dataset.editId = pass.id;
    formPass.querySelector('[name=name]').value = pass.name;
    formPass.querySelector('[name=icon]').value = pass.icon;
    formPass.querySelector('[name=color]').value = pass.color;
    formPass.querySelector('[name=description]').value = pass.description;
    formPass.querySelector('[name=starsPerLevel]').value = pass.starsPerLevel;
    inputMaxLevel.value = pass.maxLevel || 20;

    document.getElementById('passModalTitle').textContent = 'Editar sección';
    document.getElementById('btnSubmitPass').textContent = 'Guardar cambios';
  }else{
    delete formPass.dataset.editId;
    inputMaxLevel.value = 20;
    document.getElementById('passModalTitle').textContent = 'Nueva sección';
    document.getElementById('btnSubmitPass').textContent = 'Publicar sección';
  }

  renderRewardsEditorList();
  modalPass.hidden = false;
}

function openMissionModal(passId){
  formMission.reset();
  formMission.dataset.pass = passId;
  formMission.querySelector('[name=orden]').value = '0';
  formMission.querySelector('.counter-fields').hidden = true;
  
  // Selecciona el primer color pastel por defecto (#f6efdd)
  const defaultColorRadio = formMission.querySelector('input[name=color][value="#f6efdd"]');
  if(defaultColorRadio) defaultColorRadio.checked = true;

  modalMission.hidden = false;
}

function openRewardModal(passId, level){
  formReward.reset();
  formReward.dataset.pass = passId;
  document.getElementById('rewardLevelInput').value = level;
  document.getElementById('rewardModalTitle').textContent = `Premio del nivel ${level}`;

  const pass = state.passes.find(p => p.id === passId);
  const reward = (pass?.rewards || []).find(r => r.level === Number(level));

  if(reward){
    formReward.querySelector('[name=name]').value = reward.name;
    formReward.querySelector('[name=icon]').value = reward.icon;
  }

  modalReward.hidden = false;
}

formMission.addEventListener('change', (e) => {
  if(e.target.name === 'metricType'){
    formMission.querySelector('.counter-fields').hidden = e.target.value !== 'counter';
  }
});

formPass.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(formPass);

  const rewardRows = formPass.querySelectorAll('.prize-row');
  const rewards = [];
  rewardRows.forEach(row => {
    const lvl = Number(row.dataset.level);
    const icon = row.querySelector('.prize-icon-input').value.trim() || '🎁';
    const name = row.querySelector('.prize-name-input').value.trim();
    if(name){
      const existing = currentEditingPass?.rewards?.find(r => r.level === lvl);
      rewards.push({
        level: lvl,
        name,
        icon,
        claimed: existing ? existing.claimed : false
      });
    }
  });

  const payload = {
    name: fd.get('name').trim(),
    icon: fd.get('icon').trim() || '⭐',
    color: fd.get('color'),
    description: fd.get('description').trim(),
    starsPerLevel: fd.get('starsPerLevel'),
    maxLevel: fd.get('maxLevel'),
    rewards
  };

  const editId = formPass.dataset.editId;
  const pass = editId
    ? await storage.updateBattlePass(editId, payload)
    : await storage.createBattlePass(payload);

  replacePass(pass);
  if(!editId) {
    state.activePassId = pass.id;
    state.carouselPage = 1;
  }
  closeModals();
  render();
});

formMission.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(formMission);
  const passId = formMission.dataset.pass;

  const startVal = fd.get('startDate');
  const endVal = fd.get('endDate');

  const payload = {
    title: fd.get('title').trim(),
    description: fd.get('description').trim(),
    starsValue: Number(fd.get('starsValue')) || 1,
    metricType: fd.get('metricType'),
    unit: fd.get('unit'),
    targetValue: fd.get('targetValue'),
    orden: Number(fd.get('orden')) || 0,
    startDate: startVal ? new Date(startVal).toISOString() : null,
    endDate: endVal ? new Date(endVal).toISOString() : null,
    color: fd.get('color') || '#f6efdd' // 👈 Color pastel seleccionado
  };

  const updated = await storage.createMission(passId, payload);
  replacePass(updated);
  closeModals();
  render();
});

formReward.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(formReward);
  const passId = formReward.dataset.pass;
  const level = fd.get('level');
  const name = fd.get('name').trim();
  const icon = fd.get('icon').trim() || '🎁';

  const updated = await storage.saveReward(passId, level, { name, icon });
  replacePass(updated);
  closeModals();
  render();
});

/* =====================================================================
   EXPORTAR DATOS
   ===================================================================== */
document.getElementById('btnExport').addEventListener('click', () => {
  const raw = localStorage.getItem('pasesDeVida:data') || JSON.stringify({ battlePasses: [] });
  const blob = new Blob([raw], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'pases-de-vida.json';
  a.click();
  URL.revokeObjectURL(url);
});

/* =====================================================================
   INIT & TIMER INTERVAL
   ===================================================================== */
setInterval(updateLiveTimers, 1000);

async function init(){
  setDateline();
  state.passes = await storage.getBattlePasses();
  state.activePassId = state.passes[0]?.id ?? null;
  if(state.passes[0]){
    state.carouselPage = Math.ceil(state.passes[0].currentLevel / 5) || 1;
  }
  render();
}
init();