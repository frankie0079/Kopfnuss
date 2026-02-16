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

        <button class="admin-back-btn" id="admin-back">
          &larr; Zurueck zum Spiel
        </button>
      </div>
    `;

    // Generierte Karten-Sets anbieten
    checkGeneratedCards(el.querySelector('#admin-import-section'));

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
  { module: '../data/generated-kino.js', exportName: 'KINO_CARDS', label: '10 Kino-Karten', categoryName: 'Kino' }
];

async function checkGeneratedCards(container) {
  if (!container) return;

  const existingCards = await cardDB.getAllCards();
  const existingPrompts = new Set(existingCards.map(c => c.prompt));

  let html = '';
  for (const set of GENERATED_SETS) {
    try {
      const mod = await import(set.module);
      const cards = mod[set.exportName];
      if (!cards || !Array.isArray(cards)) continue;

      // Wie viele sind noch nicht importiert?
      const newCards = cards.filter(c => !existingPrompts.has(c.prompt));
      if (newCards.length === 0) {
        html += `<p style="font-size:13px; color:#27AE60;">&#x2713; ${set.label} bereits in der Bibliothek</p>`;
      } else {
        html += `<button class="btn btn-primary" id="import-${set.exportName}"
                   style="width:auto; padding:12px 24px; font-size:15px;">
                   ${newCards.length} ${set.label} importieren
                 </button>`;
      }
    } catch {
      // Modul nicht vorhanden -- still ignorieren
    }
  }

  if (html) container.innerHTML = html;

  // Event-Listener fuer Import-Buttons
  for (const set of GENERATED_SETS) {
    const btn = container.querySelector(`#import-${set.exportName}`);
    if (!btn) continue;

    btn.addEventListener('click', async () => {
      btn.disabled = true;
      btn.textContent = 'Wird importiert...';

      try {
        const mod = await import(set.module);
        const cards = mod[set.exportName];

        // Kategorie anlegen falls noetig
        if (set.categoryName) {
          const cats = await cardDB.getAllCategories();
          if (!cats.find(c => c.name === set.categoryName)) {
            await cardDB.saveCategory({ name: set.categoryName, color: '#E74C3C' });
          }
        }

        // Nur neue Karten importieren
        const fresh = await cardDB.getAllCards();
        const freshPrompts = new Set(fresh.map(c => c.prompt));
        let imported = 0;

        for (const card of cards) {
          if (freshPrompts.has(card.prompt)) continue;
          await cardDB.saveCard({
            prompt: card.prompt,
            category: card.category || set.categoryName || 'Allgemeinwissen',
            cardType: card.cardType || 'boolean',
            items: card.items,
            setName: 'Kopfnuss Kartenset',
            sourceType: 'generated'
          });
          imported++;
        }

        btn.textContent = `${imported} Karten importiert!`;
        btn.style.background = '#27AE60';
        console.log(`Import: ${imported} ${set.label} in die Bibliothek importiert.`);
      } catch (err) {
        btn.textContent = 'Fehler: ' + err.message;
        btn.style.background = '#E74C3C';
        console.error('Import-Fehler:', err);
      }
    });
  }
}

// Admin-App exportieren fuer Views die es brauchen
export { adminApp };
