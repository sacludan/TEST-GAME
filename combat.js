/**
 * 【模組：戰鬥交鋒系統 combat.js】
 * v19.2：只有搜刮會觸發遭遇，不再有 NPC 突襲與自動反擊；保留技能反傷
 */

let combatActionBusy = false;

/**
 * V19 單一傷害規則（玩家／電腦共用）：
 * 攻擊 × 100 / (100 + 防禦×1.6) + 0~4，最低 6；
 * 技能穿透 40% 防禦，再依技能倍率放大；普攻爆擊率 25%、1.6 倍。
 */
function calculateCombatDamage(attacker, defender, options = {}) {
  const attack = Math.max(0, getTotalAtk(attacker));
  const defense = Math.max(0, getTotalDef(defender));
  const skill = !!options.skill;
  const variance = options.variance === undefined ? Math.floor(Math.random() * 5) : options.variance;
  const base = Math.max(6, Math.floor(attack * 100 / (100 + defense * (skill ? 0.96 : 1.6)) + variance));
  const multiplier = skill ? (options.multiplier ?? 1) : (options.crit ? 1.6 : 1);
  // 戰鬥熟練度只增加最終攻擊傷害，不更動基礎攻擊與裝備素質。
  const masteryMultiplier = 1 + (typeof getGrowthMastery === 'function' ? getGrowthMastery(attacker).bonusPercent : 0) / 100;
  return Math.max(6, Math.round(base * multiplier * masteryMultiplier));
}

function estimateAverageCombatDamage(attacker, defender) {
  const base = calculateCombatDamage(attacker, defender, { variance: 2 });
  return base * (0.75 + 0.25 * 1.6);
}

// V19.52：敵人肖像及六格裝備直接顯示在戰鬥面板，零等待動畫。
// 只在裝備有變化或切換敵人時重建格子，避免每秒重新載入圖片。
const COMBAT_EQUIPMENT_SLOTS = [
  { key:'weapon', label:'武器', icon:'⚔️' }, { key:'head', label:'頭部', icon:'🪖' },
  { key:'chest', label:'衣服', icon:'👕' }, { key:'arm', label:'手部', icon:'🧤' },
  { key:'leg', label:'腿部', icon:'👟' }, { key:'acc', label:'飾品', icon:'💍' }
];
const COMBAT_GEAR_COLORS = [null, '#64748b', '#10b981', '#38bdf8', '#fbbf24', '#fb7185'];
let previousCombatGearSignature = '';

function updateEnemyPortrait(ai) {
  const portrait = document.getElementById('enemy-portrait');
  const fallback = document.getElementById('enemy-portrait-placeholder');
  const caption = document.getElementById('enemy-portrait-caption');
  if (caption) caption.textContent = ai.name;
  if (!portrait) return;
  if (portrait.dataset.enemyId === ai.id) return;
  portrait.dataset.enemyId = ai.id;
  portrait.classList.add('hidden');
  if (fallback) fallback.classList.remove('hidden');
  const artPath = (typeof LobbyManager !== 'undefined' && LobbyManager.characterArtworkPaths)
    ? LobbyManager.characterArtworkPaths[ai.id] : null;
  if (!artPath) { portrait.removeAttribute('src'); return; }
  portrait.onload = () => {
    if (portrait.dataset.enemyId !== ai.id) return;
    if (portrait.naturalWidth) {
      portrait.classList.remove('hidden');
      fallback?.classList.add('hidden');
    }
  };
  portrait.onerror = () => {
    portrait.classList.add('hidden');
    fallback?.classList.remove('hidden');
  };
  portrait.src = artPath;
  // Complete cache-hit images might not dispatch another load event.
  if (portrait.complete && portrait.naturalWidth > 0) portrait.onload();
}

function renderEnemyEquipment(ai) {
  const grid = document.getElementById('enemy-gear-grid');
  if (!grid) return;
  const signature = ai.id + '|' + COMBAT_EQUIPMENT_SLOTS
    .map(slot => (ai.equip?.[slot.key]?.id || '-')).join('|');
  if (signature === previousCombatGearSignature && grid.children.length === 6) return;
  previousCombatGearSignature = signature;
  const fragment = document.createDocumentFragment();
  for (const slot of COMBAT_EQUIPMENT_SLOTS) {
    const item = ai.equip?.[slot.key] || null;
    const cell = document.createElement('div');
    cell.className = 'enemy-gear-cell';
    cell.style.borderColor = item ? COMBAT_GEAR_COLORS[Math.max(1, Math.min(5, Number(item.rarity) || 1))] : '#475569';
    cell.title = item ? `${slot.label}：${item.name}` : `${slot.label}：未裝備`;
    cell.setAttribute('aria-label', cell.title);
    const slotLabel = document.createElement('span');
    slotLabel.className = 'gear-slot-label';
    slotLabel.textContent = slot.label;
    cell.appendChild(slotLabel);
    if (item) {
      const source = typeof getItemArtUrl === 'function' ? getItemArtUrl(item.id) : '';
      if (source) {
        const img = document.createElement('img');
        img.className = 'gear-art';
        img.src = source;
        img.alt = item.name;
        img.loading = 'eager';
        img.decoding = 'async';
        img.draggable = false;
        img.onerror = () => img.remove();
        cell.appendChild(img);
      }
      const name = document.createElement('span');
      name.className = 'gear-name';
      name.textContent = item.name || '裝備';
      name.style.color = COMBAT_GEAR_COLORS[Math.max(1, Math.min(5, Number(item.rarity) || 1))];
      cell.appendChild(name);
    } else {
      const blankIcon = document.createElement('div');
      blankIcon.className = 'gear-icon';
      blankIcon.textContent = slot.icon;
      cell.appendChild(blankIcon);
    }
    fragment.appendChild(cell);
  }
  grid.replaceChildren(fragment);
}

// 飄字和光圈僅在命中時才出現，搜尋遭遇沒有動畫等待。
function renderCombatDamageFloat(container, value, isCrit = false, missed = false) {
  const layer = document.getElementById('enemy-hit-fx-layer') || container;
  if (!layer || typeof document === 'undefined') return;
  // 攻擊有時是三連擊，保留已播放中的飄字但限制同時存在數量。
  while (layer.querySelectorAll('.combat-damage-float').length >= 4) {
    layer.querySelector('.combat-damage-float')?.remove();
  }
  const tag = document.createElement('span');
  tag.className = 'combat-damage-float' + (isCrit ? ' critical' : '') + (missed ? ' missed' : '');
  tag.textContent = String(value);
  layer.appendChild(tag);
  tag.addEventListener('animationend', () => tag.remove(), { once: true });
  setTimeout(() => tag.remove(), 780);
  if (missed || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  const ring = document.createElement('span');
  ring.className = 'combat-hit-ring' + (isCrit ? ' critical' : '');
  layer.appendChild(ring);
  ring.addEventListener('animationend', () => ring.remove(), { once: true });
  setTimeout(() => ring.remove(), 500);
  const portrait = document.getElementById('enemy-portrait');
  if (portrait && !portrait.classList.contains('hidden')) {
    portrait.classList.remove('combat-target-jolt');
    void portrait.offsetWidth;
    portrait.classList.add('combat-target-jolt');
    setTimeout(() => portrait.classList.remove('combat-target-jolt'), 240);
  }
}


function startCombat(targetAI, initiatedByAI = false) {
  if (state.gameOver || !state.player || state.inCombat || !state.player.alive) return false;
  const enemy = targetAI || state.ai;
  if (!enemy || !enemy.alive || enemy.zone !== state.player.zone ||
      (initiatedByAI && enemy.stunRemain > 0) ||
      enemy.stealthRemain > 0 || state.player.stealthRemain > 0) return false;

  state.ai = enemy;
  if (typeof aiStopRest === "function") aiStopRest(enemy);
  if (state.player.isResting && typeof stopPlayerRest === 'function') stopPlayerRest('敵人突襲中斷休息！');
  // NPC 可以在玩家搜刮時突襲；取消當前搜刮進度，避免逃跑後免費完成原搜刮。
  if (initiatedByAI && state.isSearching) state.isSearching = false;
  state.inCombat = true;
  combatActionBusy = false;
  const encounterLabel = document.getElementById('combat-origin-label');
  if (encounterLabel) encounterLabel.textContent = initiatedByAI ? '🚨 敵人主動突襲！' : '! 搜刮遭遇 !';
  // 玩家主動搜刮發現敵人才會進入遭遇；不附贈任何一方的攻擊。
  addLog(`💥 【搜刮遭遇！】你發現了 ${enemy.name}，可以攻擊、施放技能或選擇無視！`, 'text-amber-300 font-bold');
  if (!state.gameOver) {
    updateUI();
    updateCombatUI();
  }
  return true;
}

function updateCombatUI() {
  if (!state.ai) return;
  const ai = state.ai;

  const enemyNameEl = document.getElementById("enemy-name");
  if (enemyNameEl) {
    const stunTag = ai.stunRemain > 0 ? ` (🎤定身 ${ai.stunRemain}s)` : "";
    enemyNameEl.textContent = `${ai.name}${stunTag}`;
  }

  const enemyStatsEl = document.getElementById("enemy-stats");
  if (enemyStatsEl) {
    enemyStatsEl.textContent = `攻擊 ${getTotalAtk(ai)} | 防禦 ${getTotalDef(ai)} • 被動:${ai.passive ? ai.passive.name : '無'}`;
  }

  // 外觀與裝備資訊不影響 NPC 戰鬥邏輯，也不會洩漏 NPC 背包材料。
  updateEnemyPortrait(ai);
  renderEnemyEquipment(ai);
  const levelEl = document.getElementById('enemy-level');
  if (levelEl && typeof getGrowthLevel === 'function') levelEl.textContent = `Lv.${getGrowthLevel(ai)}`;

  const enemyHpBar = document.getElementById("enemy-hp-bar");
  if (enemyHpBar) enemyHpBar.style.width = `${Math.max(0, (ai.hp / ai.maxHp) * 100)}%`;

  const enemyHpText = document.getElementById("enemy-hp-text");
  if (enemyHpText) enemyHpText.textContent = `HP: ${Math.max(0, ai.hp)}/${ai.maxHp}`;
}

function triggerCombatShake(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.classList.remove("animate-shake");
  void el.offsetWidth;
  el.classList.add("animate-shake");
  setTimeout(() => el.classList.remove("animate-shake"), 300);
}

// 供探索面板與戰鬥面板共用的主動技按鈕入口
function triggerPlayerSkillButton(e) {
  if (e) e.stopPropagation();
  if (state.gameOver || !state.player) return;

  if (state.player.id === "zhugouliang") {
    castNonCombatActiveSkill();
    if (state.inCombat) updateCombatUI();
    return;
  }
  if (state.inCombat) {
    executeCombatAction("skill");
  } else {
    castNonCombatActiveSkill();
  }
}

function canUsePlayerSkill(p) {
  if (!p) return false;
  if (p.stunRemain > 0) {
    addLog(`⛔ 你正處於定身狀態（剩餘 ${p.stunRemain} 秒），無法施放技能！`, "text-rose-400 font-bold");
    return false;
  }
  if (p.id === "wangshijian" && p.stealthRemain > 0) {
    addLog(`👻 【Over my dead body】正在持續中（剩餘 ${p.stealthRemain} 秒），結束後才開始算冷卻！`, "text-amber-300");
    return false;
  }
  if (p.skillCdRemain > 0) {
    addLog(`⏳ 技能【${p.skill.name}】冷卻中，還需 ${p.skillCdRemain} 秒！`, "text-amber-400");
    return false;
  }
  if (p.sp < p.skill.costSp) {
    addLog(`體力不足（需要 ${p.skill.costSp} 體力），無法施展【${p.skill.name}】！`, "text-rose-400 font-bold");
    return false;
  }
  return true;
}

// 蔣萬安【生生喝鮮乳】：所在區域全體回血，包含自己、其他 NPC 與敵對玩家。
// 只治療目前仍存活且 HP > 0 的角色，不復活淘汰者，也不超過最大生命。
// 玩家、NPC（非戰鬥／戰鬥）與平衡模擬共用這條路徑。
function healCharactersInZone(caster, amount = 30) {
  const result = { targets: 0, healedCharacters: 0, totalHealed: 0, casterHealed: 0 };
  if (!caster || !caster.zone || amount <= 0) return result;
  const entities = [caster, state.player, ...(Array.isArray(state.ais) ? state.ais : [])];
  const seen = new Set();
  for (const entity of entities) {
    if (!entity || seen.has(entity)) continue;
    seen.add(entity);
    if (!entity.alive || entity.hp <= 0 || entity.zone !== caster.zone) continue;
    result.targets++;
    const before = entity.hp;
    entity.hp = Math.min(entity.maxHp, entity.hp + amount);
    const gained = Math.max(0, entity.hp - before);
    if (gained > 0) result.healedCharacters++;
    result.totalHealed += gained;
    if (entity === caster) result.casterHealed = gained;
  }
  return result;
}

// 非戰鬥狀態下施放主動技（如：豬勾亮、韓國魚、王世間、蔣晚安、亞洲桶神）
function castNonCombatActiveSkill() {
  const p = state.player;
  if (!canUsePlayerSkill(p)) return;

  if (p.skill.combatOnly) {
    addLog(`⚠️ 【${p.skill.name}】屬於戰鬥技能，請先搜刮遭遇對手後再施放！`, "text-amber-400 font-bold");
    return;
  }

  p.sp -= p.skill.costSp;
  if (p.id !== "wangshijian") {
    p.skillCdRemain = p.skill.cd;
  }

  if (p.id === "zhugouliang") {
    startZoneSongShow(p);
    addLog(`🎤 <span class="text-purple-300 font-black">【歌廳秀】</span> 在【${getSafeCurrentZone(p.zone).name}】開秀 45 秒！其他角色搜刮 +1 秒；豬哥亮在本區造成傷害 +20%、受到戰鬥傷害 -10%，離開或效果結束即失效。`, 'text-purple-300 font-bold');
  } else if (p.id === "hanguoyu") {
    addLog(`💰 <span class="text-amber-300 font-black">【發大財！】</span> 韓國魚發動技能，一次連摸 3 件物資！`, "text-amber-300 font-bold");
    lootMultipleItemsForPlayer(3, 'all');
  } else if (p.id === "wangshijian") {
    p.stealthRemain = 12;
    addLog(`👻 <span class="text-sky-300 font-black">【Over my dead body】</span> 12 秒內不會被別人搜到也搜不到人，且【從從容容】讓搜刮時間縮短為 0.5 秒！`, "text-sky-300 font-bold");
  } else if (p.id === "jiangwanan") {
    const healed = healCharactersInZone(p, 30);
    addLog(`🥛 <span class="text-emerald-300 font-black">【生生喝鮮乳】</span> 所在區域全體恢復最多 30 HP（包含敵人），${healed.healedCharacters} 人實際恢復共 ${healed.totalHealed} HP！`, "text-emerald-300 font-bold");
  } else if (p.id === "yazhoutongshen") {
    p.reflectRemain = 8;
    p.reflectCharges = 2;
    addLog(`🛡️ <span class="text-amber-300 font-black">【乾你老師奈德麗】</span> 8 秒內減傷 50%，最多反彈 2 次原始傷害的 100%（次數用完仍減傷）！`, "text-amber-300 font-bold");
  }

  updateUI();
}

// 統一傷害結算（處理蔣晚安閃避、亞洲桶神反傷、科文哲受擊回血、陳阿館殘血開播）
/**
 * 玩家 / NPC 共用的傷害與被動結算。此函式不碰 DOM、不處理 UI。
 * 被擊倒的最終淘汰交由各自的戰鬥流程處理，避免 NPC 互毆誤開玩家面板。
 */
function resolveCombatHit(attacker, defender, rawDamage) {
  const result = { damage: 0, dodged: false, reflected: 0, heal: 0, guan: false };
  if (!attacker || !defender || !defender.alive || defender.hp <= 0) return result;
  // 問A答B：就緒時每次受擊有 70% 機率完全閃避。
  // 成功閃避開始 35 秒冷卻；失敗正常受傷且保留就緒狀態。
  if (defender.id === "jiangwanan" && balanceHasPassive(defender) && defender.dodgeReady) {
    if (Math.random() < 0.70) {
      defender.dodgeReady = false;
      defender.dodgeCdRemain = 35;
      result.dodged = true;
      return result;
    }
    // 判定失敗不重置就緒狀態，也不開始冷卻。
  }
  // 歌廳秀：僅施放者豬哥亮身處其開秀區域、效果有效時，戰鬥傷害 +20%／受傷 -10%。
  const songAttackBuff = isSongShowCasterBuffActive(attacker);
  const songDefenseBuff = isSongShowCasterBuffActive(defender);
  const originalHit = Math.max(6, Math.round(rawDamage));
  const rawHit = songAttackBuff ? Math.max(1, Math.round(originalHit * 1.2)) : originalHit;
  // 亞洲桶神：8 秒內承受攻擊傷害 -50%；僅前兩次有效命中反彈原始傷害。
  const shielding = defender.reflectRemain > 0;
  let damage = shielding ? Math.max(1, Math.round(rawHit * 0.5)) : rawHit;
  if (songDefenseBuff) damage = Math.max(1, Math.round(damage * 0.9));
  defender.hp = Math.max(0, defender.hp - damage);
  result.damage = damage;
  if (shielding && (defender.reflectCharges || 0) > 0) {
    defender.reflectCharges--;
    // 反彈也屬戰鬥傷害，若豬哥亮為反彈承受者且開秀增益有效，同樣減傷 10%。
    const reflectDamage = songAttackBuff ? Math.max(1, Math.round(rawHit * 0.9)) : rawHit;
    attacker.hp = Math.max(0, attacker.hp - reflectDamage);
    result.reflected = reflectDamage;
  }
  if (defender.id === "kewenzhe" && balanceHasPassive(defender) && defender.hp > 0) {
    defender.hitTakenCount = (defender.hitTakenCount || 0) + 1;
    if (defender.hitTakenCount >= 3) {
      defender.hitTakenCount = 0;
      result.heal = Math.min(12, defender.maxHp - defender.hp);
      defender.hp += result.heal;
    }
  }
  if (defender.id === "chenaguan" && balanceHasPassive(defender) && defender.hp > 0 &&
      defender.hp <= defender.maxHp * 0.35 && (defender.guanPassiveCd || 0) <= 0) {
    defender.guanPassiveCd = 40;
    defender.guanDefBuffRemain = 8;
    defender.hp = Math.min(defender.maxHp, defender.hp + 25);
    defender.sp = Math.min(defender.maxSp, defender.sp + 25);
    result.guan = true;
  }
  return result;
}

// 遭遇戰 UI 包裝；同一套結算供 NPC 對打呼叫 resolveCombatHit。
function applyDamageToTarget(attacker, defender, rawDamage, isCrit = false, label = "攻擊") {
  const enemyHpContainer = document.getElementById("enemy-hp-container");
  const result = resolveCombatHit(attacker, defender, rawDamage);
  if (result.dodged) {
    if (defender === state.ai && attacker === state.player) {
      try { renderCombatDamageFloat(enemyHpContainer, "MISS", false, true); } catch (err) { console.warn("Damage display failed:", err); }
    }
    addLog(`💨 【問A答B】${defender.name} 閃避了${label}！`, "text-sky-300 font-bold");
    return 0;
  }
  if (result.damage <= 0) return 0;
  // 只有對玩家顯示的敵人才播放大傷害飄字，NPC 互毆不會刷畫面。
  if (defender === state.ai && attacker === state.player) {
    triggerCombatShake("combat-panel");
    try { renderCombatDamageFloat(enemyHpContainer, `-${result.damage}`, isCrit); } catch (err) { console.warn("Damage display failed:", err); }
  }
  if (attacker === state.player && window.GameAudio?.playSfx) {
    window.GameAudio.playSfx('hit');
  }
  if (defender === state.player) {
    if (typeof triggerPlayerHitShake === 'function') triggerPlayerHitShake();
    if (window.GameAudio?.playSfx) window.GameAudio.playSfx('hurt');
  }
  if (result.reflected) {
    if (attacker === state.player) {
      if (typeof triggerPlayerHitShake === 'function') triggerPlayerHitShake();
      if (window.GameAudio?.playSfx) window.GameAudio.playSfx('hurt');
    }
    addLog(`🔄 【乾你老師奈德麗】${defender.name} 反彈 ${result.reflected} 傷害！`, "text-rose-400 font-bold");
    if (attacker.hp <= 0) handleUnitDefeat(attacker, defender);
  }
  if (result.heal) addLog(`💪 【我不會屈服的】${defender.name} 回復 ${result.heal} HP！`, "text-emerald-300");
  if (result.guan) addLog(`📹 【幫我開直播】${defender.name} 回復 25 HP/SP，8 秒防禦 +6！`, "text-amber-300");
  return result.damage;
}

function executeCombatAction(action) {
  if (state.gameOver || !state.inCombat || !state.player || !state.ai || combatActionBusy) return;

  const p = state.player;
  const ai = state.ai;

  // 「無視」只關閉遭遇，不屬於移動或施法；定身時也能關閉，
  // 但身上的定身狀態不會因此清除。
  // 1. 選擇【無視】：只結束這次交鋒，不瞬移、不消耗 SP。
  // 無視沒有冷卻或保護期；下一次搜刮仍可再次遭遇同一名 NPC。
  if (action === "ignore" || action === "flee") {
    combatActionBusy = true;
    addLog(`🙈 你選擇無視 ${ai.name}，留在原地繼續探索。你仍可能再次遭遇敵人。`, 'text-sky-300');
    finishCombatTurn();
    return;
  }

  if (p.stunRemain > 0) {
    addLog(`⛔ 你正處於定身狀態，無法執行操作！`, "text-rose-400 font-bold");
    return;
  }

  // 2. 選擇【攻擊】（單向打擊）
  if (action === "attack") {
    combatActionBusy = true;
    const isCrit = Math.random() < 0.25;
    const rawDmg = calculateCombatDamage(p, ai, { crit: isCrit });

    const dealt = applyDamageToTarget(p, ai, rawDmg, isCrit, "普通攻擊");
    if (dealt > 0) {
      grantCombatHitGrowth(p, ai, false);
      if (isCrit) {
        addLog(`🔥 【爆擊重創！】你搶先出手痛擊 ${ai.name}，造成 <span class="text-amber-300 font-black">${dealt}</span> 點傷害！`, "text-amber-400 font-bold");
      } else {
        addLog(`你出拳擊中 ${ai.name}，造成 <span class="text-amber-300 font-bold">${dealt}</span> 點傷害！`, "text-amber-200");
      }
    }
  }

  // 3. 選擇【技能】；豬勾亮開秀不佔此次戰鬥行動。
  if (action === "skill") {
    if (p.id === "zhugouliang") {
      castNonCombatActiveSkill();
      if (state.inCombat) updateCombatUI();
      return;
    }
    if (!canUsePlayerSkill(p)) return;
    combatActionBusy = true;

    p.sp -= p.skill.costSp;
    if (p.id !== "wangshijian") {
      p.skillCdRemain = p.skill.cd;
    }

    const baseDmg = calculateCombatDamage(p, ai, { skill: true });
    const targetHpBeforeSkill = ai.hp;

    switch (p.id) {
      case "hanguoyu": {
        addLog(`💰 <span class="text-amber-300 font-black">【發大財！】</span> 一次搜出 3 個道具！`, "text-amber-300 font-bold");
        lootMultipleItemsForPlayer(3, 'all');
        break;
      }
      case "kewenzhe": {
        const missingRatio = 1 - (p.hp / p.maxHp);
        const mult = +(1 + missingRatio).toFixed(2);
        const dmg = applyDamageToTarget(p, ai, baseDmg * mult, true, "飛輪衝撞");
        addLog(`🚲 <span class="text-purple-300 font-black">【飛輪衝撞】</span> 依當前血量觸發 ${mult} 倍威力，對 ${ai.name} 造成 <span class="text-amber-300 font-black">${dmg}</span> 點傷害！`, "text-purple-300 font-bold");
        break;
      }
      case "laixiangde": {
        const dmg = applyDamageToTarget(p, ai, baseDmg * 1.0, false, "打掉雜質");
        if (balanceHasPassive(p)) p.gongdeStacks = Math.min(15, (p.gongdeStacks || 0) + 3);
        addLog(`🧹 <span class="text-purple-300 font-black">【打掉雜質】</span> 對 ${ai.name} 造成 ${dmg} 點傷害！【做功德】累積功德值：${p.gongdeStacks}/15（攻擊力 +${p.gongdeStacks}）！`, "text-purple-300 font-bold");

        if (ai.hp > 0) {
          const safeZones = getSafeZones().filter(z =>
            z.id !== ai.zone &&
            !state.closedZones.includes(z.id) &&
            !state.pendingCloseZones.includes(z.id)
          );
          if (safeZones.length > 0) {
            const dest = safeZones[Math.floor(Math.random() * safeZones.length)];
            ai.zone = dest.id;

            addLog(`💨 ${ai.name} 被成功打離此地圖，飛往了【${dest.name}】！`, "text-sky-300 font-bold");
          } else {
            addLog(`💨 ${ai.name} 被震退脫離戰鬥！`, "text-sky-300 font-bold");
          }
        }
        break;
      }
      case "chenaguan": {
        let totalDealt = 0;
        for (let i = 1; i <= 3; i++) {
          if (ai.hp > 0) {
            totalDealt += applyDamageToTarget(p, ai, baseDmg * 0.75, true, `三槍(第${i}發)`);
          }
        }
        p.weakenedRemain = 15;
        addLog(`🔫 <span class="text-purple-300 font-black">【三槍】</span> 每槍 75% 傷害，3 槍共造成 <span class="text-amber-300 font-black">${totalDealt}</span> 點傷害！（接下來 15 秒攻擊力減半）`, "text-purple-300 font-bold");
        break;
      }
      case "yazhoutongshen": {
        p.reflectRemain = 8;
        p.reflectCharges = 2;
        addLog(`🛡️ <span class="text-amber-300 font-black">【乾你老師奈德麗】</span> 8 秒內減傷 50%，最多反彈 2 次原始傷害的 100%（次數用完仍減傷）！`, "text-amber-300 font-bold");
        break;
      }
      case "chaoge": {
        const dmg = applyDamageToTarget(p, ai, baseDmg * 1.5, true, "超派鐵拳");
        addLog(`👊 <span class="text-purple-300 font-black">【超派鐵拳】</span> 轟出 1.5 倍重拳，對 ${ai.name} 造成 <span class="text-amber-300 font-black">${dmg}</span> 點傷害！`, "text-purple-300 font-bold");
        break;
      }
      case "wangshijian": {
        p.stealthRemain = 12;
        addLog(`👻 <span class="text-sky-300 font-black">【Over my dead body】</span> 進入 12 秒雙向隱蔽狀態，搜刮時間縮短為 0.5 秒！`, "text-sky-300 font-bold");
        break;
      }
      case "jiangwanan": {
        const healed = healCharactersInZone(p, 30);
        addLog(`🥛 <span class="text-emerald-300 font-black">【生生喝鮮乳】</span> 區域全體（含敵人）恢復最多 30 HP，${healed.healedCharacters} 人實際恢復共 ${healed.totalHealed} HP！`, "text-emerald-300 font-bold");
        break;
      }
    }
    // 多段攻擊一整次施法只給一次熟練收益；非傷害技能不刷戰鬥 EXP。
    if (ai.hp < targetHpBeforeSkill) grantCombatHitGrowth(p, ai, true);
  }

  // 傷害反彈可能已經讓玩家陣亡，避免同一回合繼續結算。
  if (state.gameOver) return;

  // 檢查敵人是否被擊倒（含豬勾亮【豬大哥沒死】判定）
  if (ai.hp <= 0) {
    handleUnitDefeat(ai, p);
    return;
  }

  // 被反傷擊倒時，死亡流程已處理完畢，不能再繼續此回合。
  if (state.gameOver || !state.inCombat) return;

  // 不設自動反擊：一次遭遇只有玩家自己選的那一下。
  // 角色主動反傷技能仍保留，那是技能效果，不是遭遇反擊。
  updateCombatUI();
  setTimeout(() => { if (state.inCombat && state.ai === ai) finishCombatTurn(); }, 400);
}

function handleUnitDefeat(victim, killer) {
  // 豬勾亮被動【豬大哥沒死】：恢復 30% 血量並瞬移到其他區域
  if (victim.id === "zhugouliang" && balanceHasPassive(victim) && !victim.pigReviveUsed) {
    victim.pigReviveUsed = true;
    victim.hp = Math.max(1, Math.round(victim.maxHp * 0.3));

    const openZones = getSafeZones().filter(z => !state.closedZones.includes(z.id) && z.id !== victim.zone);
    const dest = openZones.length > 0 ? openZones[Math.floor(Math.random() * openZones.length)] : getSafeCurrentZone(victim.zone);
    victim.zone = dest.id;

    addLog(`✨ <span class="text-amber-300 font-black">【豬大哥沒死】</span> ${victim.name} 發動免死被動！恢復 30% 生命值 (${victim.hp} HP) 並瞬移至【${dest.name}】！`, "text-amber-300 font-bold");
    finishCombatTurn();
    return;
  }

  victim.hp = 0;
  victim.alive = false;
  grantEliminationGrowth(killer, victim);

  if (victim === state.player) {
    state.inCombat = false;
    combatActionBusy = false;
    addLog(`💀 【陣亡】你遭到 ${killer ? killer.name : '禁區'} 擊敗，不幸陣亡...`, "text-rose-500 font-black");
    updateUI();
    triggerGameOver(false, `你在【${getSafeCurrentZone(victim.zone).name}】遭到淘汰。`);
    return;
  }

  const remainAIs = state.ais.filter(a => a.alive);
  addLog(`🏆 【淘汰對手】你成功擊倒了 【${victim.name}】！（剩餘對手：${remainAIs.length} 人）`, "text-amber-400 font-black");

  if (remainAIs.length === 0) {
    state.inCombat = false;
    combatActionBusy = false;
    updateUI();
    triggerGameOver(true, `你成功擊潰了場上所有對手，制霸台灣生存戰！`);
  } else if (state.inCombat && state.ai === victim) {
    // 這隻 NPC 已確實淘汰，立刻解除遭遇狀態，不讓 0 HP 面板卡住。
    finishCombatTurn();
  }
}

function finishCombatTurn() {
  if (!state.inCombat) {
    combatActionBusy = false;
    return;
  }
  state.inCombat = false;
  state.ai = null;
  combatActionBusy = false;
  previousCombatGearSignature = '';
  const layer = document.getElementById('enemy-hit-fx-layer');
  if (layer) layer.replaceChildren();
  updateUI();
}
