/**
 * 【模組：戰鬥交鋒系統 combat.js】
 * v58：完整支援 9 大角色主動技、被動技、單向交鋒與通用技能施放
 */

let combatActionBusy = false;

// 主程式沒有提供傷害飄字函式；補上並保持純顯示效果，
// 即使動畫容器不存在，也不能中斷扣血和結束戰鬥的流程。
function spawnFloatingDamage(container, value, isCrit = false) {
  if (!container || typeof document === "undefined") return;
  const tag = document.createElement("span");
  tag.className = `floating-dmg-tag ${isCrit ? "text-amber-300 text-lg" : "text-white text-base"}`;
  tag.textContent = String(value);
  tag.style.left = "50%";
  tag.style.top = "-10px";
  tag.style.transform = "translateX(-50%)";
  container.appendChild(tag);
  setTimeout(() => tag.remove(), 800);
}


function startCombat(targetAI) {
  if (state.gameOver || !state.player) return;
  const enemy = targetAI || state.ai;
  if (!enemy || !enemy.alive) return;

  state.ai = enemy;
  state.inCombat = true;
  combatActionBusy = false;
  addLog(`💥 <span class="text-amber-400 font-bold">【搜刮遭遇！】</span> 你發現了 【${enemy.name}】，可主動發動一次打擊！`, "text-amber-300 font-bold");
  updateUI();
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

// 非戰鬥狀態下施放主動技（如：韓國魚、王世間、蔣晚安、亞洲桶神）
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

  if (p.id === "hanguoyu") {
    addLog(`💰 <span class="text-amber-300 font-black">【發大財！】</span> 韓國魚發動技能，一次連摸 3 件物資！`, "text-amber-300 font-bold");
    lootMultipleItemsForPlayer(3);
  } else if (p.id === "wangshijian") {
    p.stealthRemain = 12;
    addLog(`👻 <span class="text-sky-300 font-black">【Over my dead body】</span> 12 秒內不會被別人搜到也搜不到人，且【從從容容】使搜刮速度變 1.5 倍！`, "text-sky-300 font-bold");
  } else if (p.id === "jiangwanan") {
    p.hp = Math.min(p.maxHp, p.hp + 20);
    p.milkDefBuffRemain = 10;
    addLog(`🥛 <span class="text-emerald-300 font-black">【生生喝鮮乳】</span> 立即恢復 20 HP，並獲得 10 秒防禦力 +5！`, "text-emerald-300 font-bold");
  } else if (p.id === "yazhoutongshen") {
    p.reflectRemain = 3;
    addLog(`🛡️ <span class="text-amber-300 font-black">【乾你老師奈德麗】</span> 接下來 3 秒內受到的所有傷害將 100% 反彈！`, "text-amber-300 font-bold");
  }

  updateUI();
}

// 統一傷害結算（處理蔣晚安閃避、亞洲桶神反傷、科文哲受擊回血、陳阿館殘血開播）
function applyDamageToTarget(attacker, defender, rawDamage, isCrit = false, label = "攻擊") {
  const enemyHpContainer = document.getElementById("enemy-hp-container");

  // 1. 蔣晚安【問A答B】：自動閃躲下一次攻擊
  if (defender.id === "jiangwanan" && defender.dodgeReady) {
    defender.dodgeReady = false;
    defender.dodgeCdRemain = 20;
    spawnFloatingDamage(enemyHpContainer, "MISS", false);
    addLog(`💨 <span class="text-sky-400 font-bold">【問A答B】</span> ${defender.name} 自動閃躲了你的 ${label}！（傷害 0）`, "text-sky-300 font-bold");
    return 0;
  }

  const finalDmg = Math.max(4, Math.round(rawDamage));
  defender.hp = Math.max(0, defender.hp - finalDmg);

  triggerCombatShake("combat-panel");
  spawnFloatingDamage(enemyHpContainer, `-${finalDmg}`, isCrit);

  // 2. 亞洲桶神【乾你老師奈德麗】反傷
  if (defender.reflectRemain > 0) {
    attacker.hp = Math.max(0, attacker.hp - finalDmg);
    addLog(`🔄 <span class="text-amber-300 font-bold">【乾你老師奈德麗】</span> ${defender.name} 將 ${finalDmg} 點傷害全數反彈給你！`, "text-rose-400 font-bold");
    if (attacker.hp <= 0) {
      handleUnitDefeat(attacker, defender);
    }
  }

  // 3. 科文哲【我不會屈服的】：每受擊 3 次回 12 HP
  if (defender.id === "kewenzhe" && defender.hp > 0) {
    defender.hitTakenCount = (defender.hitTakenCount || 0) + 1;
    if (defender.hitTakenCount >= 3) {
      defender.hitTakenCount = 0;
      defender.hp = Math.min(defender.maxHp, defender.hp + 12);
      addLog(`💪 <span class="text-emerald-400 font-bold">【我不會屈服的】</span> ${defender.name} 累計挨打 3 次，恢復 12 點生命值！`, "text-emerald-300");
    }
  }

  // 4. 陳阿館【幫我開直播】：低於 35% HP 恢復 25 HP/SP + 防禦+6
  if (defender.id === "chenaguan" && defender.hp > 0 && defender.hp <= defender.maxHp * 0.35 && (defender.guanPassiveCd || 0) <= 0) {
    defender.guanPassiveCd = 40;
    defender.guanDefBuffRemain = 8;
    defender.hp = Math.min(defender.maxHp, defender.hp + 25);
    defender.sp = Math.min(defender.maxSp, defender.sp + 25);
    addLog(`📹 <span class="text-amber-300 font-bold">【幫我開直播】</span> ${defender.name} 觸發被動，恢復 25 HP/SP 並獲得 8 秒防禦 +6！`, "text-amber-300");
  }

  return finalDmg;
}

function executeCombatAction(action) {
  if (state.gameOver || !state.inCombat || !state.player || !state.ai || combatActionBusy) return;

  const p = state.player;
  const ai = state.ai;

  if (p.stunRemain > 0) {
    addLog(`⛔ 你正處於定身狀態，無法執行操作！`, "text-rose-400 font-bold");
    return;
  }

  // 1. 選擇【撤退】
  if (action === "flee") {
    combatActionBusy = true;
    addLog(`🏃 你選擇不驚動對手，悄悄退回搜刮！`, "text-sky-300");
    finishCombatTurn();
    return;
  }

  // 2. 選擇【攻擊】（單向打擊）
  if (action === "attack") {
    combatActionBusy = true;
    const pAtk = getTotalAtk(p);
    const aiDef = getTotalDef(ai);
    const isCrit = Math.random() < 0.25;
    const baseDmg = Math.max(6, pAtk - aiDef + Math.floor(Math.random() * 5));
    const rawDmg = isCrit ? Math.floor(baseDmg * 1.6) : baseDmg;

    const dealt = applyDamageToTarget(p, ai, rawDmg, isCrit, "普通攻擊");
    if (dealt > 0) {
      if (isCrit) {
        addLog(`🔥 【爆擊重創！】你搶先出手痛擊 ${ai.name}，造成 <span class="text-amber-300 font-black">${dealt}</span> 點傷害！`, "text-amber-400 font-bold");
      } else {
        addLog(`你出拳擊中 ${ai.name}，造成 <span class="text-amber-300 font-bold">${dealt}</span> 點傷害！`, "text-amber-200");
      }
    }
  }

  // 3. 選擇【技能】
  if (action === "skill") {
    if (!canUsePlayerSkill(p)) return;
    combatActionBusy = true;

    p.sp -= p.skill.costSp;
    if (p.id !== "wangshijian") {
      p.skillCdRemain = p.skill.cd;
    }

    const pAtk = getTotalAtk(p);
    const aiDef = getTotalDef(ai);
    const baseDmg = Math.max(6, pAtk - Math.floor(aiDef * 0.6));

    switch (p.id) {
      case "zhugouliang": {
        ai.stunRemain = 5;
        triggerCombatShake("combat-panel");
        addLog(`🎤 <span class="text-purple-300 font-black">【歌廳秀】</span> 豬勾亮開秀！強制讓 ${ai.name} 站在原地 5 秒無法進行任何操作！`, "text-purple-300 font-bold");
        break;
      }
      case "hanguoyu": {
        addLog(`💰 <span class="text-amber-300 font-black">【發大財！】</span> 一次搜出 3 個道具！`, "text-amber-300 font-bold");
        lootMultipleItemsForPlayer(3);
        break;
      }
      case "kewenzhe": {
        const missingRatio = 1 - (p.hp / p.maxHp);
        const mult = +(1.5 + 0.5 * missingRatio).toFixed(2);
        const dmg = applyDamageToTarget(p, ai, baseDmg * mult, true, "飛輪衝撞");
        addLog(`🚲 <span class="text-purple-300 font-black">【飛輪衝撞】</span> 依當前血量觸發 ${mult} 倍威力，對 ${ai.name} 造成 <span class="text-amber-300 font-black">${dmg}</span> 點傷害！`, "text-purple-300 font-bold");
        break;
      }
      case "laixiangde": {
        const dmg = applyDamageToTarget(p, ai, baseDmg * 1.0, false, "打掉雜質");
        if (p.meritCount < 10) {
          p.meritCount = (p.meritCount || 0) + 1;
        }
        addLog(`🧹 <span class="text-purple-300 font-black">【打掉雜質】</span> 對 ${ai.name} 造成 ${dmg} 點傷害！【做功德】累積功德值：${p.meritCount}/10（攻擊力 +${p.meritCount}）！`, "text-purple-300 font-bold");

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
            totalDealt += applyDamageToTarget(p, ai, baseDmg, true, `三槍(第${i}發)`);
          }
        }
        p.weakRemain = 10;
        addLog(`🔫 <span class="text-purple-300 font-black">【三槍】</span> 連續攻擊 3 次共造成 <span class="text-amber-300 font-black">${totalDealt}</span> 點傷害！（接下來 10 秒攻擊力減半）`, "text-purple-300 font-bold");
        break;
      }
      case "yazhoutongshen": {
        p.reflectRemain = 3;
        addLog(`🛡️ <span class="text-amber-300 font-black">【乾你老師奈德麗】</span> 接下來 3 秒內受到的所有傷害將 100% 反彈！`, "text-amber-300 font-bold");
        break;
      }
      case "chaoge": {
        const dmg = applyDamageToTarget(p, ai, baseDmg * 1.5, true, "超派鐵拳");
        addLog(`👊 <span class="text-purple-300 font-black">【超派鐵拳】</span> 轟出 1.5 倍重拳，對 ${ai.name} 造成 <span class="text-amber-300 font-black">${dmg}</span> 點傷害！`, "text-purple-300 font-bold");
        break;
      }
      case "wangshijian": {
        p.stealthRemain = 12;
        addLog(`👻 <span class="text-sky-300 font-black">【Over my dead body】</span> 進入 12 秒雙向隱蔽狀態，搜刮速度提升為 1.5 倍！`, "text-sky-300 font-bold");
        break;
      }
      case "jiangwanan": {
        p.hp = Math.min(p.maxHp, p.hp + 20);
        p.milkDefBuffRemain = 10;
        addLog(`🥛 <span class="text-emerald-300 font-black">【生生喝鮮乳】</span> 恢復 20 點生命值，且 10 秒內防禦力 +5！`, "text-emerald-300 font-bold");
        break;
      }
    }
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

  updateCombatUI();

  // 單向攻擊完畢後退回搜刮主畫面
  setTimeout(() => {
    finishCombatTurn();
  }, 550);
}

function handleUnitDefeat(victim, killer) {
  // 豬勾亮被動【豬大哥沒死】：恢復 20% 血量並瞬移到其他區域
  if (victim.id === "zhugouliang" && !victim.pigReviveUsed) {
    victim.pigReviveUsed = true;
    victim.hp = Math.max(1, Math.round(victim.maxHp * 0.2));

    const openZones = getSafeZones().filter(z => !state.closedZones.includes(z.id) && z.id !== victim.zone);
    const dest = openZones.length > 0 ? openZones[Math.floor(Math.random() * openZones.length)] : getSafeCurrentZone(victim.zone);
    victim.zone = dest.id;

    addLog(`✨ <span class="text-amber-300 font-black">【豬大哥沒死】</span> ${victim.name} 發動免死被動！恢復 20% 生命值 (${victim.hp} HP) 並瞬移至【${dest.name}】！`, "text-amber-300 font-bold");
    if (victim !== state.player && typeof checkHanguoyuRadar === "function") {
      checkHanguoyuRadar(victim, dest.id);
    }
    finishCombatTurn();
    return;
  }

  victim.hp = 0;
  victim.alive = false;

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
  updateUI();
}
