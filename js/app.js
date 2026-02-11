/* ============================================
   Digital Smartbox -- App Entry Point + Router
   ============================================ */

import { state } from './state.js';

// ── SPA Router ──────────────────────────────

const router = {
  /** @type {Map<string, { init: Function, destroy: Function }>} */
  _views: new Map(),

  /** @type {string|null} */
  _currentView: null,

  /**
   * View registrieren.
   * @param {string} name  -- muss id="view-{name}" im DOM haben
   * @param {Function} init -- wird aufgerufen wenn View angezeigt wird
   * @param {Function} [destroy] -- wird aufgerufen wenn View verlassen wird
   */
  register(name, init, destroy = () => {}) {
    this._views.set(name, { init, destroy });
  },

  /**
   * Zu einer View navigieren.
   * @param {string} name
   * @param {*} [params] -- optionale Daten fuer die View
   */
  navigate(name, params) {
    if (!this._views.has(name)) {
      console.error(`[Router] View '${name}' nicht registriert.`);
      return;
    }

    // Aktuelle View aufraumen
    if (this._currentView) {
      const current = this._views.get(this._currentView);
      const currentEl = document.getElementById(`view-${this._currentView}`);
      if (current && current.destroy) {
        current.destroy();
      }
      if (currentEl) {
        currentEl.classList.remove('active', 'fade-in');
      }
    }

    // Neue View anzeigen
    const next = this._views.get(name);
    const nextEl = document.getElementById(`view-${name}`);

    if (nextEl) {
      nextEl.classList.add('active', 'fade-in');
      // fade-in Klasse nach Animation entfernen
      nextEl.addEventListener('animationend', () => {
        nextEl.classList.remove('fade-in');
      }, { once: true });
    }

    this._currentView = name;
    state.set('currentView', name);

    // View initialisieren
    if (next && next.init) {
      next.init(params);
    }
  },

  /**
   * Aktuelle View-Name zurueckgeben.
   * @returns {string|null}
   */
  getCurrentView() {
    return this._currentView;
  }
};

// Router global verfuegbar machen
export { router };

// ── App Initialisierung ─────────────────────

async function initApp() {
  // Theme aus localStorage anwenden
  const savedTheme = state.get('theme');
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
  }

  // Views registrieren (mit Error-Handling)
  try {
    const [setup, game, victory, imp] = await Promise.all([
      import('./views/setup.js'),
      import('./views/game.js'),
      import('./views/victory.js'),
      import('./views/import.js')
    ]);
    setup.registerSetup();
    game.registerGame();
    victory.registerVictory();
    imp.registerImport();
  } catch (err) {
    console.error('[App] View-Import fehlgeschlagen:', err);
    document.getElementById('app').innerHTML =
      '<p style="padding:2rem;color:red;font-size:1.2rem;">Fehler beim Laden. Bitte Seite neu laden (F5).</p>';
    return;
  }

  // Service Worker registrieren (nur Produktion)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }

  // Standard-View: Setup
  router.navigate('setup');
}

// ── Start ───────────────────────────────────

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
