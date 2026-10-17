/**
 * 【模組：AI 決策與大逃殺混戰模擬 ai.js】
 * AI 會依照裝備目標規劃素材、選擇搜刮地點、管理背包、合成、穿戴裝備、使用補品與角色技能。
 */

const AI_EQUIP_SLOTS = ["weapon", "head", "chest", "arm", "leg", "acc"];
const AI_MAX_BAG_SIZE = 6;
// 每位 AI 獨立行動間隔（秒），與玩家搜刮的 2 秒節奏一致。
const AI_ACTION_COOLDOWN_SEC = 2;
const AI_SEARCH_SP_COST = 15;
const AI_MOVE_SP_COST = 5;
const AI_PASSIVE_SP_REGEN_PER_SEC = 2;
const AI_REST_SP_REGEN_PER_SEC = 6;
const AI_REST_TARGET_RATIO = 0.52;

function aiReadyForAction(ai) {
  return (Number(ai.aiNextActionSec) || 0) <= state.timeSec;
}

function aiCommitAction(ai, seconds = AI_ACTION_COOLDOWN_SEC) {
  ai.aiNextActionSec = state.timeSec + seconds;
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
  const sameZoneThreat = state.ais.some(other => other && other.alive && other.id !== ai.id && other.zone === ai.zone && (other.stealthRemain || 0) <= 0);
  return !sameZoneThreat;
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

function aiGetRecipesForResult(itemId) {
  const resolved = aiResolveItemId(itemId);
  return getSafeRecipes().filter(recipe => aiResolveItemId(recipe.result) === resolved && Array.isArray(recipe.materials) && recipe.materials.length >= 2);
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
    (zone.drops || []).forEach(id => {
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
    if (!(zone.drops || []).some(id => aiResolveItemId(id) === resolved)) return;
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
  if (!resolved || depth > 14 || stack.includes(resolved)) {
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
  const resolved = aiResolveItemId(itemId);
  return aiGetAvailableZones().reduce((total, zone) =>
    total + (zone.drops || []).filter(id => aiResolveItemId(id) === resolved).length, 0);
}

function aiChooseBestTargetPlan(ai, context = null) {
  const planner = context || aiCreatePlannerContext(ai);
  const items = (typeof ItemRegistry !== "undefined" && typeof ItemRegistry.getAllItems === "function")
    ? ItemRegistry.getAllItems()
    : {};
  let best = null;

  for (const item of Object.values(items)) {
    if (!item || !AI_EQUIP_SLOTS.includes(item.type) || !item.id) continue;
    const currentValue = aiCurrentGearValue(ai, item.type);
    const targetValue = aiGearValue(item, ai);
    if (targetValue <= currentValue + 0.15) continue;
    // 已經持有的裝備先由 aiEnsureBestEquipment 處理，不要重複把它當成遠端目標。
    if (aiCountOwned(ai, item.id) > 0) continue;

    const plan = aiBuildTargetPlan(ai, item.id, planner);
    if (!plan) continue;

    const gain = targetValue - currentValue + (currentValue === 0 ? 5.5 : 0);
    let slotWeight = item.type === "weapon" ? 1.28 : item.type === "acc" ? 1.08 : 1;
    if (["yazhoutongshen", "jiangwanan", "zhugouliang"].includes(ai.id) && item.type !== "weapon") slotWeight *= 1.08;
    const cost = Math.max(1, plan.cost || 1);
    const priority = (gain * slotWeight) / (1 + cost * 0.7);
    if (!best || priority > best.priority) best = { ...plan, priority };
  }

  if (best) {
    ai.aiPlan = { targetId: best.targetId, slot: best.slot, priority: best.priority };
    return best;
  }
  ai.aiPlan = null;
  return null;
}

function aiGetCurrentTargetPlan(ai, context = null) {
  const planner = context || aiCreatePlannerContext(ai);
  const current = ai.aiPlan;
  if (current && current.targetId) {
    const targetItem = getSafeItem(current.targetId);
    if (targetItem && AI_EQUIP_SLOTS.includes(targetItem.type)) {
      const currentValue = aiCurrentGearValue(ai, targetItem.type);
      const targetValue = aiGearValue(targetItem, ai);
      if (currentValue + 0.15 < targetValue && aiCountOwned(ai, current.targetId) === 0) {
        const plan = aiBuildTargetPlan(ai, current.targetId, planner);
        if (plan) {
          ai.aiPlan = { targetId: plan.targetId, slot: plan.slot, priority: current.priority || 0 };
          return plan;
        }
      }
    }
    ai.aiPlan = null;
  }
  return aiChooseBestTargetPlan(ai, planner);
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
  if (ordinal <= bagNeeded) return Infinity;

  let score = aiItemComparableScore(ai, item, id, null);
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
  const wantsHp = force || hpRatio <= 0.47;
  const wantsSp = force || spRatio <= 0.31;
  if (!wantsHp && !wantsSp) return false;

  const plan = ai.aiPlan ? aiBuildTargetPlan(ai, ai.aiPlan.targetId) : null;
  let bestIndex = -1;
  let bestValue = -Infinity;
  const missingHp = Math.max(0, (ai.maxHp || ai.hp) - ai.hp);
  const missingSp = Math.max(0, (ai.maxSp || ai.sp) - ai.sp);
  const hpMultiplier = ai.id === "yazhoutongshen" ? 1.2 : 1;

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
    const hpRatio = ai.hp / Math.max(1, ai.maxHp);
    const spRatio = ai.sp / Math.max(1, ai.maxSp);
    const healthNeed = Math.max(0, (ai.maxHp - ai.hp) * (hpRatio < 0.55 ? 1.2 : 0.12));
    const staminaNeed = Math.max(0, (ai.maxSp - ai.sp) * (spRatio < 0.45 ? 1.0 : 0.08));
    const foodUtility = Math.min(healthNeed, (Number(item.hp) || 0) * (ai.id === "yazhoutongshen" ? 1.2 : 1)) + Math.min(staminaNeed, Number(item.sp) || 0) * 0.8;
    if (aiPlanRequiredCopies(plan, resolved) > aiCountOwned(ai, resolved)) return 1300 + foodUtility;
    return foodUtility > 8 ? 500 + foodUtility : -100;
  }

  if (item.type === "material") {
    if (aiPlanRequiredCopies(plan, resolved) > aiCountOwned(ai, resolved)) return 1800 + (Number(item.score) || 0);
    return 100 + (Number(item.score) || 0) * 0.5 + (Number(item.rarity) || 1) * 3;
  }

  return 0;
}

function aiSelectDropIndex(ai, zone, plan) {
  if (!zone || !Array.isArray(zone.drops) || zone.drops.length === 0) return -1;
  const ranked = zone.drops.map((id, index) => ({
    id,
    index,
    item: getSafeItem(id),
    score: aiItemComparableScore(ai, getSafeItem(id), id, plan) + Math.random() * 0.5
  })).filter(entry => {
    if (!entry.item) return false;
    const slot = aiGetSlotOfItem(entry.item);
    const current = slot && ai.equip ? ai.equip[slot] : null;
    // 更好的裝備可以直接換穿；否則滿背包時必須先通過價值比較。
    if (slot && (!current || aiGearValue(entry.item, ai) > aiGearValue(current, ai) + 0.15)) return true;
    return ai.bag.length < AI_MAX_BAG_SIZE || aiGetBagSwapChoice(ai, entry.item, entry.id, plan).accepted;
  });
  ranked.sort((a, b) => b.score - a.score);
  return ranked.length ? ranked[0].index : -1;
}

function lootOneItemForAI(ai) {
  const zObj = getSafeCurrentZone(ai.zone);
  if (!zObj || !Array.isArray(zObj.drops) || zObj.drops.length === 0) return false;

  aiEnsureBestEquipment(ai);
  const plan = ai.aiPlan ? aiBuildTargetPlan(ai, ai.aiPlan.targetId) : aiChooseBestTargetPlan(ai);
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
  ai.lastAIAction = `搜刮${item.name}`;
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

function tryAutoCraftForAI(ai, maxCrafts = 1) {
  if (typeof findAvailableRecipes !== "function" || typeof craftItem !== "function" || !ai) return 0;
  let craftedCount = 0;
  // 普通決策每次只准合成 1 件；保留參數供特殊測試用途。
  while (craftedCount < Math.max(0, Math.min(maxCrafts, 1))) {
    aiEnsureBestEquipment(ai);
    const context = aiCreatePlannerContext(ai);
    let plan = aiGetCurrentTargetPlan(ai, context);
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
  const currentNeeds = (current.drops || []).filter(id => (needCounts[aiResolveItemId(id)] || 0) > 0);
  if (currentNeeds.length > 0) return current;

  let bestZone = null;
  let bestValue = -Infinity;
  zones.forEach(zone => {
    if (!Array.isArray(zone.drops) || zone.drops.length === 0) return;
    let matchedKinds = 0;
    let matchedCopies = 0;
    for (const [id, needed] of Object.entries(needCounts)) {
      const copies = zone.drops.filter(dropId => aiResolveItemId(dropId) === id).length;
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

  let nextZone = targetZone && targetZone.id !== ai.zone ? targetZone : null;
  if (!nextZone) {
    const withDrops = candidates.filter(zone => zone.drops && zone.drops.length > 0);
    const pool = withDrops.length > 0 ? withDrops : candidates;
    nextZone = pool[Math.floor(Math.random() * pool.length)];
  }

  if (nextZone && nextZone.id !== ai.zone) {
    ai.sp -= AI_MOVE_SP_COST;
    ai.zone = nextZone.id;
    ai.lastAIAction = `前往${nextZone.name}`;
    if (typeof checkHanguoyuRadar === "function") checkHanguoyuRadar(ai, nextZone.id);
    return true;
  }
  return false;
}

function aiTryUseNonCombatSkill(ai) {
  if (!ai || !ai.skill || ai.stunRemain > 0 || ai.skill.combatOnly) return false;
  const skill = ai.skill;
  if (ai.skillCdRemain > 0 || (ai.id === "wangshijian" && ai.stealthRemain > 0)) return false;
  const cost = Number(skill.costSp ?? skill.sp) || 20;
  if (ai.sp < cost) return false;

  if (ai.id === "hanguoyu") {
    const zone = getSafeCurrentZone(ai.zone);
    if (!zone || !zone.drops || zone.drops.length === 0) return false;
    const plan = ai.aiPlan ? aiBuildTargetPlan(ai, ai.aiPlan.targetId) : aiChooseBestTargetPlan(ai);
    const localUseful = zone.drops.some(id => aiScorePickup(ai, getSafeItem(id), id, plan) > 100);
    if (!localUseful && ai.bag.length >= AI_MAX_BAG_SIZE) return false;
    ai.sp -= cost;
    ai.skillCdRemain = skill.cd || 35;
    let looted = 0;
    for (let i = 0; i < 3; i++) {
      if (lootOneItemForAI(ai)) looted++;
    }
    ai.lastAIAction = `發動${skill.name}（搜刮${looted}件）`;
    return looted > 0;
  }

  if (ai.id === "wangshijian") {
    const nearbyThreat = state.ais.some(other => other && other.alive && other.id !== ai.id && other.zone === ai.zone);
    if (ai.hp > ai.maxHp * 0.72 && !nearbyThreat) return false;
    ai.sp -= cost;
    ai.stealthRemain = 12;
    ai.lastAIAction = `發動${skill.name}`;
    return true;
  }

  if (ai.id === "jiangwanan") {
    const missingHp = ai.maxHp - ai.hp;
    const nearbyThreat = state.ais.some(other => other && other.alive && other.id !== ai.id && other.zone === ai.zone);
    if (missingHp < 12 && !nearbyThreat) return false;
    ai.sp -= cost;
    ai.skillCdRemain = skill.cd || 25;
    ai.hp = Math.min(ai.maxHp, ai.hp + 20);
    ai.milkDefBuffRemain = 10;
    ai.lastAIAction = `發動${skill.name}`;
    return true;
  }

  return false;
}

function aiUseCombatSkill(attacker, defender) {
  const skill = attacker && attacker.skill;
  if (!attacker || !defender || !skill || !attacker.alive || !defender.alive) return false;
  if (attacker.skillCdRemain > 0 || attacker.stunRemain > 0) return false;
  const cost = Number(skill.costSp ?? skill.sp) || 20;
  if (attacker.sp < cost || (attacker.id === "wangshijian" && attacker.stealthRemain > 0)) return false;

  // 技能並非每次都強放：SP 緊張時保留技能，優勢或有特殊戰術價值時才使用。
  const hpRatio = attacker.hp / Math.max(1, attacker.maxHp);
  const defenderRatio = defender.hp / Math.max(1, defender.maxHp);
  const shouldUse = defenderRatio < 0.72 || hpRatio < 0.48 || ["zhugouliang", "yazhoutongshen", "jiangwanan"].includes(attacker.id);
  if (!shouldUse || Math.random() > 0.72) return false;

  attacker.sp -= cost;
  if (attacker.id !== "wangshijian") attacker.skillCdRemain = skill.cd || 25;

  const attack = getTotalAtk(attacker);
  const defense = getTotalDef(defender);
  const baseDamage = Math.max(4, attack - defense);
  let damage = 0;

  switch (attacker.id) {
    case "zhugouliang":
      defender.stunRemain = Math.max(defender.stunRemain || 0, 5);
      attacker.lastAIAction = `施放${skill.name}，定身${defender.name}`;
      return true;
    case "kewenzhe": {
      const missingRatio = 1 - hpRatio;
      damage = Math.round(baseDamage * (1.5 + 0.5 * missingRatio));
      break;
    }
    case "laixiangde":
      damage = baseDamage;
      attacker.gongdeStacks = Math.min(10, (attacker.gongdeStacks || 0) + 1);
      break;
    case "chenaguan":
      damage = baseDamage * 3;
      attacker.weakenedRemain = 10;
      break;
    case "yazhoutongshen":
      attacker.reflectRemain = 3;
      attacker.lastAIAction = `施放${skill.name}，準備反傷`;
      return true;
    case "chaoge":
      damage = Math.round(baseDamage * 1.5);
      break;
    case "wangshijian":
      attacker.stealthRemain = 12;
      attacker.lastAIAction = `施放${skill.name}`;
      return true;
    case "jiangwanan":
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + 20);
      attacker.milkDefBuffRemain = 10;
      attacker.lastAIAction = `施放${skill.name}`;
      return true;
    case "hanguoyu": {
      const zone = getSafeCurrentZone(attacker.zone);
      let count = 0;
      for (let i = 0; i < 3 && zone && zone.drops && zone.drops.length; i++) {
        if (lootOneItemForAI(attacker)) count++;
      }
      attacker.lastAIAction = `施放${skill.name}（搜刮${count}件）`;
      return true;
    }
    default:
      damage = Math.round(baseDamage * 1.25);
  }

  defender.hp = Math.max(0, defender.hp - Math.max(4, damage));
  if (attacker.id === "laixiangde" && defender.hp > 0) {
    const destinations = getSafeOpenZonesForAI(defender.zone);
    if (destinations.length > 0) defender.zone = destinations[Math.floor(Math.random() * destinations.length)].id;
  }
  attacker.lastAIAction = `施放${skill.name}`;
  return true;
}

function simulateAIVsAICombat(attacker, defender) {
  if (!attacker || !defender || !attacker.alive || !defender.alive) return;

  let usedSkill = aiUseCombatSkill(attacker, defender);
  if (!usedSkill) {
    const dmg = Math.max(4, getTotalAtk(attacker) - getTotalDef(defender));
    defender.hp = Math.max(0, defender.hp - dmg);
    attacker.lastAIAction = `攻擊${defender.name}`;
  }

  if (defender.hp <= 0) {
    defender.hp = 0;
    defender.alive = false;
    const zone = getSafeCurrentZone(attacker.zone);
    addLog(`💀 【全島廣播】${attacker.name} 在【${zone ? zone.name : "未知地區"}】擊殺了 ${defender.name}！`, "text-rose-400 font-black");
    if (typeof checkAllAIsDeadWin === "function") checkAllAIsDeadWin();
    return;
  }

  // 防守方會在自己的行動 CD 到期後決定補血／撤退，不插隊行動。
}

function runAIBrain() {
  if (!state.ais || state.ais.length === 0) return;

  state.ais.forEach(ai => {
    if (!ai || !ai.alive || state.gameOver) return;
    if (state.inCombat && state.ai === ai) return;

    const aiRegen = AI_PASSIVE_SP_REGEN_PER_SEC + (ai.aiResting ? AI_REST_SP_REGEN_PER_SEC : 0);
    ai.sp = Math.min(ai.maxSp, ai.sp + aiRegen);
    if (state.closedZones.includes(ai.zone)) {
      aiStopRest(ai);
      ai.hp = Math.max(0, ai.hp - 30);
      if (ai.hp <= 0) {
        ai.alive = false;
        const zone = getSafeCurrentZone(ai.zone);
        addLog(`⚡ 【全島廣播】${ai.name} 滯留於禁區【${zone ? zone.name : "未知地區"}】遭高壓電網淘汰！`, "text-rose-500 font-black");
        if (typeof checkAllAIsDeadWin === "function") checkAllAIsDeadWin();
        return;
      }
    }

    if (ai.aiResting) {
      if (aiShouldContinueRest(ai)) {
        ai.lastAIAction = "休息中";
        return;
      }
      aiStopRest(ai);
    }

    // 搜刮並非瞬間完成：與玩家一樣等待固定時間後才取得 1 件物品。
    if (ai.aiSearchingUntilSec != null) {
      if (state.timeSec >= ai.aiSearchingUntilSec) {
        ai.aiSearchingUntilSec = null;
        if (!state.closedZones.includes(ai.zone)) lootOneItemForAI(ai);
      }
      return;
    }

    if (ai.stunRemain > 0 || !aiReadyForAction(ai)) return;

    if (state.closedZones.includes(ai.zone)) {
      if (moveAIToSafeZone(ai)) aiCommitAction(ai);
      return;
    }

    if (state.pendingCloseZones.includes(ai.zone) && state.roundTimeRemain <= 25) {
      const context = aiCreatePlannerContext(ai);
      const plan = aiGetCurrentTargetPlan(ai, context);
      if (moveAIToSafeZone(ai, aiGetBestNeededDropZone(ai, plan))) aiCommitAction(ai);
      return;
    }

    // 穿戴剛合成或拾取的裝備屬於取得物品當下的自動整理，不另占回合。
    aiEnsureBestEquipment(ai);
    if (aiUseFood(ai, false)) { aiStopRest(ai); aiCommitAction(ai); return; }
    if (aiTryUseNonCombatSkill(ai)) { aiStopRest(ai); aiCommitAction(ai); return; }

    let context = aiCreatePlannerContext(ai);
    let plan = aiGetCurrentTargetPlan(ai, context);
    if (tryAutoCraftForAI(ai) > 0) { aiStopRest(ai); aiCommitAction(ai); return; }

    // 危急時可以選擇花一次行動撤退，而非攻擊後免費移動。
    if (ai.hp < ai.maxHp * 0.35 && ai.sp >= AI_MOVE_SP_COST && Math.random() < 0.65) {
      if (moveAIToSafeZone(ai)) { aiStopRest(ai); aiCommitAction(ai); return; }
    }

    const sameZoneAIs = state.ais.filter(other =>
      other && other.alive && other.id !== ai.id && other.zone === ai.zone && (other.stealthRemain || 0) <= 0
    );

    const zone = getSafeCurrentZone(ai.zone);
    const lowSpNeedRest = ai.sp < AI_SEARCH_SP_COST || (ai.sp / Math.max(1, ai.maxSp)) < 0.22;
    if (lowSpNeedRest && sameZoneAIs.length === 0 && !tryConsumeFoodForAI(ai, false)) {
      if (aiStartRest(ai)) return;
    }
    if (sameZoneAIs.length > 0 && (ai.stealthRemain || 0) <= 0 && Math.random() < 0.45) {
      const targetOther = sameZoneAIs[Math.floor(Math.random() * sameZoneAIs.length)];
      aiStopRest(ai);
      simulateAIVsAICombat(ai, targetOther);
      aiCommitAction(ai);
      return;
    }

    const localHasNeed = !!(plan && plan.missingItems && plan.missingItems.some(needed =>
      (zone.drops || []).some(dropId => aiResolveItemId(dropId) === aiResolveItemId(needed))
    ));
    if (localHasNeed || Math.random() < 0.72) {
      const canFindUsefulItem = zone.drops && aiSelectDropIndex(ai, zone, plan) >= 0;
      if (ai.sp >= AI_SEARCH_SP_COST && canFindUsefulItem) {
        aiStopRest(ai);
        ai.sp -= AI_SEARCH_SP_COST;
        ai.aiSearchingUntilSec = state.timeSec + AI_ACTION_COOLDOWN_SEC;
        aiCommitAction(ai);
        ai.lastAIAction = "搜刮中";
        return;
      }
      // 缺乏搜刮體力就等待自然恢復／吃補品，不免費移動洗地圖。
      if (!canFindUsefulItem) {
        if (moveAIToSafeZone(ai, aiGetBestNeededDropZone(ai, plan))) aiCommitAction(ai);
      }
    } else {
      if (moveAIToSafeZone(ai, aiGetBestNeededDropZone(ai, plan))) aiCommitAction(ai);
    }
  });
}
