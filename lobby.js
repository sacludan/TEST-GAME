/**
 * 【模組：遊戲主大廳 lobby.js】
 * v58：完整保留原版測試模式 (sandbox)，並支援 9 選 1 角色選擇與立法院角色測試模式 (char_test)
 */
const LobbyManager = {
  selectedPlayerId: "zhugouliang",
  selectedTestBotIds: [],

  init() {
    if (typeof GAME_CHARACTERS === "undefined") return;
    const keys = Object.keys(GAME_CHARACTERS);
    if (keys.length > 0 && !GAME_CHARACTERS[this.selectedPlayerId]) {
      this.selectedPlayerId = keys[0];
    }
    this.selectedTestBotIds = keys.filter(k => k !== this.selectedPlayerId);
    this.renderCharacterSelector();
    this.renderTestBotsList();
  },

  selectCharacter(charId) {
    this.selectedPlayerId = charId;
    this.selectedTestBotIds = this.selectedTestBotIds.filter(id => id !== charId);
    this.renderCharacterSelector();
    this.renderTestBotsList();
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
    if (preview && cur) {
      preview.innerHTML = `
        <div class="flex justify-between items-center border-b border-slate-800 pb-1 mb-1.5">
          <div>
            <span class="text-sm font-black text-white">${cur.name}</span>
          </div>
          <div class="text-[10px] font-mono text-slate-300">
            HP <b class="text-rose-400">${cur.maxHp}</b> | SP <b class="text-sky-400">${cur.maxSp}</b> | 攻 <b class="text-amber-400">${cur.baseAtk}</b> | 防 <b class="text-indigo-400">${cur.baseDef}</b>
          </div>
        </div>
        <div class="space-y-1 text-[11px] leading-snug">
          <div><span class="text-amber-400 font-bold">${cur.skill.icon} 主動【${cur.skill.name}】(${cur.skill.costSp}SP/CD${cur.skill.cd}s)：</span><span class="text-slate-300">${cur.skill.desc}</span></div>
          <div><span class="text-sky-400 font-bold">🛡️ 被動【${cur.passive.name}】：</span><span class="text-slate-300">${cur.passive.desc}</span></div>
        </div>
      `;
    }
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

  // mode 支援: 'normal' (正常對戰), 'sandbox' (原版無縮圈無NPC測試), 'char_test' (立法院角色測試)
  startGame(mode = 'normal') {
    if (mode === true) mode = 'sandbox';
    if (mode === false) mode = 'normal';

    this.closeTestSetupModal();

    const lobbyScreen = document.getElementById("lobby-screen");
    if (lobbyScreen) lobbyScreen.classList.add("hidden");

    const gameScreen = document.getElementById("game-screen");
    if (gameScreen) gameScreen.classList.remove("hidden");

    if (typeof initGame === "function") {
      initGame(mode, this.selectedPlayerId, [...this.selectedTestBotIds]);
    } else {
      console.error("找不到 initGame 函式！");
    }
  }
};

window.addEventListener("DOMContentLoaded", () => {
  LobbyManager.init();
});
