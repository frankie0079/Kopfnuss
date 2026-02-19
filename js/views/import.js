/* ============================================
   Kopfnuss! -- Karteninfo-Screen
   Zeigt Uebersicht des Kartenpools und
   verlinkt zur Kartenverwaltung (Admin).
   ============================================ */

import { router } from '../app.js?v=69';
import { CARDS } from '../data/cards.js';

// ── Init / Destroy ──────────────────────────

function initImport() {
  _render();
}

function destroyImport() {
  const el = document.getElementById('view-import');
  el.innerHTML = '';
}

// ── Render ───────────────────────────────────

function _render() {
  const el = document.getElementById('view-import');
  const cards = CARDS.cards;
  const total = cards.length;

  // Kategorien zaehlen
  const cats = {};
  for (const card of cards) {
    const cat = card.category || 'Allgemeinwissen';
    cats[cat] = (cats[cat] || 0) + 1;
  }

  el.innerHTML = `
    <div class="flex-col gap-lg" style="max-width: 600px; width: 100%;">
      <h2>Kartenpool</h2>

      <div class="setup-section">
        <h3>${total} Karten verfuegbar</h3>
        <p style="margin-bottom: var(--space-md); color: var(--text-secondary);">
          Version ${CARDS.version} &middot; Aktualisiert: ${new Date(CARDS.updatedAt).toLocaleDateString('de-DE')}
        </p>

        <div style="display: flex; flex-direction: column; gap: var(--space-sm); margin-top: var(--space-md);">
          ${Object.entries(cats).sort((a, b) => b[1] - a[1]).map(([name, count]) => `
            <div style="display: flex; justify-content: space-between; padding: var(--space-sm) var(--space-md); background: var(--bg-secondary); border-radius: var(--radius-md);">
              <span style="font-weight: 600;">${_escapeHtml(name)}</span>
              <span style="color: var(--text-secondary);">${count} Karten</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="setup-section">
        <h3>Karten verwalten</h3>
        <p style="margin-bottom: var(--space-md); color: var(--text-secondary);">
          Neue Karten erfassen, pruefen und exportieren.
        </p>
        <button class="btn-primary" id="btn-goto-admin" style="width: 100%;">
          Kartenverwaltung oeffnen
        </button>
      </div>

      <button class="btn-ghost" id="btn-back" style="align-self: center;">Zurueck zum Setup</button>
    </div>
  `;

  document.getElementById('btn-goto-admin')?.addEventListener('click', () => {
    router.navigate('admin');
  });

  document.getElementById('btn-back')?.addEventListener('click', () => {
    router.navigate('setup');
  });
}

function _escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ── Export / Registrierung ──────────────────

export function registerImport() {
  router.register('import', initImport, destroyImport);
}
