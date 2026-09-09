// src/services/storage.js
const CONFIG = {
  storageMode: 'api', // 'api' o 'local'
  apiBaseUrl: 'https://pasesdevida-api-bag0daa3cscjhthb.mexicocentral-01.azurewebsites.net/api',
};

class LocalStorageAdapter {
  constructor(key = 'pasesDeVida:data'){
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
    if(!pass) throw new Error('Pase no encontrado');
    if(!pass.rewards) pass.rewards = [];
    if(!pass.maxLevel) pass.maxLevel = 20;
    return pass;
  }
  _addStars(pass, stars){
    pass.totalStarsEarned = (pass.totalStarsEarned || 0) + stars;
    pass.currentStars = (pass.currentStars || 0) + stars;
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
    return this._read().battlePasses;
  }
  async createBattlePass(data){
    const store = this._read();
    const now = new Date().toISOString();
    const pass = {
      id: crypto.randomUUID(),
      ...data,
      currentLevel: 1,
      currentStars: 0,
      totalStarsEarned: 0,
      createdAt: now,
      updatedAt: now,
      missions: [],
      rewards: Array.isArray(data.rewards) ? data.rewards : []
    };
    store.battlePasses.push(pass);
    this._write(store);
    return pass;
  }
  async updateBattlePass(id, updates){
    const store = this._read();
    const pass = this._findPass(store, id);
    Object.assign(pass, updates, { updatedAt: new Date().toISOString() });
    this._write(store);
    return pass;
  }
  async deleteBattlePass(id){
    const store = this._read();
    store.battlePasses = store.battlePasses.filter(p => p.id !== id);
    this._write(store);
    return null;
  }
  async createMission(passId, missionData){
    const store = this._read();
    const pass = this._findPass(store, passId);
    pass.missions.push({
      id: crypto.randomUUID(),
      ...missionData,
      currentValue: 0,
      completed: false,
      completedAt: null,
      createdAt: new Date().toISOString()
    });
    this._write(store);
    return pass;
  }
  async updateMission(passId, missionId, updates){
    const store = this._read();
    const pass = this._findPass(store, passId);
    const mission = pass.missions.find(m => m.id === missionId);
    if(mission) Object.assign(mission, updates);
    this._write(store);
    return pass;
  }
  async deleteMission(passId, missionId){
    const store = this._read();
    const pass = this._findPass(store, passId);
    pass.missions = pass.missions.filter(m => m.id !== missionId);
    this._write(store);
    return pass;
  }
  async completeMission(passId, missionId){
    const store = this._read();
    const pass = this._findPass(store, passId);
    const mission = pass.missions.find(m => m.id === missionId);
    if(mission && !mission.completed){
      mission.completed = true;
      mission.completedAt = new Date().toISOString();
      if(mission.metricType === 'counter') mission.currentValue = mission.targetValue;
      this._addStars(pass, mission.starsValue);
      this._write(store);
    }
    return pass;
  }
  async incrementMission(passId, missionId, amount = 1){
    const store = this._read();
    const pass = this._findPass(store, passId);
    const mission = pass.missions.find(m => m.id === missionId);
    if(mission && !mission.completed && mission.metricType === 'counter'){
      mission.currentValue = Math.min(mission.targetValue, mission.currentValue + amount);
      if(mission.currentValue >= mission.targetValue){
        mission.completed = true;
        mission.completedAt = new Date().toISOString();
        this._addStars(pass, mission.starsValue);
      }
      this._write(store);
    }
    return pass;
  }
  async claimReward(passId, level){
    const store = this._read();
    const pass = this._findPass(store, passId);
    const reward = (pass.rewards || []).find(r => r.level === Number(level));
    if(reward && !reward.claimed){
      reward.claimed = true;
      this._write(store);
    }
    return pass;
  }
}

class ApiStorageAdapter {
  constructor(baseUrl){ this.baseUrl = baseUrl; }
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
  incrementMission(bpId, mId, amount = 1){ return this._req(`/battlepasses/${bpId}/missions/${mId}/progress`, { method:'POST', body: JSON.stringify({ amount }) }); }
  claimReward(bpId, level){ return this._req(`/battlepasses/${bpId}/rewards/${level}/claim`, { method:'POST' }); }
}

export const storage = CONFIG.storageMode === 'api'
  ? new ApiStorageAdapter(CONFIG.apiBaseUrl)
  : new LocalStorageAdapter();