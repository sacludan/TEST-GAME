/* 平衡實驗室：使用正式版 NPC／物品／戰鬥與成長程式，於 Web Worker 執行無畫面模擬。 */
'use strict';
self.window = self;
self.document = { readyState: 'loading', addEventListener() {}, getElementById() { return null; } };
importScripts(
  'items_weapon.js', 'items_armor.js', 'items_material.js', 'items_food.js',
  'recipes.js', 'maps.js', 'characters.js', 'game_config.js',
  'growth.js', 'ai.js', 'combat.js', 'main.js'
);
// 避免每場產生 HTML 戰報。保留主程式的所有戰鬥、合成與 NPC 決策規則。
addLog = function () {};
// GAME_DATA.items 每次讀取都會重新合併四張靜態表；模擬時固定物品資料，
// 用完全相同的物件引用建立一次索引，避免幾百萬次不必要的重建。
const STATIC_ITEMS = Object.assign({}, WEAPONS_DATA.items, ARMORS_DATA.items, MATERIALS_DATA.items, FOODS_DATA.items);
ItemRegistry.get = function (itemId) {
  if (!itemId) return null;
  return STATIC_ITEMS[this.ALIAS[itemId] || itemId] || null;
};
ItemRegistry.getAllItems = function () { return STATIC_ITEMS; };
let cancelled = false;
let activeMetrics = null;
const heroIds = Object.keys(GAME_CHARACTERS);
const nativeRandom = Math.random;
function seededRandom(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
function track(e) { return e && activeMetrics && activeMetrics[e.id]; }

// 統計是觀測層，覆蓋包裝但不改原版規則。
const originalHit = resolveCombatHit;
resolveCombatHit = function (attacker, defender, rawDamage) {
  const r = originalHit(attacker, defender, rawDamage);
  const a = track(attacker), d = track(defender);
  if (a) {
    a.attackAttempts++;
    a.damageDealt += r.damage;
    if (r.damage > 0) a.hits++;
  }
  if (d) {
    d.damageTaken += r.damage;
    if (r.dodged) d.dodges++;
    d.healing += r.heal + (r.guan ? 25 : 0);
    d.reflected += r.reflected;
  }
  return r;
};
const originalFood = aiUseFood;
aiUseFood = function (entity, force = false) {
  const before = entity.hp;
  const used = originalFood(entity, force);
  const m = track(entity);
  if (used && m) { m.foodUses++; m.healing += Math.max(0, entity.hp - before); }
  return used;
};
const originalActive = aiUseCombatSkill;
aiUseCombatSkill = function (attacker, defender) {
  const before = attacker.hp;
  const used = originalActive(attacker, defender);
  const m = track(attacker);
  if (used && m) { m.skills++; m.healing += Math.max(0, attacker.hp - before); }
  return used;
};
const originalNonCombat = aiTryUseNonCombatSkill;
aiTryUseNonCombatSkill = function (entity) {
  const before = entity.hp;
  const used = originalNonCombat(entity);
  const m = track(entity);
  if (used && m) { m.skills++; m.healing += Math.max(0, entity.hp - before); }
  return used;
};
const originalCraft = craftItem;
craftItem = function (entity, recipe, isPlayer = true) {
  const done = originalCraft(entity, recipe, isPlayer);
  const m = track(entity);
  if (done && m) m.crafts++;
  return done;
};
const originalLoot = lootOneItemForAI;
lootOneItemForAI = function (entity) {
  const done = originalLoot(entity);
  const m = track(entity);
  if (done && m) m.loots++;
  return done;
};
const originalMove = moveAIToSafeZone;
moveAIToSafeZone = function (...args) {
  const entity = args[0], before = entity.zone;
  const done = originalMove(...args);
  const m = track(entity);
  if (m && done && entity.zone !== before) m.moves++;
  return done;
};

function emptyMetrics(id, position) {
  return {id, position, deathAt:null, rank:null, won:0, damageDealt:0, damageTaken:0,
    attackAttempts:0, hits:0, dodges:0, reflected:0, healing:0,
    foodUses:0, skills:0, crafts:0, loots:0, moves:0, kills:0,
    equipScore:0, equipRarity:0, level:0, survival:0, pigSaved:0};
}
function zoneClone(zone) { return {...zone, drops:[...zone.drops], initialDrops:[...new Set(zone.drops)]}; }
const MAX_SIM_SECONDS = 1200;
function simulate(matchNumber, seed, difficulty, rotationBlock) {
  // 同一組 9 場採用同一個隨機基底排列，循環位移，讓每個角色各站過每個行動順位一次。
  // 不同組打散基底排列；起始區每場獨立隨機抽樣，且每名角色位於不同起始區。
  Math.random = seededRandom((seed ^ Math.imul(matchNumber + 1, 0x9E3779B9)) >>> 0);
  // 透過定序區塊的排列與輪轉控制順位；與隨機起始位置抽樣獨立。
  const order = rotationBlock.slice(matchNumber % heroIds.length).concat(rotationBlock.slice(0, matchNumber % heroIds.length));
  const spawnById = Object.create(null);
  // 與正式版相同：每位 NPC 獨立隨機選擇地圖，可能出生在相同區域。
  heroIds.forEach(id => {
    spawnById[id] = MAPS_DATA.zones[Math.floor(Math.random() * MAPS_DATA.zones.length)].id;
  });

  DEV_CONFIG.aiDifficulty = difficulty;
  DEV_CONFIG.enableNPC = true;
  DEV_CONFIG.enableShrink = true;
  state.timeSec = 0; state.aiTimeSec = 0; state.round = 1; state.roundTimeRemain = ZONE_ROUND_SECONDS;
  state.closedZones = []; state.temporaryClosedZones = []; state.permanentClosedZones = [];
  state.pendingCloseZones = []; state.finalStormActive = false; state.activeZones = MAPS_DATA.zones.map(zoneClone);
  state.player = null; state.ais = order.map(id => createCharacterEntity(id, false, spawnById[id]));
  state.ai = null; state.inCombat = false; state.gameOver = false;
  // 目標規劃快取和 NPC 的個人狀態都由正式版程式碼初始化。
  activeMetrics = Object.create(null);
  order.forEach((id, position) => { activeMetrics[id] = emptyMetrics(id, position + 1); });
  pickNextPendingZones();
  let seconds = 0;
  const entities = state.ais;
  for (let tick = 1; tick <= MAX_SIM_SECONDS * 2; tick++) {
    state.aiTimeSec = tick / 2;
    const secondBoundary = tick % 2 === 0;
    if (secondBoundary) {
      state.timeSec = seconds = tick / 2;
      entities.forEach(tickEntityTimers);
      if (!state.finalStormActive) {
        state.roundTimeRemain--;
        if (state.roundTimeRemain <= 0) executeZoneShrink();
      }
      if (state.finalStormActive) {
        const toResolve = [];
        for (const entity of entities) {
          if (!entity.alive) continue;
          entity.hp = Math.max(0, entity.hp - 12 - (state.closedZones.includes(entity.zone) ? 12 : 0));
          if (entity.hp <= 0) toResolve.push(entity);
        }
        for (const entity of toResolve) aiResolveUnitDefeat(entity, null);
      }
    }
    if (!state.finalStormActive || entities.some(e => e.alive)) runAIBrain();
    for (const entity of entities) {
      const m = activeMetrics[entity.id];
      if (!entity.alive && m.deathAt === null) m.deathAt = state.aiTimeSec;
    }
    if (entities.filter(e => e.alive).length <= 1) break;
  }
  const survivors = entities.filter(e => e.alive);
  const winnerId = survivors.length === 1 ? survivors[0].id : null;
  const finalSeconds = state.aiTimeSec;
  // 按死亡秒數處理相同時刻的名次，避免風暴同秒淘汰偏袒陣列先後順序。
  for (const entity of entities) {
    const m = activeMetrics[entity.id];
    m.deathAt = m.deathAt === null ? finalSeconds : m.deathAt;
    m.survival = m.deathAt;
    m.kills = entity.killCount || 0;
    m.level = getGrowthLevel(entity);
    m.pigSaved = entity.pigReviveUsed ? 1 : 0;
    let score = 0, rarity = 0;
    for (const item of Object.values(entity.equip)) {
      if (!item) continue;
      score += Number(item.score) || 0;
      rarity += Number(item.rarity) || 1;
    }
    m.equipScore = score;
    m.equipRarity = rarity;
    m.won = entity.id === winnerId ? 1 : 0;
  }
  const results = Object.values(activeMetrics);
  for (const m of results) {
    const later = results.filter(r => !r.won && r.deathAt > m.deathAt).length;
    const equal = results.filter(r => !r.won && r.deathAt === m.deathAt).length;
    // 勝利者即使與最後一名淘汰者在同一個 0.5s 時刻結算，仍必須是單獨第 1 名。
    m.rank = m.won ? 1 : 1 + (winnerId ? 1 : 0) + later + (equal - 1) / 2;
  }
  activeMetrics = null;
  Math.random = nativeRandom;
  return {winnerId, seconds:finalSeconds, characters:results};
}

function aggregate(matches) {
  const totals = Object.create(null);
  const rankWins = Array.from({length: heroIds.length}, () => ({games:0,wins:0}));
  for (const id of heroIds) {
    totals[id] = {id, name:GAME_CHARACTERS[id].name, games:0, wins:0, top3:0,
      rank:0,survival:0, damageDealt:0, damageTaken:0, skills:0, reflected:0,
      healing:0, hits:0, dodges:0, crafts:0, loots:0, moves:0, foodUses:0,
      equipScore:0, equipRarity:0, level:0, kills:0, pigSaved:0};
  }
  let draws=0, totalSeconds=0;
  for (const match of matches) {
    if (!match.winnerId) draws++;
    totalSeconds += match.seconds;
    for (const c of match.characters) {
      const t = totals[c.id];
      t.games++; t.wins+=c.won; t.top3+=(c.rank<=3?1:0);
      for (const k of ['rank','survival','damageDealt','damageTaken','skills','reflected',
        'healing','hits','dodges','crafts','loots','moves','foodUses','equipScore',
        'equipRarity','level','kills','pigSaved']) t[k]+=c[k];
      const r = rankWins[c.position-1];
      r.games++; r.wins+=c.won;
    }
  }
  const avgKeys = ['rank','survival','damageDealt','damageTaken','skills','reflected',
    'healing','hits','dodges','crafts','loots','moves','foodUses','equipScore',
    'equipRarity','level','kills','pigSaved'];
  const roster = heroIds.map(id => {
    const t = totals[id], n=Math.max(1,t.games), row={...t, winRate:100*t.wins/n,top3Rate:100*t.top3/n};
    for (const k of avgKeys) row[k]=t[k]/n;
    return row;
  });
  return {roster, rankWins, draws, completed:matches.length,
    avgSeconds:matches.length ? totalSeconds/matches.length : 0};
}
let started=false;
onmessage = async function (event) {
  const input = event.data || {};
  if (input.type === 'cancel') { cancelled = true; return; }
  if (input.type !== 'start' || started) return;
  started=true; cancelled=false;
  try {
    const n = Math.min(10000, Math.max(1, Math.floor(Number(input.count)||100)));
    const seed = (Number(input.seed)>>>0) || 20261019;
    const difficulty = input.difficulty === 'easy' ? 'easy' : 'hard';
    const matches=[];
    let rotationBlock=[];
    const updateEvery=Math.max(1,Math.floor(n/100));
    let previousUpdate=performance.now();
    const runStarted=previousUpdate;
    for (let i=0; i<n; i++) {
      if (cancelled) break;
      if (i%heroIds.length===0) {
        Math.random=seededRandom((seed ^ Math.imul(Math.floor(i/heroIds.length)+777, 0x7F4A7C15))>>>0);
        rotationBlock=shuffle([...heroIds]);
        Math.random=nativeRandom;
      }
      matches.push(simulate(i,seed,difficulty,rotationBlock));
      const now=performance.now();
      if ((i+1)%updateEvery===0 || now-previousUpdate>=450 || i===n-1) {
        postMessage({type:'progress', completed:i+1,total:n,elapsedMs:now-runStarted});
        previousUpdate=now;
        // 讓 Worker 有機會接收停止訊息，不依賴前端瀏覽器的 requestAnimationFrame。
        await new Promise(resolve => setTimeout(resolve,0));
      }
    }
    const report=aggregate(matches);
    postMessage({type:'done', report, settings:{seed,difficulty,requested:n}, cancelled, engine:'正式 AI／戰鬥／合成規則；全 NPC 對局；500ms 時脈；每 9 局輪換執行順位'});
  } catch (error) {
    postMessage({type:'error',message:String(error?.stack||error)});
  } finally {
    activeMetrics=null; Math.random=nativeRandom; started=false;
  }
};
