/* =====================================================================
   CONFIG
   ===================================================================== */
const CONFIG = {
  storageMode: 'api',
  apiBaseUrl: 'https://pasesdevida-api-bag0daa3cscjhthb.mexicocentral-01.azurewebsites.net/api',
};

/* =====================================================================
   STORAGE ADAPTERS
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
      color: color || '#ff2a85',
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

  async createMission(battlePassId, { title, description, starsValue, metricType, unit, targetValue }){
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
   ESTADO Y RENDER
   ===================================================================== */
const state = {
  passes: [],
  activePassId: null,
  carouselPage: 1
};

let currentEditingPass = null;

function escapeHtml(str = ''){
  return String(str).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

function replacePass(updatedPass){
  const idx = state.passes.findIndex(p => p.id === updatedPass.id);
  if(idx > -1) state.passes[idx] = updatedPass;
  else state.passes.push(updatedPass);
}

function render(){
  renderRail();
  renderHud();
}

function renderRail(){
  const list = document.getElementById('railList');
  if(!state.passes.length){
    list.innerHTML = `<p class="rail-empty">🎮 Todavía no tienes pases.<br>Crea el primero con "+".</p>`;
    return;
  }
  list.innerHTML = state.passes.map(p => `
    <button class="pass-chip ${p.id === state.activePassId ? 'is-active' : ''}" data-action="select-pass" data-pass="${p.id}" style="--accent:${p.color}">
      <span class="chip-icon">${p.icon}</span>
      <span class="chip-info">
        <span class="chip-name">${escapeHtml(p.name)}</span>
        <span class="chip-level">NIVEL ${p.currentLevel}</span>
      </span>
      <span class="chip-bar"><span class="chip-bar-fill" style="width:${(p.currentStars / p.starsPerLevel) * 100}%"></span></span>
    </button>
  `).join('');
}

function missionCard(pass, m){
  const isCounter = m.metricType === 'counter';
  return `
    <article class="mission-card ${m.completed ? 'is-complete' : ''}" style="--accent:${pass.color}">
      <span class="mission-star">+${m.starsValue} ★</span>
      <button class="mission-delete" data-action="delete-mission" data-pass="${pass.id}" data-mission="${m.id}" title="Eliminar misión">✕</button>
      <h3>${escapeHtml(m.title)}</h3>
      ${m.description ? `<p>${escapeHtml(m.description)}</p>` : ''}
      ${isCounter ? `
        <div class="mission-progress">
          <div class="progress-bar"><div class="progress-fill" style="width:${Math.min(100, (m.currentValue / m.targetValue) * 100)}%;"></div></div>
          <span>${m.currentValue} / ${m.targetValue} ${escapeHtml(m.unit || '')}</span>
        </div>
        ${!m.completed ? `<button class="btn-secondary" data-action="increment-mission" data-pass="${pass.id}" data-mission="${m.id}">+1 ${escapeHtml(m.unit || '')}</button>` : '<span class="badge-done">✓ COMPLETADA</span>'}
      ` : `
        ${!m.completed ? `<button class="btn-complete" data-action="complete-mission" data-pass="${pass.id}" data-mission="${m.id}">¡MARCAR COMPLETADA!</button>` : '<span class="badge-done">✓ COMPLETADA</span>'}
      `}
    </article>
  `;
}

function renderHud(){
  const hud = document.getElementById('hud');
  const pass = state.passes.find(p => p.id === state.activePassId);

  if(!pass){
    hud.innerHTML = `
      <div class="empty-state">
        <p class="empty-emoji">🕹️</p>
        <h2>NO HAY PASE ACTIVO</h2>
        <p>Selecciona o crea un Pase de Batalla para comenzar a ganar XP y subir de nivel tus hábitos.</p>
        <button class="btn-primary" id="btnEmptyNewPass">+ CREAR MI PRIMER PASE</button>
      </div>`;
    document.getElementById('btnEmptyNewPass')?.addEventListener('click', () => openPassModal());
    return;
  }

  const segments = Array.from({ length: pass.starsPerLevel }, (_, i) =>
    `<span class="segment ${i < pass.currentStars ? 'is-filled' : ''}"></span>`
  ).join('');

  // Lógica del Carrusel estilo Fortnite (5 niveles por página)
  const maxDefinedLevel = pass.maxLevel || 20;
  const totalPages = Math.ceil(maxDefinedLevel / 5);
  if(state.carouselPage > totalPages) state.carouselPage = totalPages;
  if(state.carouselPage < 1) state.carouselPage = 1;

  const startLevel = (state.carouselPage - 1) * 5 + 1;
  const levelCardsHtml = Array.from({ length: 5 }, (_, i) => {
    const lvl = startLevel + i;
    if(lvl > maxDefinedLevel) {
      return `
        <div class="level-card is-locked" style="opacity:0.2;">
          <div class="level-card-header"><span>MAX</span></div>
          <div class="level-card-body"><div class="reward-empty">Fin del Pase</div></div>
        </div>
      `;
    }

    const isUnlocked = lvl <= pass.currentLevel;
    const reward = (pass.rewards || []).find(r => r.level === lvl);

    let statusBtn = '';
    if(!isUnlocked){
      statusBtn = `<span class="status-badge locked">🔒 BLOQUEADO</span>`;
    } else if(reward && !reward.claimed){
      statusBtn = `<button class="btn-claim" data-action="claim-reward" data-pass="${pass.id}" data-level="${lvl}">🎁 RECLAMAR</button>`;
    } else if(reward && reward.claimed){
      statusBtn = `<span class="status-badge claimed">✓ RECLAMADO</span>`;
    } else {
      statusBtn = `<span class="status-badge locked" style="border-color:var(--neon-green); color:var(--neon-green);">✨ LOGRADO</span>`;
    }

    return `
      <div class="level-card ${isUnlocked ? 'is-reached' : 'is-locked'}">
        <div class="level-card-header">
          <span>NIVEL ${lvl}</span>
        </div>
        <div class="level-card-body">
          ${reward ? `
            <div class="reward-icon">${reward.icon}</div>
            <div class="reward-name">${escapeHtml(reward.name)}</div>
          ` : `
            <div class="reward-icon" style="opacity:0.3;">🎁</div>
            <div class="reward-empty">Sin premio</div>
          `}
          ${statusBtn}
        </div>
      </div>
    `;
  }).join('');

  const pending = pass.missions.filter(m => !m.completed);
  const done = pass.missions.filter(m => m.completed);

  hud.innerHTML = `
    <section class="banner" style="--accent:${pass.color}">
      <div class="banner-top">
        <div class="banner-id">
          <span class="banner-icon">${pass.icon}</span>
          <div>
            <h1>${escapeHtml(pass.name)}</h1>
            <p>${escapeHtml(pass.description || 'Sin descripción asignada.')}</p>
          </div>
        </div>
        <div class="banner-actions">
          <button class="btn-icon" data-action="edit-pass" data-pass="${pass.id}" title="Editar pase">✎</button>
          <button class="btn-icon danger" data-action="delete-pass" data-pass="${pass.id}" title="Eliminar pase">🗑</button>
        </div>
      </div>
      <div class="level-track">
        <span class="level-badge">LVL ${pass.currentLevel} / ${pass.maxLevel}</span>
        <div class="segments">${segments}</div>
        <span class="stars-count">${pass.currentStars} / ${pass.starsPerLevel} ★ XP</span>
      </div>
    </section>

    <!-- CARRUSEL ESTILO FORTNITE -->
    <section class="battlepass-carousel">
      <div class="carousel-header">
        <h2 class="carousel-title">🏆 PREMIOS DEL PASE DE BATALLA</h2>
        <div class="carousel-nav">
          <button class="btn-icon" data-action="prev-page" ${state.carouselPage === 1 ? 'disabled style="opacity:0.4;"' : ''}>❮</button>
          <span class="page-indicator">PÁG ${state.carouselPage} / ${totalPages}</span>
          <button class="btn-icon" data-action="next-page" ${state.carouselPage === totalPages ? 'disabled style="opacity:0.4;"' : ''}>❯</button>
        </div>
      </div>
      <div class="carousel-grid">
        ${levelCardsHtml}
      </div>
    </section>

    <section class="missions">
      <div class="missions-header">
        <h2>MISIONES <span class="count">${pending.length}</span></h2>
        <button class="btn-primary" data-action="new-mission" data-pass="${pass.id}">+ NUEVA MISIÓN</button>
      </div>
      <div class="mission-grid">
        ${pending.length ? pending.map(m => missionCard(pass, m)).join('') : '<p class="rail-empty">🎉 No hay misiones pendientes. ¡Añade una para subir de nivel!</p>'}
      </div>

      ${done.length ? `
        <div class="missions-header" style="margin-top: 24px;">
          <h2>COMPLETADAS <span class="count" style="background:var(--neon-green);">${done.length}</span></h2>
        </div>
        <div class="mission-grid is-done">
          ${done.map(m => missionCard(pass, m)).join('')}
        </div>
      ` : ''}
    </section>
  `;
}

/* =====================================================================
   CELEBRACIONES Y TOASTS
   ===================================================================== */
function celebrateLevelUp(pass){
  const layer = document.getElementById('toastLayer');
  const toast = document.createElement('div');
  toast.className = 'level-toast';
  toast.style.setProperty('--accent', pass.color);
  toast.innerHTML = `
    <span class="level-toast-icon">${pass.icon}</span>
    <div>
      <strong>¡LEVEL UP! 🚀</strong>
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
  toast.className = 'level-toast';
  toast.style.borderColor = 'var(--neon-green)';
  toast.innerHTML = `
    <span class="level-toast-icon">${reward.icon}</span>
    <div>
      <strong style="color:var(--neon-green);">¡RECOMPENSA RECLAMADA! 🎉</strong>
      <p>Ganaste: ${escapeHtml(reward.name)}</p>
    </div>
  `;
  layer.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('is-visible'));
  setTimeout(() => {
    toast.classList.remove('is-visible');
    setTimeout(() => toast.remove(), 350);
  }, 3200);
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
        if(!confirm('¿Eliminar esta misión?')) break;
        const updated = await storage.deleteMission(passId, missionId);
        replacePass(updated);
        render();
        break;
      }
      case 'edit-pass':
        openPassModal(state.passes.find(p => p.id === passId));
        break;
      case 'delete-pass': {
        if(!confirm('¿Eliminar este pase de batalla y todas sus misiones?')) break;
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
   MODALES
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

  const currentRows = listContainer.querySelectorAll('.reward-editor-row');
  currentRows.forEach(row => {
    const lvl = Number(row.dataset.level);
    const icon = row.querySelector('.reward-icon-input').value;
    const name = row.querySelector('.reward-name-input').value;
    if(name || icon){
      rewardsMap.set(lvl, { level: lvl, name, icon });
    }
  });

  let html = '';
  for(let lvl = 1; lvl <= totalLevels; lvl++){
    const existing = rewardsMap.get(lvl) || { name: '', icon: '🎁' };
    html += `
      <div class="reward-editor-row" data-level="${lvl}">
        <span class="lvl-tag">LVL ${lvl}</span>
        <input type="text" class="reward-icon-input" placeholder="🎁" value="${escapeHtml(existing.icon || '🎁')}" maxlength="4">
        <input type="text" class="reward-name-input" placeholder="Premio nivel ${lvl}..." value="${escapeHtml(existing.name || '')}">
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
    
    document.getElementById('passModalTitle').textContent = 'EDITAR PASE';
    document.getElementById('btnSubmitPass').textContent = 'GUARDAR CAMBIOS';
  }else{
    delete formPass.dataset.editId;
    inputMaxLevel.value = 20;
    document.getElementById('passModalTitle').textContent = 'NUEVO PASE DE BATALLA';
    document.getElementById('btnSubmitPass').textContent = '¡CREAR PASE!';
  }

  renderRewardsEditorList();
  modalPass.hidden = false;
}

function openMissionModal(passId){
  formMission.reset();
  formMission.dataset.pass = passId;
  formMission.querySelector('.counter-fields').hidden = true;
  modalMission.hidden = false;
}

function openRewardModal(passId, level){
  formReward.reset();
  formReward.dataset.pass = passId;
  document.getElementById('rewardLevelInput').value = level;
  document.getElementById('rewardModalTitle').textContent = `RECOMPENSA NIVEL ${level}`;

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
  
  const rewardRows = formPass.querySelectorAll('.reward-editor-row');
  const rewards = [];
  rewardRows.forEach(row => {
    const lvl = Number(row.dataset.level);
    const icon = row.querySelector('.reward-icon-input').value.trim() || '🎁';
    const name = row.querySelector('.reward-name-input').value.trim();
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
  const updated = await storage.createMission(passId, {
    title: fd.get('title').trim(),
    description: fd.get('description').trim(),
    starsValue: fd.get('starsValue'),
    metricType: fd.get('metricType'),
    unit: fd.get('unit'),
    targetValue: fd.get('targetValue')
  });
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
   INIT
   ===================================================================== */
async function init(){
  state.passes = await storage.getBattlePasses();
  state.activePassId = state.passes[0]?.id ?? null;
  if(state.passes[0]){
    state.carouselPage = Math.ceil(state.passes[0].currentLevel / 5) || 1;
  }
  render();
}
init();