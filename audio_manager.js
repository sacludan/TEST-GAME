/* 台灣生存戰 V19.48 — 背景音樂 + 寫實音效（搜刮 / 命中 / 受傷）+ 禁區警報。 */
(function () {
  'use strict';

  const KEY = 'formosa_survival_audio_v2';
  let settings = { volume: 30, muted: false };
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved && typeof saved === 'object') {
      if (Number.isFinite(+saved.volume)) settings.volume = Math.min(100, Math.max(0, +saved.volume));
      settings.muted = saved.muted === true;
    }
  } catch (_) { /* file:// or private mode may block localStorage */ }

  const bgm = new Audio('assets/audio/dark_survival_loop.mp3');
  bgm.loop = true;
  bgm.preload = 'none';
  bgm.volume = settings.volume / 100;

  const sfxConfig = {
    search: { src: 'assets/audio/sfx_search_loot.mp3', gain: 0.55 },
    hit:    { src: 'assets/audio/sfx_hit_enemy.mp3',   gain: 0.72 },
    hurt:   { src: 'assets/audio/sfx_player_hurt.mp3', gain: 0.78 },
    material: { src: 'assets/audio/sfx_material_chime.mp3', gain: 0.80 }
  };
  const sfxSources = Object.create(null);
  const sfxBuffers = Object.create(null);
  const activeSfx = new Set();
  let sfxPrimed = false;
  let sfxDecodeStarted = false;
  for (const [name, cfg] of Object.entries(sfxConfig)) {
    const audio = new Audio(cfg.src);
    audio.preload = 'auto';
    sfxSources[name] = audio;
  }

  let started = false;
  let suspendedByVisibility = false;
  let alertContext = null;
  let warningActive = false;
  let lastWarningAt = -Infinity;

  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch (_) {}
  }

  function calcVolume(multiplier = 1) {
    return Math.max(0, Math.min(1, (settings.volume / 100) * multiplier));
  }

  function stopSfx(name) {
    for (const entry of [...activeSfx]) {
      if (!name || entry.name === name) entry.stop();
    }
  }

  function stopAllSfx() { stopSfx(); }

  function decodeSfxBuffers() {
    // Web Audio 在首次點擊啟用後可由定時器觸發，避免 iPhone Safari 封鎖非手勢觸發的 Audio.play()。
    if (sfxDecodeStarted || !alertContext || typeof alertContext.decodeAudioData !== 'function' || typeof fetch !== 'function') return;
    sfxDecodeStarted = true;
    for (const [name, cfg] of Object.entries(sfxConfig)) {
      fetch(cfg.src)
        .then(response => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.arrayBuffer();
        })
        .then(buffer => alertContext.decodeAudioData(buffer))
        .then(decoded => { sfxBuffers[name] = decoded; })
        .catch(err => { console.debug(`寫實音效 ${name} 緩衝失敗，改用音訊檔備援`, err); });
    }
  }

  function primeSfx() {
    if (!sfxPrimed) {
      sfxPrimed = true;
      Object.values(sfxSources).forEach(audio => {
        try { audio.load(); } catch (_) {}
      });
    }
    decodeSfxBuffers();
  }

  function playSfx(name) {
    const source = sfxSources[name];
    const cfg = sfxConfig[name];
    if (!source || !cfg || settings.muted || settings.volume <= 0 || document.hidden) return false;

    // 優先使用首次點擊解鎖的 AudioContext：NPC 在背景計時器攻擊玩家時也能播放。
    const context = alertContext;
    if (context && context.state === 'running' && sfxBuffers[name] &&
        typeof context.createBufferSource === 'function') {
      try {
        const node = context.createBufferSource();
        const gain = context.createGain();
        node.buffer = sfxBuffers[name];
        gain.gain.value = calcVolume(cfg.gain);
        node.connect(gain);
        gain.connect(context.destination);
        const entry = {
          name,
          stop() {
            try { node.stop(); } catch (_) {}
            try { node.disconnect(); gain.disconnect(); } catch (_) {}
            activeSfx.delete(entry);
          }
        };
        node.onended = () => {
          try { node.disconnect(); gain.disconnect(); } catch (_) {}
          activeSfx.delete(entry);
        };
        activeSfx.add(entry);
        node.start();
        return true;
      } catch (err) {
        console.debug(`音效 ${name} Web Audio 播放失敗`, err);
      }
    }

    // 音訊快取尚未解碼或 file:// 環境：保留原本 HTMLAudio 播放路徑。
    try {
      const clip = source.cloneNode(true);
      clip.preload = 'auto';
      clip.volume = calcVolume(cfg.gain);
      const entry = {
        name,
        stop() {
          try { clip.pause(); clip.currentTime = 0; } catch (_) {}
          activeSfx.delete(entry);
        }
      };
      activeSfx.add(entry);
      const cleanup = () => activeSfx.delete(entry);
      clip.addEventListener('ended', cleanup, { once: true });
      clip.addEventListener('error', cleanup, { once: true });
      const promise = clip.play();
      if (promise && typeof promise.catch === 'function') promise.catch(cleanup);
      return true;
    } catch (err) {
      console.debug(`音效 ${name} 播放失敗`, err);
      return false;
    }
  }

  function unlockAlertAudio() {
    if (settings.muted || settings.volume <= 0) return;
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return;
    try {
      if (!alertContext) alertContext = new Ctor();
      decodeSfxBuffers();
      if (alertContext.state === 'suspended') {
        const promise = alertContext.resume();
        if (promise?.catch) promise.catch(() => {});
      }
    } catch (err) { console.debug('警報音目前無法啟動', err); }
  }

  function beepZoneWarning() {
    if (!alertContext || alertContext.state !== 'running' || settings.muted || settings.volume <= 0 || document.hidden) return;
    try {
      const t = alertContext.currentTime;
      for (const [offset, freq] of [[0, 660], [0.19, 470]]) {
        const oscillator = alertContext.createOscillator();
        const gain = alertContext.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(freq, t + offset);
        const peak = 0.17 * (settings.volume / 100);
        gain.gain.setValueAtTime(0.0001, t + offset);
        gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + offset + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + offset + 0.16);
        oscillator.connect(gain);
        gain.connect(alertContext.destination);
        oscillator.start(t + offset);
        oscillator.stop(t + offset + 0.165);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      }
    } catch (err) { console.debug('禁區警報音播放失敗', err); }
  }

  function refresh() {
    const volume = document.getElementById('audio-volume');
    const label = document.getElementById('audio-volume-label');
    const mute = document.getElementById('audio-mute-button');
    if (volume) volume.value = String(settings.volume);
    if (label) label.textContent = settings.volume + '%';

    const menuVolume = document.getElementById('audio-volume-menu');
    const menuLabel = document.getElementById('audio-volume-label-menu');
    if (menuVolume) menuVolume.value = String(settings.volume);
    if (menuLabel) menuLabel.textContent = settings.volume + '%';

    if (mute) {
      mute.textContent = settings.muted ? '🔇 已靜音' : '🔊 音樂開啟';
      mute.setAttribute('aria-pressed', String(settings.muted));
    }
    const menuMute = document.getElementById('audio-mute-button-menu');
    if (menuMute) {
      menuMute.textContent = settings.muted ? '🔇 已靜音' : '🔊 音樂開啟';
      menuMute.setAttribute('aria-pressed', String(settings.muted));
    }
    const lobbyBtn = document.getElementById('audio-button-lobby');
    if (lobbyBtn) {
      lobbyBtn.textContent = settings.muted || settings.volume === 0 ? '🔇' : '🎵';
      lobbyBtn.title = settings.muted ? '音樂已靜音（點擊調整）' : '音樂設定';
    }
  }

  const GameAudio = {
    refresh,
    primeSfx,
    playSfx,
    playMaterialFound() { return playSfx('material'); },
    stopSfx,
    syncZoneWarning(isPending, remainSeconds = 120) {
      const active = !!isPending;
      if (!active) {
        warningActive = false;
        lastWarningAt = -Infinity;
        return;
      }
      const now = performance.now();
      const intervalMs = remainSeconds <= 30 ? 5000 : 12000;
      if (!warningActive || now - lastWarningAt >= intervalMs) {
        warningActive = true;
        if (started && !settings.muted && settings.volume > 0 && !document.hidden) {
          beepZoneWarning();
          lastWarningAt = now;
        }
      }
    },
    play() {
      started = true;
      unlockAlertAudio();
      primeSfx();
      if (settings.muted || settings.volume === 0 || document.hidden) return;
      bgm.volume = settings.volume / 100;
      const promise = bgm.play();
      if (promise && typeof promise.catch === 'function') {
        promise.catch(err => { console.info('音樂等待使用者操作才能播放:', err && err.message); });
      }
    },
    setVolume(value) {
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) return;
      settings.volume = Math.max(0, Math.min(100, Math.round(parsed)));
      bgm.volume = settings.volume / 100;
      persist();
      refresh();
      if (settings.volume === 0) {
        bgm.pause();
        stopAllSfx();
      } else if (started && !settings.muted && !document.hidden) {
        this.play();
      }
    },
    toggleMute() {
      settings.muted = !settings.muted;
      persist();
      refresh();
      if (settings.muted) {
        bgm.pause();
        stopAllSfx();
      } else {
        lastWarningAt = -Infinity;
        this.play();
      }
    },
    togglePanel() {
      document.getElementById('audio-settings-panel')?.classList.toggle('hidden');
      refresh();
    },
    closePanel() {
      document.getElementById('audio-settings-panel')?.classList.add('hidden');
    },
    getState() {
      return { ...settings, started, paused: bgm.paused, src: bgm.currentSrc, sfxPrimed };
    }
  };

  window.GameAudio = GameAudio;

  document.addEventListener('click', function (event) {
    const lobby = document.getElementById('lobby-screen');
    if (!lobby || lobby.classList.contains('hidden')) return;
    if (!event.isTrusted) return;
    primeSfx();
    if (!settings.muted && settings.volume > 0 && !document.hidden && bgm.paused) {
      GameAudio.play();
    }
  }, true);

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      suspendedByVisibility = started && !bgm.paused;
      bgm.pause();
      stopAllSfx();
    } else if (suspendedByVisibility && started && !settings.muted) {
      suspendedByVisibility = false;
      GameAudio.play();
    }
  });

  window.addEventListener('pagehide', () => {
    bgm.pause();
    stopAllSfx();
  });

  refresh();
})();
