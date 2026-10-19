/**
 * 【模組：AI 決策與大逃殺混戰模擬 ai.js】
 * AI 會依照裝備目標規劃素材、選擇搜刮地點、管理背包、合成、穿戴裝備、使用補品與角色技能。
 */

const AI_EQUIP_SLOTS = ["weapon", "head", "chest", "arm", "leg", "acc"];
const AI_MAX_BAG_SIZE = 6;
// 每位 AI 獨立行動間隔（秒），和玩家一致為 1.5 秒。
const AI_ACTION_COOLDOWN_SEC = 1.5;
const AI_SEARCH_DURATION_SEC = 1.5;
const AI_FAST_SEARCH_DURATION_SEC = 0.5; // 王世間隱蔽期間與玩家一致
const AI_SEARCH_SP_COST = 8;
const AI_MOVE_SP_COST = 5;
const AI_PASSIVE_SP_REGEN_PER_SEC = 2;
const AI_REST_SP_REGEN_PER_SEC = 6;
const AI_REST_TARGET_RATIO = 0.52;
// NPC 避戰容忍度：預估對手的戰鬥優勢達 30% 才因戰力差距撤退。
const AI_RETREAT_STRENGTH_RATIO = 1.30;
// 即使對手沒有比較強，自身殘血時仍可優先撤退或補血。
const AI_RETREAT_LOW_HP_RATIO = 0.35;

// 兩種難度共用血量、裝備、搜刮、CD 與禁區規則；只改決策品質與個性。
function aiIsHard() { return DEV_CONFIG.aiDifficulty === "hard"; }
function aiLivingThreats(ai, zoneId = ai.zone) {
  // 王世間隱蔽期間雙向不遭遇：不能攻擊，也不能因抽到遭遇而浪費這次快速搜刮。
  if ((ai.stealthRemain || 0) > 0) return [];
  const rivals = (state.ais || []).filter(a => a && a !== ai && a.alive && a.zone === zoneId && (a.stealthRemain || 0) <= 0);
  if (state.player && state.player.alive && state.player.zone === zoneId && (state.player.stealthRemain || 0) <= 0) {
    rivals.push(state.player);
  }
  return rivals;
}
function aiDamageEstimate(attacker, defender) {
  // 預估與玩家、NPC 實際使用同一套防禦遞減計算及爆擊機率。
  return estimateAverageCombatDamage(attacker, defender);
}
function aiCombatOdds(ai, other) {
  const myDamage = aiDamageEstimate(ai, other);
  const theirDamage = aiDamageEstimate(other, ai);
  const myTurns = Math.ceil(Math.max(1, other.hp) / myDamage);
  const enemyTurns = Math.ceil(Math.max(1, ai.hp) / theirDamage);
  const gearAdv = (getTotalAtk(ai) - getTotalAtk(other)) * 0.35 + (getTotalDef(ai) - getTotalDef(other)) * 0.65;
  // 閃避、反彈和免死會影響交戰風險，不只看血量。
  const passiveDanger = (other.id === "jiangwanan" && balanceHasPassive(other) && other.dodgeReady ? 0.65 : 0) + ((other.reflectRemain || 0) > 0 ? 2.0 : 0) +
    (other.id === "zhugouliang" && balanceHasPassive(other) && !other.pigReviveUsed ? 0.5 : 0);
  return (enemyTurns - myTurns) + gearAdv * 0.035 - passiveDanger;
}
function aiFoodCount(ai) { return (ai.bag || []).filter(id => getSafeItem(id)?.type === "food").length; }
function aiMissingEquipSlots(ai) { return AI_EQUIP_SLOTS.filter(slot => !ai.equip?.[slot]).length; }
function aiFoodQuota(ai) {
  const slotsMissing = aiMissingEquipSlots(ai);
  if (slotsMissing >= 3) return 1; // 前期不能讓補品擠掉基本裝備與關鍵合成素材
  return (ai.hp < ai.maxHp * 0.8 || ai.sp < ai.maxSp * 0.25) ? 2 : 1;
}


function aiReadyForAction(ai) {
  return (Number(ai.aiNextActionSec) || 0) <= state.aiTimeSec;
}

function aiCommitAction(ai, seconds = AI_ACTION_COOLDOWN_SEC) {
  ai.aiNextActionSec = state.aiTimeSec + seconds;
}

function aiStartRest(ai) {
  if (!ai || ai.aiResting || ai.hp <= 0) return false;
  ai.aiResting = true;
  ai.lastAIAction = "休息中";
  aiCommitAction(ai);
  return true;
}

function aiStopRest(ai) {
  if (!ai || !ai.aiResting) return false;
  ai.aiResting = false;
  return true;
}

function aiShouldContinueRest(ai) {
  if (!ai || !ai.aiResting) return false;
  if (state.closedZones.includes(ai.zone)) return false;
  if (state.pendingCloseZones.includes(ai.zone) && state.roundTimeRemain <= 18) return false;
  const targetSp = Math.max(AI_SEARCH_SP_COST, Math.round((ai.maxSp || 0) * AI_REST_TARGET_RATIO));
  if (ai.sp >= targetSp || ai.sp >= ai.maxSp) return false;
  return aiLivingThreats(ai).length === 0;
}

function aiReturnItemToZone(ai, itemId) {
  const zone = getSafeCurrentZone(ai.zone);
  if (zone && Array.isArray(zone.drops)) zone.drops.push(aiResolveItemId(itemId));
}


function aiResolveItemId(itemId) {
  if (!itemId) return itemId;
  return (typeof ItemRegistry !== "undefined" && ItemRegistry.ALIAS && ItemRegistry.ALIAS[itemId])
    ? ItemRegistry.ALIAS[itemId]
    : itemId;
}

const AI_RECIPE_INDEX = new Map();
function aiGetRecipesForResult(itemId) {
  const recipes = getSafeRecipes();
  if (AI_RECIPE_INDEX.size === 0) {
    recipes.forEach(recipe => {
      if (!recipe || !Array.isArray(recipe.materials) || recipe.materials.length < 2) return;
      const key = aiResolveItemId(recipe.result);
      if (!AI_RECIPE_INDEX.has(key)) AI_RECIPE_INDEX.set(key, []);
      AI_RECIPE_INDEX.get(key).push(recipe);
    });
  }
  return AI_RECIPE_INDEX.get(aiResolveItemId(itemId)) || [];
}

function aiGetAvailableZones() {
  return getSafeZones().filter(zone =>
    zone &&
    !state.closedZones.includes(zone.id) &&
    !state.pendingCloseZones.includes(zone.id)
  );
}

function aiCreatePlannerContext(ai) {
  const ownedCounts = Object.create(null);
  const worldCounts = Object.create(null);
  const zones = aiGetAvailableZones();

  const addOwned = id => {
    const resolved = aiResolveItemId(id);
    if (resolved) ownedCounts[resolved] = (ownedCounts[resolved] || 0) + 1;
  };

  (ai.bag || []).forEach(addOwned);
  Object.values(ai.equip || {}).forEach(item => {
    if (item && item.id) addOwned(item.id);
  });

  zones.forEach(zone => {
    // 只看開局固定掉落表，不讀取本局已被玩家／NPC 搜走多少物品。
    const publishedZone = MAPS_DATA.zones.find(z => z.id === zone.id);
    (publishedZone?.drops || []).forEach(id => {
      const resolved = aiResolveItemId(id);
      if (resolved) worldCounts[resolved] = (worldCounts[resolved] || 0) + 1;
    });
  });

  return { ai, ownedCounts, worldCounts, zones };
}

function aiCloneCounts(counts) {
  return Object.assign(Object.create(null), counts || {});
}

function aiGetNearestItemDistance(ai, itemId, zones = null) {
  const resolved = aiResolveItemId(itemId);
  const allZones = zones || aiGetAvailableZones();
  const currentZone = getSafeCurrentZone(ai.zone);
  let best = Infinity;

  allZones.forEach(zone => {
    const catalog = MAPS_DATA.zones.find(z => z.id === zone.id);
    if (!(catalog?.drops || []).some(id => aiResolveItemId(id) === resolved)) return;
    const dx = (Number(zone.x) || 0) - (Number(currentZone.x) || 0);
    const dy = (Number(zone.y) || 0) - (Number(currentZone.y) || 0);
    best = Math.min(best, Math.sqrt(dx * dx + dy * dy));
  });
  return best;
}

function aiPlanCost(plan, ai, zones = null) {
  if (!plan || !plan.feasible) return Infinity;
  const distinctMissing = new Set(plan.missingItems || []);
  let travelCost = 0;
  distinctMissing.forEach(id => {
    const distance = aiGetNearestItemDistance(ai, id, zones);
    if (Number.isFinite(distance)) travelCost += Math.min(3, distance / 30);
  });
  return (plan.missingItems || []).length + (plan.steps || []).length * 0.62 + travelCost * 0.45;
}

/**
 * 由目標裝備反推需求。
 * 若道具已在背包／裝備欄就優先使用；否則優先直接撿得到的成品，再考慮合成。
 * worldCounts 會被分支複製，用來避免同一份地圖素材被需求樹重複計算。
 */
function aiExpandRequiredItem(itemId, ownedCounts, worldCounts, zones, stack = [], depth = 0) {
  const resolved = aiResolveItemId(itemId);
  if (!resolved || depth > 5 || stack.includes(resolved)) {
    return { feasible: false, missingItems: [], steps: [], dependencyIds: new Set(), ownedCounts, worldCounts };
  }

  const ownedNext = aiCloneCounts(ownedCounts);
  const worldNext = aiCloneCounts(worldCounts);
  const dependencies = new Set([resolved]);

  if ((ownedNext[resolved] || 0) > 0) {
    ownedNext[resolved]--;
    return { feasible: true, missingItems: [], steps: [], dependencyIds: dependencies, ownedCounts: ownedNext, worldCounts: worldNext };
  }

  if ((worldNext[resolved] || 0) > 0) {
    worldNext[resolved]--;
    return { feasible: true, missingItems: [resolved], steps: [], dependencyIds: dependencies, ownedCounts: ownedNext, worldCounts: worldNext };
  }

  const recipes = aiGetRecipesForResult(resolved);
  const options = [];
  for (const recipe of recipes) {
    const recipeOwned = aiCloneCounts(ownedNext);
    const recipeWorld = aiCloneCounts(worldNext);
    const first = aiExpandRequiredItem(recipe.materials[0], recipeOwned, recipeWorld, zones, [...stack, resolved], depth + 1);
    if (!first.feasible) continue;
    const second = aiExpandRequiredItem(recipe.materials[1], first.ownedCounts, first.worldCounts, zones, [...stack, resolved], depth + 1);
    if (!second.feasible) continue;

    const dependencyIds = new Set([resolved]);
    first.dependencyIds.forEach(id => dependencyIds.add(id));
    second.dependencyIds.forEach(id => dependencyIds.add(id));
    const plan = {
      feasible: true,
      missingItems: [...first.missingItems, ...second.missingItems],
      steps: [...first.steps, ...second.steps, recipe],
      dependencyIds,
      ownedCounts: second.ownedCounts,
      worldCounts: second.worldCounts
    };
    options.push(plan);
  }

  if (options.length === 0) {
    return { feasible: false, missingItems: [], steps: [], dependencyIds: dependencies, ownedCounts: ownedNext, worldCounts: worldNext };
  }

  options.sort((a, b) => {
    const costA = (a.missingItems || []).length + (a.steps || []).length * 0.62;
    const costB = (b.missingItems || []).length + (b.steps || []).length * 0.62;
    return costA - costB;
  });
  return options[0];
}

function aiBuildTargetPlan(ai, targetId, context = null) {
  const planner = context || aiCreatePlannerContext(ai);
  const result = aiExpandRequiredItem(
    targetId,
    aiCloneCounts(planner.ownedCounts),
    aiCloneCounts(planner.worldCounts),
    planner.zones
  );
  if (!result.feasible) return null;

  const slot = (getSafeItem(targetId) || {}).type;
  return {
    targetId: aiResolveItemId(targetId),
    slot,
    missingItems: result.missingItems,
    steps: result.steps,
    dependencyIds: result.dependencyIds,
    cost: aiPlanCost(result, ai, planner.zones)
  };
}

function aiRoleWeights(ai) {
  if (["kewenzhe", "laixiangde", "chenaguan", "chaoge"].includes(ai.id)) {
    return { atk: 1.32, def: 1.0 };
  }
  if (["yazhoutongshen", "jiangwanan", "zhugouliang"].includes(ai.id)) {
    return { atk: 1.0, def: 1.32 };
  }
  return { atk: 1.13, def: 1.13 };
}

function aiGearValue(item, ai) {
  if (!item) return 0;
  const weights = aiRoleWeights(ai);
  const atk = Number(item.atk) || 0;
  const def = Number(item.def) || 0;
  const rarity = Number(item.rarity) || 1;
  const tieBreak = (Number(item.score) || 0) * 0.015;
  return atk * weights.atk + def * weights.def + rarity * 0.12 + tieBreak;
}

function aiCurrentGearValue(ai, slot) {
  return aiGearValue(ai.equip && ai.equip[slot], ai);
}

function aiCountOwned(ai, itemId) {
  const resolved = aiResolveItemId(itemId);
  let count = (ai.bag || []).filter(id => aiResolveItemId(id) === resolved).length;
  Object.values(ai.equip || {}).forEach(item => {
    if (item && aiResolveItemId(item.id) === resolved) count++;
  });
  return count;
}

function aiGetWorldDropCount(itemId) {
  // 開局公開的掉落配置，不讀取遊戲中各區的實際剩餘量。
  const resolved = aiResolveItemId(itemId);
  return aiGetAvailableZones().reduce((total, zone) => {
    const published = MAPS_DATA.zones.find(z => z.id === zone.id);
    return total + (published?.drops || []).filter(id => aiResolveItemId(id) === resolved).length;
  }, 0);
}

function aiChooseBestTargetPlan(ai, context = null) {
  const planner = context || aiCreatePlannerContext(ai);
  const items = (typeof ItemRegistry !== "undefined" && typeof ItemRegistry.getAllItems === "function")
    ? ItemRegistry.getAllItems()
    : {};
  let best = null;

  const slotsMissing = aiMissingEquipSlots(ai);
  const candidateItems = Object.values(items).filter(item => {
    if (!item || !AI_EQUIP_SLOTS.includes(item.type) || !item.id) return false;
    const maxTier = slotsMissing >= 3 ? 2 : slotsMissing > 0 ? 3 : state.timeSec < 150 ? 3 : 4;
    if (Number(item.rarity || 1) > maxTier) return false;
    return aiGearValue(item, ai) > aiCurrentGearValue(ai, item.type) + 0.15 && aiCountOwned(ai, item.id) === 0;
  });
  // 先做廉價的候選篩選，再針對少量合適裝備展開配方，避免每秒反覆算數百棵樹。
  candidateItems.sort((a,b) => {
    const score = item => (aiGearValue(item, ai) - aiCurrentGearValue(ai, item.type) +
      (ai.equip?.[item.type] ? 0 : 20)) / Math.max(1, Number(item.rarity) || 1);
    return score(b) - score(a);
  });
  for (const item of candidateItems.slice(0, slotsMissing >= 3 ? 12 : 14)) {
    const currentValue = aiCurrentGearValue(ai, item.type);
    const targetValue = aiGearValue(item, ai);
    // 世界還有直接掉落的成品時，不必展開整棵配方樹。
    const directId = aiResolveItemId(item.id);
    const plan = (planner.worldCounts[directId] || 0) > 0
      ? { targetId:directId, slot:item.type, missingItems:[directId], steps:[],
          dependencyIds:new Set([directId]), cost:1 + aiGetNearestItemDistance(ai,directId,planner.zones)/30 }
      : aiBuildTargetPlan(ai, item.id, planner);
    if (!plan) continue;

    const slotsMissing = aiMissingEquipSlots(ai);
    const gain = targetValue - currentValue + (currentValue === 0 ? 12 : 0);
    let slotWeight = item.type === "weapon" ? 1.35 : item.type === "acc" ? 1.05 : 1;
    if (["yazhoutongshen", "jiangwanan", "zhugouliang"].includes(ai.id) && item.type !== "weapon") slotWeight *= 1.08;
    const cost = Math.max(1, plan.cost || 1);
    // 基礎六件未成形時，大幅削弱昂貴頂裝優先權；缺一件先補一件。
    const phase = slotsMissing >= 3 ? (Number(item.rarity) >= 4 ? 0.08 : Number(item.rarity) >= 3 ? 0.4 : 1.6) : 1;
    const starter = currentValue === 0 ? 2.2 : 1;
    const priority = gain * slotWeight * phase * starter / (1 + cost * (slotsMissing >= 3 ? 1.3 : 0.7));
    if (!best || priority > best.priority) best = { ...plan, priority };
  }

  if (best) {
    ai.aiPlan = { targetId: best.targetId, slot: best.slot, priority: best.priority };
    ai.aiPlanChosenAtSec = state.timeSec;
    return best;
  }
  ai.aiPlan = null;
  return null;
}

function aiGetCurrentTargetPlan(ai, context = null) {
  // 地點改變不代表背包／裝備目標失效；只短暫沿用計畫，避免每次移動都重算整棵配方樹。
  const signature = (ai.bag || []).join('|') + ':' + AI_EQUIP_SLOTS.map(s => ai.equip?.[s]?.id || '_').join('|');
  if (ai.aiPlanCacheSignature === signature && state.timeSec < (ai.aiPlanCacheUntilSec || 0)) {
    return ai.aiCachedTargetPlan || null;
  }
  const planner = context || aiCreatePlannerContext(ai);
  const current = ai.aiPlan;
  if (current && current.targetId) {
    // 每 16 秒重檢發育路線；不能永遠執著追逐一件已不划算的高階裝備。
    if ((ai.aiPlanChosenAtSec || 0) + 16 <= state.timeSec) ai.aiPlan = null;
  }
  if (ai.aiPlan && ai.aiPlan.targetId) {
    const targetItem = getSafeItem(ai.aiPlan.targetId);
    if (targetItem && AI_EQUIP_SLOTS.includes(targetItem.type)) {
      const currentValue = aiCurrentGearValue(ai, targetItem.type);
      const targetValue = aiGearValue(targetItem, ai);
      if (currentValue + 0.15 < targetValue && aiCountOwned(ai, current.targetId) === 0) {
        const plan = aiBuildTargetPlan(ai, current.targetId, planner);
        if (plan) {
          ai.aiPlan = { targetId: plan.targetId, slot: plan.slot, priority: current.priority || 0 };
          ai.aiPlanCacheSignature = signature;
          ai.aiPlanCacheUntilSec = state.timeSec + 6;
          ai.aiCachedTargetPlan = plan;
          return plan;
        }
      }
    }
    ai.aiPlan = null;
  }
  const selected = aiChooseBestTargetPlan(ai, planner);
  ai.aiPlanCacheSignature = signature;
  ai.aiPlanCacheUntilSec = state.timeSec + 6;
  ai.aiCachedTargetPlan = selected;
  return selected;
}

function aiPlanNeedsId(plan, itemId) {
  if (!plan || !plan.dependencyIds) return false;
  return plan.dependencyIds.has(aiResolveItemId(itemId));
}

function aiGetSlotOfItem(item) {
  return item && AI_EQUIP_SLOTS.includes(item.type) ? item.type : null;
}

// 計算目前的目標裝備實際還需要多少份素材，不把多餘的重複品全部鎖死。
function aiPlanRequiredCopies(plan, itemId) {
  if (!plan || !itemId) return 0;
  const id = aiResolveItemId(itemId);
  let count = 0;
  for (const step of plan.steps || []) {
    for (const material of step.materials || []) {
      if (aiResolveItemId(material) === id) count++;
    }
  }
  if (!count && id === aiResolveItemId(plan.targetId)) count = 1;
  return count;
}

function aiItemComparableScore(ai, item, id, plan) {
  let score = aiScorePickup(ai, item, id, plan);
  if (item && item.type === "food") {
    // 用相同規則估算「地上的補品」與「背包補品」，避免弱補品擠掉好補品。
    score += 220 + Math.min(100, ((Number(item.hp) || 0) + (Number(item.sp) || 0)) * 0.8);
  }
  return score;
}

function aiBagRetentionScore(ai, index, plan, counts) {
  const id = aiResolveItemId(ai.bag[index]);
  const item = getSafeItem(id);
  if (!item) return -1000;
  const desired = aiPlanRequiredCopies(plan, id);
  // 裝備欄的素材也可合成，因此先扣除已裝備的數量，再保護所需背包份數。
  const equipped = Object.values(ai.equip || {}).filter(eq => eq && aiResolveItemId(eq.id) === id).length;
  const bagNeeded = Math.max(0, desired - equipped);
  const ordinal = ai.bag.slice(0, index + 1).filter(bagId => aiResolveItemId(bagId) === id).length;
  if (ordinal <= bagNeeded) {
    // 合成素材很重要，但不可永久鎖死六格：緊急補給或直接補上缺失裝備仍可替換。
    return aiMissingEquipSlots(ai) >= 3 ? 2200 : 5200;
  }

  let score = aiItemComparableScore(ai, item, id, null);
  if (item.type === "food") {
    const foodOrdinal = ai.bag.slice(0, index + 1).filter(x => getSafeItem(x)?.type === "food").length;
    score += foodOrdinal <= aiFoodQuota(ai) ? 260 : -500;
    if (aiMissingEquipSlots(ai) >= 3 && foodOrdinal > 1) score -= 900;
  }
  if ((counts[id] || 0) > Math.max(1, bagNeeded)) {
    if (item.type === "material") score -= 70;
    else if (item.type === "food") score -= 45;
    else score -= 25;
  }
  return score;
}

function aiGetBagSwapChoice(ai, item, itemId, plan) {
  if (!Array.isArray(ai.bag) || ai.bag.length < AI_MAX_BAG_SIZE) return { index: -1, accepted: true };
  const counts = Object.create(null);
  ai.bag.forEach(id => {
    const key = aiResolveItemId(id);
    counts[key] = (counts[key] || 0) + 1;
  });
  const incomingScore = aiItemComparableScore(ai, item, itemId, plan);
  let lowestScore = Infinity;
  let lowestIndex = -1;
  ai.bag.forEach((id, index) => {
    const score = aiBagRetentionScore(ai, index, plan, counts);
    if (score < lowestScore) {
      lowestScore = score;
      lowestIndex = index;
    }
  });
  // 一定要比現有最弱物品更有價值才換；等價物品不來回交換。
  return { index: lowestIndex, accepted: lowestIndex >= 0 && incomingScore > lowestScore + 5,
    incomingScore, lowestScore };
}

function aiMakeBagRoom(ai, plan = null, incomingItemId = null) {
  if (!Array.isArray(ai.bag)) ai.bag = [];
  if (ai.bag.length < AI_MAX_BAG_SIZE) return true;
  if (!incomingItemId) return false; // 禁止為了空間而隨便丟東西。
  const item = getSafeItem(incomingItemId);
  if (!item) return false;
  const choice = aiGetBagSwapChoice(ai, item, incomingItemId, plan);
  if (!choice.accepted) return false;
  const removed = ai.bag.splice(choice.index, 1)[0];
  aiReturnItemToZone(ai, removed);
  return true;
}

function aiEnsureBestEquipment(ai) {
  if (!ai || !ai.equip || !Array.isArray(ai.bag)) return false;
  let changed = false;
  for (let i = 0; i < ai.bag.length;) {
    const itemId = aiResolveItemId(ai.bag[i]);
    const item = getSafeItem(itemId);
    const slot = aiGetSlotOfItem(item);
    if (!slot) {
      i++;
      continue;
    }
    const old = ai.equip[slot];
    if (!old || aiGearValue(item, ai) > aiGearValue(old, ai) + 0.15) {
      if (old && old.id) {
        ai.bag[i] = aiResolveItemId(old.id);
      } else {
        ai.bag.splice(i, 1);
      }
      ai.equip[slot] = { ...item, id: itemId };
      changed = true;
      if (old) i++;
    } else {
      i++;
    }
  }
  return changed;
}

function aiUseFood(ai, force = false) {
  if (!ai || !Array.isArray(ai.bag) || ai.bag.length === 0) return false;
  const hpRatio = (ai.maxHp || 1) > 0 ? ai.hp / ai.maxHp : 1;
  const spRatio = (ai.maxSp || 1) > 0 ? ai.sp / ai.maxSp : 1;
  const wantsHp = force || hpRatio <= (aiIsHard() ? 0.72 : 0.64);
  const wantsSp = force || spRatio <= (aiIsHard() ? 0.25 : 0.21);
  if (!wantsHp && !wantsSp) return false;

  const plan = ai.aiPlan ? aiBuildTargetPlan(ai, ai.aiPlan.targetId) : null;
  let bestIndex = -1;
  let bestValue = -Infinity;
  const missingHp = Math.max(0, (ai.maxHp || ai.hp) - ai.hp);
  const missingSp = Math.max(0, (ai.maxSp || ai.sp) - ai.sp);
  const hpMultiplier = ai.id === "yazhoutongshen" && balanceHasPassive(ai) ? 1.2 : 1;

  ai.bag.forEach((id, index) => {
    const resolved = aiResolveItemId(id);
    const item = getSafeItem(resolved);
    if (!item || item.type !== "food") return;

    const rawHp = (Number(item.hp) || 0) * hpMultiplier;
    const rawSp = Number(item.sp) || 0;
    const healHp = Math.min(missingHp, rawHp);
    const healSp = Math.min(missingSp, rawSp);
    if (healHp <= 0 && healSp <= 0) return;

    const isEmergency = hpRatio <= 0.22;
    // 台灣價值也是 5 階神裝的核心材料；除非真的危急，不要隨便吃掉。
    if (resolved === "taiwan_value" && aiPlanNeedsId(plan, resolved) && !isEmergency && spRatio > 0.12) return;

    let value = healHp * (wantsHp ? 1.18 : 0.18) + healSp * (wantsSp ? 1.02 : 0.22);
    const usefulTotal = rawHp + rawSp;
    value += Math.min(8, usefulTotal * 0.025);
    if (resolved === "taiwan_value" && !isEmergency) value -= 100;
    // 優先使用剛好補足的補品，避免在剩 10 HP 缺口時浪費 110 HP 便當。
    value -= (Math.max(0, rawHp - missingHp) + Math.max(0, rawSp - missingSp)) * 0.20;
    if (value > bestValue) {
      bestValue = value;
      bestIndex = index;
    }
  });

  if (bestIndex < 0) return false;
  const itemId = aiResolveItemId(ai.bag[bestIndex]);
  const item = getSafeItem(itemId);
  if (!item) return false;

  const healHp = Math.round((Number(item.hp) || 0) * hpMultiplier);
  const healSp = Number(item.sp) || 0;
  const beforeHp = ai.hp;
  const beforeSp = ai.sp;
  ai.hp = Math.min(ai.maxHp, ai.hp + healHp);
  ai.sp = Math.min(ai.maxSp, ai.sp + healSp);
  ai.bag.splice(bestIndex, 1);
  ai.lastAIAction = `使用${item.name}`;

  if (ai.hp === beforeHp && ai.sp === beforeSp) return false;
  return true;
}

function tryConsumeFoodForAI(ai, force = false) {
  return aiUseFood(ai, force);
}

function aiScorePickup(ai, item, id, plan) {
  if (!item) return -Infinity;
  const resolved = aiResolveItemId(id);
  const missingCount = plan && Array.isArray(plan.missingItems)
    ? plan.missingItems.filter(value => aiResolveItemId(value) === resolved).length
    : 0;
  if (missingCount > 0) return 10000 + missingCount * 100 + (Number(item.score) || 0);

  const slot = aiGetSlotOfItem(item);
  if (slot) {
    const delta = aiGearValue(item, ai) - aiCurrentGearValue(ai, slot);
    return delta > 0.15 ? 3000 + delta * 20 + (Number(item.rarity) || 1) : -500 + delta;
  }

  if (item.type === "food") {
    // 受傷撤離後，補血道具的價值暫時高於一般裝備素材，確保滿背包也會考慮換掉低價值物品。
    if (ai.aiSeekingHealing && ai.hp < ai.maxHp * 0.75 && Number(item.hp) > 0) {
      return 11000 + Math.min(ai.maxHp - ai.hp, Number(item.hp)) * 5;
    }
    const hpRatio = ai.hp / Math.max(1, ai.maxHp);
    const spRatio = ai.sp / Math.max(1, ai.maxSp);
    const healthNeed = Math.max(0, (ai.maxHp - ai.hp) * (hpRatio < 0.55 ? 1.2 : 0.12));
    const staminaNeed = Math.max(0, (ai.maxSp - ai.sp) * (spRatio < 0.45 ? 1.0 : 0.08));
    const foodUtility = Math.min(healthNeed, (Number(item.hp) || 0) * (ai.id === "yazhoutongshen" && balanceHasPassive(ai) ? 1.2 : 1)) + Math.min(staminaNeed, Number(item.sp) || 0) * 0.8;
    if (aiPlanRequiredCopies(plan, resolved) > aiCountOwned(ai, resolved)) return 1300 + foodUtility;
    const foodCount = aiFoodCount(ai);
    if (foodCount >= aiFoodQuota(ai)) return -650 + foodUtility;
    return (foodCount === 0 ? 890 : 400) + foodUtility;
  }

  if (item.type === "material") {
    if (aiPlanRequiredCopies(plan, resolved) > aiCountOwned(ai, resolved)) return 1800 + (Number(item.score) || 0);
    return 100 + (Number(item.score) || 0) * 0.5 + (Number(item.rarity) || 1) * 3;
  }

  return 0;
}

// 與玩家相同：每次搜刮只抽一件隨機物資。不能事先抽看 7～10 件再挑最有用的。
// 判斷要不要撿是合理的 AI 決策，但不能更換已抽中的物品。
function aiSelectDropIndex(ai, zone, plan) {
  if (!zone || !Array.isArray(zone.drops) || !zone.drops.length) return -1;
  return Math.floor(Math.random() * zone.drops.length);
}

function lootOneItemForAI(ai) {
  const zObj = getSafeCurrentZone(ai.zone);
  if (!zObj || !Array.isArray(zObj.drops) || zObj.drops.length === 0) return false;

  aiEnsureBestEquipment(ai);
  const plan = aiGetCurrentTargetPlan(ai);
  const randIdx = aiSelectDropIndex(ai, zObj, plan);
  if (randIdx < 0) return false;

  const dropId = zObj.drops[randIdx];
  const item = getSafeItem(dropId);
  if (!item) return false;
  const canonicalId = aiResolveItemId(dropId);
  const slot = aiGetSlotOfItem(item);
  const currentEquip = slot && ai.equip ? ai.equip[slot] : null;

  if (slot && (!currentEquip || aiGearValue(item, ai) > aiGearValue(currentEquip, ai) + 0.15)) {
    if (currentEquip && currentEquip.id) {
      const oldId = aiResolveItemId(currentEquip.id);
      const currentPlan = ai.aiPlan ? aiBuildTargetPlan(ai, ai.aiPlan.targetId) : plan;
      if (ai.bag.length < AI_MAX_BAG_SIZE || aiMakeBagRoom(ai, currentPlan, oldId)) {
        ai.bag.push(oldId);
      } else {
        // 玩家卸下裝備時也會留在地上；AI 不再讓物品憑空消失。
        aiReturnItemToZone(ai, oldId);
      }
    }
    ai.equip[slot] = { ...item, id: canonicalId };
  } else {
    if (!aiMakeBagRoom(ai, plan, canonicalId)) return false;
    ai.bag.push(canonicalId);
  }

  zObj.drops.splice(randIdx, 1);
  // 沒找到需求素材時逐漸改走其他產地；只使用已搜到的結果，不偷看剩餘物資。
  const useful = !!(plan?.missingItems || []).find(id => aiResolveItemId(id) === canonicalId);
  ai.aiUnproductiveSearches = useful ? 0 : (ai.aiUnproductiveSearches || 0) + 1;
  ai.lastAIAction = `搜刮${item.name}`;
  if (ai.aiSeekingHealing) {
    const usefulHeal = item.type === "food" && Number(item.hp) > 0;
    ai.aiRecoveryMisses = usefulHeal ? 0 : (ai.aiRecoveryMisses || 0) + 1;
  }
  aiEnsureBestEquipment(ai);
  // 合成另外佔用一次 AI 行動 CD，不再撿一次就連續合成好幾次。
  return true;
}

function aiRecipeMatchesPlan(recipe, plan) {
  if (!recipe || !plan || !Array.isArray(plan.steps)) return false;
  const output = aiResolveItemId(recipe.result);
  return plan.steps.some(step =>
    aiResolveItemId(step.result) === output &&
    aiResolveItemId(step.materials[0]) === aiResolveItemId(recipe.materials[0]) &&
    aiResolveItemId(step.materials[1]) === aiResolveItemId(recipe.materials[1])
  );
}

function aiGetRecipeDepth(targetId, wantedId, stack = [], depth = 0) {
  const target = aiResolveItemId(targetId);
  const wanted = aiResolveItemId(wantedId);
  if (target === wanted) return depth;
  if (depth > 12 || stack.includes(target)) return -1;
  for (const recipe of aiGetRecipesForResult(target)) {
    for (const materialId of recipe.materials) {
      const found = aiGetRecipeDepth(materialId, wanted, [...stack, target], depth + 1);
      if (found >= 0) return found;
    }
  }
  return -1;
}

function aiChooseFoodCraft(ai, available, gearPlan = null) {
  if (aiFoodCount(ai) > aiFoodQuota(ai) || !Array.isArray(available)) return null;
  if (ai.hp < ai.maxHp * 0.25) return null; // 危急時先吃現有補品，不花回合料理
  const foodRecipes = available.filter(recipe => {
    const result = getSafeItem(recipe.result);
    if (!result || result.type !== "food" || Number(result.rarity) < 2) return false;
    // 裝備發育關鍵材料不可拿去做餐點，除非裝備已成形。
    if (gearPlan && recipe.materials.some(id => aiPlanNeedsId(gearPlan, id))) return false;
    return true;
  });
  let best = null, bestValue = -Infinity;
  for (const recipe of foodRecipes) {
    const result = getSafeItem(recipe.result);
    const ingredients = recipe.materials.map(getSafeItem);
    const before = ingredients.reduce((n, item) => n + (Number(item?.hp) || 0) + (Number(item?.sp) || 0) * 0.75, 0);
    const after = (Number(result.hp) || 0) + (Number(result.sp) || 0) * 0.75;
    const bonus = aiFoodCount(ai) === 0 ? 18 : 0;
    const benefit = after - before + bonus - (aiMissingEquipSlots(ai) >= 3 ? 12 : 0);
    if (benefit > bestValue && benefit >= 16) { best = recipe; bestValue = benefit; }
  }
  return best;
}

function tryAutoCraftForAI(ai, maxCrafts = 1) {
  if (typeof findAvailableRecipes !== "function" || typeof craftItem !== "function" || !ai) return 0;
  let craftedCount = 0;
  // 普通決策每次只准合成 1 件；保留參數供特殊測試用途。
  while (craftedCount < Math.max(0, Math.min(maxCrafts, 1))) {
    aiEnsureBestEquipment(ai);
    let plan = aiGetCurrentTargetPlan(ai);
    let available = findAvailableRecipes(ai) || [];
    let recipe = null;

    if (plan && plan.steps && plan.steps.length) {
      const matching = available.filter(candidate => aiRecipeMatchesPlan(candidate, plan));
      matching.sort((a, b) => {
        const depthA = aiGetRecipeDepth(plan.targetId, a.result);
        const depthB = aiGetRecipeDepth(plan.targetId, b.result);
        return depthB - depthA;
      });
      recipe = matching[0] || null;
    }

    // 若目標路線目前沒有可合成步驟，仍允許做「確定會改善現有裝備」的合成；
    // 但不會再無條件照配方表第一條消耗背包素材。
    if (!recipe) {
      const improvements = available.filter(candidate => {
        const resultItem = getSafeItem(candidate.result);
        const slot = aiGetSlotOfItem(resultItem);
        if (!slot) return false;
        if (plan && candidate.materials.some(id => aiPlanNeedsId(plan, id)) && !aiRecipeMatchesPlan(candidate, plan)) return false;
        return aiGearValue(resultItem, ai) > aiCurrentGearValue(ai, slot) + 0.15;
      });
      improvements.sort((a, b) => {
        const itemA = getSafeItem(a.result);
        const itemB = getSafeItem(b.result);
        return aiGearValue(itemB, ai) - aiGearValue(itemA, ai);
      });
      recipe = improvements[0] || null;
    }

    // 補品不占固定背包格；裝備關鍵步驟優先，普通空檔才能製作更高效的補給。
    const foodRecipe = aiChooseFoodCraft(ai, available, plan);
    if (!recipe || (!plan?.steps?.length && foodRecipe && aiFoodCount(ai) < aiFoodQuota(ai))) {
      recipe = foodRecipe || recipe;
    }
    if (!recipe) break;
    if (!craftItem(ai, recipe, false)) break;
    craftedCount++;
    ai.lastAIAction = `合成${getSafeItem(recipe.result)?.name || recipe.result}`;
    aiEnsureBestEquipment(ai);
  }

  return craftedCount;
}

function aiGetBestNeededDropZone(ai, plan) {
  const zones = aiGetAvailableZones();
  if (!plan || !Array.isArray(plan.missingItems) || plan.missingItems.length === 0) return null;

  const needCounts = Object.create(null);
  plan.missingItems.forEach(id => {
    const resolved = aiResolveItemId(id);
    needCounts[resolved] = (needCounts[resolved] || 0) + 1;
  });

  const current = getSafeCurrentZone(ai.zone);
  const currentPublished = MAPS_DATA.zones.find(z => z.id === current.id);
  const currentNeeds = (currentPublished?.drops || []).filter(id => (needCounts[aiResolveItemId(id)] || 0) > 0);
  if (currentNeeds.length > 0) return current;

  let bestZone = null;
  let bestValue = -Infinity;
  zones.forEach(zone => {
    const published = MAPS_DATA.zones.find(z => z.id === zone.id);
    if (!published?.drops?.length) return;
    let matchedKinds = 0;
    let matchedCopies = 0;
    for (const [id, needed] of Object.entries(needCounts)) {
      const copies = published.drops.filter(dropId => aiResolveItemId(dropId) === id).length;
      if (copies > 0) {
        matchedKinds++;
        matchedCopies += Math.min(needed, copies);
      }
    }
    if (matchedCopies === 0) return;

    const dx = (Number(zone.x) || 0) - (Number(current.x) || 0);
    const dy = (Number(zone.y) || 0) - (Number(current.y) || 0);
    const distance = Math.sqrt(dx * dx + dy * dy);
    const pendingPenalty = state.pendingCloseZones.includes(zone.id) ? 100 : 0;
    const value = matchedCopies * 16 + matchedKinds * 8 - distance * 0.22 - pendingPenalty;
    if (value > bestValue) {
      bestValue = value;
      bestZone = zone;
    }
  });
  return bestZone;
}

function getSafeOpenZonesForAI(excludeZoneId = null) {
  const allZones = getSafeZones();
  const safeList = allZones.filter(zone =>
    !state.closedZones.includes(zone.id) &&
    !state.pendingCloseZones.includes(zone.id) &&
    zone.id !== excludeZoneId
  );
  if (safeList.length > 0) return safeList;
  const fallback = allZones.filter(zone => !state.closedZones.includes(zone.id) && zone.id !== excludeZoneId);
  return fallback.length > 0 ? fallback : allZones;
}

function moveAIToSafeZone(ai, targetZone = null) {
  if (DEV_CONFIG.mode === "char_test" || ai.sp < AI_MOVE_SP_COST) return false;
  const candidates = getSafeOpenZonesForAI(ai.zone);
  if (!candidates || candidates.length === 0) return false;

  let nextZone = targetZone && targetZone.id !== ai.zone &&
    !state.closedZones.includes(targetZone.id) &&
    !state.pendingCloseZones.includes(targetZone.id) ? targetZone : null;
  if (!nextZone) {
    const withDrops = candidates.filter(zone => {
      const published = MAPS_DATA.zones.find(z => z.id === zone.id);
      return !!published?.drops?.length;
    });
    const pool = withDrops.length > 0 ? withDrops : candidates;
    // 困難 AI 避開多人地圖與玩家威脅，簡單 AI 偶爾進入有風險的區域。
    const sorted = [...pool].sort((a, b) => {
      const aRisk = aiLivingThreats(ai, a.id).length * (aiIsHard() ? 5 : 1);
      const bRisk = aiLivingThreats(ai, b.id).length * (aiIsHard() ? 5 : 1);
      return aRisk - bRisk;
    });
    const upper = aiIsHard() ? Math.min(3, sorted.length) : sorted.length;
    nextZone = sorted[Math.floor(Math.random() * upper)];
  }

  if (nextZone && nextZone.id !== ai.zone) {
    ai.sp -= AI_MOVE_SP_COST;
    ai.zone = nextZone.id;
    ai.lastAIAction = `前往${nextZone.name}`;

    return true;
  }
  return false;
}

/**
 * AI 遭遇戰：遭遇機率和出手決策分離。
 * 只要沒有實際執行補血／換區，就必須攻擊，不允許「想避戰卻站著不動」。
 */
function aiUseHPFood(ai) {
  if (!ai || ai.hp >= ai.maxHp) return false;
  const missing = ai.maxHp - ai.hp;
  const multiplier = ai.id === "yazhoutongshen" && balanceHasPassive(ai) ? 1.2 : 1;
  let bestIndex = -1;
  let bestValue = -Infinity;
  (ai.bag || []).forEach((id, index) => {
    const item = getSafeItem(aiResolveItemId(id));
    const hp = Math.round((Number(item?.hp) || 0) * multiplier);
    if (item?.type !== "food" || hp <= 0) return;
    // 危急時應該先保命；也盡可能少浪費超出最大 HP 的補量。
    const value = Math.min(missing, hp) - Math.max(0, hp - missing) * 0.16;
    if (value > bestValue) { bestValue = value; bestIndex = index; }
  });
  if (bestIndex < 0) return false;
  const id = aiResolveItemId(ai.bag[bestIndex]);
  const food = getSafeItem(id);
  ai.hp = Math.min(ai.maxHp, ai.hp + Math.round(Number(food.hp) * multiplier));
  ai.sp = Math.min(ai.maxSp, ai.sp + (Number(food.sp) || 0));
  ai.bag.splice(bestIndex, 1);
  ai.lastAIAction = `使用${food.name}補血`;
  if (ai.hp >= ai.maxHp * 0.77) ai.aiSeekingHealing = false;
  return true;
}

function aiZoneThreatPressure(ai, zoneId) {
  return aiLivingThreats(ai, zoneId).reduce((total, rival) =>
    total + 1 + Math.max(0, -aiCombatOdds(ai, rival)) * 0.55, 0);
}

// 僅參考開局公開產地，不偷看本局掉落池剩幾件。
function aiPublishedHealingCount(zoneId) {
  const published = MAPS_DATA.zones.find(zone => zone.id === zoneId);
  return (published?.drops || []).filter(id => {
    const item = getSafeItem(aiResolveItemId(id));
    return item?.type === "food" && Number(item.hp) > 0;
  }).length;
}

function aiFindSaferRetreatZone(ai) {
  if (DEV_CONFIG.mode === "char_test" || ai.sp < AI_MOVE_SP_COST) return null;
  const currentPressure = aiZoneThreatPressure(ai, ai.zone);
  if (currentPressure <= 0) return null;
  const currentZone = getSafeCurrentZone(ai.zone);
  const candidates = aiGetAvailableZones().filter(zone => zone.id !== ai.zone)
    .map(zone => ({ zone, pressure: aiZoneThreatPressure(ai, zone.id) }))
    .filter(({ pressure }) => pressure + 0.05 < currentPressure);
  if (!candidates.length) return null;
  const missing = ai.aiPlan?.missingItems || [];
  candidates.sort((a, b) => {
    const score = entry => {
      const published = MAPS_DATA.zones.find(z => z.id === entry.zone.id);
      const dropIds = published?.drops || [];
      const planMatches = missing.filter(id => dropIds.includes(aiResolveItemId(id))).length;
      const healing = aiPublishedHealingCount(entry.zone.id);
      const distance = Math.hypot((entry.zone.x || 0) - (currentZone.x || 0),
        (entry.zone.y || 0) - (currentZone.y || 0));
      return entry.pressure * 25 + distance * 0.07 -
        (ai.hp < ai.maxHp * 0.75 ? Math.min(healing, 5) * 1.7 : 0) - planMatches * 0.8;
    };
    return score(a) - score(b);
  });
  return candidates[0].zone;
}

function aiFindHealingZone(ai) {
  const currentZone = getSafeCurrentZone(ai.zone);
  const avoided = ai.aiRecoveryAvoidZones || [];
  const candidates = aiGetAvailableZones().filter(zone => aiPublishedHealingCount(zone.id) > 0);
  if (!candidates.length) return null;
  const preferred = candidates.filter(zone => !avoided.includes(zone.id));
  const pool = preferred.length ? preferred : candidates;
  pool.sort((a, b) => {
    const score = zone => {
      const published = MAPS_DATA.zones.find(z => z.id === zone.id);
      const healCount = aiPublishedHealingCount(zone.id);
      const chance = healCount / Math.max(1, published?.drops?.length || 0);
      const distance = Math.hypot((zone.x || 0) - (currentZone.x || 0),
        (zone.y || 0) - (currentZone.y || 0));
      return aiZoneThreatPressure(ai, zone.id) * 30 + distance * 0.08 - chance * 30 -
        Math.min(healCount, 6) * 0.7;
    };
    return score(a) - score(b);
  });
  return pool[0];
}

// 比較「目前血量下預期幾次普通攻擊能分出勝負」，而非用固定的回合差距判斷。
// 1.30 代表：我方擊倒敵人所需的預估攻擊次數，比敵人擊倒我方多 30%。
// 包含雙方當前 HP、攻擊、裝備、防禦、熟練度與爆擊期望值；
// 已準備好的真實必閃，也要算入敵方可承受的攻擊次數。
function aiEnemyStrengthRatio(ai, enemy) {
  const outgoing = Math.max(1, aiDamageEstimate(ai, enemy));
  const incoming = Math.max(1, aiDamageEstimate(enemy, ai));
  let attacksToDefeatEnemy = Math.max(1, enemy.hp) / outgoing;
  const attacksToDefeatMe = Math.max(1, ai.hp) / incoming;
  if (enemy.id === "jiangwanan" && balanceHasPassive(enemy) && enemy.dodgeReady) {
    attacksToDefeatEnemy += 1; // 準備好的必閃會令首次普通攻擊無效
  }
  return attacksToDefeatEnemy / attacksToDefeatMe;
}

function aiShouldAvoidEncounter(ai, enemy) {
  if (!enemy || !enemy.alive || !ai || !ai.alive) return false;
  // 本次攻擊就能擊倒敵人時，仍要把握機會，不因自身殘血浪費出手。
  if (aiDamageEstimate(ai, enemy) >= enemy.hp &&
      !(enemy.id === "jiangwanan" && balanceHasPassive(enemy) && enemy.dodgeReady)) return false;
  const incoming = aiDamageEstimate(enemy, ai);
  const hpRatio = ai.hp / Math.max(1, ai.maxHp);
  const lowHealth = hpRatio <= AI_RETREAT_LOW_HP_RATIO;
  // 即使敵方平均戰力較低，也應避開兩擊內可能死亡的局面。
  const imminentDanger = ai.hp <= incoming * (aiIsHard() ? 2.0 : 1.5);
  const heavilyOutmatched = aiEnemyStrengthRatio(ai, enemy) >= AI_RETREAT_STRENGTH_RATIO;
  return lowHealth || imminentDanger || heavilyOutmatched;
}

function aiTryAvoidSearchEncounter(ai, enemy) {
  if (!aiShouldAvoidEncounter(ai, enemy)) return false;
  const hpRatio = ai.hp / Math.max(1, ai.maxHp);
  // 有真正能補 HP 的補品時，先使用它，而不是留在原地空轉或丟掉一次遭遇。
  if (hpRatio < 0.74 && aiUseHPFood(ai)) {
    ai.aiSeekingHealing = ai.hp < ai.maxHp * 0.60;
    aiCommitAction(ai);
    return true;
  }
  const destination = aiFindSaferRetreatZone(ai);
  if (destination && moveAIToSafeZone(ai, destination)) {
    ai.aiSeekingHealing = hpRatio < 0.75;
    ai.aiRecoveryMisses = 0;
    aiCommitAction(ai);
    return true;
  }
  // 真的無法補血／移動就死戰；不額外抽「放棄出手」機率。
  return false;
}

function aiTryUseNonCombatSkill(ai) {
  if (!ai || !ai.skill || ai.stunRemain > 0 || ai.skill.combatOnly) return false;
  const skill = ai.skill;
  if (ai.skillCdRemain > 0 || (ai.id === "wangshijian" && ai.stealthRemain > 0)) return false;
  const cost = Number(skill.costSp ?? skill.sp) || 20;
  if (ai.sp < cost) return false;

  if (ai.id === "zhugouliang") {
    // 不需要搜到敵人才知道地區裡有角色；AI 的即時位置資訊沿用原本 aiLivingThreats。
    // 不在無人區空放技能，也不在原本已經開秀的同區重複浪費施放機會。
    if (!aiLivingThreats(ai).length || zoneSongShowRemaining(ai.zone) > 0) return false;
    ai.sp -= cost;
    ai.skillCdRemain = skill.cd || 30;
    startZoneSongShow(ai);
    ai.lastAIAction = `施放${skill.name}（本區60秒搜刮干擾）`;
    return true;
  }

  if (ai.id === "hanguoyu") {
    const published = MAPS_DATA.zones.find(z => z.id === ai.zone);
    if (!published?.drops?.length) return false;
    const plan = ai.aiPlan ? aiBuildTargetPlan(ai, ai.aiPlan.targetId) : aiChooseBestTargetPlan(ai);
    const localUseful = published.drops.some(id => aiScorePickup(ai, getSafeItem(id), id, plan) > 100);
    if (!localUseful && ai.bag.length >= AI_MAX_BAG_SIZE) return false;
    ai.sp -= cost;
    ai.skillCdRemain = skill.cd || 35;
    let looted = 0;
    for (let i = 0; i < 3; i++) {
      if (lootOneItemForAI(ai)) { looted++; grantSearchGrowth(ai); }
    }
    ai.lastAIAction = `發動${skill.name}（搜刮${looted}件）`;
    return looted > 0;
  }

  if (ai.id === "wangshijian") {
    const nearbyThreat = aiLivingThreats(ai).length > 0;
    // 隱蔽能加速搜刮：有足夠體力和可搜刮的「公開地圖類型」時，AI 也會主動使用。
    // 只根據地圖公開的掉落列表決策，不偷看有限的實際剩餘物資池。
    const hasSearchOpportunity = ai.sp >= cost + AI_SEARCH_SP_COST * 2 &&
      !!MAPS_DATA.zones.find(z => z.id === ai.zone)?.drops?.length;
    if (ai.hp > ai.maxHp * 0.72 && !nearbyThreat && !hasSearchOpportunity) return false;
    ai.sp -= cost;
    ai.stealthRemain = 12;
    ai.lastAIAction = `發動${skill.name}`;
    return true;
  }

  if (ai.id === "jiangwanan") {
    const missingHp = ai.maxHp - ai.hp;
    const nearbyThreat = aiLivingThreats(ai).length > 0;
    if (missingHp < 12 && !nearbyThreat) return false;
    ai.sp -= cost;
    ai.skillCdRemain = skill.cd || 25;
    const healed = healCharactersInZone(ai, 30);
    ai.lastAIAction = `發動${skill.name}（區域恢復${healed.totalHealed}HP）`;
    return true;
  }

  return false;
}

// NPC 被動免死與死亡處理，保持與玩家遭遇戰相同的基本效果。
function aiResolveUnitDefeat(victim, killer) {
  if (!victim || victim.hp > 0 || !victim.alive) return false;
  if (victim.id === "zhugouliang" && balanceHasPassive(victim) && !victim.pigReviveUsed) {
    victim.pigReviveUsed = true;
    victim.hp = Math.max(1, Math.round(victim.maxHp * 0.3));
    const safe = getSafeOpenZonesForAI(victim.zone);
    const dest = safe[Math.floor(Math.random() * safe.length)];
    if (dest) {
      victim.zone = dest.id;

    }
    victim.aiSearchingUntilSec = null;
    aiStopRest(victim);
    aiCommitAction(victim);
    addLog(`✨ 【豬大哥沒死】${victim.name} 觸發免死，逃往【${dest?.name || "安全區"}】！`, "text-amber-300");
    return false;
  }
  victim.hp = 0;
  victim.alive = false;
  grantEliminationGrowth(killer, victim);
  aiStopRest(victim);
  victim.aiSearchingUntilSec = null;
  if (state.inCombat && state.ai === victim && typeof finishCombatTurn === "function") finishCombatTurn();
  const zone = getSafeCurrentZone(victim.zone);
  addLog(`💀 【全島廣播】${killer?.name || "禁區"} 在【${zone?.name || "未知地區"}】淘汰了 ${victim.name}！`, "text-rose-400 font-black");
  if (typeof checkAllAIsDeadWin === "function") checkAllAIsDeadWin();
  return true;
}

function aiSkillDamage(attacker, defender, multiplier = 1) {
  if (defender.hp <= 0) return 0;
  const hit = resolveCombatHit(attacker, defender,
    calculateCombatDamage(attacker, defender, { skill: true, multiplier }));
  return hit.damage;
}

function aiUseCombatSkill(attacker, defender) {
  const skill = attacker && attacker.skill;
  if (!attacker || !defender || !skill || !attacker.alive || !defender.alive) return false;
  if (attacker.skillCdRemain > 0 || attacker.stunRemain > 0) return false;
  const cost = Number(skill.costSp ?? skill.sp) || 20;
  if (attacker.sp < cost || (attacker.id === "wangshijian" && attacker.stealthRemain > 0)) return false;
  if (attacker.id === "hanguoyu" &&
      !MAPS_DATA.zones.find(z => z.id === attacker.zone)?.drops?.length) return false;

  const hpRatio = attacker.hp / Math.max(1, attacker.maxHp);
  const defenderRatio = defender.hp / Math.max(1, defender.maxHp);
  const wanted = defenderRatio < 0.75 || hpRatio < 0.62 ||
    ["zhugouliang", "yazhoutongshen", "jiangwanan", "chenaguan"].includes(attacker.id);
  if (!wanted || Math.random() > (aiIsHard() ? 0.90 : 0.46)) return false;

  const enemyHpBeforeSkill = defender.hp;
  attacker.sp -= cost;
  if (attacker.id !== "wangshijian") attacker.skillCdRemain = skill.cd || 25;
  const hpMissing = 1 - hpRatio;
  let damage = 0;
  switch (attacker.id) {
    case "zhugouliang":
      startZoneSongShow(attacker);
      break;
    case "kewenzhe":
      damage = aiSkillDamage(attacker, defender, 1.5 + hpMissing * 0.5);
      break;
    case "laixiangde":
      damage = aiSkillDamage(attacker, defender, 1);
      if (balanceHasPassive(attacker)) attacker.gongdeStacks = Math.min(15, (attacker.gongdeStacks || 0) + 3);
      if (defender.hp > 0) {
        const safe = getSafeOpenZonesForAI(defender.zone);
        const dest = safe[Math.floor(Math.random() * safe.length)];
        if (dest) {
          defender.zone = dest.id;

        }
      }
      break;
    case "chenaguan":
      for (let i = 0; i < 3 && defender.hp > 0 && attacker.hp > 0; i++) {
        damage += aiSkillDamage(attacker, defender, 0.75);
      }
      attacker.weakenedRemain = 15;
      break;
    case "yazhoutongshen":
      attacker.reflectRemain = 8;
      attacker.reflectHitsRemaining = 2;
      break;
    case "chaoge":
      damage = aiSkillDamage(attacker, defender, 1.5);
      break;
    case "wangshijian":
      attacker.stealthRemain = 12;
      break;
    case "jiangwanan":
      healCharactersInZone(attacker, 30);
      break;
    case "hanguoyu": {
      for (let i = 0; i < 3; i++) if (lootOneItemForAI(attacker)) grantSearchGrowth(attacker);
      break;
    }
    default:
      damage = aiSkillDamage(attacker, defender, 1.25);
  }
  if (defender.hp < enemyHpBeforeSkill) grantCombatHitGrowth(attacker, defender, true);
  attacker.lastAIAction = `施放${skill.name}${damage ? `（${damage}傷害）` : ""}`;
  return true;
}

function simulateAIVsAICombat(attacker, defender) {
  if (!attacker || !defender || !attacker.alive || !defender.alive) return;
  if ((defender.stealthRemain || 0) > 0 || (attacker.stealthRemain || 0) > 0) return;
  const usedSkill = aiUseCombatSkill(attacker, defender);
  if (!usedSkill) {
    const crit = Math.random() < 0.25;
    const hit = resolveCombatHit(attacker, defender, calculateCombatDamage(attacker, defender, { crit }));
    if (hit.damage > 0) grantCombatHitGrowth(attacker, defender, false);
    attacker.lastAIAction = hit.dodged ? `${defender.name}閃避了攻擊` : `攻擊${defender.name}`;
  }
  // 反傷可能先殺死攻擊者，兩方均檢查免死；不允許一次遭遇免費連擊。
  if (attacker.hp <= 0) aiResolveUnitDefeat(attacker, defender);
  if (defender.hp <= 0) aiResolveUnitDefeat(defender, attacker);
}

/**
 * NPC 搜刮遇到真人玩家：只結算 NPC 本次主動出手。
 * 重要：不呼叫 startCombat()、不切換 state.inCombat，也不觸發玩家自動反擊。
 * 玩家原本的搜刮操作可以繼續進行；死亡或瞬移時由搜刮流程自行終止。
 */
function aiAttackPlayerOnSearch(ai) {
  const player = state.player;
  if (!ai || !player || !ai.alive || !player.alive || state.gameOver || state.inCombat ||
      ai.zone !== player.zone || (ai.stealthRemain || 0) > 0 ||
      (player.stealthRemain || 0) > 0 || (ai.stunRemain || 0) > 0) return false;

  // 每隻 NPC 都獨立從搜刮觸發遭遇並判斷攻擊；不設全場或個別的攻擊間隔。
  // 如果多個 NPC 剛好在同一秒搜刮遇到玩家，允許自然形成連續攻擊。
  const zoneName = getSafeCurrentZone(player.zone)?.name || '未知區域';
  const hpBefore = player.hp;
  const aiHpBefore = ai.hp;
  const wasDodgeReady = !!player.dodgeReady;
  const skillUsed = aiUseCombatSkill(ai, player);
  let critical = false;
  let basicHit = null;
  if (!skillUsed) {
    critical = Math.random() < 0.25;
    basicHit = resolveCombatHit(ai, player, calculateCombatDamage(ai, player, { crit: critical }));
    if (basicHit.damage > 0) grantCombatHitGrowth(ai, player, false);
    ai.lastAIAction = basicHit.dodged ? `${player.name}閃避了攻擊` : `攻擊${player.name}`;
  }

  const dmgTaken = Math.max(0, hpBefore - player.hp);
  const skillName = ai.skill?.name || '技能';
  const action = skillUsed ? `使用【${skillName}】` : (critical ? '爆擊攻擊' : '普通攻擊');
  if (dmgTaken > 0) {
    addLog(`⚔️ 【遭遇襲擊】${ai.name} 在【${zoneName}】搜刮遇到你，${action}造成 <b class="text-rose-300">${dmgTaken}</b> 點傷害！`, 'text-rose-400 font-black');
    // 攻擊不是進入遭遇面板；維持玩家目前所在的探索畫面。
    if (player.isResting && typeof stopPlayerRest === 'function') stopPlayerRest('遭到攻擊，休息中斷。');
    const hitOverlay = typeof document !== 'undefined' ? document.getElementById('fps-blood-hit-overlay') : null;
    if (hitOverlay) {
      hitOverlay.classList.remove('hit-active');
      void hitOverlay.offsetWidth;
      hitOverlay.classList.add('hit-active');
      setTimeout(() => hitOverlay.classList.remove('hit-active'), 280);
    }
  } else if (basicHit?.dodged || (wasDodgeReady && !player.dodgeReady)) {
    addLog(`💨 【搜刮遭遇】${ai.name} 在【${zoneName}】攻擊你，但你成功閃避！`, 'text-sky-300 font-bold');
  } else {
    addLog(`⚔️ 【搜刮遭遇】${ai.name} 在【${zoneName}】遇到你，${action}${player.hp > 0 ? '，本次沒有造成傷害。' : '。'}`, 'text-amber-300');
  }

  // 結算原本的被動反傷／受擊恢復。技能中的多段攻擊已在 aiUseCombatSkill 結算。
  if (ai.hp < aiHpBefore) {
    addLog(`🛡️ ${player.name} 的反傷效果使 ${ai.name} 受到 ${aiHpBefore - ai.hp} 點傷害！`, 'text-amber-300');
  }
  // 勝負先以玩家是否死亡為優先處理；豬勾亮免死例外仍然有效。
  if (player.hp <= 0) handleUnitDefeat(player, ai);
  if (ai.hp <= 0 && ai.alive) aiResolveUnitDefeat(ai, player);
  return true;
}

function aiThreatenedEnoughToLeave(ai, threats) {
  if (!threats.length) return false;
  // 先評估是否真的有明顯弱勢／殘血威脅，只有成功換到較安全的區域才算逃跑。
  // 勢均力敵的 NPC 不會因為看到玩家就亂跑。
  return threats.some(enemy => aiShouldAvoidEncounter(ai, enemy));
}

function aiChooseDuelTarget(ai, threats) {
  // 每次搜刮先抽「是否遭遇」，遭遇後再隨機遇到一個同區對手。
  // 不偏好玩家、不挑最弱者，也不另外抽攻擊機率。
  const candidates = threats.filter(enemy => enemy !== state.player || !state.inCombat);
  return candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : null;
}

function runAIBrain() {
  if (!state.ais || state.ais.length === 0) return;
  state.ais.forEach(ai => {
    if (!ai || !ai.alive || state.gameOver) return;

    // AI 每 0.5 秒執行一次：每次只回復一半，總每秒恢復量不變。
    ai.sp = Math.min(ai.maxSp, ai.sp + AI_PASSIVE_SP_REGEN_PER_SEC * 0.5 +
      (ai.aiResting ? AI_REST_SP_REGEN_PER_SEC * 0.5 : 0));
    if (state.closedZones.includes(ai.zone) && Number.isInteger(state.aiTimeSec) && !state.finalStormActive) {
      aiStopRest(ai);
      ai.hp = Math.max(0, ai.hp - 12); // 玩家與 NPC 禁區傷害一致
      if (ai.hp <= 0) { aiResolveUnitDefeat(ai, null); return; }
    }
    if (state.inCombat && state.ai === ai) return;
    if (ai.aiResting) {
      if (aiShouldContinueRest(ai)) { ai.lastAIAction = "休息中"; return; }
      aiStopRest(ai);
    }

    // 普通搜刮等 1.5 秒；王世間隱蔽期間等 0.5 秒（500ms AI 時脈）。
    if (ai.aiSearchingUntilSec != null) {
      if (state.closedZones.includes(ai.zone)) {
        ai.aiSearchingUntilSec = null;
      } else {
        if (state.aiTimeSec >= ai.aiSearchingUntilSec) {
          ai.aiSearchingUntilSec = null;
          // 只有「完成搜刮」才可能遇敵；玩家也是合法目標，但 NPC 攻擊真人
          // 只單向結算傷害／技能，不彈戰鬥面板，也不附贈玩家反擊。
          const rivals = aiLivingThreats(ai);
          // 先抽原本的 65% 遭遇骰，成功才抽對手；沒有雷達時保留舊版的亂數消耗順序。
          const encounterRoll = Math.random();
          const opponent = rivals.length && encounterRoll < 0.65 ? aiChooseDuelTarget(ai, rivals) : null;
          const duel = opponent && encounterRoll < getSearchEncounterChance(ai, opponent) ? opponent : null;
          if (duel) {
            const avoided = aiTryAvoidSearchEncounter(ai, duel);
            if (!avoided) {
              // 沒有實際補血或成功逃離，就 100% 攻擊／施技。沒有自動反擊。
              if (duel === state.player) aiAttackPlayerOnSearch(ai);
              else simulateAIVsAICombat(ai, duel);
            }
          } else if (lootOneItemForAI(ai)) {
            grantSearchGrowth(ai);
          } else {
            ai.aiUnproductiveSearches = (ai.aiUnproductiveSearches || 0) + 1;
            if (ai.aiSeekingHealing) ai.aiRecoveryMisses = (ai.aiRecoveryMisses || 0) + 1;
          }
        }
        // 快速搜刮完成後允許 AI 立即規劃下一次行動；否則在 0.5s 時脈下
        // 每次搜刮仍會白等一拍，使「0.5 秒」無法真正發揮效果。
        // 不影響普通 NPC 1.5 秒搜刮或其他動作的原始行動間隔。
        if (!(ai.id === "wangshijian" && ai.stealthRemain > 0)) return;
      }
    }
    if (ai.stunRemain > 0 || !aiReadyForAction(ai)) return;

    // 危險狀態先避險：即使 SP 不足以搜刮，也優先保留移動費用。
    if (state.closedZones.includes(ai.zone) ||
        (state.pendingCloseZones.includes(ai.zone) && state.roundTimeRemain <= (aiIsHard() ? 32 : 22))) {
      if (ai.sp < AI_MOVE_SP_COST && aiUseFood(ai, true)) { aiCommitAction(ai); return; }
      if (moveAIToSafeZone(ai)) { aiCommitAction(ai); return; }
      return;
    }

    aiEnsureBestEquipment(ai);
    const threats = aiLivingThreats(ai);
    const hpRatio = ai.hp / Math.max(1, ai.maxHp);
    const imminentHit = threats.some(t => aiDamageEstimate(t, ai) * (aiIsHard() ? 2.1 : 1.5) >= ai.hp);
    if ((hpRatio <= (aiIsHard() ? 0.74 : 0.65) || imminentHit) && aiUseFood(ai, imminentHit)) {
      aiCommitAction(ai);
      return;
    }

    if (aiThreatenedEnoughToLeave(ai, threats)) {
      const safeDestination = aiFindSaferRetreatZone(ai);
      if (safeDestination && moveAIToSafeZone(ai, safeDestination)) {
        ai.aiSeekingHealing = hpRatio < 0.75;
        ai.aiRecoveryMisses = 0;
        aiCommitAction(ai);
        return;
      }
      // 沒有真正能到達的較安全地區，就繼續搜刮／在遭遇時應戰。
    }
    if (aiTryUseNonCombatSkill(ai)) { aiCommitAction(ai); return; }

    // 逃離戰鬥後先找能補 HP 的道具，不會一逃走就繼續死追頂級裝備。
    if (ai.aiSeekingHealing) {
      if (hpRatio >= 0.77) {
        ai.aiSeekingHealing = false;
        ai.aiRecoveryMisses = 0;
        ai.aiRecoveryAvoidZones = [];
      } else if (aiUseHPFood(ai)) {
        aiCommitAction(ai);
        return;
      } else {
        const enoughTries = (ai.aiRecoveryMisses || 0) >= 5;
        if (enoughTries) {
          ai.aiRecoveryAvoidZones = [...new Set([...(ai.aiRecoveryAvoidZones || []), ai.zone])];
          ai.aiRecoveryMisses = 0;
        }
        const destination = aiFindHealingZone(ai);
        if (destination && destination.id !== ai.zone && moveAIToSafeZone(ai, destination)) {
          aiCommitAction(ai);
          return;
        }
      }
    }

    const plan = aiGetCurrentTargetPlan(ai);
    if (!ai.aiSeekingHealing && tryAutoCraftForAI(ai) > 0) { aiCommitAction(ai); return; }

    // 已連續多次搜不到目標：憑實際搜刮經驗換一條路，而非透視庫存。
    if (!ai.aiSeekingHealing && (ai.aiUnproductiveSearches || 0) >= (aiIsHard() ? 4 : 6)) {
      const wanted = new Set((plan?.missingItems || []).map(aiResolveItemId));
      const candidates = aiGetAvailableZones().filter(zone => zone.id !== ai.zone)
        .map(zone => {
          const published = MAPS_DATA.zones.find(z => z.id === zone.id);
          const matches = (published?.drops || []).filter(id => wanted.has(aiResolveItemId(id))).length;
          return { zone, matches, hasLoot: !!published?.drops?.length };
        }).filter(x => x.hasLoot && (!wanted.size || x.matches > 0))
        .sort((a, b) => b.matches - a.matches);
      if (candidates.length > 0) {
        // 同分路線保留一些隨機性，免得所有 NPC 都精確走同一最優路線。
        const shortlist = candidates.slice(0, Math.min(3, candidates.length));
        const choice = shortlist[Math.floor(Math.random() * shortlist.length)].zone;
        if (moveAIToSafeZone(ai, choice)) {
          ai.aiUnproductiveSearches = 0;
          aiCommitAction(ai);
          return;
        }
      }
      ai.aiUnproductiveSearches = 0;
    }

    // 不在普通 AI 行動中主動開戰。遭遇只能由搜刮觸發（黑色倖存者式節奏）。
    const zone = getSafeCurrentZone(ai.zone);
    // 無剩餘物資透視：只知道該地圖理論上可能搜到什麼。
    const viableDrop = !!MAPS_DATA.zones.find(z => z.id === ai.zone)?.drops?.length;
    const lowSP = ai.sp < AI_SEARCH_SP_COST || ai.sp < ai.maxSp * (aiIsHard() ? 0.18 : 0.14);
    if (lowSP && ai.sp < ai.maxSp * 0.4 && aiUseFood(ai)) { aiCommitAction(ai); return; }
    if (lowSP && threats.length === 0) { aiStartRest(ai); return; }

    const localPublished = MAPS_DATA.zones.find(z => z.id === ai.zone);
    const localHasNeed = !!(plan && plan.missingItems && plan.missingItems.some(needed =>
      (localPublished?.drops || []).some(id => aiResolveItemId(id) === aiResolveItemId(needed))));
    const targetZone = aiGetBestNeededDropZone(ai, plan);
    // 困難 AI：有明確需求且本區沒有時，優先移動；簡單 AI 會多撿一些非關鍵物品。
    const seekTarget = !ai.aiSeekingHealing && targetZone && targetZone.id !== ai.zone &&
      !localHasNeed && (!viableDrop || (aiIsHard() && Math.random() < 0.73));
    if (seekTarget && moveAIToSafeZone(ai, targetZone)) { aiCommitAction(ai); return; }
    if (viableDrop && ai.sp >= AI_SEARCH_SP_COST) {
      ai.sp -= AI_SEARCH_SP_COST;
      const fastSearch = ai.id === "wangshijian" && balanceHasPassive(ai) && ai.stealthRemain > 0;
      const searchDuration = (fastSearch ? AI_FAST_SEARCH_DURATION_SEC : AI_SEARCH_DURATION_SEC) + zoneSongShowSearchPenalty(ai);
      ai.aiSearchingUntilSec = state.aiTimeSec + searchDuration;
      aiCommitAction(ai, searchDuration);
      ai.lastAIAction = zoneSongShowSearchPenalty(ai) ? `🎤 搜刮干擾（${searchDuration}秒）` : fastSearch ? "從從容容（0.5秒搜刮）" : "搜刮中";
      return;
    }
    if (moveAIToSafeZone(ai, targetZone)) { aiCommitAction(ai); return; }
    if (threats.length === 0 && ai.sp < ai.maxSp) aiStartRest(ai);
  });
}
