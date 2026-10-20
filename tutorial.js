/* 台北倖存者 V19.59 — 劇情教學完整版：淡水 → 三重 → 立法院 → 神秘通訊。 */
(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  const tutorial = {
    active: false,
    step: 'off',
    enemy: null,
    finalEnemy: null,
    _blackoutTimer: null,
    lineIndex: 0,
    lines: [],
    onDialogueFinished: null,
    currentHint: '',
    focused: null,
    _searching: false,

    start() {
      this.active = true;
      this.step = 'blink';
      this.finalEnemy = null;
      clearTimeout(this._blackoutTimer);
      this.enemy = createCharacterEntity('yazhoutongshen', false, 'sanchong');
      this.enemy.equip.acc = { ...getSafeItem('party_card'), id: 'party_card' };
      this.enemy.bag = ['rusty_nail'];
      this.enemy.reflectRemain = 0;
      this.enemy.reflectCharges = 0;
      state.ais = [this.enemy];
      // 不讓任何隨機計時、NPC AI 或禁區倒數打亂教學進度。
      DEV_CONFIG.enableNPC = false;
      DEV_CONFIG.enableShrink = false;
      if (mainTimer) { clearInterval(mainTimer); mainTimer = null; }
      state.player.zone = 'tamsui';
      state.player.hp = Math.max(1, state.player.maxHp - 32); // 讓豆腐的回血效果可被看見。
      state.player.bag = [];
      state.player.equip.weapon = null;
      state.player.isResting = false;
      updateUI();
      $('tutorial-hint')?.classList.add('hidden');
      $('tutorial-blink')?.classList.remove('hidden');
      delay(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ? 1250 : 2300).then(() => {
        if (!this.active) return;
        $('tutorial-blink')?.classList.add('hidden');
        this.say([
          '奇怪…我怎麼在這…頭好痛….',
          '這裡是淡水老街…有點餓了…先找個食物吃吧。'
        ], () => this.promptSearch('stool'));
      });
    },

    say(lines, next) {
      this.step = 'dialogue';
      this.removeFocus();
      this.lines = Array.isArray(lines) ? lines : [lines];
      this.lineIndex = 0;
      this.onDialogueFinished = next;
      $('tutorial-hint')?.classList.add('hidden');
      $('tutorial-dialog')?.classList.remove('hidden');
      this.drawLine();
    },
    drawLine() {
      if ($('tutorial-dialog-text')) $('tutorial-dialog-text').textContent = this.lines[this.lineIndex] || '';
      if ($('tutorial-dialog-count')) $('tutorial-dialog-count').textContent = `${this.lineIndex + 1}/${this.lines.length}`;
      if ($('tutorial-dialog-next')) $('tutorial-dialog-next').textContent = this.lineIndex === this.lines.length - 1 ? '我知道了 ▶' : '繼續 ▶';
    },
    nextDialogue() {
      if (!this.active || this.step !== 'dialogue') return;
      if (++this.lineIndex < this.lines.length) { this.drawLine(); return; }
      $('tutorial-dialog')?.classList.add('hidden');
      const next = this.onDialogueFinished;
      this.onDialogueFinished = null;
      if (next) next();
    },

    removeFocus() {
      if (this.focused) this.focused.classList.remove('tutorial-focus');
      this.focused = null;
      document.querySelectorAll('.tutorial-focus').forEach(el => el.classList.remove('tutorial-focus'));
    },
    guide(hint, element) {
      this.removeFocus();
      this.currentHint = hint;
      if ($('tutorial-hint')) {
        $('tutorial-hint').textContent = '👉 ' + hint;
        $('tutorial-hint').classList.remove('hidden');
      }
      if (element) {
        this.focused = typeof element === 'string' ? document.querySelector(element) : element;
        this.focused?.classList.add('tutorial-focus');
      }
    },
    remind() {
      const hint = $('tutorial-hint');
      if (hint && !hint.classList.contains('hidden')) {
        hint.animate?.([{ transform:'translateX(-50%) scale(1)' },{transform:'translateX(-50%) scale(1.04)'},{transform:'translateX(-50%) scale(1)'}],{duration:230});
      }
    },

    promptSearch(which) {
      this.step = which === 'stool' ? 'search_stool'
        : which === 'tofu' ? 'search_tofu'
        : which === 'lai' ? 'search_lai' : 'search_enemy';
      this.guide('點擊畫面中的搜刮區域。', '#explore-panel');
    },
    async scriptedSearch(which) {
      if (this._searching) return;
      this._searching = true;
      this.step = 'search_progress';
      this.removeFocus();
      this.guide('正在搜刮中，請稍候……');
      const prompt = $('search-prompt-text');
      const progress = $('search-progress-box');
      const bar = $('search-progress-bar');
      if (prompt) { prompt.textContent = '🔍 搜刮中…'; prompt.classList.remove('hidden'); }
      progress?.classList.remove('hidden');
      if (bar) { bar.style.transition = 'none'; bar.style.transform = 'scaleX(0)'; void bar.offsetWidth; bar.style.transition = 'transform 1.5s linear'; bar.style.transform = 'scaleX(1)'; }
      window.GameAudio?.playSfx?.('search');
      await delay(1500);
      if (!this.active) return;
      this._searching = false;
      if (prompt) prompt.classList.add('hidden');
      progress?.classList.add('hidden');
      if (bar) { bar.style.transition = 'none'; bar.style.transform = 'scaleX(0)'; }
      if (which === 'enemy' || which === 'lai') {
        // 兩場劇情指定遭遇：不使用隨機碰面，也不讓 NPC 自行決策。
        const target = which === 'lai' ? this.finalEnemy : this.enemy;
        if (target && startCombat(target)) {
          if (which === 'lai') {
            this.say('就是你嗎…讓這世界混亂的傢伙！', () => {
              this.storyHitToHp(1);
              this.say([
                '啊啊啊啊 幫我開直播！！',
                '不行，現在不是說這個的時候了..吃我三槍！'
              ], () => this.promptFinalSkill());
            });
          } else {
            this.say('桶神？為什麼要攻擊我？', () => {
              this.fakeHit();
              this.say('不行…無法溝通，吃我一擊！', () => this.promptAttack());
            });
          }
        }
        return;
      }
      const itemId = which === 'stool' ? 'plastic_stool' : 'tofu';
      const zone = getSafeCurrentZone(state.player.zone);
      // 教學道具也遵守物品有限池：從該區抽走一個指定材料。
      const poolIndex = zone?.drops?.indexOf(itemId) ?? -1;
      if (poolIndex >= 0) zone.drops.splice(poolIndex, 1);
      state.pendingLootQueue.push({itemId, zoneId:state.player.zone, tutorial:true});
      if (typeof grantSearchGrowth === 'function') grantSearchGrowth(state.player);
      renderLootChoice();
      if (which === 'stool') {
        this.say('這好像不能吃，但是先拿在手上好了。', () => {
          this.step = 'equip_stool';
          this.guide('點擊「裝備」，把塑膠折凳拿在手上。', '#loot-choice-equip');
        });
      } else {
        this.say('太好了！補充蛋白質！', () => {
          this.step = 'take_tofu';
          this.guide('點擊「拾取」，把豆腐放進背包。', '#loot-choice-take');
        });
      }
    },
    takeStoryLoot(action) {
      if (this.step === 'equip_stool' && action === 'equip' && state.pendingLootQueue?.[0]?.itemId === 'plastic_stool') {
        resolveLootChoice('equip');
        if (state.player.equip.weapon?.id !== 'plastic_stool') return;
        this.promptSearch('tofu');
      } else if (this.step === 'take_tofu' && action === 'take' && state.pendingLootQueue?.[0]?.itemId === 'tofu') {
        resolveLootChoice('take');
        if (!state.player.bag.includes('tofu')) return;
        this.step = 'use_tofu';
        this.guide('長按背包裡的「豆腐」，拖曳到上方人物欄使用。', '[data-fast-drag="bag"]');
      }
    },
    afterFood() {
      this.say('等等…三重埔那邊好像有聲音，去看看好了！', () => this.promptMap('sanchong'));
    },
    promptMap(zoneId) {
      this.destination = zoneId;
      this.step = 'open_map';
      this.guide('點擊右上角「移動／地圖」，開啟地圖。', '#main-map-btn');
    },
    showMapTarget() {
      this.step = 'map_target';
      const name = this.destination === 'sanchong' ? '三重埔' : '立法院';
      const target = Array.from(document.querySelectorAll('#map-nodes-container [onclick]'))
        .find(el => el.getAttribute('onclick')?.includes(`moveZone('${this.destination}')`));
      this.guide(`在地圖上點擊「${name}」。`, target);
    },
    chooseZone(zoneId) {
      if (this.step !== 'map_target' || zoneId !== this.destination) return;
      moveZone(zoneId);
      if (state.player.zone !== zoneId) return;
      if (zoneId === 'sanchong') {
        this.fakeHit();
        this.say('什麼？！這攻擊哪裡來的？', () => this.promptSearch('enemy'));
      } else {
        this.arriveLegislature();
      }
    },
    fakeHit() {
      if (!this.active) return;
      state.player.hp = Math.max(1, state.player.hp - 8);
      if (typeof triggerPlayerHitShake === 'function') triggerPlayerHitShake(8);
      window.GameAudio?.playSfx?.('hurt');
      addLog('💥 一道突如其來的攻擊擊中了你！(-8 HP)', 'text-rose-300 font-bold');
      updateUI();
    },
    promptAttack() {
      // 劇情戰鬥保證一擊勝利，不改正式對戰的角色傷害計算。
      this.enemy.hp = 1;
      this.enemy.reflectRemain = 0;
      this.enemy.reflectCharges = 0;
      updateCombatUI();
      this.step = 'attack';
      this.guide('點擊「攻擊」，擊敗亞洲桶神。', '#btn-combat-atk');
    },
    onEnemyDefeated(corpse) {
      if (!this.active || !corpse) return;
      this.step = 'corpse_loot';
      this.guide('從桶神的屍體取得「黨證」和「生鏽鐵釘」（逐件點拾取）。', '#corpse-loot-items');
      this.refreshCorpseFocus();
    },
    refreshCorpseFocus() {
      if (this.step !== 'corpse_loot') return;
      const entries = corpseEntries(findCorpseById(activeCorpseLootId));
      const missing = ['party_card','rusty_nail'].filter(id => !state.player.bag.includes(id));
      if (!missing.length) {
        closeCorpseLoot();
        this.say([
          '黨證…統神，你也墮落了嗎…',
          '等等，這個鐵釘應該能派上用場！'
        ], () => this.promptCraft());
        return;
      }
      const ix = entries.findIndex(e => e.id === missing[0]);
      const wanted = $('corpse-loot-items')?.querySelectorAll('button[onclick*="takeCorpseLoot"]');
      this.guide('請拾取「' + getItemDisplayName(missing[0]) + '」。', wanted?.[ix * 2] || '#corpse-loot-items');
    },
    promptCraft() {
      this.step = 'open_craft';
      this.guide('點擊畫面中的「合成」按鈕。', '#craft-menu-trigger');
    },
    showCraftTarget() {
      this.step = 'craft_target';
      const idx = getSafeRecipes().findIndex(r => r.result === 'spiked_stool');
      const target = Array.from(document.querySelectorAll('#craft-choice-list [onclick]'))
        .find(el => el.getAttribute('onclick')?.includes(`craftRecipeFromMenu(${idx})`));
      this.guide('找到「帶釘折凳」，點擊那一列的「合成」。', target || '#craft-choice-list');
    },
    afterCraft() {
      closeCraftMenu();
      this.say([
        '很好！至少能好好保護自己了！',
        '咦？這個聲音是…立法院？！'
      ], () => this.promptMap('ly'));
    },
    // 第二段：立法院。血量由劇情指定，與正式難度／NPC 攻擊公式完全分離。
    storyHitToHp(targetHp) {
      if (!this.active || !state.player) return;
      const p = state.player;
      const before = p.hp;
      p.hp = Math.max(1, Math.min(p.hp - 1, targetHp));
      const taken = Math.max(0, before - p.hp);
      if (taken > 0) {
        if (typeof triggerPlayerHitShake === 'function') triggerPlayerHitShake(taken);
        window.GameAudio?.playSfx?.('hurt');
        addLog(`💥 【劇情襲擊】你遭到猛烈攻擊，失去 ${taken} HP！`, 'text-rose-300 font-black');
      }
      updateUI();
      if (state.inCombat) updateCombatUI();
    },
    arriveLegislature() {
      this.finalEnemy = createCharacterEntity('laixiangde', false, 'ly');
      this.finalEnemy.equip = { weapon:null, head:null, chest:null, arm:null, leg:null, acc:null };
      this.finalEnemy.bag = [];
      this.finalEnemy.stunRemain = 0;
      this.finalEnemy.stealthRemain = 0;
      state.ais.push(this.finalEnemy);
      this.storyHitToHp(Math.max(1, Math.ceil(state.player.maxHp / 3)));
      this.say('什麼….好強的攻擊！', () => this.promptSearch('lai'));
    },
    promptFinalSkill() {
      // 第三次攻擊是劇情專用必勝「三槍」，仍消耗角色原技能 SP。
      const p = state.player;
      p.sp = Math.max(p.sp, p.skill.costSp);
      p.stunRemain = 0;
      p.skillCdRemain = 0;
      this.step = 'skill_lai';
      updateUI();
      updateCombatUI();
      this.guide('點擊紫色「三槍」技能，擊敗賴祥德。', '#btn-combat-skill');
    },
    async performFinalSkill() {
      if (this.step !== 'skill_lai' || !this.finalEnemy?.alive || !state.player) return;
      this.step = 'final_skill_anim';
      this.removeFocus();
      $('tutorial-hint')?.classList.add('hidden');
      const p = state.player;
      const enemy = this.finalEnemy;
      p.sp = Math.max(0, p.sp - p.skill.costSp);
      p.skillCdRemain = p.skill.cd;
      // 三次命中都要明確演出，第三下才擊敗。只用於教學，不影響正式傷害。
      const initialHp = Math.min(enemy.maxHp, 42);
      enemy.hp = initialHp;
      updateUI(); updateCombatUI();
      addLog('🔫 館長使出了【三槍】！', 'text-purple-300 font-black');
      for (let i = 0; i < 3; i++) {
        if (!this.active) return;
        enemy.hp = Math.max(0, enemy.hp - 14);
        if (typeof triggerCombatShake === 'function') triggerCombatShake('combat-panel');
        if (typeof renderCombatDamageFloat === 'function') {
          renderCombatDamageFloat($('enemy-hp-container'), '-14', i === 2);
        }
        window.GameAudio?.playSfx?.('hit');
        updateCombatUI();
        await delay(250);
      }
      if (!this.active) return;
      enemy.alive = false;
      p.killCount = (p.killCount || 0) + 1;
      addLog('🏆 【劇情擊敗】賴祥德被館長的三槍擊倒！', 'text-amber-300 font-black');
      await delay(580);
      if (!this.active) return;
      finishCombatTurn();
      this.say('呼….', () => this.showBlackout());
    },
    showBlackout() {
      this.step = 'final_blackout';
      this.removeFocus();
      $('tutorial-dialog')?.classList.add('hidden');
      $('tutorial-hint')?.classList.add('hidden');
      const overlay = $('tutorial-blackout');
      overlay?.classList.remove('hidden');
      requestAnimationFrame(() => { if (this.active && overlay) overlay.style.opacity = '1'; });
      this._blackoutTimer = setTimeout(() => this.returnToLobby(), 4800);
    },
    returnToLobby() {
      if (!this.active || this.step !== 'final_blackout') return;
      clearTimeout(this._blackoutTimer);
      this.active = false;
      window.location.reload();
    },

    onClickCapture(e) {
      if (!this.active) return;
      const el = e.target;
      if (this.step === 'final_blackout' && el.closest('#tutorial-final-return')) return;
      if (this.step === 'dialogue' && el.closest('#tutorial-dialog-next')) return;
      const intercept = () => { e.preventDefault(); e.stopImmediatePropagation(); };
      if (this.step === 'search_stool' || this.step === 'search_tofu' || this.step === 'search_enemy' || this.step === 'search_lai') {
        if (el.closest('#explore-panel') && !el.closest('button') && !el.closest('#target-tracker-box')) {
          const which = this.step === 'search_stool' ? 'stool' : this.step === 'search_tofu' ? 'tofu' : this.step === 'search_lai' ? 'lai' : 'enemy';
          intercept(); this.scriptedSearch(which); return;
        }
      }
      if (this.step === 'equip_stool' && el.closest('#loot-choice-equip')) {
        intercept(); this.takeStoryLoot('equip'); return;
      }
      if (this.step === 'take_tofu' && el.closest('#loot-choice-take')) {
        intercept(); this.takeStoryLoot('take'); return;
      }
      if (this.step === 'open_map' && el.closest('#main-map-btn')) {
        intercept(); openMapModal(); this.showMapTarget(); return;
      }
      if (this.step === 'map_target') {
        const mapTarget = el.closest?.('[onclick*="moveZone"]');
        if (mapTarget) {
          const match = mapTarget.getAttribute('onclick')?.match(/moveZone\(['"]([^'"]+)['"]\)/);
          if (match?.[1] === this.destination) { intercept(); this.chooseZone(match[1]); return; }
        }
      }
      if (this.step === 'attack' && el.closest('#btn-combat-atk')) {
        intercept(); executeCombatAction('attack'); return;
      }
      if (this.step === 'skill_lai' && el.closest('#btn-combat-skill')) {
        intercept(); this.performFinalSkill(); return;
      }
      if (this.step === 'corpse_loot') {
        const button = el.closest('button[onclick^="takeCorpseLoot"]');
        if (button) {
          const match = button.getAttribute('onclick')?.match(/takeCorpseLoot\((\d+),'(take|equip)'\)/);
          if (match && match[2] === 'take') {
            const ix = Number(match[1]);
            const corpse = findCorpseById(activeCorpseLootId);
            const entry = corpseEntries(corpse)[ix];
            if (entry && ['party_card','rusty_nail'].includes(entry.id)) {
              intercept(); takeCorpseLoot(ix, 'take'); this.refreshCorpseFocus(); return;
            }
          }
        }
      }
      if (this.step === 'open_craft' && el.closest('#craft-menu-trigger')) {
        intercept(); openCraftMenu(); this.showCraftTarget(); return;
      }
      if (this.step === 'craft_target') {
        const button = el.closest('button[onclick^="craftRecipeFromMenu"]');
        const match = button?.getAttribute('onclick')?.match(/craftRecipeFromMenu\((\d+)\)/);
        if (match && getSafeRecipes()[Number(match[1])]?.result === 'spiked_stool') {
          intercept(); craftRecipeFromMenu(Number(match[1]));
          if (state.player.equip.weapon?.id === 'spiked_stool') this.afterCraft();
          return;
        }
      }
      // 食物食用流程要讓 iPhone 的原本快速拖曳系統正常處理；輕點不算完成。
      if (this.step === 'use_tofu' && el.closest('[data-fast-drag="bag"]')) {
        intercept(); this.remind(); return;
      }
      intercept(); this.remind();
    }
  };

  // 正式模式完全不受此攔截器影響。
  document.addEventListener('click', e => tutorial.onClickCapture(e), true);
  const originalUse = window.useOrEquipBagItem;
  if (typeof originalUse === 'function') {
    window.useOrEquipBagItem = function (idx) {
      if (tutorial.active) {
        if (tutorial.step !== 'use_tofu' || state.player?.bag?.[idx] !== 'tofu') return;
        originalUse(idx);
        if (!state.player.bag.includes('tofu')) tutorial.afterFood();
        return;
      }
      return originalUse(idx);
    };
  }
  const originalDrop = window.dropItemFromSource;
  if (typeof originalDrop === 'function') {
    window.dropItemFromSource = function (...args) {
      if (tutorial.active) return; // 禁止教學過程將指定道具丟回地圖或丟棄。
      return originalDrop(...args);
    };
  }
  window.TutorialMode = tutorial;
})();
