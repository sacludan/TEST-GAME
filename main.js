/**
 * 【主引擎與 UI 控制核心 main.js】
 * 負責：全域狀態、每秒計時迴圈、90秒縮圈、探索搜刮（含資源枯竭）、地圖移動、6格裝備與背包、合成與圖鑑、拖曳系統
 */

// ==========================================
// 1. 統一物品查詢與稀有度註冊表 (ItemRegistry)
// ==========================================
const ItemRegistry = {
  ALIAS: {
    "cloth": "talisman",
    "thick_cloth": "peace_amulet",
    "wood": "wooden_stick",
    "iron_sheet": "scrap_iron",
    "thick_paper": "election_ballot",
    "plastic": "plastic_bag",
    "glass": "camera_module",
    "alcohol": "cooking_wine",
    "scooter_Send": "exhaust_pipe",
    " circuit_board": "wafer",
    "circuit_board": "wafer",
    "herb": "incense",
    "feather": "feather",
    "gov_vest": "legislative_vest"
  },

  RARITY_MAP: {
    // 1階 (⚪ 普通)
    "wooden_stick": 1, "plastic_stool": 1, "rusty_cleaver": 1, "protest_megaphone": 1,
    "melon_helmet": 1, "reading_glasses": 1, "yellow_vest": 1, "light_raincoat": 1,
    "cloth_gloves": 1, "white_slippers": 1, "netizen_cert": 1, "dirty_bracelet": 1,
    "talisman": 1, "scrap_iron": 1, "paper": 1, "plastic_bag": 1, "camera_module": 1,
    "cooking_wine": 1, "exhaust_pipe": 1, "wafer": 1, "incense": 1, "feather": 1,
    "water": 1, "rice": 1, "pork": 1, "betel_nut": 1, "bandage": 1,

    // 2階 (🟢 精良)
    "wolf_bat": 2, "spiked_stool": 2, "opening_machete": 2, "mod_megaphone": 2,
    "sticker_helmet": 2, "wind_goggles": 2, "clean_vest": 2, "reflective_vest": 2,
    "taoist_robe": 2, "insulated_gloves": 2, "pot_shield": 2, "nonslip_slippers": 2,
    "guard_medal": 2, "pretty_bracelet": 2, "peace_amulet": 2, "iron_plate": 2,
    "election_ballot": 2, "nano_wafer": 2, "dash_cam": 2, "mod_exhaust": 2,
    "century_ash": 2, "explosive_bomb": 2, "pork_bento": 2, "kaoliang": 2,
    "double_betel_nut": 2, "survival_pack": 2,

    // 3階 (🔵 稀有)
    "aluminum_bat": 3, "iron_stool": 3, "shark_sword": 3, "village_megaphone": 3,
    "wind_helmet": 3, "purple_cult_robe": 3, "legislative_vest": 3, "tsmc_vest": 3,
    "thick_iron_armor": 3, "engineer_wrist": 3, "protest_shield": 3, "enhanced_slippers": 3,
    "party_card": 3, "grandma_bracelet": 3, "blessed_amulet": 3, "taiwan_value": 3,
    "legislative_bento": 3, "energy_drink": 3,

    // 4階 (🟡 史詩)
    "taichung_bat": 4, "overlord_stool": 4, "ly_thunder_megaphone": 4,
    "full_helmet": 4, "eight_generals_helm": 4, "purple_down": 4, "yellow_robe": 4,
    "tsmc_suit": 4, "engineer_armor": 4, "riot_shield": 4, "studded_slippers": 4,
    "senior_party_card": 4, "mazu_amulet": 4,

    // 5階 (🔴 傳說)
    "mythic_stool": 5, "mazu_helmet": 5, "grandma_jacket": 5,
    "nano_arm": 5, "grandma_slippers": 5, "ultimate_party_card": 5
  },

  RARITY_STYLE: {
    1: { tier: 1, label: "普通", color: "⚪", border: "border-slate-600/80", bg: "bg-slate-900/90", text: "text-slate-200", badge: "bg-slate-800 text-slate-300 border-slate-600" },
    2: { tier: 2, label: "精良", color: "🟢", border: "border-emerald-500/80", bg: "bg-emerald-950/50", text: "text-emerald-300", badge: "bg-emerald-950 text-emerald-300 border-emerald-500/60" },
    3: { tier: 3, label: "稀有", color: "🔵", border: "border-sky-500/80", bg: "bg-sky-950/50", text: "text-sky-300", badge: "bg-sky-950 text-sky-300 border-sky-500/60" },
    4: { tier: 4, label: "史詩", color: "🟡", border: "border-amber-400/90", bg: "bg-amber-950/50", text: "text-amber-300", badge: "bg-amber-950 text-amber-300 border-amber-400/70" },
    5: { tier: 5, label: "傳說", color: "🔴", border: "border-rose-500", bg: "bg-rose-950/60", text: "text-rose-300", badge: "bg-rose-950 text-rose-300 border-rose-500/80" }
  },

  get(itemId) {
    if (!itemId) return null;
    const resolvedId = this.ALIAS[itemId] || itemId;
    if (typeof GAME_DATA !== 'undefined' && GAME_DATA.items && GAME_DATA.items[resolvedId]) {
      return GAME_DATA.items[resolvedId];
    }
    const pools = [window.ITEMS_WEAPON, window.ITEMS_ARMOR, window.ITEMS_MATERIAL, window.ITEMS_FOOD];
    for (const pool of pools) {
      if (pool && pool[resolvedId]) return pool[resolvedId];
    }
    return null;
  },

  getName(itemId) {
    const item = this.get(itemId);
    return item ? item.name : String(itemId || "未知物資");
  },

  getRarity(itemId) {
    const resolvedId = this.ALIAS[itemId] || itemId;
    const item = this.get(resolvedId);
    const tier = (item && item.rarity) ? item.rarity : (this.RARITY_MAP[resolvedId] || 1);
    return this.RARITY_STYLE[tier] || this.RARITY_STYLE[1];
  },

  getAllItems() {
    if (typeof GAME_DATA !== 'undefined' && GAME_DATA.items && Object.keys(GAME_DATA.items).length > 0) {
      return GAME_DATA.items;
    }
    return Object.assign({}, window.ITEMS_WEAPON || {}, window.ITEMS_ARMOR || {}, window.ITEMS_MATERIAL || {}, window.ITEMS_FOOD || {});
  }
};

function getSafeItem(itemId) {
  return ItemRegistry.get(itemId);
}

function getItemDisplayName(itemId) {
  return ItemRegistry.getName(itemId);
}

function getSafeZones() {
  if (state && Array.isArray(state.activeZones) && state.activeZones.length > 0) {
    return state.activeZones;
  }
  if (typeof GAME_DATA !== 'undefined' && Array.isArray(GAME_DATA.zones) && GAME_DATA.zones.length > 0) {
    return GAME_DATA.zones;
  }
  if (typeof MAPS_DATA !== 'undefined' && Array.isArray(MAPS_DATA.zones) && MAPS_DATA.zones.length > 0) {
    return MAPS_DATA.zones;
  }
  return [{ id: "ly", name: "立法院", icon: "🏛️", x: 50, y: 52, drops: [], initialDrops: [] }];
}

function getSafeCurrentZone(zoneId) {
  const zones = getSafeZones();
  return zones.find(z => z.id === zoneId) || zones[0] || { id: "ly", name: "立法院", icon: "🏛️", x: 50, y: 52, drops: [], initialDrops: [] };
}

function getSafeRecipes() {
  if (typeof GAME_DATA !== 'undefined' && Array.isArray(GAME_DATA.recipes) && GAME_DATA.recipes.length > 0) {
    return GAME_DATA.recipes;
  }
  if (typeof RECIPES_DATA !== 'undefined' && Array.isArray(RECIPES_DATA.recipes)) {
    return RECIPES_DATA.recipes;
  }
  return [];
}

// ==========================================
// 2. 開發模式與全域遊戲狀態 (State)
// ==========================================
const DEV_CONFIG = {
  mode: "normal",
  enableShrink: true,
  enableNPC: true,
  aiDifficulty: "easy"
};

const state = {
  timeSec: 0,
  round: 1,
  roundTimeRemain: 90,
  closedZones: [],
  pendingCloseZones: [],
  activeZones: [],
  inCombat: false,
  nextPlayerAmbushSec: 0,
  isSearching: false,
  gameOver: false,
  trackedItemId: null,
  craftBookFilter: "all",
  craftBookType: "all",
  craftBookSearch: "",
  dragSource: null,
  player: null,
  ai: null,
  ais: [],
  logs: []
};

let mainTimer = null;

const PASSIVE_SP_REGEN_PER_SEC = 2;
const REST_SP_REGEN_PER_SEC = 6;
const PLAYER_SEARCH_MS = 2000;
const PLAYER_FAST_SEARCH_MS = 1333;

// ==========================================
// 3. 角色建立與數值計算
// ==========================================
function createCharacterEntity(charId, isPlayer = false, spawnZoneId = "ly") {
  // characters.js 使用 GAME_CHARACTERS 物件；保留舊版 CHARACTERS_DATA 作為相容備援。
  const roster = (typeof GAME_CHARACTERS !== 'undefined' && GAME_CHARACTERS)
    ? GAME_CHARACTERS
    : ((typeof CHARACTERS_DATA !== 'undefined' && CHARACTERS_DATA.roster) ? CHARACTERS_DATA.roster : {});
  const tpl = roster[charId] || Object.values(roster)[0] || {
    id: charId,
    name: "生存者",
    hp: 120,
    sp: 100,
    baseAtk: 12,
    baseDef: 10,
    skill: { name: "爆發", costSp: 20, cd: 15, desc: "造成傷害" },
    passive: { name: "求生", desc: "無" }
  };

  return {
    id: tpl.id,
    name: tpl.name,
    title: tpl.title || "",
    isPlayer: isPlayer,
    alive: true,
    zone: spawnZoneId,
    hp: Number(tpl.hp ?? tpl.maxHp) || 120,
    maxHp: Number(tpl.maxHp ?? tpl.hp) || 120,
    sp: Number(tpl.sp ?? tpl.maxSp) || 100,
    maxSp: Number(tpl.maxSp ?? tpl.sp) || 100,
    baseAtk: Number(tpl.baseAtk ?? tpl.atk) || 10,
    baseDef: Number(tpl.baseDef ?? tpl.def) || 5,
    skill: { ...tpl.skill },
    passive: { ...tpl.passive },
    skillCdRemain: 0,
    // AI 專用：每隻角色獨立計時，搜刮需等候固定時間才取得物資。
    aiNextActionSec: 0,
    aiSearchingUntilSec: null,
    aiResting: false,
    isResting: false,

    // 狀態與被動計數器
    stunRemain: 0,
    stealthRemain: 0,
    reflectRemain: 0,
    milkDefBuffRemain: 0,
    weakenedRemain: 0,
    dodgeReady: (tpl.id === "jiangwanan"),
    dodgeCdRemain: 0,
    hitTakenCount: 0,
    gongdeStacks: 0,
    pigReviveUsed: false,
    guanPassiveCd: 0,
    guanDefBuffRemain: 0,
    streamTriggered: false,

    equip: {
      weapon: null,
      head: null,
      chest: null,
      arm: null,
      leg: null,
      acc: null
    },
    bag: []
  };
}

function getTotalAtk(entity) {
  if (!entity) return 0;
  let total = entity.baseAtk || 10;

  if (entity.equip) {
    Object.values(entity.equip).forEach(item => {
      if (item && item.atk) total += item.atk;
    });
  }

  if (entity.id === "laixiangde" && entity.gongdeStacks > 0) {
    total += entity.gongdeStacks;
  }

  if (entity.weakenedRemain > 0) {
    total = Math.max(1, Math.floor(total * 0.5));
  }

  return total;
}

function isChaoGeAuraAffecting(entity) {
  if (!entity || entity.id === "chaoge") return false;
  if (state.player && state.player.alive && state.player.id === "chaoge" && state.player.zone === entity.zone) {
    return true;
  }
  if (state.ais && state.ais.some(a => a && a.alive && a.id === "chaoge" && a.zone === entity.zone)) {
    return true;
  }
  return false;
}

function getTotalDef(entity) {
  if (!entity) return 0;
  let total = entity.baseDef || 5;

  if (entity.equip) {
    Object.values(entity.equip).forEach(item => {
      if (item && item.def) total += item.def;
    });
  }

  if (entity.milkDefBuffRemain > 0) total += 5;
  if (entity.guanDefBuffRemain > 0) total += 6;

  if (isChaoGeAuraAffecting(entity)) {
    total = Math.floor(total * 0.8);
  }

  return Math.max(0, total);
}

// ==========================================
// 4. 遊戲初始化 (initGame)
// ==========================================
function initGame(mode = "normal", selectedCharId = "zhugouliang", customBotIds = null, aiDifficulty = "easy") {
  if (mainTimer) clearInterval(mainTimer);

  DEV_CONFIG.mode = mode;
  DEV_CONFIG.aiDifficulty = aiDifficulty === "hard" ? "hard" : "easy";
  DEV_CONFIG.enableShrink = (mode === "normal");
  DEV_CONFIG.enableNPC = (mode !== "sandbox");

  state.timeSec = 0;
  state.round = 1;
  state.roundTimeRemain = 90;
  state.closedZones = [];
  state.pendingCloseZones = [];
  state.inCombat = false;
  state.nextPlayerAmbushSec = 0;
  state.isSearching = false;
  state.gameOver = false;
  state.trackedItemId = null;
  state.logs = [];
  state.ai = null;

  // 深拷貝每區物資池作為當局有限消耗池 (drops)，並保留固定不重複種類清單 (initialDrops)
  const fullMaps = (typeof MAPS_DATA !== 'undefined' && Array.isArray(MAPS_DATA.zones)) ? MAPS_DATA.zones : [];
  const cloneZoneWithFinitePool = (z) => ({
    ...z,
    drops: [...(z.drops || [])],
    initialDrops: [...new Set(z.drops || [])]
  });

  if (mode === "char_test") {
    const lyZone = fullMaps.find(z => z.id === "ly") || { id: "ly", name: "立法院", icon: "🏛️", x: 50, y: 52, drops: [] };
    state.activeZones = [cloneZoneWithFinitePool(lyZone)];
  } else {
    state.activeZones = fullMaps.map(cloneZoneWithFinitePool);
  }

  const zones = getSafeZones();
  const startZone = zones.find(z => z.id === "ly") || zones[0];

  state.player = createCharacterEntity(selectedCharId, true, startZone.id);

  // 建立 AI 對手
  state.ais = [];
  const rosterKeys = (typeof GAME_CHARACTERS !== 'undefined' && GAME_CHARACTERS)
    ? Object.keys(GAME_CHARACTERS).filter(k => k !== selectedCharId)
    : ((typeof CHARACTERS_DATA !== 'undefined' && CHARACTERS_DATA.roster)
      ? Object.keys(CHARACTERS_DATA.roster).filter(k => k !== selectedCharId)
      : []);

  if (mode === "normal") {
    rosterKeys.forEach(botId => {
      const randZone = zones[Math.floor(Math.random() * zones.length)];
      state.ais.push(createCharacterEntity(botId, false, randZone.id));
    });
  } else if (mode === "char_test") {
    const botList = Array.isArray(customBotIds) ? customBotIds : rosterKeys;
    botList.forEach(botId => {
      if (botId !== selectedCharId) {
        state.ais.push(createCharacterEntity(botId, false, "ly"));
      }
    });
  }

  if (DEV_CONFIG.enableShrink) {
    pickNextPendingZones(4);
  }

  const logEl = document.getElementById("game-log");
  if (logEl) logEl.innerHTML = "";

  if (mode === "sandbox") {
    addLog("🔧 【測試模式】全島 22 區與圖鑑已就緒（無縮圈、無電腦對手）。", "text-emerald-400 font-bold");
  } else if (mode === "char_test") {
    addLog(`🏛️ 【立法院角色測試】已放入 ${state.ais.length} 位電腦對手，點擊探索面板即可搜刮或遇敵！`, "text-indigo-300 font-bold");
  } else {
    addLog(`🔥 台灣生存戰開始！你選擇了【${state.player.name}】，${DEV_CONFIG.aiDifficulty === "hard" ? "🔥 困難" : "🌱 簡單"}難度，全島共 ${state.ais.length + 1} 人參戰！`, "text-amber-300 font-bold");
  }

  updateUI();
  mainTimer = setInterval(gameTick, 1000);
}

// ==========================================
// 5. 縮圈與每秒計時器 (gameTick)
// ==========================================
function pickNextPendingZones(count = 4) {
  const zones = getSafeZones();
  const openZones = zones.filter(z => !state.closedZones.includes(z.id));
  if (openZones.length <= 1) {
    state.pendingCloseZones = [];
    return;
  }

  const actualCount = Math.min(count, openZones.length - 1);
  const shuffled = [...openZones].sort(() => Math.random() - 0.5);
  state.pendingCloseZones = shuffled.slice(0, actualCount).map(z => z.id);
}

function executeZoneShrink() {
  if (!DEV_CONFIG.enableShrink) return;

  if (state.pendingCloseZones.length > 0) {
    const closedNames = state.pendingCloseZones.map(id => getSafeCurrentZone(id).name);
    state.closedZones.push(...state.pendingCloseZones);
    state.pendingCloseZones = [];
    addLog(`🚫 第 ${state.round} 階段縮圈完成！【${closedNames.join("、")}】已列為禁區！`, "text-rose-400 font-black");
  }

  state.round++;
  state.roundTimeRemain = 90;
  pickNextPendingZones(4);
}

function tickEntityTimers(entity) {
  if (!entity || !entity.alive) return;

  if (entity.skillCdRemain > 0) entity.skillCdRemain--;
  if (entity.stunRemain > 0) entity.stunRemain--;
  if (entity.reflectRemain > 0) entity.reflectRemain--;
  if (entity.milkDefBuffRemain > 0) entity.milkDefBuffRemain--;
  if (entity.weakenedRemain > 0) entity.weakenedRemain--;
  if (entity.guanPassiveCd > 0) entity.guanPassiveCd--;
  if (entity.guanDefBuffRemain > 0) entity.guanDefBuffRemain--;

  // 王世間：12 秒隱蔽結束後才開始起算 35 秒 CD
  if (entity.stealthRemain > 0) {
    entity.stealthRemain--;
    if (entity.stealthRemain === 0) {
      entity.skillCdRemain = entity.skill?.cd || 35;
      if (entity.isPlayer) {
        addLog("🕵️ 【Over my dead body】隱蔽狀態結束，技能開始進入 35 秒冷卻。", "text-slate-400");
      }
    }
  }

  // 蔣晚安：每 20 秒必定閃避下一次受擊
  if (entity.id === "jiangwanan" && !entity.dodgeReady) {
    if (entity.dodgeCdRemain > 0) {
      entity.dodgeCdRemain--;
      if (entity.dodgeCdRemain === 0) {
        entity.dodgeReady = true;
        if (entity.isPlayer) {
          addLog("🛡️ 被動【問A答B】已就緒！下一次受到的攻擊必定閃避！", "text-sky-300 font-bold");
        }
      }
    }
  }
}

function gameTick() {
  if (state.gameOver || !state.player) return;

  state.timeSec++;

  if (state.player.alive) {
    let spGain = PASSIVE_SP_REGEN_PER_SEC;
    if (state.player.isResting && !state.inCombat && !state.isSearching) {
      spGain += REST_SP_REGEN_PER_SEC;
    }
    if (spGain > 0) {
      state.player.sp = Math.min(state.player.maxSp, state.player.sp + spGain);
    }
    if (state.player.isResting && (state.inCombat || state.isSearching || state.player.sp >= state.player.maxSp)) {
      stopPlayerRest(state.player.sp >= state.player.maxSp ? '體力已回滿，結束休息。' : '休息被中斷。');
    }
  }

  tickEntityTimers(state.player);
  state.ais.forEach(ai => tickEntityTimers(ai));

  // 縮圈倒數與禁區扣血
  if (DEV_CONFIG.enableShrink) {
    state.roundTimeRemain--;
    if (state.roundTimeRemain <= 0) {
      executeZoneShrink();
    }

    if (state.closedZones.includes(state.player.zone)) {
      state.player.hp = Math.max(0, state.player.hp - 12);
      addLog("⚡ 警告！你位於禁區內，遭到高壓電流轟擊 (-12 HP)！請立刻移動！", "text-rose-500 font-black");
      if (typeof triggerBloodScreenEffect === 'function') triggerBloodScreenEffect();
      if (state.player.hp <= 0) {
        triggerGameOver(false, "你滯留於禁區過久，遭到淘汰！");
        return;
      }
    }
  }

  // 驅動電腦 AI 行動
  if (DEV_CONFIG.enableNPC && typeof runAIBrain === 'function') {
    runAIBrain();
  }

  updateUI();
}

// ==========================================
// 6. 探索與搜刮系統 (含資源枯竭機制)
// ==========================================
function stopPlayerRest(reason = "") {
  const p = state.player;
  if (!p || !p.isResting) return false;
  p.isResting = false;
  if (reason) addLog(`🛌 ${reason}`, "text-sky-300");
  return true;
}

function togglePlayerRest(e) {
  if (e) e.stopPropagation();
  if (state.gameOver || state.inCombat || state.isSearching || !state.player) return;
  const p = state.player;
  if (p.stunRemain > 0) {
    addLog("⛔ 你正處於定身狀態，無法休息！", "text-rose-400 font-bold");
    return;
  }
  if (p.isResting) {
    stopPlayerRest("你結束休息，重新投入行動。");
  } else {
    if (p.sp >= p.maxSp) {
      addLog("你的體力已滿，不需要休息。", "text-slate-300");
      return;
    }
    p.isResting = true;
    addLog(`🛌 你開始休息：自然回復 +${PASSIVE_SP_REGEN_PER_SEC}/秒，休息額外 +${REST_SP_REGEN_PER_SEC}/秒。`, "text-emerald-300 font-bold");
  }
  updateUI();
}

function triggerSearch() {
  if (state.gameOver || state.inCombat || state.isSearching || !state.player) return;
  if (state.player.isResting) stopPlayerRest("你停止休息，開始搜刮。");

  const p = state.player;
  if (p.stunRemain > 0) {
    addLog("⛔ 你正處於定身狀態，無法搜刮！", "text-rose-400 font-bold");
    return;
  }

  if (p.sp < 15) {
    addLog("體力不足（需 15 體力），請稍候回復或食用補品！", "text-rose-400");
    return;
  }

  p.sp -= 15;
  state.isSearching = true;
  const searchedZoneId = p.zone;

  // 王世間隱蔽期間搜刮速度 1.5 倍
  const totalSearchMs = (p.id === "wangshijian" && p.stealthRemain > 0) ? PLAYER_FAST_SEARCH_MS : PLAYER_SEARCH_MS;

  const promptText = document.getElementById("search-prompt-text");
  const progressBox = document.getElementById("search-progress-box");
  const progressBar = document.getElementById("search-progress-bar");

  if (promptText) {
    promptText.textContent = (totalSearchMs === PLAYER_FAST_SEARCH_MS) ? "⚡ 從從容容 1.5x 極速搜刮中..." : "🔍 搜刮中...";
    promptText.classList.remove("hidden");
  }
  if (progressBox) progressBox.classList.remove("hidden");
  if (progressBar) progressBar.style.width = "0%";

  updateUI();

  let elapsed = 0;
  const searchInterval = setInterval(() => {
    if (state.gameOver || state.inCombat || !state.isSearching || p.zone !== searchedZoneId) {
      clearInterval(searchInterval);
      state.isSearching = false;
      if (progressBox) progressBox.classList.add("hidden");
      if (promptText) promptText.classList.add("hidden");
      return;
    }

    elapsed += 100;
    const percent = Math.min(100, (elapsed / totalSearchMs) * 100);
    if (progressBar) progressBar.style.width = `${percent}%`;

    if (elapsed >= totalSearchMs) {
      clearInterval(searchInterval);
      state.isSearching = false;
      if (progressBox) progressBox.classList.add("hidden");
      if (promptText) promptText.classList.add("hidden");
      executeSearchFinish();
    }
  }, 100);
}

function lootMultipleItemsForPlayer(count = 1) {
  const p = state.player;
  const currentZoneObj = getSafeCurrentZone(p.zone);
  const dropPool = (currentZoneObj && Array.isArray(currentZoneObj.drops)) ? currentZoneObj.drops : [];

  if (dropPool.length === 0) {
    addLog("🔍 這次沒有找到任何物資，再搜尋或換個地點試試。", "text-slate-400");
    return;
  }

  for (let i = 0; i < count; i++) {
    if (dropPool.length === 0) {
      addLog("🔍 這次沒有找到其他物資。", "text-slate-400");
      break;
    }

    const randIdx = Math.floor(Math.random() * dropPool.length);
    const dropId = dropPool[randIdx];
    const item = getSafeItem(dropId);
    if (!item) continue;

    const slot = item.type;
    if (p.equip && ['weapon', 'head', 'chest', 'arm', 'leg', 'acc'].includes(slot) && p.equip[slot] === null) {
      p.equip[slot] = { ...item, id: dropId };
      dropPool.splice(randIdx, 1); // 確定裝備後從該地區物資池移除 1 件
      addLog(`搜刮獲得並自動裝備【${item.name}】！`, "text-amber-300 font-bold");
    } else if (p.bag && p.bag.length < 6) {
      p.bag.push(dropId);
      dropPool.splice(randIdx, 1); // 確定放入背包後從該地區物資池移除 1 件
      addLog(`搜刮獲得【${item.name}】！`, "text-emerald-300 font-bold");
    } else {
      addLog(`背包已滿（6/6），無法撿起【${item.name}】（物資已留在原地）！`, "text-rose-400");
    }
  }
}

function executeSearchFinish() {
  const p = state.player;

  // 若雙方皆未處於王世間隱蔽狀態，且該區有電腦對手，則有機率觸發遭遇戰
  if ((p.stealthRemain || 0) <= 0 && DEV_CONFIG.enableNPC) {
    const sameZoneAIs = state.ais.filter(a =>
      a && a.alive && a.zone === p.zone && (a.stealthRemain || 0) <= 0 &&
      state.timeSec >= (a.ignoredByPlayerUntilSec || 0)
    );

    if (sameZoneAIs.length > 0 && Math.random() < 0.65) {
      const targetAI = sameZoneAIs[Math.floor(Math.random() * sameZoneAIs.length)];
      if (typeof startCombat === 'function') {
        startCombat(targetAI);
        return;
      }
    }
  }

  lootMultipleItemsForPlayer(1);
  updateUI();
}

// ==========================================
// 7. 角色主動技能按鈕與韓國魚雷達警報
// ==========================================
function triggerPlayerSkillButton(e) {
  if (e) e.stopPropagation();
  if (state.gameOver || !state.player) return;
  if (state.player.isResting) stopPlayerRest("你停止休息，準備施放技能。");
  if (state.inCombat) {
    if (typeof executeCombatAction === "function") executeCombatAction("skill");
  } else if (typeof castNonCombatActiveSkill === "function") {
    castNonCombatActiveSkill();
  }
}

function checkHanguoyuRadar(movingEntity, targetZoneId) {
  if (!state.player || !state.player.alive) return;
  if (state.player.id !== "hanguoyu") return;
  if (movingEntity.isPlayer) return;

  if (targetZoneId === state.player.zone) {
    addLog(`🚨 【禿子跟著月亮走】雷達感應！有其他角色進入了你所在的【${getSafeCurrentZone(targetZoneId).name}】！`, "text-rose-400 font-black");
    const banner = document.getElementById("radar-warning-banner");
    if (banner) {
      banner.classList.remove("hidden");
      setTimeout(() => banner.classList.add("hidden"), 3500);
    }
  }
}

// ==========================================
// 8. 6格裝備欄、背包操作與拖曳系統
// ==========================================
const EQUIP_SLOT_META = [
  { key: "weapon", label: "武器", icon: `<svg class="w-4 h-4 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 17.5L3 6V3h3l11.5 11.5"/><path d="M13 19l6-6"/><path d="M16 16l4 4"/><path d="M19 21l2-2"/></svg>` },
  { key: "head",   label: "頭部", icon: `<svg class="w-4 h-4 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 14a8 8 0 0 1 16 0v3H4v-3z"/><path d="M2 17h20"/></svg>` },
  { key: "chest",  label: "衣服", icon: `<svg class="w-4 h-4 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></svg>` },
  { key: "arm",    label: "手臂", icon: `<svg class="w-4 h-4 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>` },
  { key: "leg",    label: "腿部", icon: `<svg class="w-4 h-4 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3h12l-1 18h-4l-1-11-1 11H7L6 3z"/></svg>` },
  { key: "acc",    label: "飾品", icon: `<svg class="w-4 h-4 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="14" r="6"/><path d="M10 8l2-4 2 4"/></svg>` }
];

function renderEquipSixGrid(p) {
  const grid = document.getElementById("equip-six-grid");
  if (!grid || !p || !p.equip) return;

  grid.innerHTML = EQUIP_SLOT_META.map(slot => {
    const equipped = p.equip[slot.key];
    if (equipped) {
      const rarity = ItemRegistry.getRarity(equipped.id);
      const statStr = equipped.atk && equipped.def
        ? `+${equipped.atk}攻/+${equipped.def}防`
        : (equipped.atk ? `+${equipped.atk}攻` : `+${equipped.def || 0}防`);
      return `
        <div draggable="true"
             ondragstart="handleDragStartEquip(event, '${slot.key}')"
             data-fast-drag="equip" data-fast-drag-key="${slot.key}"
             onclick="openItemInfoModal('${equipped.id}', 'equip', '${slot.key}')"
             class="fast-drag-item p-1 rounded-md border ${rarity.border} ${rarity.bg} flex flex-col justify-between cursor-pointer hover:brightness-110 transition select-none">
          <div class="text-[9px] font-black ${rarity.text} truncate leading-tight">${equipped.name}</div>
          <div class="text-[8px] font-mono text-amber-300/90 text-right leading-none">${statStr}</div>
        </div>
      `;
    } else {
      return `
        <div class="p-1 rounded-md border border-slate-800/90 bg-slate-900/50 flex flex-col items-center justify-center text-slate-600 select-none">
          ${slot.icon}
        </div>
      `;
    }
  }).join("");
}

function useOrEquipBagItem(bagIndex) {
  if (state.gameOver || !state.player) return;
  const p = state.player;
  const itemId = p.bag[bagIndex];
  const item = getSafeItem(itemId);
  if (!item) return;

  if (item.type === "food") {
    let healHp = item.hp || 0;
    let healSp = item.sp || 0;

    // 亞洲桶神被動：鼎王吃到飽 (食物回血量提升 20%)
    if (p.id === "tonggod" && healHp > 0) {
      healHp = Math.round(healHp * 1.2);
    }

    p.hp = Math.min(p.maxHp, p.hp + healHp);
    p.sp = Math.min(p.maxSp, p.sp + healSp);
    p.bag.splice(bagIndex, 1);

    const parts = [];
    if (healHp > 0) parts.push(`+${healHp} HP`);
    if (healSp > 0) parts.push(`+${healSp} 體力`);
    addLog(`🍱 食用了【${item.name}】（${parts.join("、")}）！`, "text-emerald-300 font-bold");
    closeItemInfoModal();
    updateUI();
    return;
  }

  const slot = item.type;
  if (p.equip && ['weapon', 'head', 'chest', 'arm', 'leg', 'acc'].includes(slot)) {
    const oldEquip = p.equip[slot];
    p.equip[slot] = { ...item, id: itemId };
    if (oldEquip) {
      p.bag[bagIndex] = oldEquip.id;
      addLog(`⚔️ 裝備了【${item.name}】，換下【${oldEquip.name}】。`, "text-amber-300");
    } else {
      p.bag.splice(bagIndex, 1);
      addLog(`⚔️ 裝備了【${item.name}】！`, "text-amber-300");
    }
    closeItemInfoModal();
    updateUI();
  }
}

function unequipSlotToBag(slotKey) {
  if (state.gameOver || !state.player) return;
  const p = state.player;
  const equipped = p.equip[slotKey];
  if (!equipped) return;

  if (p.bag.length >= 6) {
    addLog("背包已滿（6/6），無法卸下裝備！", "text-rose-400");
    return;
  }

  p.bag.push(equipped.id);
  p.equip[slotKey] = null;
  addLog(`已將【${equipped.name}】卸下放入背包。`, "text-slate-300");
  closeItemInfoModal();
  updateUI();
}

function dropItemFromSource(sourceType, indexOrSlot) {
  if (state.gameOver || !state.player) return;
  const p = state.player;
  const currentZoneObj = getSafeCurrentZone(p.zone);

  if (sourceType === "bag") {
    const removedId = p.bag.splice(indexOrSlot, 1)[0];
    if (removedId) {
      if (currentZoneObj && Array.isArray(currentZoneObj.drops)) {
        currentZoneObj.drops.push(removedId);
      }
      addLog(`🗑️ 丟棄了【${getItemDisplayName(removedId)}】（已留在此區域地面）。`, "text-slate-400");
    }
  } else if (sourceType === "equip") {
    const eq = p.equip[indexOrSlot];
    if (eq) {
      p.equip[indexOrSlot] = null;
      if (currentZoneObj && Array.isArray(currentZoneObj.drops)) {
        currentZoneObj.drops.push(eq.id);
      }
      addLog(`🗑️ 丟棄了裝備【${eq.name}】（已留在此區域地面）。`, "text-slate-400");
    }
  }
  closeItemInfoModal();
  updateUI();
}

function handleDragStartBag(e, bagIdx) {
  state.dragSource = { type: "bag", key: bagIdx };
  if (e.dataTransfer) e.dataTransfer.setData("text/plain", `bag:${bagIdx}`);
}

function handleDragStartEquip(e, slotKey) {
  state.dragSource = { type: "equip", key: slotKey };
  if (e.dataTransfer) e.dataTransfer.setData("text/plain", `equip:${slotKey}`);
}

function handleDragOverYellow(e) {
  e.preventDefault();
  const panel = document.getElementById("explore-panel");
  if (panel) panel.classList.add("drag-over-yellow");
}

function handleDragLeaveYellow(e) {
  const panel = document.getElementById("explore-panel");
  if (panel) panel.classList.remove("drag-over-yellow");
}

function handleDropToYellow(e) {
  e.preventDefault();
  const panel = document.getElementById("explore-panel");
  if (panel) panel.classList.remove("drag-over-yellow");

  if (!state.dragSource) return;
  dropItemFromSource(state.dragSource.type, state.dragSource.key);
  state.dragSource = null;
}

function handleDragOverRed(e) {
  e.preventDefault();
  const zone = document.getElementById("drop-zone-red");
  if (zone) zone.classList.add("drag-over-red");
}

function handleDragLeaveRed(e) {
  const zone = document.getElementById("drop-zone-red");
  if (zone) zone.classList.remove("drag-over-red");
}

function handleDropToRed(e) {
  e.preventDefault();
  const zone = document.getElementById("drop-zone-red");
  if (zone) zone.classList.remove("drag-over-red");

  if (!state.dragSource) return;
  if (state.dragSource.type === "bag") {
    useOrEquipBagItem(state.dragSource.key);
  }
  state.dragSource = null;
}

// 觸控／觸控筆：Pointer Events 直接跟隨座標，不經過 iOS 的長按原生拖放。
// 電腦滑鼠仍然使用原本的 HTML5 drag & drop。
const QUICK_DRAG_START_PX = 3;
let quickPointerDrag = null;
let quickDragSuppressClickUntil = 0;

function clearQuickDragHighlights() {
  document.getElementById("explore-panel")?.classList.remove("drag-over-yellow");
  document.getElementById("drop-zone-red")?.classList.remove("drag-over-red");
}

// 開始拖動時快取投放區範圍，拖動中不用每幀 elementFromPoint 觸發樣式重算。
function quickDragGetDropRects() {
  return {
    discard: document.getElementById("explore-panel")?.getBoundingClientRect() || null,
    use: document.getElementById("drop-zone-red")?.getBoundingClientRect() || null
  };
}

function quickDragInside(rect, x, y) {
  return !!rect && x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

function quickDragDestination(drag, x, y) {
  if (quickDragInside(drag.rects.discard, x, y)) return "discard";
  if (drag.type === "bag" && quickDragInside(drag.rects.use, x, y)) return "use";
  return null;
}

function quickDragDraw(drag, x, y) {
  // 使用 transform 直接移動已合成的圖層，禁止原來 .transition 的 150ms 動畫造成拖尾。
  if (drag.ghost) {
    drag.ghost.style.transform = `translate3d(${x - drag.grabX}px, ${y - drag.grabY}px, 0)`;
  }
  const destination = quickDragDestination(drag, x, y);
  if (destination !== drag.lastDestination) {
    drag.lastDestination = destination;
    document.getElementById("explore-panel")?.classList.toggle("drag-over-yellow", destination === "discard");
    document.getElementById("drop-zone-red")?.classList.toggle("drag-over-red", destination === "use");
  }
}

function quickDragCreatePreview(drag, x, y) {
  // 不再複製原本的 transition/hover 類別，避免預覽道具總是慢半拍。
  const ghost = drag.source.cloneNode(true);
  ghost.className = "quick-drag-ghost";
  ghost.removeAttribute("onclick");
  ghost.removeAttribute("ondragstart");
  ghost.removeAttribute("draggable");
  ghost.removeAttribute("data-fast-drag");
  ghost.removeAttribute("data-fast-drag-key");
  const rect = drag.sourceRect;
  const style = getComputedStyle(drag.source);
  ghost.style.cssText = [
    "position:fixed", "left:0", "top:0", "z-index:99999", "pointer-events:none",
    "touch-action:none", "user-select:none", "-webkit-user-select:none",
    `width:${rect.width}px`, `height:${rect.height}px`, "box-sizing:border-box",
    `background:${style.backgroundColor}`, `border:2px solid ${style.borderColor}`,
    `border-radius:${style.borderRadius || "9px"}`, `color:${style.color}`,
    "display:flex", "flex-direction:column", "justify-content:space-between",
    "padding:4px 8px", "opacity:0.96", "box-shadow:0 8px 22px rgba(0,0,0,.65)",
    "transition:none!important", "animation:none!important", "will-change:transform",
    "transform:translate3d(0,0,0)"
  ].join(";");
  document.body.appendChild(ghost);
  drag.ghost = ghost;
  drag.rects = quickDragGetDropRects();
  quickDragDraw(drag, x, y);
}

function quickDragPointerDown(event) {
  if (quickPointerDrag || event.pointerType === "mouse" || !event.isPrimary ||
      !state.player || state.gameOver || event.button !== 0) return;
  const source = event.target.closest?.("[data-fast-drag]");
  if (!source || !source.closest("#game-screen")) return;
  const type = source.dataset.fastDrag;
  const key = type === "bag" ? Number(source.dataset.fastDragKey) : source.dataset.fastDragKey;
  if (type !== "bag" && type !== "equip") return;
  if (type === "bag" && !state.player.bag[key]) return;
  if (type === "equip" && !state.player.equip[key]) return;
  const rect = source.getBoundingClientRect();
  quickPointerDrag = {
    pointerId: event.pointerId, type, key, source, sourceRect: rect,
    originalDraggable: source.draggable,
    startX: event.clientX, startY: event.clientY,
    grabX: event.clientX - rect.left, grabY: event.clientY - rect.top,
    active: false, ghost: null, rects: null, lastDestination: null
  };
  // 禁止 iOS Safari 把 draggable=true 判定成系統長按拖動。
  source.draggable = false;
  // 不在按下時捕捉指標，讓正常輕點仍能觸發原本 onclick。
}

function quickDragPointerMove(event) {
  const drag = quickPointerDrag;
  if (!drag || event.pointerId !== drag.pointerId) return;
  if (!drag.active) {
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (dx * dx + dy * dy < QUICK_DRAG_START_PX * QUICK_DRAG_START_PX) return;
    drag.active = true;
    state.dragSource = { type: drag.type, key: drag.key };
    // 捕捉到不會隨每秒 UI 更新而消失的遊戲根節點。
    const screen = document.getElementById("game-screen");
    if (screen?.setPointerCapture) {
      try { screen.setPointerCapture(event.pointerId); } catch (_) { /* ignore */ }
    }
    quickDragCreatePreview(drag, event.clientX, event.clientY);
  } else {
    quickDragDraw(drag, event.clientX, event.clientY);
  }
  if (event.cancelable) event.preventDefault();
}

function quickDragPointerFinish(event, cancelled = false) {
  const drag = quickPointerDrag;
  if (!drag || event.pointerId !== drag.pointerId) return;
  const destination = (!cancelled && drag.active) ?
    quickDragDestination(drag, event.clientX, event.clientY) : null;
  if (drag.source.isConnected) drag.source.draggable = drag.originalDraggable;
  drag.ghost?.remove();
  clearQuickDragHighlights();
  const screen = document.getElementById("game-screen");
  if (screen?.hasPointerCapture?.(event.pointerId)) {
    try { screen.releasePointerCapture(event.pointerId); } catch (_) { /* ignore */ }
  }
  quickPointerDrag = null;
  state.dragSource = null;
  if (!drag.active) return; // 輕點保持原來的物品資訊互動。
  if (event.cancelable) event.preventDefault();
  quickDragSuppressClickUntil = Date.now() + 360;
  if (destination === "discard") {
    dropItemFromSource(drag.type, drag.key);
  } else if (destination === "use" && drag.type === "bag") {
    useOrEquipBagItem(drag.key);
  }
  // 取消或拖到空白處不做任何物品操作。
}

// 捕捉階段接收事件，源格子即使在上層有其他元素也不會遺漏移動。
document.addEventListener("pointerdown", quickDragPointerDown, true);
document.addEventListener("pointermove", quickDragPointerMove, true);
document.addEventListener("pointerup", e => quickDragPointerFinish(e), true);
document.addEventListener("pointercancel", e => quickDragPointerFinish(e, true), true);
document.addEventListener("contextmenu", e => {
  if (e.target.closest?.("[data-fast-drag]")) e.preventDefault();
}, true);
document.addEventListener("click", event => {
  if (Date.now() >= quickDragSuppressClickUntil) return;
  if (!event.target.closest?.("#game-screen")) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  quickDragSuppressClickUntil = 0;
}, true);

// ==========================================
// 9. 合成系統、全物資圖鑑與上下位合成樹
// ==========================================
function getEntityAllItemLocations(entity) {
  const list = [];
  if (!entity) return list;

  if (Array.isArray(entity.bag)) {
    entity.bag.forEach((id, idx) => {
      list.push({ id: ItemRegistry.ALIAS[id] || id, rawId: id, source: "bag", key: idx });
    });
  }
  if (entity.equip) {
    Object.entries(entity.equip).forEach(([slot, item]) => {
      if (item && item.id) {
        list.push({ id: ItemRegistry.ALIAS[item.id] || item.id, rawId: item.id, source: "equip", key: slot });
      }
    });
  }
  return list;
}

function countOwnedItemCopies(entity, itemId) {
  if (!entity || !itemId) return 0;
  const resolvedTarget = ItemRegistry.ALIAS[itemId] || itemId;
  return getEntityAllItemLocations(entity).filter(entry => entry.id === resolvedTarget).length;
}

function findAvailableRecipes(entity) {
  const recipes = getSafeRecipes();
  if (!entity || recipes.length === 0) return [];

  const owned = getEntityAllItemLocations(entity);
  const available = [];

  recipes.forEach(r => {
    if (!r.materials || r.materials.length < 2) return;
    const m1 = ItemRegistry.ALIAS[r.materials[0]] || r.materials[0];
    const m2 = ItemRegistry.ALIAS[r.materials[1]] || r.materials[1];

    const idx1 = owned.findIndex(o => o.id === m1);
    if (idx1 === -1) return;

    const idx2 = owned.findIndex((o, i) => i !== idx1 && o.id === m2);
    if (idx2 === -1) return;

    available.push(r);
  });

  return available;
}

function craftItem(entity, recipe, isPlayer = true) {
  if (!entity || !recipe || !Array.isArray(recipe.materials) || recipe.materials.length < 2 ||
      !Array.isArray(entity.bag) || !entity.equip) return false;

  const owned = getEntityAllItemLocations(entity);
  const m1 = ItemRegistry.ALIAS[recipe.materials[0]] || recipe.materials[0];
  const m2 = ItemRegistry.ALIAS[recipe.materials[1]] || recipe.materials[1];
  const loc1Idx = owned.findIndex(o => o.id === m1);
  if (loc1Idx === -1) return false;
  const loc2Idx = owned.findIndex((o, i) => i !== loc1Idx && o.id === m2);
  if (loc2Idx === -1) return false;

  const resultId = ItemRegistry.ALIAS[recipe.result] || recipe.result;
  const resultItem = getSafeItem(resultId);
  if (!resultItem) return false;

  const targets = [owned[loc1Idx], owned[loc2Idx]];
  const bagIndices = targets.filter(t => t.source === "bag").map(t => t.key).sort((a, b) => b - a);
  const slot = resultItem.type;
  const isEquipment = ['weapon', 'head', 'chest', 'arm', 'leg', 'acc'].includes(slot);
  // 如果原本穿著的裝備本身就是素材，合成後該裝備欄會空出來。
  const slotConsumed = isEquipment && targets.some(t => t.source === "equip" && t.key === slot);
  const oldEquip = isEquipment && !slotConsumed ? entity.equip[slot] : null;
  const equipResult = isEquipment && (!oldEquip || (resultItem.score || 0) >= (oldEquip.score || 0));

  // 合成是原子操作：先試算背包容量，放得下才扣除素材。
  // 直接穿在空裝備欄不用背包；替換裝備則需替舊裝備留 1 格。
  const bagAfterIngredients = entity.bag.length - bagIndices.length;
  const bagSlotsNeeded = equipResult ? (oldEquip ? 1 : 0) : 1;
  if (bagAfterIngredients + bagSlotsNeeded > 6) {
    if (isPlayer) addLog("背包空間不足，合成已取消，素材不會消耗。", "text-rose-400");
    return false;
  }

  bagIndices.forEach(idx => entity.bag.splice(idx, 1));
  targets.filter(t => t.source === "equip").forEach(t => { entity.equip[t.key] = null; });

  if (equipResult) {
    if (oldEquip) entity.bag.push(oldEquip.id);
    entity.equip[slot] = { ...resultItem, id: resultId };
  } else {
    entity.bag.push(resultId);
  }

  if (isPlayer) {
    addLog(`🔨 合成成功！獲得【${resultItem.name}】！`, "text-amber-300 font-black");
    if (state.trackedItemId === resultId) state.trackedItemId = null;
    updateUI();
  }
  return true;
}

function triggerQuickCraft(resultId) {
  if (!state.player) return;
  const avail = findAvailableRecipes(state.player);
  const recipe = avail.find(r => (ItemRegistry.ALIAS[r.result] || r.result) === (ItemRegistry.ALIAS[resultId] || resultId));
  if (recipe) {
    craftItem(state.player, recipe, true);
  }
}

function findZonesDroppingItem(itemId) {
  const target = ItemRegistry.ALIAS[itemId] || itemId;
  return getSafeZones().filter(z => {
    const baseList = z.initialDrops || z.drops || [];
    return baseList.some(d => (ItemRegistry.ALIAS[d] || d) === target);
  });
}

function getItemDropLocationName(itemId) {
  const resolved = ItemRegistry.ALIAS[itemId] || itemId;
  const zones = findZonesDroppingItem(resolved);
  if (zones.length > 0) {
    // 完整列出所有產地，不再用 slice(0, 2) 截斷
    return zones.map(z => z.name).join(" / ");
  }
  const recipes = getSafeRecipes();
  const rec = recipes.find(r => (ItemRegistry.ALIAS[r.result] || r.result) === resolved);
  if (rec) {
    return `合成 (${rec.materials.map(m => getItemDisplayName(m)).join("+")})`;
  }
  return "特殊途徑";
}

function formatItemStatBadge(item) {
  if (!item) return "一般物資";
  if (item.type === "food") {
    const parts = [];
    if (item.hp) parts.push(`+${item.hp} HP`);
    if (item.sp) parts.push(`+${item.sp} SP`);
    return parts.join(" / ") || "食物補品";
  }
  const parts = [];
  if (item.atk) parts.push(`+${item.atk} 攻`);
  if (item.def) parts.push(`+${item.def} 防`);
  return parts.length > 0 ? parts.join(" / ") : "合成材料";
}

function openItemInfoModal(itemId, sourceType = null, indexOrSlot = null) {
  const item = getSafeItem(itemId);
  if (!item) return;

  const modal = document.getElementById("item-info-modal");
  const catEl = document.getElementById("info-item-category");
  const nameEl = document.getElementById("info-item-name");
  const statEl = document.getElementById("info-item-stat");
  const descEl = document.getElementById("info-item-desc");
  const btnContainer = document.getElementById("info-buttons-container");

  if (!modal || !btnContainer) return;

  const rarity = ItemRegistry.getRarity(item.id);
  const typeLabels = { weapon: "⚔️ 武器", head: "🪖 頭部防具", chest: "👕 衣服防具", arm: "🧤 手臂防具", leg: "👖 腿部防具", acc: "💍 飾品", food: "🍱 美食補品", material: "🔩 合成材料" };

  if (catEl) catEl.textContent = `${rarity.color} ${rarity.label} • ${typeLabels[item.type] || "物資"}`;
  if (nameEl) {
    nameEl.className = `text-base font-black mt-0.5 ${rarity.text}`;
    nameEl.textContent = item.name;
  }
  if (statEl) statEl.textContent = formatItemStatBadge(item);
  if (descEl) descEl.textContent = item.desc || "台灣街頭常見的生存物資。";

  const recipes = getSafeRecipes();
  const craftFromRecipe = recipes.find(r => (ItemRegistry.ALIAS[r.result] || r.result) === item.id);
  const upgradesToList = recipes.filter(r => r.materials && r.materials.some(m => (ItemRegistry.ALIAS[m] || m) === item.id));
  const dropZones = findZonesDroppingItem(item.id);

  let treeHTML = `<div class="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-2 text-xs">`;

  // 取得方式：產地或下位材料
  if (craftFromRecipe) {
    const [m1, m2] = craftFromRecipe.materials;
    const ownedM1 = countOwnedItemCopies(state.player, m1);
    const ownedM2 = countOwnedItemCopies(state.player, m2);
    const needsPair = (ItemRegistry.ALIAS[m1] || m1) === (ItemRegistry.ALIAS[m2] || m2);
    const hasM1 = needsPair ? ownedM1 >= 2 : ownedM1 >= 1;
    const hasM2 = needsPair ? ownedM2 >= 2 : ownedM2 >= 1;
    const countTextM1 = needsPair ? `${ownedM1}/2` : `${ownedM1}/1`;
    const countTextM2 = needsPair ? `${ownedM2}/2` : `${ownedM2}/1`;

    const renderMaterialNeedButton = (matId, hasIt, countText) => `
      <button onclick="openItemInfoModal('${matId}')" class="p-1.5 border rounded-lg text-left truncate transition ${hasIt ? 'bg-emerald-950/80 hover:bg-emerald-900 border-emerald-500/70 shadow-[0_0_0_1px_rgba(34,197,94,0.2)]' : 'bg-slate-900 hover:bg-slate-800 border-slate-700'}">
        <div class="flex items-center justify-between gap-1">
          <div class="font-bold truncate ${hasIt ? 'text-emerald-200' : 'text-slate-200'}">${getItemDisplayName(matId)}</div>
          <span class="text-[9px] font-mono px-1.5 py-0.5 rounded ${hasIt ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400 border border-slate-700'}">${countText}</span>
        </div>
        <div class="mt-0.5 text-[9px] truncate ${hasIt ? 'text-emerald-300' : 'text-amber-300/80'}">${hasIt ? '✔ 已擁有，可直接拿來合成' : `📍 ${getItemDropLocationName(matId)}`}</div>
      </button>
    `;

    treeHTML += `
      <div>
        <div class="text-[10px] text-amber-400 font-bold mb-1">🔨 合成所需下位材料（點擊可跳轉）：</div>
        <div class="grid grid-cols-2 gap-1.5">
          ${renderMaterialNeedButton(m1, hasM1, countTextM1)}
          ${renderMaterialNeedButton(m2, hasM2, countTextM2)}
        </div>
      </div>
    `;
  } else if (dropZones.length > 0) {
    treeHTML += `
      <div>
        <div class="text-[10px] text-emerald-400 font-bold mb-1">📍 全島搜刮產地：</div>
        <div class="flex flex-wrap gap-1">
          ${dropZones.map(z => `<span class="px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-[10px] text-amber-300">${z.icon || ''}${z.name}</span>`).join("")}
        </div>
      </div>
    `;
  }

  // 上位升級路線
  if (upgradesToList.length > 0) {
    treeHTML += `
      <div class="pt-1 border-t border-slate-800/80">
        <div class="text-[10px] text-sky-400 font-bold mb-1">⬆️ 可升級合成之上位裝備：</div>
        <div class="space-y-1 max-h-24 overflow-y-auto custom-scrollbar">
          ${upgradesToList.map(r => {
            const resItem = getSafeItem(r.result);
            const otherMat = r.materials.find(m => (ItemRegistry.ALIAS[m] || m) !== item.id) || r.materials[0];
            const ownedOther = countOwnedItemCopies(state.player, otherMat);
            const needOtherCount = ((ItemRegistry.ALIAS[otherMat] || otherMat) === item.id) ? 2 : 1;
            const hasOtherMat = ownedOther >= needOtherCount;
            return `
              <button onclick="openItemInfoModal('${r.result}')" class="w-full p-1.5 ${hasOtherMat ? 'bg-emerald-950/60 border-emerald-700/70' : 'bg-slate-900 border-slate-700/80'} hover:bg-slate-800 border rounded-lg flex justify-between items-center text-left">
                <span class="font-bold text-amber-300 truncate">${resItem ? resItem.name : r.result}</span>
                <span class="text-[10px] ${hasOtherMat ? 'text-emerald-300' : 'text-slate-400'} font-mono">${hasOtherMat ? '✔ ' : '+ '}${getItemDisplayName(otherMat)}</span>
              </button>
            `;
          }).join("")}
        </div>
      </div>
    `;
  }

  treeHTML += `</div>`;

  // 操作按鈕列
  let actionBtns = "";
  if (sourceType === "bag" && indexOrSlot !== null) {
    if (item.type === "food") {
      actionBtns += `
        <button onclick="useOrEquipBagItem(${indexOrSlot})" class="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs shadow transition">
          🍱 立即食用 (${formatItemStatBadge(item)})
        </button>
      `;
    } else if (['weapon', 'head', 'chest', 'arm', 'leg', 'acc'].includes(item.type)) {
      actionBtns += `
        <button onclick="useOrEquipBagItem(${indexOrSlot})" class="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs shadow transition">
          ⚔️ 裝備至身上
        </button>
      `;
    }
    actionBtns += `
      <button onclick="dropItemFromSource('bag', ${indexOrSlot})" class="w-full py-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-700/60 text-rose-300 font-bold rounded-xl text-xs transition">
        🗑️ 丟棄此物資
      </button>
    `;
  } else if (sourceType === "equip" && indexOrSlot !== null) {
    actionBtns += `
      <div class="grid grid-cols-2 gap-2">
        <button onclick="unequipSlotToBag('${indexOrSlot}')" class="py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-bold rounded-xl text-xs transition">
          📥 卸下至背包
        </button>
        <button onclick="dropItemFromSource('equip', '${indexOrSlot}')" class="py-2 bg-rose-950/80 hover:bg-rose-900 border border-rose-700/60 text-rose-300 font-bold rounded-xl text-xs transition">
          🗑️ 直接丟棄
        </button>
      </div>
    `;
  }

  const isTracking = (state.trackedItemId === item.id);
  const trackBtn = isTracking
    ? `<button onclick="clearTrackedItem(event)" class="w-full py-2 bg-rose-700 hover:bg-rose-600 text-white font-black rounded-xl text-xs transition">✕ 取消追蹤此目標</button>`
    : `<button onclick="setTrackedItem('${item.id}')" class="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl text-xs shadow transition">🎯 鎖定追蹤此物資（地圖標記產地）</button>`;

  btnContainer.innerHTML = treeHTML + actionBtns + trackBtn;
  modal.classList.remove("hidden");
}

function closeItemInfoModal(e) {
  const modal = document.getElementById("item-info-modal");
  if (modal) modal.classList.add("hidden");
}

const CRAFT_BOOK_TYPES = {
  all: "全部", weapon: "武器", head: "頭部", chest: "身體",
  arm: "手部", leg: "腿部", acc: "飾品", food: "補品", material: "材料"
};

function openCraftBookModal() {
  const modal = document.getElementById("craft-book-modal");
  if (!modal) return;
  modal.classList.remove("hidden");
  // 重開圖鑑時保留上次的篩選與搜尋條件，方便反覆查詢合成路線。
  const search = document.getElementById("craft-book-search");
  if (search) search.value = state.craftBookSearch || "";
  renderCraftBook();
}

function closeCraftBookModal() {
  const modal = document.getElementById("craft-book-modal");
  if (modal) modal.classList.add("hidden");
}

function setCraftBookType(type) {
  if (!Object.prototype.hasOwnProperty.call(CRAFT_BOOK_TYPES, type)) return;
  state.craftBookType = type;
  renderCraftBook();
}

// 保留舊函式名稱，避免其他入口呼叫失效。
function filterCraftBook(tierFilter) {
  const tier = String(tierFilter);
  if (!['all', '1', '2', '3', '4', '5'].includes(tier)) return;
  state.craftBookFilter = tier;
  renderCraftBook();
}

function searchCraftBook(term) {
  state.craftBookSearch = String(term || "");
  renderCraftBook();
}

function clearCraftBookFilters() {
  state.craftBookType = "all";
  state.craftBookFilter = "all";
  state.craftBookSearch = "";
  const search = document.getElementById("craft-book-search");
  if (search) search.value = "";
  renderCraftBook();
}

function renderCraftBook() {
  const listEl = document.getElementById("craft-recipes-list");
  if (!listEl) return;

  const selectedType = state.craftBookType || "all";
  const selectedTier = String(state.craftBookFilter || "all");
  const searchTerm = (state.craftBookSearch || "").trim().toLocaleLowerCase();
  Object.keys(CRAFT_BOOK_TYPES).forEach(type => {
    const btn = document.getElementById(`craft-type-${type}`);
    if (!btn) return;
    const active = selectedType === type;
    btn.className = `min-w-0 py-1.5 px-1 rounded-lg border text-[11px] font-bold transition active:scale-95 ${active
      ? 'bg-indigo-600 border-indigo-400 text-white shadow'
      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`;
    btn.setAttribute('aria-pressed', String(active));
  });
  const raritySelect = document.getElementById("craft-book-rarity");
  if (raritySelect && raritySelect.value !== selectedTier) raritySelect.value = selectedTier;

  const allItems = Object.values(ItemRegistry.getAllItems());
  const recipes = getSafeRecipes();
  const recipeMap = new Map(recipes.map(r => [ItemRegistry.ALIAS[r.result] || r.result, r]));
  const filtered = allItems.filter(item => {
    if (!item || !item.id) return false;
    if (selectedType !== 'all' && item.type !== selectedType) return false;
    if (selectedTier !== 'all' && ItemRegistry.getRarity(item.id).tier !== Number(selectedTier)) return false;
    return !searchTerm || (item.name || '').toLocaleLowerCase().includes(searchTerm);
  }).sort((a, b) => {
    const tierDiff = ItemRegistry.getRarity(b.id).tier - ItemRegistry.getRarity(a.id).tier;
    return tierDiff || (a.name || '').localeCompare(b.name || '', 'zh-Hant');
  });

  const countEl = document.getElementById("craft-book-count");
  if (countEl) countEl.textContent = `${CRAFT_BOOK_TYPES[selectedType] || '全部'} · ${filtered.length} / ${allItems.length} 件物資`;

  if (!filtered.length) {
    listEl.innerHTML = `<div class="text-center text-slate-400 py-10 space-y-3">
      <div class="text-sm font-bold">找不到符合條件的物品</div>
      <div class="text-[11px]">試試其他類型、稀有度，或縮短搜尋名稱。</div>
      <button onclick="clearCraftBookFilters()" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg">清除所有篩選</button>
    </div>`;
    return;
  }

  listEl.innerHTML = filtered.map(item => {
    const r = ItemRegistry.getRarity(item.id);
    const rec = recipeMap.get(item.id);
    const subInfo = rec
      ? `🔨 配方：${rec.materials.map(m => getItemDisplayName(m)).join(" + ")}`
      : `📍 產地：${getItemDropLocationName(item.id)}`;
    const typeLabel = CRAFT_BOOK_TYPES[item.type] || '物資';

    return `
      <div onclick="openItemInfoModal('${item.id}')" class="p-2.5 rounded-xl border ${r.border} ${r.bg} flex justify-between items-center gap-2 cursor-pointer hover:brightness-110 transition">
        <div class="min-w-0 flex-1 text-left">
          <div class="flex flex-wrap items-center gap-x-1.5 gap-y-1">
            <span class="text-[10px] px-1.5 py-0.5 rounded border font-mono ${r.badge}">${r.color}${r.label}</span>
            <span class="text-[10px] px-1 py-0.5 rounded border border-slate-700/80 text-slate-400">${typeLabel}</span>
            <span class="text-xs font-black ${r.text} break-words">${item.name}</span>
          </div>
          <div class="text-[10px] text-amber-300 font-bold mt-1">${formatItemStatBadge(item)}</div>
          <div class="text-[10px] text-slate-400 mt-0.5 truncate">${subInfo}</div>
        </div>
        <button onclick="event.stopPropagation(); setTrackedItem('${item.id}')" class="flex-shrink-0 px-2.5 py-1.5 bg-indigo-600/90 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-black shadow">
          🎯 追蹤
        </button>
      </div>
    `;
  }).join("");
}

// ==========================================
// 10. 目標追蹤盒與 22 區台灣島戰術地圖
// ==========================================
function setTrackedItem(itemId) {
  const item = getSafeItem(itemId);
  if (!item) return;

  state.trackedItemId = item.id;
  addLog(`🎯 已鎖定追蹤：【${item.name}】！`, "text-amber-300 font-bold");
  closeCraftBookModal();
  closeItemInfoModal();
  updateUI();
}

function clearTrackedItem(e) {
  if (e) e.stopPropagation();
  state.trackedItemId = null;
  addLog("已取消追蹤目標。", "text-slate-400");
  closeItemInfoModal();
  updateUI();
}

/**
 * 追蹤配方樹：將背包與身上裝備視為共用庫存，逐枝消耗虛擬件數。
 * 重複需求（例如兩個相同一級素材）不會因為手上只有 1 件就都顯示完成。
 * 已擁有的中階成品直接標記完成、收合其下層材料。
 */
function buildTrackedCraftTree(itemId) {
  const resolved = ItemRegistry.ALIAS[itemId] || itemId;
  const owned = Object.create(null);
  for (const entry of getEntityAllItemLocations(state.player)) {
    owned[entry.id] = (owned[entry.id] || 0) + 1;
  }
  const recipeIndex = new Map();
  for (const r of getSafeRecipes()) {
    const id = ItemRegistry.ALIAS[r.result] || r.result;
    if (!recipeIndex.has(id)) recipeIndex.set(id, r);
  }
  const missingLeaves = [];
  const nodes = [];
  function expand(id, depth = 0, ancestry = []) {
    id = ItemRegistry.ALIAS[id] || id;
    const item = getSafeItem(id);
    const node = { id, name: item?.name || id, depth, owned: false, craftable: false, children: [] };
    nodes.push(node);
    if ((owned[id] || 0) > 0) {
      owned[id] -= 1;
      node.owned = true;
      return node;
    }
    const recipe = recipeIndex.get(id);
    if (recipe && depth < 9 && !ancestry.includes(id)) {
      node.craftable = true;
      node.children = recipe.materials.map(child => expand(child, depth + 1, [...ancestry, id]));
    } else {
      missingLeaves.push(id);
    }
    return node;
  }
  return { root: expand(resolved), missingLeaves, nodes };
}

function getMissingTrackedMaterials() {
  if (!state.trackedItemId || !state.player) return [];
  return [...new Set(buildTrackedCraftTree(state.trackedItemId).missingLeaves)];
}

/** 只用固定產地表顯示來源；已關閉的地點灰字，不透露剩餘數量。 */
function formatTrackedDropLocations(itemId) {
  const zones = findZonesDroppingItem(itemId);
  if (!zones.length) return `<span class="text-slate-500">無固定搜刮產地</span>`;
  return zones.map(z => {
    if (state.closedZones.includes(z.id)) {
      return `<span class="text-slate-500" title="禁區">${z.name}</span>`;
    }
    return `<span class="text-amber-300">⭐${z.name}</span>`;
  }).join('<span class="text-slate-600"> / </span>');
}

/** Black Survival 風格：從目標展開到一階材料；完成的中階分支自動收合。 */
function renderTargetTracker() {
  const trackerBox = document.getElementById('target-tracker-box');
  if (!trackerBox) return;
  if (!state.trackedItemId || !state.player) {
    trackerBox.classList.add('hidden');
    trackerBox.innerHTML = '';
    trackerBox.dataset.signature = '';
    return;
  }
  const targetItem = getSafeItem(state.trackedItemId);
  if (!targetItem) {
    trackerBox.classList.add('hidden');
    trackerBox.innerHTML = '';
    trackerBox.dataset.signature = '';
    return;
  }
  const ownedSignature = getEntityAllItemLocations(state.player).map(o => o.id).sort().join('|');
  const signature = [state.trackedItemId, ownedSignature, [...state.closedZones].sort().join('|')].join('::');
  // 避免每秒重畫整棵樹、造成捲動回彈或觸控手感不跟手。
  if (trackerBox.dataset.signature === signature && !trackerBox.classList.contains('hidden')) return;
  const previousScroll = trackerBox.querySelector('.tracked-tree-scroll')?.scrollTop || 0;
  trackerBox.dataset.signature = signature;
  trackerBox.classList.remove('hidden');
  trackerBox.className = 'w-full max-w-[350px] bg-slate-950/90 border border-amber-500/65 rounded-xl p-2 shadow-xl text-left';
  const tree = buildTrackedCraftTree(targetItem.id);
  const rarity = ItemRegistry.getRarity(targetItem.id);
  const missing = tree.missingLeaves.length;
  function renderNode(node, depth = 0) {
    const level = ItemRegistry.getRarity(node.id);
    const isLeaf = !node.owned && !node.craftable;
    const marker = node.owned ? '✔' : node.craftable ? '🔧' : '□';
    const status = node.owned ? '已完成・下層已收合' : node.craftable ? '需要合成' : '待搜刮';
    const style = node.owned
      ? 'border-emerald-800/70 bg-emerald-950/35'
      : isLeaf ? 'border-amber-800/60 bg-amber-950/15' : 'border-slate-700 bg-slate-900/60';
    const indent = depth > 0 ? 'ml-3 pl-2 border-l-2 border-slate-600/60' : '';
    const leaves = isLeaf ? `<div class="text-[9px] font-bold leading-snug mt-0.5 break-words">📍 ${formatTrackedDropLocations(node.id)}</div>` : '';
    return `<div class="${indent} mt-1.5">
      <div class="border rounded-lg px-2 py-1.5 ${style}">
        <div class="flex items-start justify-between gap-2">
          <button type="button" onclick="event.stopPropagation();openItemInfoModal('${node.id}')" class="min-w-0 text-left text-[11px] font-black ${node.owned ? 'text-emerald-300' : level.text}">
            ${marker} ${node.name}
          </button>
          <span class="text-[9px] flex-shrink-0 ${node.owned ? 'text-emerald-400' : 'text-slate-400'}">${status}</span>
        </div>
        ${leaves}
      </div>
      ${node.owned ? '' : node.children.map(child => renderNode(child, depth + 1)).join('')}
    </div>`;
  }
  trackerBox.innerHTML = `
    <div class="flex items-center justify-between gap-2 border-b border-slate-700/70 pb-1.5">
      <div class="min-w-0">
        <div class="text-[9px] text-amber-400 font-black">🎯 合成追蹤路線</div>
        <div class="text-[12px] font-black truncate ${rarity.text}">${targetItem.name}</div>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <span class="text-[9px] ${missing === 0 ? 'text-emerald-300' : 'text-slate-400'}">${missing ? `缺 ${missing} 份原料` : '已完成'}</span>
        <button type="button" onclick="event.stopPropagation();clearTrackedItem(event)" class="text-slate-400 text-xs px-1" title="取消追蹤">✕</button>
      </div>
    </div>
    <div class="tracked-tree-scroll max-h-[35vh] overflow-y-auto overscroll-contain custom-scrollbar pr-1">
      ${renderNode(tree.root)}
    </div>
    <div class="flex justify-between items-center border-t border-slate-800 mt-1.5 pt-1">
      <span class="text-[9px] text-slate-500">✔ 完成自動收合 · 點名稱看詳情</span>
      <button type="button" onclick="event.stopPropagation();openCraftBookModal()" class="text-[9px] text-indigo-300 font-black px-1">📖 圖鑑</button>
    </div>`;
  const scroll = trackerBox.querySelector('.tracked-tree-scroll');
  if (scroll) scroll.scrollTop = previousScroll;
}

function openMapModal() {
  if (state.gameOver || state.inCombat || state.isSearching) return;
  const modal = document.getElementById("map-modal");
  if (modal) {
    modal.classList.remove("hidden");
    renderTacticalMap();
  }
}

function closeMapModal() {
  const modal = document.getElementById("map-modal");
  if (modal) modal.classList.add("hidden");
}

function moveZone(targetZoneId) {
  if (state.gameOver || state.inCombat || state.isSearching || !state.player) return;
  if (state.player.isResting) stopPlayerRest("你停止休息，開始移動。");
  const p = state.player;

  if (p.stunRemain > 0) {
    addLog("⛔ 你正處於定身狀態，無法移動！", "text-rose-400 font-bold");
    closeMapModal();
    return;
  }

  if (p.zone === targetZoneId) {
    closeMapModal();
    return;
  }

  if (state.closedZones.includes(targetZoneId)) {
    addLog("🚫 該區域已列為禁區，無法進入！", "text-rose-500 font-bold");
    return;
  }

  if (p.sp < 5) {
    addLog("體力不足（需 5 體力），無法移動！", "text-rose-400");
    closeMapModal();
    return;
  }

  p.sp -= 5;
  p.zone = targetZoneId;
  const targetZone = getSafeCurrentZone(targetZoneId);
  addLog(`🏃 移動到了【${targetZone.name}】。`, "text-indigo-300");

  if (isChaoGeAuraAffecting(p)) {
    addLog("⚠️ 感受到一股「超派～」氣場，在此地區你的防禦力降低了 20%！", "text-rose-400 font-bold");
  }

  closeMapModal();
  updateUI();
}

function renderTacticalMap() {
  const container = document.getElementById("map-nodes-container");
  if (!container || !state.player) return;

  const p = state.player;
  const zones = getSafeZones();
  const missingMats = getMissingTrackedMaterials();
  const mapW = 1600;
  const mapH = 2622;
  const baseW = 941;
  const baseH = 1672;
  const sx = mapW / baseW;
  const sy = mapH / baseH;

  const zonePolygonsBase = {
    tamsui: '34,150 132,120 247,146 265,212 234,287 113,316 44,257 25,193',
    beitou: '241,158 372,151 474,188 456,280 343,318 248,282 212,213',
    yangmingshan: '468,140 664,122 810,174 788,277 635,327 494,298 446,212',
    sanchong: '29,381 182,374 286,423 281,526 139,563 43,533 22,461',
    shilin: '287,346 447,337 562,394 561,496 457,568 330,551 264,456',
    jiufen: '734,320 893,321 923,419 871,522 739,550 650,466 663,381',
    wugu_ind: '24,549 192,550 281,618 256,725 122,763 37,714 18,629',
    neihu: '612,490 800,487 901,545 883,646 777,724 625,702 573,588',
    taipeistation: '311,571 545,572 624,646 603,751 480,810 336,794 255,691',
    ximen: '22,735 188,734 248,793 239,898 150,949 40,915 18,818',
    ntu_hospital: '266,769 424,772 481,829 464,917 380,958 283,941 231,859',
    guanghua: '501,756 657,757 720,817 703,907 610,944 513,923 460,844',
    songshan: '731,736 895,740 921,818 908,908 792,949 696,893 688,796',
    longshan_temple: '44,907 192,905 264,959 248,1058 116,1085 36,1028 24,960',
    ly: '332,927 494,928 554,988 537,1089 450,1137 345,1118 286,1031',
    taipeiarena: '551,911 731,910 801,975 788,1075 695,1121 578,1088 520,995',
    taipei101: '752,905 901,913 919,1055 832,1111 730,1080 720,974',
    market: '48,1084 245,1077 320,1147 299,1232 180,1289 58,1261 23,1167',
    ntu: '335,1089 545,1094 623,1176 601,1278 466,1308 332,1277 281,1184',
    xinyi: '674,1085 901,1088 922,1184 883,1287 749,1312 641,1261 631,1148',
    keelung: '25,1292 315,1294 408,1395 348,1558 173,1621 48,1516 18,1399',
    zoo: '540,1288 828,1287 914,1385 905,1584 724,1620 565,1563 497,1418'
  };

  const labelAnchorsBase = {
    tamsui: { x: 132, y: 228 }, beitou: { x: 406, y: 269 }, yangmingshan: { x: 694, y: 280 },
    sanchong: { x: 164, y: 485 }, shilin: { x: 484, y: 521 }, jiufen: { x: 821, y: 472 },
    wugu_ind: { x: 122, y: 631 }, neihu: { x: 763, y: 598 }, taipeistation: { x: 470, y: 732 },
    ximen: { x: 126, y: 873 }, ntu_hospital: { x: 364, y: 897 }, guanghua: { x: 606, y: 901 },
    songshan: { x: 858, y: 877 }, longshan_temple: { x: 153, y: 1025 }, ly: { x: 439, y: 1040 },
    taipeiarena: { x: 650, y: 1060 }, taipei101: { x: 846, y: 1050 }, market: { x: 168, y: 1228 },
    ntu: { x: 474, y: 1250 }, xinyi: { x: 809, y: 1242 }, keelung: { x: 250, y: 1420 }, zoo: { x: 735, y: 1420 }
  };


  function scalePoint(pt) {
    return { x: Math.round(pt.x * sx), y: Math.round(pt.y * sy) };
  }
  function scalePolygon(str) {
    return str.split(' ').map(s => {
      const [x, y] = s.split(',').map(Number);
      return `${Math.round(x * sx)},${Math.round(y * sy)}`;
    }).join(' ');
  }
  const zonePolygons = Object.fromEntries(Object.entries(zonePolygonsBase).map(([k,v]) => [k, scalePolygon(v)]));
  const labelAnchors = Object.fromEntries(Object.entries(labelAnchorsBase).map(([k,v]) => [k, scalePoint(v)]));

  // 地名框和字體同步放大 20%，中心座標則完全不動。
  const MAP_LABEL_SCALE = 1.2;
  function labelWidth(name, hasStar) {
    const charW = 32;
    const base = 52 + name.length * charW;
    return base * MAP_LABEL_SCALE;
  }

  const svgParts = [];
  svgParts.push(`<defs>
      <filter id="label-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="rgba(0,0,0,0.45)"/>
      </filter>
      <filter id="glow-orange" x="-60%" y="-60%" width="220%" height="220%">
        <feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="rgba(255,191,0,0.95)"/>
        <feDropShadow dx="0" dy="0" stdDeviation="12" flood-color="rgba(255,140,0,0.75)"/>
      </filter>
      <filter id="glow-red" x="-60%" y="-60%" width="220%" height="220%">
        <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="rgba(239,68,68,0.85)"/>
      </filter>
    </defs>`);

  zones.forEach(z => {
    const pts = zonePolygons[z.id];
    if (!pts) return;
    const label = labelAnchors[z.id];
    const isCurrent = p.zone === z.id;
    const isClosed = state.closedZones.includes(z.id);
    const isPendingClose = !isClosed && state.pendingCloseZones.includes(z.id);
    const baseDrops = z.initialDrops || z.drops || [];
    const hasNeededMaterial = missingMats.some(mId =>
      baseDrops.some(d => (ItemRegistry.ALIAS[d] || d) === mId)
    );

    svgParts.push(`<polygon points="${pts}"
      fill="rgba(255,255,255,0.001)"
      stroke="transparent"
      stroke-width="18"
      vector-effect="non-scaling-stroke"
      style="cursor:pointer;"
      onclick="moveZone('${z.id}')">
      <title>${z.name}</title>
    </polygon>`);

    if (label) {
      // label 是地名框的中心點；使用者自行調好的所有 labelAnchorsBase 完全保留。
      const w = labelWidth(z.name, hasNeededMaterial);
      const h = 58 * MAP_LABEL_SCALE;
      const x = label.x - w / 2;
      const y = label.y - h / 2;
      // 星星顯示在名稱上方，不再佔用標籤內部的文字空間。
      const textX = label.x;
      const outerStroke = isPendingClose ? '#ffb300' : '#ffffff';
      const innerStroke = isPendingClose ? 'rgba(255,214,64,0.95)' : 'rgba(255,255,255,0.10)';
      const labelFill = 'rgba(12,12,14,0.92)';
      const textFill = '#f8fafc';
      const labelFilter = isPendingClose ? 'url(#glow-orange)' : 'url(#label-shadow)';
      svgParts.push(`<g style="cursor:pointer;" onclick="moveZone('${z.id}')" filter="${labelFilter}">
          <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${22 * MAP_LABEL_SCALE}" fill="${labelFill}" stroke="${outerStroke}" stroke-width="${5.2 * MAP_LABEL_SCALE}" >
            ${isPendingClose ? `<animate attributeName="stroke-opacity" values="1;0.35;1" dur="1.1s" repeatCount="indefinite" />` : ''}
            ${isPendingClose ? `<animate attributeName="opacity" values="1;0.82;1" dur="1.1s" repeatCount="indefinite" />` : ''}
          </rect>
          <rect x="${x + 4 * MAP_LABEL_SCALE}" y="${y + 4 * MAP_LABEL_SCALE}" width="${w - 8 * MAP_LABEL_SCALE}" height="${h - 8 * MAP_LABEL_SCALE}" rx="${18 * MAP_LABEL_SCALE}" fill="rgba(0,0,0,0.16)" stroke="${innerStroke}" stroke-width="${1.8 * MAP_LABEL_SCALE}" >
            ${isPendingClose ? `<animate attributeName="stroke-opacity" values="0.95;0.25;0.95" dur="1.1s" repeatCount="indefinite" />` : ''}
          </rect>
          ${hasNeededMaterial ? `<text x="${label.x + (isCurrent ? 50 * MAP_LABEL_SCALE : 0)}" y="${y - 3 * MAP_LABEL_SCALE}" text-anchor="middle" font-size="${46 * MAP_LABEL_SCALE}" font-family="'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif" aria-label="追蹤產地">⭐</text>` : ''}
          <text x="${textX}" y="${label.y + 10 * MAP_LABEL_SCALE}" text-anchor="middle" font-size="${26 * MAP_LABEL_SCALE}" font-weight="900" fill="${textFill}" style="letter-spacing:${0.5 * MAP_LABEL_SCALE}px;">${z.name}</text>
        </g>`);

      if (isClosed) {
        const triCx = label.x;
        const triCy = label.y - 1 * MAP_LABEL_SCALE;
        const triHalfW = Math.max(w * 0.34, 38 * MAP_LABEL_SCALE);
        const triH = Math.max(h * 1.08, 66 * MAP_LABEL_SCALE);
        const p1 = `${triCx},${triCy - triH * 0.62}`;
        const p2 = `${triCx - triHalfW},${triCy + triH * 0.38}`;
        const p3 = `${triCx + triHalfW},${triCy + triH * 0.38}`;
        svgParts.push(`<g filter="url(#glow-red)" pointer-events="none" opacity="0.97">
            <polygon points="${p1} ${p2} ${p3}" fill="#ef4444" stroke="#ffffff" stroke-width="${5 * MAP_LABEL_SCALE}" stroke-linejoin="round" />
            <text x="${triCx}" y="${triCy + triH * 0.08}" text-anchor="middle" font-size="${37 * MAP_LABEL_SCALE}" font-weight="900" fill="#ffffff">!</text>
          </g>`);
      }

      if (isCurrent) {
        // 水滴形定位標記，尖端距離地名框上緣 2 座標單位，永遠對準名稱中央。
        const pinTipY = y - 2;
        svgParts.push(`<g transform="translate(${label.x},${pinTipY})" pointer-events="none">
            <path d="M 0 0 C -10 -17 -30 -36 -30 -53 A 30 30 0 1 1 30 -53 C 30 -36 10 -17 0 0 Z" fill="#0ea5e9" stroke="#ffffff" stroke-width="5" stroke-linejoin="round" />
            <text x="0" y="-43" text-anchor="middle" font-size="25" font-weight="900" fill="#ffffff">1</text>
          </g>`);
      }
    }
  });

  container.innerHTML = `
    <div class="relative w-full h-full flex items-center justify-center overflow-hidden">
      <div class="relative h-full" style="aspect-ratio: 1600 / 2622; height: 100%; max-width: 100%;">
        <img src="taipei_map_clean_v12.jpg" alt="台北生存島地圖" class="absolute inset-0 w-full h-full object-contain select-none pointer-events-none">
        <svg viewBox="0 0 ${mapW} ${mapH}" class="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">${svgParts.join('')}</svg>
      </div>
    </div>
  `;
}

// ==========================================
// 11. 主畫面 UI 總渲染與訊息紀錄
// ==========================================
function addLog(msg, colorClass = "text-slate-300") {
  const timeStr = new Date(state.timeSec * 1000).toISOString().substr(14, 5);
  state.logs.unshift({ time: timeStr, msg, colorClass });
  if (state.logs.length > 40) state.logs.pop();

  const logEl = document.getElementById("game-log");
  if (logEl) {
    logEl.innerHTML = state.logs.map(l =>
      `<div class="${l.colorClass} leading-snug"><span class="text-slate-600">[${l.time}]</span> ${l.msg}</div>`
    ).join("");
  }
}

// AI 對戰與禁區淘汰也可能清空對手名單；避免最後一名 NPC 死亡卻不結算。
function checkAllAIsDeadWin() {
  if (state.gameOver || !state.player || !state.player.alive) return;
  if (state.ais.length > 0 && state.ais.every(ai => !ai.alive)) {
    state.inCombat = false;
    state.ai = null;
    triggerGameOver(true, "場上所有對手都已淘汰，你成功存活到最後！");
  }
}

function triggerGameOver(isWin, reasonText) {
  state.gameOver = true;
  if (mainTimer) clearInterval(mainTimer);

  const modal = document.getElementById("gameover-modal");
  const iconEl = document.getElementById("gameover-icon");
  const titleEl = document.getElementById("gameover-title");
  const descEl = document.getElementById("gameover-desc");

  if (iconEl) {
    iconEl.textContent = isWin ? "🏆" : "💀";
    iconEl.className = isWin ? "text-5xl mb-3 font-black text-amber-400" : "text-5xl mb-3 font-black text-rose-500";
  }
  if (titleEl) titleEl.textContent = isWin ? "大吉大利，稱霸台灣！" : "勝敗乃兵家常事！";
  if (descEl) descEl.textContent = reasonText || "";
  if (modal) modal.classList.remove("hidden");
}

function updateUI() {
  if (!state.player) return;
  const p = state.player;

  // 戰鬥狀態必須同步切換面板：否則 state.inCombat=true 會禁止搜刮，
  // 但隱藏的戰鬥面板仍看不到，玩家就會像卡死一樣無法繼續。
  const combatPanel = document.getElementById("combat-panel");
  const explorePanelForCombat = document.getElementById("explore-panel");
  if (combatPanel) combatPanel.classList.toggle("hidden", !state.inCombat);
  if (explorePanelForCombat) explorePanelForCombat.classList.toggle("hidden", state.inCombat);

  const zObj = getSafeCurrentZone(p.zone);

  // 1. 頂部區域標題、縮圈計時與不重複物資清單
  const zoneTitle = document.getElementById("zone-title");
  if (zoneTitle && zObj) {
    zoneTitle.textContent = `${zObj.icon || '📍'} ${zObj.name}`;
  }

  const timerBadge = document.getElementById("zone-timer-badge");
  if (timerBadge) {
    if (!DEV_CONFIG.enableShrink) {
      timerBadge.textContent = DEV_CONFIG.mode === "char_test" ? "🏛️ 角色測試 (立法院)" : "🔧 測試模式 (無縮圈)";
      timerBadge.className = "text-[10px] font-mono font-black px-2 py-0.5 rounded-md bg-emerald-950/90 border border-emerald-600/60 text-emerald-300";
    } else {
      const m = Math.floor(state.roundTimeRemain / 60);
      const s = String(state.roundTimeRemain % 60).padStart(2, "0");
      const aliveCount = 1 + state.ais.filter(a => a && a.alive).length;
      timerBadge.textContent = `🔥 R${state.round} 縮圈 ${m}:${s} • 存活 ${aliveCount}人`;
      timerBadge.className = "text-[10px] font-mono font-black px-2 py-0.5 rounded-md bg-slate-900/90 border border-slate-700 text-amber-400";
    }
  }

  const explorePanel = document.getElementById("explore-panel");
  const alertPill = document.getElementById("current-zone-alert-pill");
  if (explorePanel && alertPill) {
    explorePanel.classList.remove("zone-pending-warning", "zone-closed-danger");
    if (state.closedZones.includes(p.zone)) {
      explorePanel.classList.add("zone-closed-danger");
      alertPill.textContent = "🚫 禁區扣血中";
      alertPill.className = "text-[10px] font-black px-1.5 py-0.5 rounded bg-rose-600 text-white animate-pulse";
    } else if (state.pendingCloseZones.includes(p.zone)) {
      explorePanel.classList.add("zone-pending-warning");
      alertPill.textContent = "⚠️ 即將關閉";
      alertPill.className = "text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 animate-pulse";
    } else {
      alertPill.className = "hidden";
    }
  }

  // 2. 合成提示橫幅
  const craftAlert = document.getElementById("craft-alert-box");
  if (craftAlert) {
    const availRecipes = findAvailableRecipes(p);
    if (availRecipes.length > 0) {
      const topRec = availRecipes[0];
      const resItem = getSafeItem(topRec.result);
      craftAlert.className = "bg-amber-500/20 border-2 border-amber-400 rounded-xl p-2 flex justify-between items-center animate-pulse-fast";
      craftAlert.innerHTML = `
        <div class="text-xs font-black text-amber-300 truncate">
          🔨 可合成：【${resItem ? resItem.name : topRec.result}】
        </div>
        <button onclick="triggerQuickCraft('${topRec.result}')" class="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-lg text-xs shadow">
          立即合成
        </button>
      `;
    } else {
      craftAlert.className = "hidden";
      craftAlert.innerHTML = "";
    }
  }

  // 3. 角色狀態與主動技能按鈕
  const pNameEl = document.getElementById("player-name");
  if (pNameEl) pNameEl.textContent = p.name;

  const statEl = document.getElementById("player-stats");
  if (statEl) statEl.textContent = `攻擊 ${getTotalAtk(p)} | 防禦 ${getTotalDef(p)}`;

  const restBtn = document.getElementById("btn-rest-toggle");
  const restStatus = document.getElementById("rest-status");
  const isResting = !!(p.isResting && !state.inCombat && !state.isSearching && p.alive);
  if (restStatus) restStatus.classList.toggle("hidden", !isResting);
  if (restBtn) {
    const canRest = !state.inCombat && !state.isSearching && p.alive && (isResting || p.sp < p.maxSp);
    const restBtnBase = "w-14 h-14 min-w-[56px] min-h-[56px] flex flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-black shadow transition";
    if (isResting) {
      restBtn.innerHTML = '<span class="text-lg leading-none" aria-hidden="true">🛌</span><span>結束</span>';
      restBtn.setAttribute("aria-label", "結束休息");
      restBtn.className = `${restBtnBase} bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white ring-2 ring-emerald-300/70`;
    } else if (p.sp >= p.maxSp) {
      restBtn.innerHTML = '<span class="text-lg leading-none" aria-hidden="true">🛌</span><span>已滿</span>';
      restBtn.setAttribute("aria-label", "體力已滿，無需休息");
      restBtn.className = `${restBtnBase} bg-slate-800 text-slate-400`;
    } else {
      restBtn.innerHTML = '<span class="text-lg leading-none" aria-hidden="true">🛌</span><span>休息</span>';
      restBtn.setAttribute("aria-label", "開始休息");
      restBtn.className = `${restBtnBase} bg-emerald-800 hover:bg-emerald-700 active:scale-95 text-emerald-100`;
    }
    restBtn.disabled = !canRest;
    if (!canRest) restBtn.classList.add("opacity-60", "cursor-not-allowed");
  }

  const quickSkillBtn = document.getElementById("btn-quick-skill");
  if (quickSkillBtn && p.skill) {
    if (p.stealthRemain > 0) {
      quickSkillBtn.textContent = `🕵️ 隱蔽中(${p.stealthRemain}s)`;
      quickSkillBtn.className = "px-2 py-0.5 bg-purple-900 border border-purple-400 text-purple-200 font-black rounded text-[10px]";
    } else if (p.skillCdRemain > 0) {
      quickSkillBtn.textContent = `⏳ ${p.skill.name}(${p.skillCdRemain}s)`;
      quickSkillBtn.className = "px-2 py-0.5 bg-slate-800 text-slate-400 font-bold rounded text-[10px]";
    } else {
      quickSkillBtn.textContent = `✨ ${p.skill.name}`;
      quickSkillBtn.className = "px-2 py-0.5 bg-purple-700 hover:bg-purple-600 active:scale-95 text-white font-black rounded text-[10px] shadow transition";
    }
  }

  // 狀態徽章
  const badgesEl = document.getElementById("player-status-badges");
  if (badgesEl) {
    const bList = [];
    if (p.id === "laixiangde" && p.gongdeStacks > 0) {
      bList.push(`<span class="px-1.5 py-0.5 bg-amber-950 border border-amber-500/60 text-amber-300 rounded text-[9px] font-bold">🙏 功德 +${p.gongdeStacks}</span>`);
    }
    if (p.id === "jiangwanan") {
      bList.push(p.dodgeReady
        ? `<span class="px-1.5 py-0.5 bg-sky-950 border border-sky-400 text-sky-300 rounded text-[9px] font-bold">🛡️ 閃避就緒</span>`
        : `<span class="px-1.5 py-0.5 bg-slate-900 border border-slate-700 text-slate-400 rounded text-[9px]">閃避(${p.dodgeCdRemain}s)</span>`);
    }
    if (p.stealthRemain > 0) {
      bList.push(`<span class="px-1.5 py-0.5 bg-purple-950 border border-purple-400 text-purple-300 rounded text-[9px] font-bold">🕵️ 隱蔽 ${p.stealthRemain}s</span>`);
    }
    if (p.isResting) {
      bList.push(`<span class="px-1.5 py-0.5 bg-emerald-950 border border-emerald-400 text-emerald-300 rounded text-[9px] font-bold">🛌 休息中 (+${REST_SP_REGEN_PER_SEC}/秒)</span>`);
    }
    if (p.reflectRemain > 0) {
      bList.push(`<span class="px-1.5 py-0.5 bg-rose-950 border border-rose-400 text-rose-300 rounded text-[9px] font-bold">🪞 反彈 ${p.reflectRemain}s</span>`);
    }
    if (p.milkDefBuffRemain > 0) {
      bList.push(`<span class="px-1.5 py-0.5 bg-emerald-950 border border-emerald-400 text-emerald-300 rounded text-[9px] font-bold">🥛 防禦+5 (${p.milkDefBuffRemain}s)</span>`);
    }
    if (p.weakenedRemain > 0) {
      bList.push(`<span class="px-1.5 py-0.5 bg-rose-950 border border-rose-600 text-rose-300 rounded text-[9px] font-bold">💤 虛弱 ${p.weakenedRemain}s</span>`);
    }
    if (isChaoGeAuraAffecting(p)) {
      bList.push(`<span class="px-1.5 py-0.5 bg-rose-950 border border-rose-500 text-rose-300 rounded text-[9px] font-bold">👊 超派破防 -20%</span>`);
    }
    badgesEl.innerHTML = bList.join("");
  }

  // HP / SP 進度條
  const hpBar = document.getElementById("hp-bar");
  if (hpBar) hpBar.style.width = `${Math.max(0, Math.min(100, (p.hp / p.maxHp) * 100))}%`;
  const hpText = document.getElementById("hp-text");
  if (hpText) hpText.textContent = `${p.hp}/${p.maxHp}`;

  const spBar = document.getElementById("sp-bar");
  if (spBar) spBar.style.width = `${Math.max(0, Math.min(100, (p.sp / p.maxSp) * 100))}%`;
  const spText = document.getElementById("sp-text");
  if (spText) spText.textContent = `${p.sp}/${p.maxSp}`;

  // 4. 渲染 6 格裝備與目標追蹤器
  // 拖曳途中勿重建來源格子，避免每秒 gameTick 將手指綁定的元素移除。
  if (!quickPointerDrag) renderEquipSixGrid(p);
  renderTargetTracker();

  // 5. 渲染 6 格隨身背包
  const invGrid = document.getElementById("inventory-grid");
  if (invGrid && !quickPointerDrag) {
    const slots = [];
    for (let i = 0; i < 6; i++) {
      const itemId = p.bag[i];
      if (itemId) {
        const item = getSafeItem(itemId);
        const rarity = ItemRegistry.getRarity(itemId);
        const badge = formatItemStatBadge(item);
        slots.push(`
          <div draggable="true"
               ondragstart="handleDragStartBag(event, ${i})"
               data-fast-drag="bag" data-fast-drag-key="${i}"
               onclick="openItemInfoModal('${itemId}', 'bag', ${i})"
               class="fast-drag-item h-[46px] px-2 py-1 rounded-lg border ${rarity.border} ${rarity.bg} flex flex-col justify-between cursor-pointer hover:brightness-110 transition select-none">
            <div class="text-xs font-black ${rarity.text} truncate">${item ? item.name : itemId}</div>
            <div class="text-[9px] font-mono text-amber-300/90 text-right">${badge}</div>
          </div>
        `);
      } else {
        slots.push(`
          <div class="h-[46px] rounded-lg border border-slate-800/80 bg-slate-900/40 flex items-center justify-center text-[11px] text-slate-600 font-mono select-none">
            空
          </div>
        `);
      }
    }
    invGrid.innerHTML = slots.join("");
  }

  // 6. 若在戰鬥中，同步更新敵方血量與技能鈕狀態
  if (state.inCombat && state.ai) {
    const enemy = state.ai;
    const eName = document.getElementById("enemy-name");
    if (eName) eName.textContent = enemy.name;
    const eStats = document.getElementById("enemy-stats");
    if (eStats) eStats.textContent = `攻擊 ${getTotalAtk(enemy)} | 防禦 ${getTotalDef(enemy)}`;
    const eHpText = document.getElementById("enemy-hp-text");
    if (eHpText) eHpText.textContent = `HP: ${enemy.hp}/${enemy.maxHp}`;
    const eHpBar = document.getElementById("enemy-hp-bar");
    if (eHpBar) eHpBar.style.width = `${Math.max(0, Math.min(100, (enemy.hp / enemy.maxHp) * 100))}%`;

    const combatSkillBtn = document.getElementById("btn-combat-skill");
    if (combatSkillBtn && p.skill) {
      if (p.skillCdRemain > 0) {
        combatSkillBtn.innerHTML = `<span>⏳ ${p.skill.name} (${p.skillCdRemain}s)</span>`;
      } else {
        combatSkillBtn.innerHTML = `<span>✨ ${p.skill.name} (-${p.skill.costSp}SP)</span>`;
      }
    }
  }
}
