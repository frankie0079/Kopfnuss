/* ============================================
   Digital Smartbox -- Zentraler App-State
   EventBus + Key-Value Store + localStorage
   ============================================ */

class AppState {
  constructor() {
    /** @type {Map<string, Set<Function>>} */
    this._listeners = new Map();
    /** @type {Object} */
    this._data = {};

    // Gespeicherte Settings aus localStorage laden
    this._loadPersisted();
  }

  // ── EventBus ────────────────────────────────

  /**
   * Listener fuer ein Event registrieren.
   * @param {string} event
   * @param {Function} fn
   */
  on(event, fn) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(fn);
  }

  /**
   * Listener entfernen.
   * @param {string} event
   * @param {Function} fn
   */
  off(event, fn) {
    const set = this._listeners.get(event);
    if (set) set.delete(fn);
  }

  /**
   * Event feuern -- alle registrierten Listener aufrufen.
   * @param {string} event
   * @param {*} data
   */
  emit(event, data) {
    const set = this._listeners.get(event);
    if (set) {
      for (const fn of set) {
        try {
          fn(data);
        } catch (err) {
          console.error(`[State] Fehler in Listener fuer '${event}':`, err);
        }
      }
    }
  }

  // ── Key-Value Store ─────────────────────────

  /**
   * Wert lesen.
   * @param {string} key
   * @returns {*}
   */
  get(key) {
    return this._data[key];
  }

  /**
   * Wert setzen und 'change:key' Event feuern.
   * @param {string} key
   * @param {*} value
   */
  set(key, value) {
    const old = this._data[key];
    this._data[key] = value;
    this.emit(`change:${key}`, { key, value, old });
  }

  // ── Persistenz (localStorage) ───────────────

  /** Keys die persistent gespeichert werden */
  static PERSISTED_KEYS = ['theme', 'lastTeamConfig', 'lastTargetScore', 'lastTimerSeconds'];

  /**
   * Persistierte Werte speichern.
   */
  save() {
    const toSave = {};
    for (const key of AppState.PERSISTED_KEYS) {
      if (this._data[key] !== undefined) {
        toSave[key] = this._data[key];
      }
    }
    try {
      localStorage.setItem('smartbox_state', JSON.stringify(toSave));
    } catch (err) {
      console.warn('[State] localStorage Speichern fehlgeschlagen:', err);
    }
  }

  /**
   * Persistierte Werte laden.
   */
  _loadPersisted() {
    try {
      const raw = localStorage.getItem('smartbox_state');
      if (raw) {
        const saved = JSON.parse(raw);
        Object.assign(this._data, saved);
      }
    } catch (err) {
      console.warn('[State] localStorage Laden fehlgeschlagen:', err);
    }
  }
}

export const state = new AppState();
