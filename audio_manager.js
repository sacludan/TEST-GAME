/* 台北倖存者 V19.54 — BGM / SFX 獨立控制，任何道具拾獲時播放提示音。 */
(function () {
  'use strict';

  const KEY = 'formosa_survival_audio_v2';
  let settings = { volume: 30, muted: false, sfxVolume: 75, sfxMuted: false };
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved && typeof saved === 'object') {
      if (Number.isFinite(+saved.volume)) settings.volume = Math.min(100, Math.max(0, +saved.volume));
      settings.muted = saved.muted === true;
      if (Number.isFinite(+saved.sfxVolume)) settings.sfxVolume = Math.min(100, Math.max(0, +saved.sfxVolume));
      settings.sfxMuted = saved.sfxMuted === true;
    }
  } catch (_) { /* file:// or private mode may block localStorage */ }

  const bgm = new Audio('assets/audio/dark_survival_loop.mp3');
  bgm.loop = true;
  bgm.preload = 'none';
  bgm.volume = settings.volume / 100;

  // 直接隨程式附上既有 V19.53 的短叮聲，避免使用者漏上傳 MP3 或瀏覽器快取 404。
  // 這不是上一回合尚未獲得同意的 A / B 新試聽音色。
  const pickupMp3Base64 = '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';
  const pickupSrc = 'data:audio/mpeg;base64,' + pickupMp3Base64;
  const sfxConfig = {
    search: { src: 'assets/audio/sfx_search_loot.mp3', gain: 0.55 },
    hit:    { src: 'assets/audio/sfx_hit_enemy.mp3',   gain: 0.72 },
    hurt:   { src: 'assets/audio/sfx_player_hurt.mp3', gain: 0.78 },
    material: { src: pickupSrc, gain: 0.95 }
  };
  const sfxSources = Object.create(null);
  const sfxBuffers = Object.create(null);
  const activeSfx = new Set();
  let sfxPrimed = false;
  let sfxDecodeStarted = false;
  let deferredPickupAt = 0;
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
    return Math.max(0, Math.min(1, (settings.sfxVolume / 100) * multiplier));
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
      // 叮聲以內嵌 bytes 解碼，不依賴額外網路請求；其餘寫實音效沿用檔案載入。
      const bytesPromise = name === 'material'
        ? Promise.resolve(Uint8Array.from(atob(pickupMp3Base64), c => c.charCodeAt(0)).buffer)
        : fetch(cfg.src).then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.arrayBuffer();
          });
      bytesPromise
        .then(buffer => alertContext.decodeAudioData(buffer))
        .then(decoded => {
          sfxBuffers[name] = decoded;
          if (name === 'material' && deferredPickupAt && performance.now() - deferredPickupAt <= 800) {
            deferredPickupAt = 0;
            playSfx('material');
          }
        })
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
    if (!source || !cfg || settings.sfxMuted || settings.sfxVolume <= 0 || document.hidden) return false;

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
      if (promise && typeof promise.catch === 'function') promise.catch(() => {
        cleanup();
        // Safari 可能拒絕讀條結束後（非直接點擊）的 HTMLAudio.play()。
        // 若 Web Audio 尚未解碼完成，短時間內完成時再補播一次。
        if (name === 'material' && !sfxBuffers.material) deferredPickupAt = performance.now();
      });
      return true;
    } catch (err) {
      console.debug(`音效 ${name} 播放失敗`, err);
      return false;
    }
  }

  function unlockAlertAudio() {
    // 音效獨立於 BGM 靜音；解鎖動作一定要在點擊／觸控事件內進行。
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
    for (const suffix of ['', '-menu']) {
      const sfxVolume = document.getElementById('audio-sfx-volume' + suffix);
      const sfxLabel = document.getElementById('audio-sfx-volume-label' + suffix);
      const sfxMute = document.getElementById('audio-sfx-mute' + suffix);
      if (sfxVolume) sfxVolume.value = String(settings.sfxVolume);
      if (sfxLabel) sfxLabel.textContent = settings.sfxVolume + '%';
      if (sfxMute) {
        sfxMute.textContent = settings.sfxMuted ? '🔇 音效關閉' : '🔊 音效開啟';
        sfxMute.setAttribute('aria-pressed', String(settings.sfxMuted));
      }
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
    // 音效試播是在玩家直接點擊時執行，兼作 iOS 首次解鎖及診斷。
    previewPickup() {
      unlockAlertAudio();
      primeSfx();
      playSfx('material');
    },
    setSfxVolume(value) {
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) return;
      settings.sfxVolume = Math.min(100, Math.max(0, Math.round(parsed)));
      if (settings.sfxVolume === 0) stopAllSfx();
      persist(); refresh();
    },
    toggleSfxMute() {
      settings.sfxMuted = !settings.sfxMuted;
      if (settings.sfxMuted) stopAllSfx();
      persist(); refresh();
    },
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

  // 只解鎖，不主動播放聲音。背景音樂維持原本點首頁才啟動。
  document.addEventListener('pointerdown', function (event) {
    if (!event.isTrusted) return;
    unlockAlertAudio();
    primeSfx();
  }, { capture: true, passive: true });

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
