/* ============================================
   Batch-Import View
   batch_results.json laden, Schnell-Review, importieren
   ============================================ */

import { cardDB } from './card-db.js';
import { buildKopfnussSet } from './export.js';

export function registerBatchImport(app) {
  const view = document.getElementById('view-batch');

  // State
  let batchData = null;
  let reviewQueue = [];
  let currentIdx = 0;
  let okCount = 0;
  let errorCount = 0;
  let skippedDuplicates = 0;

  // Keyboard-Handler (wird bei Cleanup entfernt)
  let keyHandler = null;

  app.on('show:batch', () => {
    cleanupKeyboard();
    renderUpload();
  });

  // ── Tastatur-Steuerung ───────────────────────────

  function setupKeyboard(mode) {
    cleanupKeyboard();
    keyHandler = (e) => {
      // Nicht reagieren wenn ein Input/Textarea/Select fokussiert ist
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (mode === 'quick') {
        if (e.key === 'Enter') { e.preventDefault(); onQuickOK(); }
        if (e.key === ' ')     { e.preventDefault(); onQuickError(); }
        if (e.key === 'ArrowLeft')  { e.preventDefault(); goToPrev(); }
        if (e.key === 'ArrowRight') { e.preventDefault(); goToNext(); }
      }
    };
    document.addEventListener('keydown', keyHandler);
  }

  function cleanupKeyboard() {
    if (keyHandler) {
      document.removeEventListener('keydown', keyHandler);
      keyHandler = null;
    }
  }

  // ── Schritt 1: Datei hochladen ─────────────────────

  function renderUpload() {
    view.innerHTML = `
      <div class="admin-container">
        <button class="admin-back-btn" id="batch-back">&larr; Zurueck</button>
      </div>
      <div class="batch-upload">
        <h2>Batch-Import</h2>
        <p class="batch-hint">
          Lade eine <code>batch_results.json</code> Datei,
          die mit <code>batch_import.py</code> erzeugt wurde.
        </p>

        <label class="btn btn-primary mt-16" style="cursor:pointer;">
          Datei waehlen
          <input type="file" accept=".json" id="batch-file-input"
                 style="display:none;">
        </label>

        <button class="btn btn-secondary mt-8" id="batch-dedup-btn">
          Duplikate bereinigen
        </button>

        <div id="batch-error" class="batch-error hidden"></div>
        <div id="batch-info" class="batch-info hidden" style="margin-top:12px;"></div>
      </div>
    `;

    view.querySelector('#batch-back').addEventListener('click', () => { cleanupKeyboard(); app.navigate('admin'); });
    view.querySelector('#batch-file-input').addEventListener('change', onFileSelect);
    view.querySelector('#batch-dedup-btn').addEventListener('click', removeDuplicates);
  }

  /** Entfernt Duplikate aus der IndexedDB (gleicher Prompt -> aeltere loeschen) */
  async function removeDuplicates() {
    const infoEl = view.querySelector('#batch-info');
    infoEl.textContent = 'Pruefe auf Duplikate...';
    infoEl.classList.remove('hidden');

    const allCards = await cardDB.getAllCards();
    const promptMap = new Map();
    const toDelete = [];

    for (const card of allCards) {
      const key = card.prompt;
      if (promptMap.has(key)) {
        const existing = promptMap.get(key);
        if ((card.createdAt || 0) > (existing.createdAt || 0)) {
          toDelete.push(existing.id);
          promptMap.set(key, card);
        } else {
          toDelete.push(card.id);
        }
      } else {
        promptMap.set(key, card);
      }
    }

    if (toDelete.length === 0) {
      infoEl.textContent = 'Keine Duplikate gefunden.';
      return;
    }

    for (const id of toDelete) {
      await cardDB.deleteCard(id);
    }

    infoEl.textContent = `${toDelete.length} Duplikat${toDelete.length !== 1 ? 'e' : ''} entfernt. `
      + `${promptMap.size} Karten verbleiben.`;
  }

  async function onFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    const errEl = view.querySelector('#batch-error');
    errEl.classList.add('hidden');

    try {
      const text = await file.text();
      batchData = JSON.parse(text);

      if (!batchData.cards || !Array.isArray(batchData.cards)) {
        throw new Error('Ungueltige Datei: "cards"-Array fehlt.');
      }

      await processImport();
    } catch (err) {
      errEl.textContent = 'Fehler: ' + err.message;
      errEl.classList.remove('hidden');
    }
  }

  // ── Schritt 2: Review-Queue aufbauen (KEIN Auto-Import) ─

  async function processImport() {
    const cards = batchData.cards;
    reviewQueue = [];
    okCount = 0;
    errorCount = 0;
    skippedDuplicates = 0;

    view.innerHTML = `
      <div class="text-center mt-24">
        <div class="spinner"></div>
        <p class="mt-16">Lade Karten...</p>
      </div>
    `;

    // Kategorien auf die 9 festen zuruecksetzen
    await cardDB.resetCategories();

    // Bestehende Karten laden fuer Duplikat-Erkennung
    const existingCards = await cardDB.getAllCards();
    const existingPrompts = new Set(existingCards.map(c => c.prompt));
    const existingSources = new Set(
      existingCards.map(c => c.source).filter(Boolean)
    );

    for (const entry of cards) {
      if (!entry.card) continue;

      // Duplikat-Pruefung
      const isDuplicate = (entry.source && existingSources.has(entry.source))
        || existingPrompts.has(entry.card.prompt);

      if (isDuplicate) {
        skippedDuplicates++;
        continue;
      }

      // Keine Auto-Kategorie mehr! suggestedCategory wird nur als Vorauswahl genutzt.
      // ALLE Karten in die Review-Queue (kein Auto-Import)
      entry._status = null; // null = noch nicht geprueft
      reviewQueue.push(entry);
    }

    renderSummary();
  }

  // ── Schritt 3: Zusammenfassung ──────────────────────

  function renderSummary() {
    const total = batchData.cards.filter(c => c.card).length;
    const errors = batchData.cards.filter(c => !c.card).length;
    const diffCards = reviewQueue.filter(e =>
      e.confidence === 'review' || (e.diffs && e.diffs.length > 0)
    ).length;
    const pending = reviewQueue.filter(e => !e._status).length;

    view.innerHTML = `
      <div class="batch-summary">
        <h2>Schnell-Review</h2>

        <div class="batch-stats">
          <div class="batch-stat">
            <div class="batch-stat-num">${total}</div>
            <div class="batch-stat-lbl">Karten</div>
          </div>
          ${skippedDuplicates > 0 ? `
          <div class="batch-stat">
            <div class="batch-stat-num">${skippedDuplicates}</div>
            <div class="batch-stat-lbl">Duplikate</div>
          </div>` : ''}
          ${diffCards > 0 ? `
          <div class="batch-stat batch-stat-error">
            <div class="batch-stat-num">${diffCards}</div>
            <div class="batch-stat-lbl">Abweichend</div>
          </div>` : ''}
          ${errors ? `
          <div class="batch-stat batch-stat-error">
            <div class="batch-stat-num">${errors}</div>
            <div class="batch-stat-lbl">API-Fehler</div>
          </div>` : ''}
        </div>

        <p class="batch-info mt-16">
          Alle ${reviewQueue.length} Karten muessen geprueft werden.
          ${diffCards > 0 ? `<br><strong>${diffCards} Karten</strong> mit Abweichungen zwischen den API-Aufrufen (rot markiert).` : ''}
          ${pending < reviewQueue.length ? `<br>${reviewQueue.length - pending} bereits geprueft, ${pending} noch offen.` : ''}
        </p>

        <p style="color:#888; font-size:13px; margin-top:8px;">
          Tastatur: <strong>Enter</strong> = OK, <strong>Leertaste</strong> = Fehler/Bearbeiten,
          Pfeiltasten = Navigation
        </p>

        ${reviewQueue.length > 0 ? `
          <button class="btn btn-primary mt-16" id="batch-start-review">
            Schnell-Review starten (${pending} Karten)
          </button>` : ''}

        <button class="btn btn-secondary mt-8" id="batch-go-home">
          Zur Startseite
        </button>
      </div>
    `;

    view.querySelector('#batch-go-home')
        .addEventListener('click', () => { cleanupKeyboard(); app.navigate('home'); });

    const reviewBtn = view.querySelector('#batch-start-review');
    if (reviewBtn) {
      reviewBtn.addEventListener('click', () => {
        // Zum ersten ungepruefen springen
        const firstPending = reviewQueue.findIndex(e => !e._status);
        currentIdx = firstPending >= 0 ? firstPending : 0;
        renderQuickReview();
      });
    }
  }

  // ── Schritt 4: Schnell-Review (nur lesen, OK/Fehler) ─

  function renderQuickReview() {
    if (currentIdx >= reviewQueue.length) {
      cleanupKeyboard();
      renderDone();
      return;
    }

    setupKeyboard('quick');

    const entry = reviewQueue[currentIdx];
    const card = entry.card;
    const hasDiffs = entry.confidence === 'review'
      || (entry.diffs && entry.diffs.length > 0);
    const isBooleanCard = card.cardType === 'boolean';

    const pending = reviewQueue.filter(e => !e._status).length;

    // Items als lesbare Tabelle (nicht editierbar)
    const itemsHtml = (card.items || []).map((item, i) => {
      // Pruefen ob dieses Item in den Diffs erwaehnt wird
      const itemHasDiff = (entry.diffs || []).some(d =>
        d.startsWith(`Item ${i + 1}:`)
      );
      const rowClass = itemHasDiff
        ? 'batch-item-row batch-item-error'
        : 'batch-item-row';

      let solutionDisplay;
      if (isBooleanCard) {
        const clr = item.solution ? '#27AE60' : '#E74C3C';
        const sym = item.solution ? '\u2713' : '\u2717';
        solutionDisplay = `<span style="color:${clr}; font-weight:bold; font-size:18px;
          width:36px; text-align:center; flex-shrink:0;">${sym}</span>`;
      } else {
        solutionDisplay = `<span class="batch-item-solution" style="flex:1; padding:6px 8px; font-size:14px;
          color:#333; ${itemHasDiff ? 'color:#E74C3C; font-weight:bold;' : ''}"
          >${escapeHtml(item.solutionText || '')}</span>`;
      }

      return `<div class="${rowClass}">
        <span class="batch-item-num">${i + 1}.</span>
        <span class="batch-item-label" style="flex:1; padding:6px 8px; font-size:14px;">${escapeHtml(item.label || '')}</span>
        ${solutionDisplay}
      </div>`;
    }).join('');

    // Diff-Warnungen
    const diffsHtml = hasDiffs
      ? `<div class="batch-issues" style="border-color:#E74C3C; background:#FFF5F5;">
           <strong style="color:#E74C3C;">Abweichungen zwischen API-Aufrufen:</strong>
           ${(entry.diffs || []).map(d => `<div class="batch-issue" style="color:#C0392B;">${escapeHtml(d)}</div>`).join('')}
           ${(entry.issues || []).filter(i => !i.startsWith('Abweichung:')).map(i =>
             `<div class="batch-issue">${escapeHtml(i)}</div>`
           ).join('')}
         </div>`
      : '';

    // Status-Hinweis
    const statusLabels = { ok: 'OK', edited: 'bearbeitet', deleted: 'geloescht' };
    const statusColors = { ok: '#27AE60', edited: '#E74C3C', deleted: '#999' };
    const statusHtml = entry._status
      ? `<span style="margin-left:12px; font-size:13px; color:${statusColors[entry._status] || '#E74C3C'};">
           (${statusLabels[entry._status] || entry._status})
         </span>`
      : '';

    view.innerHTML = `
      <div class="batch-review ${hasDiffs ? 'batch-review-warning' : ''}">
        <div class="batch-review-header">
          <span>Karte ${currentIdx + 1} von ${reviewQueue.length}</span>
          <span class="batch-conf batch-conf-${entry.confidence}">
            ${entry.confidence}${entry.doubleChecked ? ' (2x geprueft)' : ''}
          </span>
          <span class="batch-source">${escapeHtml(entry.source || '')}${statusHtml}</span>
        </div>

        <div class="batch-review-body">
          <!-- Linke Seite: Originalfoto -->
          <div class="batch-photo-panel">
            ${(entry.imageBase64 || entry.imagePath)
              ? `<img src="${entry.imageBase64 || entry.imagePath}" class="batch-photo"
                   id="batch-photo-img" alt="Originalfoto">
                 <button class="btn btn-secondary mt-8" id="batch-rotate-btn"
                   style="width:auto; padding:6px 16px; font-size:13px;">
                   Drehen
                 </button>`
              : '<div class="batch-no-photo">Kein Foto vorhanden</div>'}
          </div>

          <!-- Rechte Seite: Erkannte Daten (nur lesen) -->
          <div class="batch-data-panel">
            ${diffsHtml}

            <div class="form-group">
              <label style="font-weight:bold; font-size:16px;">
                ${escapeHtml(card.prompt || '')}
              </label>
              <span class="category-badge" style="margin-top:4px; display:inline-block;">
                ${escapeHtml(card.suggestedCategory || 'Allgemein')}
              </span>
            </div>

            <div class="form-group">
              <label class="batch-col-header">
                <span class="batch-item-num"></span>
                <span style="flex:1;">Moeglichkeit</span>
                <span style="${isBooleanCard ? 'width:36px; text-align:center;' : 'flex:1; text-align:center;'}">Loesung</span>
              </label>
              <div class="review-items" id="batch-items">
                ${itemsHtml}
              </div>
            </div>
          </div>
        </div>

        <!-- Aktionsleiste: Schnell-Review -->
        <div class="batch-actions" style="justify-content:center; gap:16px;">
          <button class="btn btn-secondary" id="batch-prev"
            ${currentIdx === 0 ? 'disabled' : ''}
            title="Vorherige (Pfeil links)">
            \u25C0 Vorherige
          </button>
          <button class="btn btn-success" id="batch-ok"
            style="min-width:140px; font-size:16px; padding:12px 24px;"
            title="OK -- importieren (Enter)">
            OK (Enter)
          </button>
          <button class="btn btn-primary" id="batch-edit"
            style="min-width:140px; font-size:16px; padding:12px 24px;
            background:#E74C3C;"
            title="Fehler -- bearbeiten (Leertaste)">
            Fehler (Space)
          </button>
          <button class="btn btn-secondary" id="batch-next"
            ${currentIdx >= reviewQueue.length - 1 ? 'disabled' : ''}
            title="Naechste (Pfeil rechts)">
            Naechste \u25B6
          </button>
        </div>

        <div class="batch-progress">
          <div class="batch-progress-bar"
               style="width:${Math.round(((currentIdx + 1) / reviewQueue.length) * 100)}%">
          </div>
        </div>
        <div style="text-align:center; font-size:13px; color:#888; margin-top:4px;">
          ${okCount} OK, ${errorCount} bearbeitet, ${pending} noch offen
        </div>
      </div>
    `;

    // ── Event-Listener ──────────────────────

    // Foto Zoom
    const photoImg = view.querySelector('#batch-photo-img');
    if (photoImg) {
      photoImg.addEventListener('click', () => {
        photoImg.classList.toggle('batch-photo-zoomed');
      });
    }

    // Dreh-Button
    const rotateBtn = view.querySelector('#batch-rotate-btn');
    if (rotateBtn && photoImg) {
      let rotation = 0;
      rotateBtn.addEventListener('click', () => {
        rotation = (rotation + 90) % 360;
        photoImg.style.transform = rotation ? `rotate(${rotation}deg)` : '';
      });
    }

    // Buttons
    view.querySelector('#batch-ok').addEventListener('click', onQuickOK);
    view.querySelector('#batch-edit').addEventListener('click', onQuickError);
    view.querySelector('#batch-prev').addEventListener('click', goToPrev);
    view.querySelector('#batch-next').addEventListener('click', goToNext);
  }

  async function onQuickOK() {
    const entry = reviewQueue[currentIdx];
    if (!entry) return;

    // Sofort importieren
    await saveCardToDB(entry.card, entry.source);
    entry._status = 'ok';
    okCount++;

    // Zum naechsten ungepruefen springen
    goToNextPending();
  }

  function onQuickError() {
    // In den Editor-Modus wechseln fuer diese Karte
    cleanupKeyboard();
    renderEditor();
  }

  function goToPrev() {
    if (currentIdx > 0) { currentIdx--; renderQuickReview(); }
  }

  function goToNext() {
    if (currentIdx < reviewQueue.length - 1) { currentIdx++; renderQuickReview(); }
  }

  function goToNextPending() {
    // Naechste ungepruefte Karte finden
    for (let i = currentIdx + 1; i < reviewQueue.length; i++) {
      if (!reviewQueue[i]._status) { currentIdx = i; renderQuickReview(); return; }
    }
    // Von Anfang suchen
    for (let i = 0; i < currentIdx; i++) {
      if (!reviewQueue[i]._status) { currentIdx = i; renderQuickReview(); return; }
    }
    // Alle geprueft
    cleanupKeyboard();
    renderDone();
  }

  // ── Schritt 5: Editor-Modus (editierbar) ───────────

  async function renderEditor() {
    const entry = reviewQueue[currentIdx];
    const card = entry.card;
    const categories = await cardDB.getAllCategories();

    const isBooleanCard = card.cardType === 'boolean';

    // Kategorie-Vorauswahl: suggestedCategory mit den festen Kategorien matchen
    const suggested = card.suggestedCategory || '';
    const catNames = categories.map(c => c.name);
    const matchedCat = catNames.find(n => n === suggested)
      || catNames.find(n => n.toLowerCase() === suggested.toLowerCase())
      || 'Allgemeinwissen';

    const catOptions = categories.map(c => {
      const sel = c.name === matchedCat ? ' selected' : '';
      return `<option value="${escapeAttr(c.name)}"${sel}>${escapeHtml(c.name)}</option>`;
    }).join('') + '<option value="__new__">+ Neue Kategorie...</option>';

    const itemsHtml = (card.items || []).map((item, i) => {
      const itemHasDiff = (entry.diffs || []).some(d =>
        d.startsWith(`Item ${i + 1}:`)
      );
      const hasIssue = itemHasDiff || (entry.issues || []).some(iss =>
        iss.includes(`Pos.${i + 1}`) || iss.includes(`Pos.${i + 1} `)
      );
      const rowClass = hasIssue ? 'batch-item-row batch-item-error' : 'batch-item-row';

      let solutionEl;
      if (isBooleanCard) {
        const val = item.solution ? 'true' : 'false';
        const clr = item.solution ? '#27AE60' : '#E74C3C';
        const sym = item.solution ? '\u2713' : '\u2717';
        solutionEl = `<span class="item-solution-toggle" data-value="${val}"
          style="width:36px; text-align:center; font-size:20px; cursor:pointer;
          flex-shrink:0; color:${clr}; user-select:none; font-weight:bold;">${sym}</span>`;
      } else {
        solutionEl = `<input type="text" class="item-solution-text"
          value="${escapeAttr(item.solutionText || '')}"
          style="flex:1; padding:6px 8px; font-size:14px;
          border:1px solid ${hasIssue ? '#E74C3C' : '#ddd'}; border-radius:4px;"
          placeholder="Loesung">`;
      }

      return `<div class="${rowClass}">
        <span class="batch-item-num">${i + 1}.</span>
        <input type="text" class="item-label batch-item-label"
          value="${escapeAttr(item.label || '')}"
          style="flex:1; padding:6px 8px; font-size:14px;
          border:1px solid ${hasIssue ? '#E74C3C' : '#ddd'}; border-radius:4px;">
        ${solutionEl}
      </div>`;
    }).join('');

    const diffsHtml = (entry.diffs && entry.diffs.length > 0)
      ? `<div class="batch-issues" style="border-color:#E74C3C; background:#FFF5F5;">
           <strong style="color:#E74C3C;">Abweichungen (bitte pruefen):</strong>
           ${entry.diffs.map(d => `<div class="batch-issue" style="color:#C0392B;">${escapeHtml(d)}</div>`).join('')}
         </div>`
      : '';

    view.innerHTML = `
      <div class="batch-review batch-review-warning">
        <div class="batch-review-header">
          <span>Karte ${currentIdx + 1} von ${reviewQueue.length} -- BEARBEITEN</span>
          <span class="batch-source">${escapeHtml(entry.source || '')}</span>
        </div>

        <div class="batch-review-body">
          <div class="batch-photo-panel">
            ${(entry.imageBase64 || entry.imagePath)
              ? `<img src="${entry.imageBase64 || entry.imagePath}" class="batch-photo"
                   id="batch-photo-img" alt="Originalfoto">
                 <button class="btn btn-secondary mt-8" id="batch-rotate-btn"
                   style="width:auto; padding:6px 16px; font-size:13px;">
                   Drehen
                 </button>`
              : '<div class="batch-no-photo">Kein Foto vorhanden</div>'}
          </div>

          <div class="batch-data-panel">
            ${diffsHtml}

            <div class="form-group">
              <label>Frage / Thema</label>
              <input type="text" class="review-prompt" id="batch-prompt"
                value="${escapeAttr(card.prompt || '')}">
            </div>

            <div class="form-group">
              <label>Kategorie</label>
              <select class="review-category" id="batch-category">
                ${catOptions}
              </select>
            </div>

            <div class="form-group">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <label class="batch-col-header" style="flex:1; margin-bottom:0;">
                  <span class="batch-item-num"></span>
                  <span style="flex:1;">Moeglichkeit</span>
                  <span style="${isBooleanCard ? 'width:36px; text-align:center;' : 'flex:1; text-align:center;'}">Loesung</span>
                </label>
                ${!isBooleanCard ? `
                  <button class="btn btn-secondary" id="batch-swap-cols"
                    style="width:auto; padding:4px 12px; font-size:12px; margin-left:8px; white-space:nowrap;">
                    ⇄ Spalten tauschen
                  </button>
                ` : ''}
              </div>
              <div class="review-items" id="batch-items">
                ${itemsHtml}
              </div>
            </div>
          </div>
        </div>

        <div class="batch-actions">
          <button class="btn btn-secondary" id="batch-cancel-edit">
            Zurueck zum Review
          </button>
          <button class="btn btn-danger" id="batch-delete-card" style="min-width:120px;">
            Karte loeschen
          </button>
          <button class="btn btn-success" id="batch-save" style="min-width:160px;">
            Speichern + Weiter
          </button>
        </div>
      </div>
    `;

    // Foto Zoom
    const photoImg = view.querySelector('#batch-photo-img');
    if (photoImg) {
      photoImg.addEventListener('click', () => {
        photoImg.classList.toggle('batch-photo-zoomed');
      });
    }

    // Dreh-Button
    const rotateBtn = view.querySelector('#batch-rotate-btn');
    if (rotateBtn && photoImg) {
      let rotation = 0;
      rotateBtn.addEventListener('click', () => {
        rotation = (rotation + 90) % 360;
        photoImg.style.transform = rotation ? `rotate(${rotation}deg)` : '';
      });
    }

    // Boolean-Toggle
    view.querySelectorAll('.item-solution-toggle').forEach(toggle => {
      toggle.addEventListener('click', () => {
        const current = toggle.dataset.value === 'true';
        const newVal = !current;
        toggle.dataset.value = newVal ? 'true' : 'false';
        toggle.textContent = newVal ? '\u2713' : '\u2717';
        toggle.style.color = newVal ? '#27AE60' : '#E74C3C';
      });
    });

    // Spalten tauschen (Moeglichkeit <-> Loesung)
    const swapBtn = view.querySelector('#batch-swap-cols');
    if (swapBtn) {
      swapBtn.addEventListener('click', () => {
        view.querySelectorAll('#batch-items > div').forEach(row => {
          const labelInput = row.querySelector('.item-label');
          const solutionInput = row.querySelector('.item-solution-text');
          if (labelInput && solutionInput) {
            const tmp = labelInput.value;
            labelInput.value = solutionInput.value;
            solutionInput.value = tmp;
          }
        });
      });
    }

    // Kategorie
    const catSelect = view.querySelector('#batch-category');
    catSelect.addEventListener('change', async () => {
      if (catSelect.value === '__new__') {
        const name = prompt('Name der neuen Kategorie:');
        if (name && name.trim()) {
          await cardDB.saveCategory({ name: name.trim(), color: '#3498DB' });
          const opt = document.createElement('option');
          opt.value = name.trim();
          opt.textContent = name.trim();
          opt.selected = true;
          catSelect.insertBefore(opt, catSelect.lastElementChild);
        } else {
          catSelect.value = matchedCat || 'Allgemeinwissen';
        }
      }
    });

    // Zurueck
    view.querySelector('#batch-cancel-edit').addEventListener('click', () => {
      renderQuickReview();
    });

    // Karte loeschen (aus Review-Queue entfernen, nicht importieren)
    view.querySelector('#batch-delete-card').addEventListener('click', () => {
      if (!confirm('Karte wirklich loeschen? Sie wird nicht importiert.')) return;
      entry._status = 'deleted';
      goToNextPending();
    });

    // Speichern
    view.querySelector('#batch-save').addEventListener('click', async () => {
      const cardData = collectFormData(card);
      await saveCardToDB(cardData, entry.source);
      entry._status = 'edited';
      errorCount++;

      goToNextPending();
    });
  }

  // ── Review fertig ─────────────────────────────────

  function renderDone() {
    cleanupKeyboard();
    const deletedCount = reviewQueue.filter(e => e._status === 'deleted').length;
    const pending = reviewQueue.filter(e => !e._status).length;

    view.innerHTML = `
      <div class="batch-done text-center">
        <h2 class="mt-24">Schnell-Review abgeschlossen</h2>
        <p class="mt-16">
          <strong>${okCount}</strong> mit OK importiert,
          <strong>${errorCount}</strong> manuell korrigiert${deletedCount > 0 ? `,
          <strong>${deletedCount}</strong> geloescht` : ''}.
          ${pending > 0 ? `<br><strong>${pending}</strong> noch nicht geprueft.` : ''}
        </p>
        ${pending > 0 ? `
          <button class="btn btn-primary mt-16" id="batch-continue">
            Verbleibende ${pending} Karten pruefen
          </button>
        ` : ''}
        <button class="btn btn-success mt-16" id="batch-push-game">
          Alle Karten ins Spiel uebernehmen
        </button>
        <button class="btn btn-${pending > 0 ? 'secondary' : 'primary'} mt-8" id="batch-to-library">
          Zur Kartenbibliothek
        </button>
        <button class="btn btn-secondary mt-8" id="batch-to-home">
          Zur Startseite
        </button>
      </div>
    `;

    const contBtn = view.querySelector('#batch-continue');
    if (contBtn) {
      contBtn.addEventListener('click', () => {
        const firstPending = reviewQueue.findIndex(e => !e._status);
        currentIdx = firstPending >= 0 ? firstPending : 0;
        renderQuickReview();
      });
    }

    view.querySelector('#batch-push-game')
        .addEventListener('click', async () => {
          const btn = view.querySelector('#batch-push-game');
          btn.disabled = true;
          btn.textContent = 'Wird uebernommen...';
          try {
            await syncToGame();
            btn.textContent = 'Erledigt!';
            btn.style.background = '#27AE60';
          } catch (err) {
            btn.textContent = 'Fehler: ' + err.message;
            btn.style.background = '#E74C3C';
          }
        });
    view.querySelector('#batch-to-library')
        .addEventListener('click', () => app.navigate('library'));
    view.querySelector('#batch-to-home')
        .addEventListener('click', () => app.navigate('home'));
  }

  // ── Hilfsfunktionen ───────────────────────────────

  function collectFormData(originalCard) {
    const promptVal = view.querySelector('#batch-prompt').value.trim();
    const category = view.querySelector('#batch-category').value;
    const items = [];

    view.querySelectorAll('#batch-items > div').forEach((row, i) => {
      const toggle = row.querySelector('.item-solution-toggle');
      const solutionInput = row.querySelector('.item-solution-text');
      const orig = originalCard.items[i] || {};

      items.push({
        position: i + 1,
        label: row.querySelector('.item-label').value.trim(),
        solution: toggle
          ? toggle.dataset.value === 'true'
          : (orig.solution || false),
        solutionText: solutionInput
          ? solutionInput.value.trim()
          : (orig.solutionText || '')
      });
    });

    return {
      prompt: promptVal,
      category,
      cardType: originalCard.cardType || 'boolean',
      items,
      setName: category,
      sourceType: 'batch'
    };
  }

  async function saveCardToDB(cardInput, source) {
    const cardData = {
      prompt: cardInput.prompt,
      category: cardInput.category || cardInput.suggestedCategory || 'Allgemein',
      cardType: cardInput.cardType || 'boolean',
      items: (cardInput.items || []).map((item, i) => ({
        position: item.position || item.clockPosition || i + 1,
        label: item.label,
        solution: item.solution ?? false,
        solutionText: item.solutionText || ''
      })),
      setName: cardInput.setName || cardInput.category
              || cardInput.suggestedCategory || 'Allgemein',
      sourceType: cardInput.sourceType || 'batch',
      source: source || cardInput.source || null
    };
    await cardDB.saveCard(cardData);

    // Nach jedem Speichern: demo-set.js im Spiel aktualisieren
    await syncToGame();
  }

  /** Sync-Hinweis: Spieldatei muss manuell exportiert werden */
  async function syncToGame() {
    console.log('[Batch] Karten gespeichert. Spieldatei (cards.js) muss ueber die Bibliothek exportiert werden.');
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function escapeAttr(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
