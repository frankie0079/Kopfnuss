/* ============================================
   Kopfnuss! -- Audio Manager
   Web Audio API Synthese als Fallback
   (echte MP3s koennen spaeter ergaenzt werden)
   ============================================ */

class AudioManager {
  constructor() {
    /** @type {AudioContext|null} */
    this._ctx = null;
    this._muted = false;
    this._initialized = false;
  }

  /**
   * AudioContext initialisieren (muss nach User-Interaktion passieren).
   */
  _ensureContext() {
    if (!this._ctx) {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this._ctx.state === 'suspended') {
      this._ctx.resume();
    }
  }

  /**
   * Sound abspielen.
   * @param {'correct'|'wrong'|'fanfare'|'tick'} soundName
   */
  play(soundName) {
    if (this._muted) return;

    try {
      this._ensureContext();

      switch (soundName) {
        case 'correct':  this._playCorrect(); break;
        case 'wrong':    this._playWrong(); break;
        case 'fanfare':  this._playFanfare(); break;
        case 'tick':     this._playTick(); break;
      }
    } catch (err) {
      console.warn('[Audio] Fehler beim Abspielen:', err);
    }
  }

  /**
   * Zufaelligen Freudensound abspielen (5 Varianten).
   */
  playRandomJoy() {
    if (this._muted) return;

    try {
      this._ensureContext();
      const joyFns = [
        () => this._playJoy1(),
        () => this._playJoy2(),
        () => this._playJoy3(),
        () => this._playJoy4(),
        () => this._playJoy5(),
      ];
      const fn = joyFns[Math.floor(Math.random() * joyFns.length)];
      fn();
    } catch (err) {
      console.warn('[Audio] Fehler beim Joy-Sound:', err);
    }
  }

  /**
   * Stummschaltung setzen.
   * @param {boolean} muted
   */
  setMuted(muted) {
    this._muted = muted;
  }

  /** @returns {boolean} */
  get isMuted() {
    return this._muted;
  }

  // ── Synthetische Sounds (Web Audio API) ────

  /**
   * Richtig: aufsteigender Dreiklang (freudig).
   */
  _playCorrect() {
    const ctx = this._ctx;
    const now = ctx.currentTime;

    // Drei aufsteigende Toene
    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
    frequencies.forEach((freq, i) => {
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
  }

  /**
   * Falsch: absteigender Ton (enttaeuschend).
   */
  _playWrong() {
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

    // Zweiter tiefer Ton
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(200, now + 0.1);
    osc2.frequency.exponentialRampToValueAtTime(100, now + 0.6);
    gain2.gain.setValueAtTime(0.15, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.8);
  }

  /**
   * Fanfare: triumphale Melodie.
   */
  _playFanfare() {
    const ctx = this._ctx;
    const now = ctx.currentTime;

    // Fanfare: C-E-G-C(hoch)
    const notes = [
      { freq: 523.25, start: 0,    dur: 0.2 },   // C5
      { freq: 659.25, start: 0.2,  dur: 0.2 },   // E5
      { freq: 783.99, start: 0.4,  dur: 0.2 },   // G5
      { freq: 1046.5, start: 0.6,  dur: 0.6 },   // C6 (lang)
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

    // Bass-Untermalung
    const bass = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bass.type = 'sine';
    bass.frequency.value = 130.81; // C3
    bassGain.gain.setValueAtTime(0.15, now);
    bassGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    bass.connect(bassGain);
    bassGain.connect(ctx.destination);
    bass.start(now);
    bass.stop(now + 1.3);
  }

  /**
   * Tick: kurzer Klick (Timer).
   */
  _playTick() {
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
  }

  // ── Freudengeraeusche (5 Varianten) ────────

  /** Joy 1: Schnelles aufsteigendes Glissando */
  _playJoy1() {
    const ctx = this._ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.25);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.setValueAtTime(0.25, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.45);
  }

  /** Joy 2: Doppelter hoher Ping (bling-bling) */
  _playJoy2() {
    const ctx = this._ctx;
    const now = ctx.currentTime;
    [0, 0.15].forEach((delay, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = i === 0 ? 1200 : 1500;
      gain.gain.setValueAtTime(0.2, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + 0.25);
    });
  }

  /** Joy 3: Jubel-Akkord (Dur-Dreiklang mit Shimmer) */
  _playJoy3() {
    const ctx = this._ctx;
    const now = ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    freqs.forEach(freq => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.setValueAtTime(0.12, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.55);
    });
  }

  /** Joy 4: Aufsteigendes Xylophon (4 schnelle Toene) */
  _playJoy4() {
    const ctx = this._ctx;
    const now = ctx.currentTime;
    const notes = [587.33, 698.46, 880, 1174.66]; // D5, F5, A5, D6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = now + i * 0.08;
      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.3);
    });
  }

  /** Joy 5: Freudiges Whoop (Frequenz-Sweep hoch mit Vibrato) */
  _playJoy5() {
    const ctx = this._ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.15);
    osc.frequency.setValueAtTime(900, now + 0.15);
    osc.frequency.exponentialRampToValueAtTime(1100, now + 0.35);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.setValueAtTime(0.2, now + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.5);

    // Leichtes Vibrato
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 12;
    lfoGain.gain.value = 30;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start(now + 0.15);
    lfo.stop(now + 0.5);
  }
}

export const audio = new AudioManager();
