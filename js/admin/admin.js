/* ============================================
   Kopfnuss! -- Admin-Bereich (Kartenmanager)
   Bridge zwischen Kartenmanager-Views und
   dem Spiel-Router.
   ============================================ */

import { router } from '../app.js';
import { registerBatchImport } from './batch-import.js';
import { registerLibrary } from './library.js';
import { registerCardEditor } from './card-editor.js';
import { registerSettings } from './settings.js';
import { cardDB } from './card-db.js';
import { CARDS } from '../data/cards.js';

// ── Kompatibilitaets-App-Objekt ─────────────
// Die Kartenmanager-Views erwarten ein `app`-Objekt
// mit Event-System und Navigation. Diese Bridge
// uebersetzt zum Spiel-Router.

const adminApp = {
  _listeners: {},
  reviewData: null,
  editCardId: null,

  on(event, fn) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(fn);
  },

  emit(event, data) {
    (this._listeners[event] || []).forEach(fn => fn(data));
  },

  navigate(viewName) {
    // Admin-Views nutzen 'batch', 'library', 'card-editor', 'settings', 'admin'
    // sowie 'home' -> zurueck zum Spiel-Setup
    if (viewName === 'home') {
      router.navigate('setup');
    } else {
      router.navigate(viewName);
    }
  }
};

// ── Admin-Views registrieren ────────────────

export function registerAdmin() {
  // Views beim Kartenmanager-App-Objekt registrieren
  registerBatchImport(adminApp);
  registerLibrary(adminApp);
  registerCardEditor(adminApp);
  registerSettings(adminApp);

  // Admin-Hub: Einstiegsseite fuer den Admin-Bereich
  router.register('admin', async () => {
    // Standard-Kategorien sicherstellen
    await cardDB.initDefaultCategories();

    // Nur bei komplett leerer DB: Karten aus cards.js importieren
    const existingCount = await cardDB.getCardCount();
    if (existingCount === 0) {
      await syncCardsToAdminDB();
    }

    // Einmalige Kategorie-Reparatur (v1)
    await repairCategoriesOnce();

    const el = document.getElementById('view-admin');
    el.innerHTML = `
      <div class="admin-container" style="display:flex; flex-direction:column; align-items:center; gap:24px; padding-top:32px;">
        <h2>Kartenmanager</h2>

        <div class="admin-nav-grid" style="width:100%;">
          <button class="admin-nav-btn" id="admin-goto-batch">
            <span class="admin-nav-icon">&#x1F4E5;</span>
            <span class="admin-nav-label">Batch-Import</span>
            <span class="admin-nav-desc">Neue Karten pruefen</span>
          </button>
          <button class="admin-nav-btn" id="admin-goto-library">
            <span class="admin-nav-icon">&#x1F4DA;</span>
            <span class="admin-nav-label">Kartenbibliothek</span>
            <span class="admin-nav-desc">Alle Karten anzeigen</span>
          </button>
          <button class="admin-nav-btn" id="admin-goto-settings">
            <span class="admin-nav-icon">&#x2699;</span>
            <span class="admin-nav-label">Einstellungen</span>
            <span class="admin-nav-desc">API-Keys verwalten</span>
          </button>
        </div>

        <div id="admin-import-section" style="width:100%; text-align:center;">
          <p id="admin-import-status" style="font-size:14px; color:#888;"></p>
        </div>

        <div id="admin-paste-import" style="width:100%;"></div>

        <button class="admin-back-btn" id="admin-back">
          &larr; Zurueck zum Spiel
        </button>
      </div>
    `;

    // Generierte Karten-Sets automatisch importieren
    autoImportGeneratedCards(el.querySelector('#admin-import-section'));

    // Paste-Import (JSON) rendern
    renderPasteImport(el.querySelector('#admin-paste-import'));

    el.querySelector('#admin-goto-batch')?.addEventListener('click', () => {
      router.navigate('batch');
      adminApp.emit('show:batch');
    });
    el.querySelector('#admin-goto-library')?.addEventListener('click', () => {
      router.navigate('library');
      adminApp.emit('show:library');
    });
    el.querySelector('#admin-goto-settings')?.addEventListener('click', () => {
      router.navigate('settings');
      adminApp.emit('show:settings');
    });
    el.querySelector('#admin-back')?.addEventListener('click', () => {
      router.navigate('setup');
    });
  });

  // Batch-Import View beim Router registrieren
  router.register('batch', () => {
    adminApp.emit('show:batch');
  }, () => {});

  // Library View
  router.register('library', () => {
    adminApp.emit('show:library');
  }, () => {});

  // Card-Editor View
  router.register('card-editor', () => {
    adminApp.emit('show:card-editor');
  }, () => {});

  // Settings View
  router.register('settings', () => {
    adminApp.emit('show:settings');
  }, () => {});
}

// ── Einmalige Kategorie-Reparatur ───────────────
// Korrigiert die Kategorien aller Karten in der Admin-DB
// anhand der korrekten Werte aus cards.js.
// Laeuft nur einmal (localStorage-Flag).

async function repairCategoriesOnce() {
  const FLAG = 'kopfnuss_cat_repair_v1';
  if (localStorage.getItem(FLAG)) return;

  try {
    // Lookup: prompt -> korrekte Kategorie aus cards.js
    const correctCats = {};
    for (const gc of CARDS.cards) {
      const prompt = gc.prompt?.text || '';
      if (prompt) correctCats[prompt] = gc.category || 'Allgemeinwissen';
    }

    const allCards = await cardDB.getAllCards();
    let fixed = 0;

    for (const card of allCards) {
      const correct = correctCats[card.prompt];
      if (correct && card.category !== correct) {
        card.category = correct;
        await cardDB.saveCard(card);
        fixed++;
      }
    }

    localStorage.setItem(FLAG, Date.now().toString());
    if (fixed > 0) {
      console.log(`[Admin] Kategorie-Reparatur: ${fixed} Karten korrigiert.`);
    } else {
      console.log('[Admin] Kategorie-Reparatur: Alle Kategorien bereits korrekt.');
    }
  } catch (err) {
    console.warn('[Admin] Kategorie-Reparatur fehlgeschlagen:', err);
  }
}

// ── Erstbefuellung: cards.js in leere Admin-DB ─

async function syncCardsToAdminDB() {
  try {
    let imported = 0;

    for (const gameCard of CARDS.cards) {
      const promptText = gameCard.prompt?.text || '';
      if (!promptText) continue;

      const firstSolType = gameCard.items?.[0]?.solution?.type || 'boolean_true';
      const detectedType = firstSolType === 'text' ? 'text' : 'boolean';

      // Kategorie-Mapping: "Kino" -> Standard-Kategorie
      let category = gameCard.category || 'Allgemeinwissen';
      if (category === 'Kino') category = 'Musik/Entertainment/Movie';

      const items = (gameCard.items || []).map((item, i) => ({
        position: i + 1,
        label: item.label?.text || '',
        solution: item.solution?.type === 'boolean_true',
        solutionText: item.solution?.text || ''
      }));

      await cardDB.saveCard({
        prompt: promptText,
        category,
        cardType: detectedType,
        items,
        setName: 'Kopfnuss Kartenset',
        sourceType: category === 'Musik/Entertainment/Movie' ? 'generated' : 'import'
      });
      imported++;
    }

    if (imported > 0) {
      console.log(`[Admin] Erstbefuellung: ${imported} Karten aus cards.js importiert.`);
    }
  } catch (err) {
    console.warn('[Admin] Erstbefuellung fehlgeschlagen:', err);
  }
}

// ── Generierte Karten importieren ───────────

const GENERATED_SETS = [
  { module: '../data/generated-kino.js', exportName: 'KINO_CARDS', label: '10 Kino-Karten', categoryName: 'Kino' },
  { module: '../data/generated-slogans.js', exportName: 'SLOGAN_CARDS', label: '2 Werbeslogan-Karten', categoryName: 'Wirtschaft' }
];

async function autoImportGeneratedCards(container) {
  if (!container) return;

  const existingCards = await cardDB.getAllCards();
  const existingPrompts = new Set(existingCards.map(c => c.prompt));

  let totalImported = 0;
  const messages = [];

  for (const set of GENERATED_SETS) {
    try {
      const mod = await import(set.module);
      const cards = mod[set.exportName];
      if (!cards || !Array.isArray(cards)) continue;

      const newCards = cards.filter(c => !existingPrompts.has(c.prompt));

      if (newCards.length === 0) {
        messages.push(`<span style="color:#27AE60;">&#x2713; ${set.label}</span>`);
        continue;
      }

      // Kategorie anlegen falls noetig
      if (set.categoryName) {
        const cats = await cardDB.getAllCategories();
        if (!cats.find(c => c.name === set.categoryName)) {
          await cardDB.saveCategory({ name: set.categoryName, color: '#E74C3C' });
        }
      }

      // Automatisch importieren
      for (const card of newCards) {
        existingPrompts.add(card.prompt);
        await cardDB.saveCard({
          prompt: card.prompt,
          category: card.category || set.categoryName || 'Allgemeinwissen',
          cardType: card.cardType || 'boolean',
          items: card.items,
          setName: 'Kopfnuss Kartenset',
          sourceType: 'generated'
        });
        totalImported++;
      }

      messages.push(`<span style="color:#27AE60;">&#x2713; ${newCards.length} ${set.label} importiert</span>`);
      console.log(`[Auto-Import] ${newCards.length} ${set.label} in die Bibliothek importiert.`);
    } catch {
      // Modul nicht vorhanden -- still ignorieren
    }
  }

  if (messages.length > 0) {
    container.innerHTML = `
      <p style="font-size:13px; color:#888; margin-bottom:4px;">Kartensets:</p>
      <p style="font-size:13px;">${messages.join(' &middot; ')}</p>
      ${totalImported > 0 ? `<p style="font-size:14px; color:#27AE60; font-weight:600; margin-top:8px;">
        ${totalImported} neue Karte(n) automatisch importiert!
      </p>` : ''}
    `;
  }
}

// ── Paste-Import (JSON) ──────────────────────

function renderPasteImport(container) {
  if (!container) return;

  container.innerHTML = `
    <details style="width:100%; text-align:left;">
      <summary style="cursor:pointer; font-size:15px; font-weight:600; padding:8px 0;">
        Karten importieren (JSON)
      </summary>
      <div style="margin-top:12px;">
        <p style="font-size:13px; color:#888; margin-bottom:8px;">
          JSON von Claude, ChatGPT oder einer anderen KI hier einfuegen:
        </p>
        <textarea id="paste-import-json" rows="8"
          style="width:100%; font-family:monospace; font-size:13px; padding:8px;
                 border:1px solid #ddd; border-radius:6px; resize:vertical;"
          placeholder='[{ "prompt": "Frage?", "category": "Kategorie", "cardType": "text", "items": [{ "label": "...", "solution": "..." }] }]'></textarea>
        <div style="display:flex; gap:8px; margin-top:8px; align-items:center;">
          <button class="btn btn-primary" id="btn-paste-import"
            style="width:auto; padding:8px 20px; font-size:14px;">
            Importieren
          </button>
          <span id="paste-import-result" style="font-size:13px;"></span>
        </div>
      </div>
    </details>
  `;

  container.querySelector('#btn-paste-import')?.addEventListener('click', async () => {
    const textarea = container.querySelector('#paste-import-json');
    const resultEl = container.querySelector('#paste-import-result');
    const raw = textarea.value.trim();

    if (!raw) {
      resultEl.innerHTML = '<span style="color:#E74C3C;">Bitte JSON einfuegen.</span>';
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      const cards = Array.isArray(parsed) ? parsed : [parsed];

      if (cards.length === 0) {
        resultEl.innerHTML = '<span style="color:#E74C3C;">Keine Karten im JSON gefunden.</span>';
        return;
      }

      // Duplikat-Pruefung
      const existing = await cardDB.getAllCards();
      const existingPrompts = new Set(existing.map(c => c.prompt));

      let imported = 0;
      let skipped = 0;

      for (const card of cards) {
        if (!card.prompt) { skipped++; continue; }
        if (existingPrompts.has(card.prompt)) { skipped++; continue; }

        // Items normalisieren (einfaches Format -> internes Format)
        const items = (card.items || []).map((item, i) => {
          const isBool = card.cardType === 'boolean';
          return {
            position: item.position || (i + 1),
            label: item.label || '',
            solution: isBool ? !!item.solution : false,
            solutionText: isBool
              ? (item.solution ? 'Richtig' : 'Falsch')
              : (item.solution || item.solutionText || '')
          };
        });

        // Kategorie anlegen falls noetig
        if (card.category) {
          const cats = await cardDB.getAllCategories();
          if (!cats.find(c => c.name === card.category)) {
            await cardDB.saveCategory({ name: card.category, color: '#3498DB' });
          }
        }

        await cardDB.saveCard({
          prompt: card.prompt,
          category: card.category || 'Allgemeinwissen',
          cardType: card.cardType || 'boolean',
          items,
          setName: 'Kopfnuss Kartenset',
          sourceType: 'generated'
        });

        existingPrompts.add(card.prompt);
        imported++;
      }

      let msg = '';
      if (imported > 0) msg += `<span style="color:#27AE60; font-weight:600;">${imported} Karte(n) importiert!</span>`;
      if (skipped > 0) msg += ` <span style="color:#888;">(${skipped} uebersprungen)</span>`;
      resultEl.innerHTML = msg;

      if (imported > 0) {
        textarea.value = '';
        console.log(`[Paste-Import] ${imported} Karten importiert, ${skipped} uebersprungen.`);
      }
    } catch (err) {
      resultEl.innerHTML = `<span style="color:#E74C3C;">JSON-Fehler: ${err.message}</span>`;
    }
  });
}

// Admin-App exportieren fuer Views die es brauchen
export { adminApp };
