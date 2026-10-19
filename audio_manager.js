/* 台灣生存戰 V19.43 — A 黑暗生存配樂 (BGM only). */
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

  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch (_) {}
  }
  function refresh() {
    const volume = document.getElementById('audio-volume');
    const label = document.getElementById('audio-volume-label');
    const mute = document.getElementById('audio-mute-button');
    if (volume) volume.value = String(settings.volume);
    if (label) label.textContent = settings.volume + '%';
    if (mute) {
      mute.textContent = settings.muted ? '🔇 已靜音' : '🔊 音樂開啟';
      mute.setAttribute('aria-pressed', String(settings.muted));
    }
    for (const id of ['audio-button-lobby', 'audio-button-game']) {
      const btn = document.getElementById(id);
      if (!btn) continue;
      btn.textContent = settings.muted || settings.volume === 0 ? '🔇' : '🎵';
      btn.title = settings.muted ? '音樂已靜音（點擊調整）' : '音樂設定';
    }
  }
  const GameAudio = {
    play() {
      started = true;
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
      else this.play();
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
