/**
 * 【模組：遊戲主大廳 lobby.js】
 * v18.3：首頁改為主選單式介面，角色選擇／測試模式改為彈窗，保留難度選擇。
 */
const LobbyManager = {
  selectedPlayerId: "zhugouliang",
  selectedDifficulty: "easy",
  selectedTestBotIds: [],
  // Nine selectable characters each have one portrait, including the original 科文哲 art.
  characterArtworkPaths: Object.freeze({
    zhugouliang: "assets/characters/zhugouliang.webp?v=19.31",
    hanguoyu: "assets/characters/hanguoyu.webp?v=19.31",
    kewenzhe: "assets/characters/kewenzhe.webp?v=19.31",
    laixiangde: "assets/characters/laixiangde.webp?v=19.31",
    chenaguan: "assets/characters/chenaguan.webp?v=19.31",
    yazhoutongshen: "assets/characters/yazhoutongshen.webp?v=19.31",
    chaoge: "assets/characters/chaoge.webp?v=19.31",
    wangshijian: "assets/characters/wangshijian.webp?v=19.31",
    jiangwanan: "assets/characters/jiangwanan.webp?v=19.31"
  }),
  characterArtworkCache: Object.create(null),

  // Decode these lightweight WebPs once in the lobby so switching characters stays responsive.
  preloadCharacterArtwork() {
    if (typeof Image === "undefined") return;
    for (const [id, url] of Object.entries(this.characterArtworkPaths)) {
      if (this.characterArtworkCache[id]) continue;
      const image = new Image();
      image.decoding = "async";
      image.src = url;
      this.characterArtworkCache[id] = image;
      // Decoding in advance also avoids a blank flash when opening the modal on iPhone.
      if (typeof image.decode === "function") image.decode().catch(() => {});
    }
  },

  init() {
    if (typeof GAME_CHARACTERS === "undefined") return;
    const keys = Object.keys(GAME_CHARACTERS);
    if (keys.length > 0 && !GAME_CHARACTERS[this.selectedPlayerId]) {
      this.selectedPlayerId = keys[0];
    }
    this.selectedTestBotIds = keys.filter(k => k !== this.selectedPlayerId);
    this.renderCharacterSelector();
    this.renderTestBotsList();
    this.updateSelectedCharacterSummary();
    this.selectDifficulty(this.selectedDifficulty);
    this.preloadCharacterArtwork();
  },

  updateSelectedCharacterSummary() {
    const cur = (typeof GAME_CHARACTERS !== 'undefined') ? GAME_CHARACTERS[this.selectedPlayerId] : null;
    const summaryEl = document.getElementById('selected-char-summary');
    const inlineEl = document.getElementById('selected-char-inline');
    if (!cur) return;
    if (summaryEl) summaryEl.textContent = `${cur.name}｜${cur.title}`;
    if (inlineEl) inlineEl.textContent = cur.name;
  },

  selectDifficulty(value) {
    this.selectedDifficulty = value === "hard" ? "hard" : "easy";
    const hard = this.selectedDifficulty === "hard";
    const easyBtn = document.getElementById("difficulty-easy");
    const hardBtn = document.getElementById("difficulty-hard");
    const description = document.getElementById("ai-difficulty-description");
    for (const [el, active, color] of [[easyBtn, !hard, "emerald"], [hardBtn, hard, "rose"]]) {
      if (!el) continue;
      el.setAttribute("aria-pressed", String(active));
      const activeClass = color === "rose"
        ? "rounded-lg py-2 text-xs font-black border border-rose-400 bg-rose-950 text-rose-200"
        : "rounded-lg py-2 text-xs font-black border border-emerald-400 bg-emerald-950 text-emerald-200";
      el.className = active ? activeClass
        : "rounded-lg py-2 text-xs font-black border border-slate-700 bg-slate-950 text-slate-400";
    }
    if (description) {
      description.textContent = hard ? "困難・積極發育、善用技能" : "簡單・適合熟悉遊戲";
      description.className = hard ? "text-[10px] text-rose-300" : "text-[10px] text-emerald-300";
    }
  },

  selectCharacter(charId) {
    this.selectedPlayerId = charId;
    this.selectedTestBotIds = this.selectedTestBotIds.filter(id => id !== charId);
    this.renderCharacterSelector();
    this.renderTestBotsList();
    this.updateSelectedCharacterSummary();
  },

  renderCharacterSelector() {
    const grid = document.getElementById("lobby-char-grid");
    const preview = document.getElementById("lobby-char-preview");
    if (!grid || typeof GAME_CHARACTERS === "undefined") return;

    const chars = Object.values(GAME_CHARACTERS);
    grid.innerHTML = chars.map(c => {
      const isSelected = c.id === this.selectedPlayerId;
      return `
        <button onclick="LobbyManager.selectCharacter('${c.id}')"
                class="py-1.5 px-1 rounded-xl border text-center transition active:scale-95 flex flex-col items-center justify-center ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.35)] font-black'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 font-bold'
                }">
          <span class="text-xs truncate w-full">${c.name}</span>
          <span class="text-[9px] ${isSelected ? 'text-amber-400' : 'text-slate-500'}">${c.title}</span>
        </button>
      `;
    }).join("");

    const cur = GAME_CHARACTERS[this.selectedPlayerId];
    // Keep one <img> element; switch artwork by character ID. Hide the previous art
    // immediately so slower network loads never display the wrong character.
    const characterArtwork = document.getElementById('lobby-char-art');
    const characterGlow = document.getElementById('lobby-char-art-glow');
    const artUrl = cur && this.characterArtworkPaths[cur.id];
    if (characterArtwork && artUrl) {
      characterArtwork.onload = () => {
        const active = characterArtwork.dataset.characterId === this.selectedPlayerId
          && characterArtwork.naturalWidth > 0;
        characterArtwork.classList.toggle('hidden', !active);
        if (characterGlow) characterGlow.classList.toggle('hidden', !active);
      };
      characterArtwork.onerror = () => {
        characterArtwork.classList.add('hidden');
        if (characterGlow) characterGlow.classList.add('hidden');
      };
      if (characterArtwork.dataset.characterId !== cur.id) {
        characterArtwork.classList.add('hidden');
        if (characterGlow) characterGlow.classList.add('hidden');
        characterArtwork.dataset.characterId = cur.id;
        characterArtwork.src = artUrl;
      }
      const showArtwork = characterArtwork.complete && characterArtwork.naturalWidth > 0;
      characterArtwork.classList.toggle('hidden', !showArtwork);
      if (characterGlow) characterGlow.classList.toggle('hidden', !showArtwork);
    } else {
      if (characterArtwork) characterArtwork.classList.add('hidden');
      if (characterGlow) characterGlow.classList.add('hidden');
    }
    if (preview && cur) {
      preview.innerHTML = `
        <div class="flex justify-between items-center border-b border-slate-800 pb-1 mb-1.5 gap-2">
          <div class="min-w-0">
            <span class="text-sm font-black text-white">${cur.name}</span>
            <div class="text-[10px] text-amber-300 font-bold truncate">${cur.title}</div>
          </div>
          <div class="text-[10px] font-mono text-slate-300 text-right shrink-0">
            HP <b class="text-rose-400">${cur.maxHp}</b> | SP <b class="text-sky-400">${cur.maxSp}</b><br>
            攻 <b class="text-amber-400">${cur.baseAtk}</b> | 防 <b class="text-indigo-400">${cur.baseDef}</b>
          </div>
        </div>
        <div class="space-y-1 text-[11px] leading-snug">
          <div><span class="text-amber-400 font-bold">${cur.skill.icon} 主動【${cur.skill.name}】(${cur.skill.costSp}SP/CD${cur.skill.cd}s)：</span><span class="text-slate-300">${cur.skill.desc}</span></div>
          <div><span class="text-sky-400 font-bold">🛡️ 被動【${cur.passive.name}】：</span><span class="text-slate-300">${cur.passive.desc}</span></div>
        </div>
      `;
    }
  },

  openCharacterSelectModal() {
    const modal = document.getElementById('character-select-modal');
    if (modal) {
      this.renderCharacterSelector();
      modal.classList.remove('hidden');
    }
  },

  closeCharacterSelectModal() {
    const modal = document.getElementById('character-select-modal');
    if (modal) modal.classList.add('hidden');
  },

  openTestModeModal() {
    const modal = document.getElementById('test-mode-modal');
    if (modal) modal.classList.remove('hidden');
  },

  closeTestModeModal() {
    const modal = document.getElementById('test-mode-modal');
    if (modal) modal.classList.add('hidden');
  },

  chooseTestMode(mode) {
    if (mode === 'char_test') {
      this.closeTestModeModal();
      this.openTestSetupModal();
      return;
    }
    this.startGame(mode === 'sandbox' ? 'sandbox' : 'sandbox');
  },

  openTutorialModal() {
    const modal = document.getElementById('tutorial-coming-modal');
    if (modal) modal.classList.remove('hidden');
  },

  closeTutorialModal() {
    const modal = document.getElementById('tutorial-coming-modal');
    if (modal) modal.classList.add('hidden');
  },

  openTestSetupModal() {
    const modal = document.getElementById("test-setup-modal");
    if (modal) {
      this.renderTestBotsList();
      modal.classList.remove("hidden");
    }
  },

  closeTestSetupModal() {
    const modal = document.getElementById("test-setup-modal");
    if (modal) modal.classList.add("hidden");
  },

  toggleTestBot(charId) {
    if (charId === this.selectedPlayerId) return;
    const idx = this.selectedTestBotIds.indexOf(charId);
    if (idx === -1) {
      this.selectedTestBotIds.push(charId);
    } else {
      this.selectedTestBotIds.splice(idx, 1);
    }
    this.renderTestBotsList();
  },

  selectAllTestBots(enableAll) {
    if (enableAll) {
      this.selectedTestBotIds = Object.keys(GAME_CHARACTERS).filter(id => id !== this.selectedPlayerId);
    } else {
      this.selectedTestBotIds = [];
    }
    this.renderTestBotsList();
  },

  renderTestBotsList() {
    const listEl = document.getElementById("test-bots-grid");
    if (!listEl || typeof GAME_CHARACTERS === "undefined") return;

    const chars = Object.values(GAME_CHARACTERS);
    listEl.innerHTML = chars.map(c => {
      const isPlayer = c.id === this.selectedPlayerId;
      const isChecked = this.selectedTestBotIds.includes(c.id);

      if (isPlayer) {
        return `
          <div class="p-2 rounded-xl border border-slate-800 bg-slate-900/40 opacity-40 text-left flex items-center justify-between">
            <div>
              <div class="text-xs font-bold text-slate-400">${c.name}</div>
              <div class="text-[9px] text-amber-400">⭐ 玩家本人使用中</div>
            </div>
          </div>
        `;
      }

      return `
        <button onclick="LobbyManager.toggleTestBot('${c.id}')"
                class="p-2 rounded-xl border text-left transition active:scale-95 flex items-center justify-between ${
                  isChecked
                    ? 'bg-indigo-950/70 border-indigo-500 text-indigo-200 shadow'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                }">
          <div>
            <div class="text-xs font-black ${isChecked ? 'text-white' : 'text-slate-300'}">${c.name}</div>
            <div class="text-[9px] ${isChecked ? 'text-indigo-400' : 'text-slate-500'}">${c.title}</div>
          </div>
          <span class="text-xs font-black">${isChecked ? '✔' : '＋'}</span>
        </button>
      `;
    }).join("");
  },

  closeAllLobbyModals() {
    this.closeCharacterSelectModal();
    this.closeTestModeModal();
    this.closeTutorialModal();
    this.closeTestSetupModal();
  },

  // mode 支援: 'normal' (正常對戰), 'sandbox' (原版無縮圈無NPC測試), 'char_test' (立法院角色測試)
  async startGame(mode = 'normal') {
    if (mode === true) mode = 'sandbox';
    if (mode === false) mode = 'normal';

    if (this._startingGame) return;
    this._startingGame = true;
    this.closeAllLobbyModals();
    const mapLoading = document.getElementById('map-loading-status');
    if (mapLoading) {
      mapLoading.textContent = '🗺️ 正在載入地圖、場景圖片並準備互動區域，請稍候…';
      mapLoading.classList.remove('hidden');
    }
    try {
      if (typeof preloadTacticalMap === 'function' || typeof preloadZoneSceneBackgrounds === 'function') {
        const [mapReady, scenesReady] = await Promise.all([
          typeof preloadTacticalMap === 'function' ? preloadTacticalMap() : Promise.resolve(true),
          typeof preloadZoneSceneBackgrounds === 'function' ? preloadZoneSceneBackgrounds() : Promise.resolve(true)
        ]);
        if (!mapReady || !scenesReady) {
          if (mapLoading) mapLoading.textContent = '⚠️ 有場景圖片載入失敗，請確認連線，重新按「開始遊戲」即可重試。';
          this._startingGame = false;
          return;
        }
      }
    } catch (error) {
      console.error('地圖載入失敗:', error);
      if (mapLoading) mapLoading.textContent = '地圖載入失敗，請檢查網路後再按一次「開始遊戲」。';
      this._startingGame = false;
      return;
    }
    if (mapLoading) mapLoading.classList.add('hidden');

    const lobbyScreen = document.getElementById("lobby-screen");
    if (lobbyScreen) lobbyScreen.classList.add("hidden");

    const gameScreen = document.getElementById("game-screen");
    if (gameScreen) gameScreen.classList.remove("hidden");

    if (typeof initGame === "function") {
      initGame(mode, this.selectedPlayerId, [...this.selectedTestBotIds], this.selectedDifficulty);
    } else {
      console.error("找不到 initGame 函式！");
    }
    this._startingGame = false;
  }
};

window.addEventListener("DOMContentLoaded", () => {
  LobbyManager.init();
});
