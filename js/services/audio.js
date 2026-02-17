/* ============================================
   Kopfnuss! -- Audio Manager
   MP3-Sounds mit Web Audio API Synthese-Fallback
   ============================================ */

const SOUND_BASE = './assets/sounds/';

const SOUND_FILES = {
  correct: ['correct-1.mp3', 'correct-2.mp3', 'correct-3.mp3', 'correct-4.mp3', 'correct-5.mp3'],
  wrong:   ['wrong-1.mp3', 'wrong-2.mp3', 'wrong-3.mp3'],
  victory: ['victory-1.mp3', 'victory-2.mp3', 'victory-3.mp3'],
  timer:   ['timer-10s.mp3']
};

class AudioManager {
  constructor() {
    /** @type {AudioContext|null} */
    this._ctx = null;
    this._muted = false;

    /** @type {Map<string, HTMLAudioElement[]>} */
    this._pools = new Map();

    /** @type {HTMLAudioElement|null} */
    this._timerAudio = null;

    /** @type {HTMLAudioElement|null} */
    this._currentSound = null;

    this._preloaded = false;
  }

  /**
   * Alle MP3s vorladen. Sicher nach User-Interaktion aufrufen.
   */
  preload() {
    if (this._preloaded) return;
    this._preloaded = true;

    for (const [category, files] of Object.entries(SOUND_FILES)) {
      const pool = files.map(file => {
        const a = new Audio(SOUND_BASE + file);
        a.preload = 'auto';
        a.load();
        return a;
      });
      this._pools.set(category, pool);
    }
  }

  // ── Oeffentliche API ──────────────────────

  /**
   * Zufaelligen "Richtig"-Sound abspielen.
   */
  playCorrect() {
    if (this._muted) return;
    this.preload();
    if (!this._playRandom('correct', 3)) {
      this._synthCorrect();
    }
  }

  /**
   * Zufaelligen "Falsch"-Sound abspielen.
   */
  playWrong() {
    if (this._muted) return;
    this.preload();
    if (!this._playRandom('wrong', 3)) {
      this._synthWrong();
    }
  }

  /**
   * Zufaelligen Victory-Sound abspielen.
   */
  playVictory() {
    if (this._muted) return;
    this.preload();
    if (!this._playRandom('victory')) {
      this._synthFanfare();
    }
  }

  /**
   * Timer-Countdown starten (10s durchgehender Clip).
   */
  playTimerCountdown() {
    if (this._muted) return;
    this.preload();

    this.stopTimerCountdown();

    const pool = this._pools.get('timer');
    if (pool && pool.length > 0) {
      const a = pool[0];
      a.currentTime = 0;
      a.volume = 0.8;
      a.play().catch(() => {});
      this._timerAudio = a;
    }
  }

  /**
   * Timer-Countdown stoppen.
   */
  stopTimerCountdown() {
    if (this._timerAudio) {
      this._timerAudio.pause();
      this._timerAudio.currentTime = 0;
      this._timerAudio = null;
    }
  }

  /**
   * Generischer Sound (Abwaertskompatibilitaet).
   * @param {'correct'|'wrong'|'fanfare'|'tick'} soundName
   */
  play(soundName) {
    if (this._muted) return;

    switch (soundName) {
      case 'correct': this.playCorrect(); break;
      case 'wrong':   this.playWrong(); break;
      case 'fanfare': this.playVictory(); break;
      case 'tick':    this._synthTick(); break;
    }
  }

  /**
   * Zufaelligen Freudensound (Alias fuer playCorrect).
   */
  playRandomJoy() {
    this.playCorrect();
  }

  /**
   * Alle laufenden Sounds sofort stoppen.
   */
  stopAll() {
    this._stopCurrent();
    this.stopTimerCountdown();
  }

  /**
   * Stummschaltung.
   * @param {boolean} muted
   */
  setMuted(muted) {
    this._muted = muted;
    if (muted) {
      this.stopAll();
    }
  }

  /** @returns {boolean} */
  get isMuted() {
    return this._muted;
  }

  // ── MP3-Wiedergabe ────────────────────────

  /**
   * Zufaellige MP3 aus einer Kategorie abspielen.
   * @param {string} category
   * @param {number} [maxDuration] Max. Wiedergabedauer in Sekunden (0 = unbegrenzt)
   * @returns {boolean} true wenn erfolgreich
   */
  _playRandom(category, maxDuration = 0) {
    const pool = this._pools.get(category);
    if (!pool || pool.length === 0) return false;

    const idx = Math.floor(Math.random() * pool.length);
    const a = pool[idx];

    try {
      this._stopCurrent();
      a.currentTime = 0;
      a.volume = 1.0;
      a.play().catch(() => {});
      this._currentSound = a;

      if (maxDuration > 0) {
        this._fadeOutTimer = setTimeout(() => {
          if (this._currentSound === a) {
            this._fadeOut(a);
          }
        }, (maxDuration - 0.5) * 1000);
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Sanftes Ausblenden eines Audio-Elements (500ms Fade-Out).
   */
  _fadeOut(audioEl) {
    const steps = 10;
    const interval = 50;
    let vol = audioEl.volume;
    const dec = vol / steps;
    const fade = setInterval(() => {
      vol -= dec;
      if (vol <= 0) {
        clearInterval(fade);
        audioEl.pause();
        audioEl.currentTime = 0;
        audioEl.volume = 1.0;
        if (this._currentSound === audioEl) this._currentSound = null;
      } else {
        audioEl.volume = vol;
      }
    }, interval);
  }

  _stopCurrent() {
    if (this._fadeOutTimer) {
      clearTimeout(this._fadeOutTimer);
      this._fadeOutTimer = null;
    }
    if (this._currentSound) {
      this._currentSound.pause();
      this._currentSound.currentTime = 0;
      this._currentSound.volume = 1.0;
      this._currentSound = null;
    }
  }

  // ── Synthese-Fallback (Web Audio API) ─────

  _ensureContext() {
    if (!this._ctx) {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this._ctx.state === 'suspended') {
      this._ctx.resume();
    }
  }

  _synthCorrect() {
    try {
      this._ensureContext();
      const ctx = this._ctx;
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.3, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.5);
      });
    } catch { /* silent */ }
  }

  _synthWrong() {
    try {
      this._ensureContext();
      const ctx = this._ctx;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.5);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.7);
    } catch { /* silent */ }
  }

  _synthFanfare() {
    try {
      this._ensureContext();
      const ctx = this._ctx;
      const now = ctx.currentTime;
      const notes = [
        { freq: 523.25, start: 0, dur: 0.2 },
        { freq: 659.25, start: 0.2, dur: 0.2 },
        { freq: 783.99, start: 0.4, dur: 0.2 },
        { freq: 1046.5, start: 0.6, dur: 0.6 },
      ];
      notes.forEach(note => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = note.freq;
        gain.gain.setValueAtTime(0.2, now + note.start);
        gain.gain.setValueAtTime(0.2, now + note.start + note.dur * 0.7);
        gain.gain.exponentialRampToValueAtTime(0.001, now + note.start + note.dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + note.start);
        osc.stop(now + note.start + note.dur + 0.1);
      });
    } catch { /* silent */ }
  }

  _synthTick() {
    try {
      this._ensureContext();
      const ctx = this._ctx;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 800;
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } catch { /* silent */ }
  }
}

export const audio = new AudioManager();

// Sounds stoppen wenn Tab unsichtbar wird (iPad-Deckel zu, Tab-Wechsel)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) audio.stopAll();
});
