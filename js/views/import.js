/* ============================================
   Kopfnuss! -- Import-Screen View
   ZIP-Import + Kartenset-Verwaltung
   ============================================ */

import { router } from '../app.js';
import { cardStore } from '../services/card-store.js';
import { importZip } from '../services/zip-import.js';
import { getSetMeta } from '../models/card.js';
import { DEMO_SET } from '../data/demo-set.js';

// ── Init / Destroy ──────────────────────────

async function initImport() {
  await cardStore.init();
  await _render();
}

function destroyImport() {
  const el = document.getElementById('view-import');
  el.innerHTML = '';
}

// ── Render ───────────────────────────────────

async function _render() {
  const el = document.getElementById('view-import');

  // Importierte Sets laden
  let sets = [];
  try {
    const allSets = await cardStore.getAllSets();
    sets = (allSets || []).map(s => getSetMeta(s));
  } catch (err) {
    console.warn('[Import] Sets laden fehlgeschlagen:', err);
  }

  el.innerHTML = `
    <div class="flex-col gap-lg" style="max-width: 600px; width: 100%;">
      <h2>Kartensets verwalten</h2>

      <!-- Import -->
      <div class="setup-section">
        <h3>Neues Kartenset importieren</h3>
        <p style="margin-bottom: var(--space-md); color: var(--text-secondary);">
          Waehle eine ZIP-Datei mit set.json und images/-Ordner.
        </p>
        <div class="flex-row gap-md">
          <input type="file" id="zip-file-input" accept=".zip" style="display: none;">
          <button class="btn-primary" id="btn-choose-zip">ZIP-Datei waehlen</button>
          <span id="zip-filename" style="color: var(--text-secondary);"></span>
        </div>
        <div id="import-status" style="margin-top: var(--space-md);"></div>
      </div>

      <!-- Vorhandene Sets -->
      <div class="setup-section">
        <h3>Vorhandene Kartensets</h3>
        <div id="set-list" class="flex-col gap-sm" style="margin-top: var(--space-md);">
          <div class="set-row" style="padding: var(--space-md); background: var(--bg-secondary); border-radius: var(--radius-md);">
            <div class="flex-between">
              <div>
                <strong>${_escapeHtml(DEMO_SET.setName)}</strong>
                <br><small style="color: var(--text-secondary);">${DEMO_SET.cards.length} Karten &middot; ${_escapeHtml(DEMO_SET.category)}</small>
              </div>
              <span style="color: var(--text-secondary); font-size: var(--font-size-sm);">Fest eingebaut</span>
            </div>
          </div>
          ${sets.map(s => `
            <div class="set-row" style="padding: var(--space-md); background: var(--bg-secondary); border-radius: var(--radius-md);">
              <div class="flex-between">
                <div>
                  <strong>${_escapeHtml(s.setName)}</strong>
                  <br><small style="color: var(--text-secondary);">${s.cardCount} Karten &middot; ${_escapeHtml(s.category)}</small>
                </div>
                <button class="btn-danger" data-delete-set="${s.id}" style="padding: var(--space-xs) var(--space-md); font-size: var(--font-size-sm);">
                  Loeschen
                </button>
              </div>
            </div>
          `).join('')}
          ${sets.length === 0 ? '<p style="color: var(--text-secondary);">Noch keine importierten Kartensets.</p>' : ''}
        </div>
      </div>

      <!-- Zurueck -->
      <button class="btn-ghost" id="btn-back" style="align-self: center;">Zurueck zum Setup</button>
    </div>
  `;

  _bindEvents();
}

// ── Events ──────────────────────────────────

function _bindEvents() {
  // File-Input triggern
  document.getElementById('btn-choose-zip')?.addEventListener('click', () => {
    document.getElementById('zip-file-input')?.click();
  });

  // File ausgewaehlt
  document.getElementById('zip-file-input')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    document.getElementById('zip-filename').textContent = file.name;

    const statusEl = document.getElementById('import-status');
    statusEl.innerHTML = '<p style="color: var(--accent);">Importiere...</p>';

    const result = await importZip(file);

    if (result.success) {
      statusEl.innerHTML = `
        <p style="color: var(--success);">
          "${_escapeHtml(result.setName)}" erfolgreich importiert (${result.cardCount} Karten).
        </p>
      `;
      // Liste aktualisieren
      setTimeout(() => _render(), 1000);
    } else {
      statusEl.innerHTML = `
        <p style="color: var(--danger);">
          Import fehlgeschlagen:<br>
          ${result.errors.map(e => `&bull; ${_escapeHtml(e)}`).join('<br>')}
        </p>
      `;
    }
  });

  // Sets loeschen
  document.querySelectorAll('[data-delete-set]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const setId = btn.dataset.deleteSet;
      if (confirm('Kartenset wirklich loeschen?')) {
        await cardStore.deleteSet(setId);
        await _render();
      }
    });
  });

  // Zurueck
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
