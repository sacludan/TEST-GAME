/**
 * 《台灣生存戰》V19.18：角色等級 + 統一戰鬥熟練度。
 * 玩家與 AI 共用同一套成長公式；等級加成與裝備加成獨立計算。
 */
const GROWTH_LEVEL_THRESHOLDS = Object.freeze([0, 4, 9, 15, 22, 30, 39, 49, 60, 72, 85, 99, 114, 130, 147, 165, 184, 204]);
const GROWTH_MASTERY_THRESHOLDS = Object.freeze([0, 4, 12, 24, 40, 62, 90, 126]);
const GROWTH_MASTERY_RANKS = Object.freeze(['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS']);
const GROWTH_MASTERY_BONUSES = Object.freeze([0, 3, 6, 10, 15, 21, 28, 35]);

function growthTierFromExp(exp, thresholds) {
  const total = Math.max(0, Number(exp) || 0);
  let tier = 0;
  for (let i = 1; i < thresholds.length; i++) {
    if (total < thresholds[i]) break;
    tier = i;
  }
  return tier;
}

function getGrowthLevel(entity) {
  return growthTierFromExp(entity?.levelExp, GROWTH_LEVEL_THRESHOLDS) + 1;
}

function getGrowthLevelBonus(entity) {
  const completed = getGrowthLevel(entity) - 1;
  return { hp: completed * 2, sp: 0, atk: Math.floor(completed / 2), def: Math.floor(completed / 3) };
}

function getGrowthMastery(entity) {
  const index = growthTierFromExp(entity?.masteryExp, GROWTH_MASTERY_THRESHOLDS);
  return { index, rank: GROWTH_MASTERY_RANKS[index], bonusPercent: GROWTH_MASTERY_BONUSES[index] };
}

function getGrowthProgress(exp, thresholds) {
  const total = Math.max(0, Number(exp) || 0);
  const index = growthTierFromExp(total, thresholds);
  const maxed = index >= thresholds.length - 1;
  const start = thresholds[index];
  const need = maxed ? 0 : thresholds[index + 1] - start;
  const current = maxed ? 0 : total - start;
  return { index, maxed, current, need, percent: maxed ? 100 : Math.min(100, current / need * 100), total };
}

function grantGrowthExperience(entity, amount, reason = '') {
  if (!entity || !entity.alive || !(amount > 0)) return false;
  const oldLevel = getGrowthLevel(entity);
  const oldBonus = getGrowthLevelBonus(entity);
  entity.levelExp = Math.max(0, (Number(entity.levelExp) || 0) + Math.floor(amount));
  const newLevel = getGrowthLevel(entity);
  if (newLevel > oldLevel) {
    const bonus = getGrowthLevelBonus(entity);
    entity.maxHp += bonus.hp - oldBonus.hp;
    entity.maxSp += bonus.sp - oldBonus.sp;
    entity.baseAtk += bonus.atk - oldBonus.atk;
    entity.baseDef += bonus.def - oldBonus.def;
    // 升級只增加最大 HP，不會憑空把當前血量補滿。
    if (entity.isPlayer && typeof addLog === 'function') {
      addLog(`🌟 LEVEL UP！Lv.${oldLevel} → Lv.${newLevel}｜累積：生命 +${bonus.hp}、攻擊 +${bonus.atk}、防禦 +${bonus.def}`, 'text-sky-300 font-black');
    }
  }
  if (entity.isPlayer && reason && typeof addLog === 'function') {
    addLog(`📘 ${reason}：角色 EXP +${Math.floor(amount)}`, 'text-sky-300');
  }
  return newLevel > oldLevel;
}

function grantGrowthMastery(entity, amount) {
  if (!entity || !entity.alive || !(amount > 0)) return false;
  const before = getGrowthMastery(entity);
  entity.masteryExp = Math.max(0, (Number(entity.masteryExp) || 0) + Math.floor(amount));
  const after = getGrowthMastery(entity);
  if (entity.isPlayer && after.index > before.index && typeof addLog === 'function') {
    addLog(`⚔️ 戰鬥熟練度 ${before.rank} → ${after.rank}！傷害加成 +${after.bonusPercent}%`, 'text-amber-300 font-black');
  }
  return after.index > before.index;
}

// 韓國魚【愛情摩天輪】：普通搜刮、技能搜刮、合成都以實際成功獲得為準。
// 僅加倍角色 EXP，不加倍戰鬥熟練度、擊殺或命中經驗。
function hasHanguoyuExpPassive(entity) {
  return entity?.id === 'hanguoyu' && typeof balanceHasPassive === 'function' && balanceHasPassive(entity);
}

function grantSearchGrowth(entity) {
  const exp = hasHanguoyuExpPassive(entity) ? 2 : 1;
  return grantGrowthExperience(entity, exp, entity?.isPlayer ? '有效搜刮' : '');
}

function grantCraftGrowth(entity, item) {
  if (!item) return false;
  const rarity = Math.max(1, Math.min(5, Number(item.rarity) || 1));
  const exp = (rarity <= 2 ? 1 : rarity - 1) * (hasHanguoyuExpPassive(entity) ? 2 : 1);
  return grantGrowthExperience(entity, exp, entity?.isPlayer ? '合成' : '');
}

function grantCombatHitGrowth(attacker, defender, usedSkill = false) {
  if (!attacker || !defender || !attacker.alive) return false;
  grantGrowthExperience(attacker, 2);
  grantGrowthMastery(attacker, usedSkill ? 3 : 2);
  if (attacker.isPlayer && typeof addLog === 'function') {
    addLog(`📈 命中獎勵：角色 EXP +2｜戰鬥熟練 +${usedSkill ? 3 : 2}`, 'text-emerald-300');
  }
  return true;
}

function grantEliminationGrowth(killer, victim) {
  if (!victim || victim.growthKillRewarded || victim.alive || victim.hp > 0) return false;
  victim.growthKillRewarded = true;
  if (!killer || killer === victim) return false;
  killer.killCount = (killer.killCount || 0) + 1;
  // 同歸於盡時不暫時改寫 alive 狀態；存活的擊殺者才獲得成長收益。
  if (killer.alive) {
    grantGrowthExperience(killer, 5, killer.isPlayer ? '擊殺' : '');
    grantGrowthMastery(killer, 5);
  }
  return true;
}
