/* 台灣生存戰 V19.45 — A 黑暗生存配樂 + 封區警報 (BGM only). */
(function () {
  'use strict';
  const KEY = 'formosa_survival_bgm_v1';
  let settings = { volume: 30, muted: false };
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved && typeof saved === 'object') {
      if (Number.isFinite(+saved.volume)) settings.volume = Math.min(100, Math.max(0, +saved.volume));
      settings.muted = saved.muted === true;
    }
  } catch (_) { /* Private mode / file:// may disable localStorage. */ }
  const audio = new Audio('assets/audio/dark_survival_loop.mp3');
  audio.loop = true;
  audio.preload = 'none'; // Don't compete with critical scene and character images.
  audio.volume = settings.volume / 100;
  let started = false;
  let suspendedByVisibility = false;
  let alertContext = null;
  let warningActive = false;
  let lastWarningAt = -Infinity;

  // Create / resume an AudioContext from the same real user gesture that starts BGM.
  // Safari cannot start Web Audio later from an unattended game timer.
  function unlockAlertAudio() {
    if (settings.muted || settings.volume <= 0) return;
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return;
    try {
      if (!alertContext) alertContext = new Ctor();
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
      // Two gentle descending alert tones, 0.35 s total; avoid shrill continuous sirens.
      for (const [offset, freq] of [[0, 660], [0.19, 470]]) {
        const oscillator = alertContext.createOscillator();
        const gain = alertContext.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(freq, t + offset);
        const peak = 0.17 * (settings.volume / 100);
        gain.gain.setValueAtTime(0.0001, t + offset);
        gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + offset + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + offset + 0.16);
        oscillator.connect(gain); gain.connect(alertContext.destination);
        oscillator.start(t + offset);
        oscillator.stop(t + offset + 0.165);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      }
    } catch (err) { console.debug('禁區警報音播放失敗', err); }
  }

  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch (_) {}
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
    for (const id of ['audio-button-lobby']) {
      const btn = document.getElementById(id);
      if (!btn) continue;
      btn.textContent = settings.muted || settings.volume === 0 ? '🔇' : '🎵';
      btn.title = settings.muted ? '音樂已靜音（點擊調整）' : '音樂設定';
    }
  }
  const GameAudio = {
    refresh,
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
      if (settings.muted || settings.volume === 0 || document.hidden) return;
      audio.volume = settings.volume / 100;
      // iPhone Safari only permits playback after a user gesture.
      const promise = audio.play();
      if (promise && typeof promise.catch === 'function') {
        promise.catch(err => { console.info('音樂等待使用者操作才能播放:', err && err.message); });
      }
    },
    setVolume(value) {
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) return;
      settings.volume = Math.max(0, Math.min(100, Math.round(parsed)));
      audio.volume = settings.volume / 100;
      persist(); refresh();
      if (settings.volume === 0) audio.pause();
      else if (started && !settings.muted && !document.hidden) this.play();
    },
    toggleMute() {
      settings.muted = !settings.muted;
      persist(); refresh();
      if (settings.muted) audio.pause();
      else {
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
    // Expose playback state only for testing / debugging.
    getState() { return { ...settings, started, paused: audio.paused, src: audio.currentSrc }; }
  };
  window.GameAudio = GameAudio;
  // Browsers (especially iPhone Safari) generally forbid sound on page load.
  // Start it synchronously inside the first real click/tap gesture in the lobby.
  // Capturing lets music begin BEFORE the click triggers an async loading flow.
  // If the browser initially refuses, the next tap gives another valid gesture.
  document.addEventListener('click', function (event) {
    const lobby = document.getElementById('lobby-screen');
    if (!lobby || lobby.classList.contains('hidden')) return;
    if (!event.isTrusted || settings.muted || settings.volume === 0 || document.hidden) return;
    if (audio.paused) GameAudio.play();
  }, true);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      suspendedByVisibility = started && !audio.paused;
      audio.pause();
    } else if (suspendedByVisibility && started && !settings.muted) {
      suspendedByVisibility = false;
      GameAudio.play();
    }
  });
  window.addEventListener('pagehide', () => audio.pause());
  refresh();
})();
