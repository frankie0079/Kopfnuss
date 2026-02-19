/* ============================================
   Library-View: Karten-Bibliothek
   Anzeigen, filtern, sortieren, exportieren
   ============================================ */

import { cardDB } from './card-db.js';
import { exportCardsAsZip, downloadOrShareZip, generateCardsJS } from './export.js';

const PAGE_SIZE = 50;

export function registerLibrary(app) {
  const view = document.getElementById('view-library');
  let currentFilter = 'all';
  let currentStatusFilter = 'all';
  let searchQuery = '';
  let currentPage = 0;

  app.on('show:library', () => {
    render();
  });

  async function render({ focusSearch = false, cursorPos = null } = {}) {
    const cards = await cardDB.getAllCards();
    const categories = await cardDB.getAllCategories();

    // Karten nach Kategorie zaehlen
    const counts = {};
    let kiCount = 0;
    let exportedCount = 0;
    let newCount = 0;
    cards.forEach(c => {
      counts[c.category] = (counts[c.category] || 0) + 1;
      if (c.sourceType === 'generated') kiCount++;
      if (c.exported) {
        exportedCount++;
      } else {
        newCount++;
      }
    });

    // Status-Filter
    let statusFiltered;
    if (currentStatusFilter === 'new') {
      statusFiltered = cards.filter(c => !c.exported);
    } else if (currentStatusFilter === 'exported') {
      statusFiltered = cards.filter(c => c.exported);
    } else {
      statusFiltered = cards;
    }

    // Kategorie-Filter
    let filtered;
    if (currentFilter === 'all') {
      filtered = statusFiltered;
    } else if (currentFilter === '__ki__') {
      filtered = statusFiltered.filter(c => c.sourceType === 'generated');
    } else {
      filtered = statusFiltered.filter(c => c.category === currentFilter);
    }

    // Suchfilter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(c => {
        if ((c.prompt || '').toLowerCase().includes(q)) return true;
        if ((c.category || '').toLowerCase().includes(q)) return true;
        if (c.items && c.items.some(it => (it.label || '').toLowerCase().includes(q))) return true;
        return false;
      });
    }

    // Sortieren: KI-generierte oben, dann neueste zuerst
    filtered.sort((a, b) => {
      const aGen = a.sourceType === 'generated' ? 1 : 0;
      const bGen = b.sourceType === 'generated' ? 1 : 0;
      if (aGen !== bGen) return bGen - aGen;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });

    // Paginierung
    const totalFiltered = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
    if (currentPage >= totalPages) currentPage = totalPages - 1;
    if (currentPage < 0) currentPage = 0;
    const pageStart = currentPage * PAGE_SIZE;
    const pageEnd = Math.min(pageStart + PAGE_SIZE, totalFiltered);
    const pageCards = filtered.slice(pageStart, pageEnd);

    view.innerHTML = `
      <div class="admin-container">
        <button class="admin-back-btn" id="lib-back">&larr; Zurueck</button>

        <div class="admin-header">
          <h2>Karten (${cards.length})</h2>
          ${cards.length > 0 ? `
            <div class="admin-actions">
              <button class="btn btn-success" id="btn-export-cards-js">
                Ans Spiel senden
              </button>
              <button class="btn btn-secondary" id="btn-export-zip">
                ZIP exportieren
              </button>
            </div>
          ` : ''}
        </div>

        <!-- Suchfeld -->
        <div class="lib-search-bar">
          <input type="text" id="lib-search" class="lib-search-input"
                 placeholder="Karten durchsuchen..."
                 value="${escapeHtml(searchQuery)}">
          ${searchQuery ? '<button class="lib-search-clear" id="lib-search-clear">&times;</button>' : ''}
        </div>

        <!-- Status-Filter -->
        <div class="lib-status-bar">
          <button class="lib-status-btn ${currentStatusFilter === 'all' ? 'lib-status-active' : ''}"
                  data-status="all">
            Alle (${cards.length})
          </button>
          <button class="lib-status-btn ${currentStatusFilter === 'new' ? 'lib-status-active' : ''}"
                  data-status="new">
            Neu (${newCount})
          </button>
          <button class="lib-status-btn ${currentStatusFilter === 'exported' ? 'lib-status-active' : ''}"
                  data-status="exported">
            Gesendet (${exportedCount})
          </button>
        </div>

        <!-- Kategorie-Filter -->
        <div class="category-filter-bar">
          <button class="category-badge ${currentFilter === 'all' ? 'active-filter' : ''}"
                  data-cat="all">
            Alle (${statusFiltered.length})
          </button>
          ${kiCount > 0 ? `
            <button class="category-badge source-badge-ki ${currentFilter === '__ki__' ? 'active-filter' : ''}"
                    data-cat="__ki__">
              KI-generiert (${kiCount})
            </button>
          ` : ''}
          ${categories.map(cat => `
            <button class="category-badge ${currentFilter === cat.name ? 'active-filter' : ''}"
                    data-cat="${cat.name}">
              ${cat.name} (${counts[cat.name] || 0})
            </button>
          `).join('')}
        </div>

        <!-- Kartenliste -->
        <div class="card-list mt-8">
          ${totalFiltered === 0 ? `
            <p class="text-center" style="color:#999; padding:40px 0;">
              ${cards.length === 0
                ? 'Noch keine Karten erfasst.'
                : searchQuery ? 'Keine Karten gefunden.' : 'Keine Karten in dieser Auswahl.'
              }
            </p>
          ` : ''}
          ${pageCards.map(card => `
            <div class="card-item ${card.sourceType === 'generated' ? 'card-item--ki' : ''} ${card.exported ? 'card-item--exported' : 'card-item--new'}" data-id="${card.id}">
              <div class="card-item-title">${escapeHtml(card.prompt)}</div>
              <div class="card-item-meta">
                <span class="category-badge">${card.category || 'Ohne'}</span>
                ${card.sourceType === 'generated' ? '<span class="source-badge-ki">KI</span>' : ''}
                ${card.exported
                  ? '<span class="export-badge export-badge--sent">gesendet</span>'
                  : '<span class="export-badge export-badge--new">neu</span>'
                }
                <span style="margin-left:8px;">
                  ${card.items ? card.items.filter(i => i.solution).length + '/10 richtig' : ''}
                </span>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Paginierung -->
        ${totalPages > 1 ? `
          <div class="lib-pagination">
            <button class="lib-page-btn" id="lib-prev" ${currentPage === 0 ? 'disabled' : ''}>
              &larr; Vorherige
            </button>
            <span class="lib-page-info">
              Seite ${currentPage + 1} von ${totalPages}
              (${pageStart + 1}&ndash;${pageEnd} von ${totalFiltered})
            </span>
            <button class="lib-page-btn" id="lib-next" ${currentPage >= totalPages - 1 ? 'disabled' : ''}>
              Naechste &rarr;
            </button>
          </div>
        ` : ''}
      </div>
    `;

    // Events: Zurueck-Button
    view.querySelector('#lib-back')?.addEventListener('click', () => app.navigate('admin'));

    // Events: Suchfeld
    const searchInput = view.querySelector('#lib-search');
    let searchTimer;
    searchInput?.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        searchQuery = searchInput.value;
        const cursorPos = searchInput.selectionStart;
        currentPage = 0;
        render({ focusSearch: true, cursorPos });
      }, 300);
    });
    view.querySelector('#lib-search-clear')?.addEventListener('click', () => {
      searchQuery = '';
      currentPage = 0;
      render({ focusSearch: true });
    });

    if (focusSearch && searchInput) {
      searchInput.focus();
      if (cursorPos != null) {
        searchInput.setSelectionRange(cursorPos, cursorPos);
      }
    }

    // Events: Status-Filter
    view.querySelectorAll('.lib-status-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        currentStatusFilter = btn.dataset.status;
        currentPage = 0;
        render();
      });
    });

    // Events: Kategorie-Filter
    view.querySelectorAll('.category-badge').forEach(btn => {
      btn.addEventListener('click', () => {
        currentFilter = btn.dataset.cat;
        currentPage = 0;
        render();
      });
    });

    // Events: Paginierung
    view.querySelector('#lib-prev')?.addEventListener('click', () => {
      if (currentPage > 0) { currentPage--; render(); }
    });
    view.querySelector('#lib-next')?.addEventListener('click', () => {
      if (currentPage < totalPages - 1) { currentPage++; render(); }
    });

    // Events: Karte anklicken -> Editor
    view.querySelectorAll('.card-item').forEach(item => {
      item.addEventListener('click', () => {
        app.editCardId = item.dataset.id;
        app.navigate('card-editor');
      });
    });

    // Events: Ans Spiel senden (cards.js generieren + an Server senden + exported-Flag)
    view.querySelector('#btn-export-cards-js')?.addEventListener('click', async () => {
      const btn = view.querySelector('#btn-export-cards-js');
      btn.disabled = true;
      btn.textContent = 'Wird gesendet...';

      try {
        const allCards = await cardDB.getAllCards();
        const jsContent = generateCardsJS(allCards);

        // An lokalen Server senden (schreibt cards.js + git push)
        const res = await fetch('/api/save-cards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: jsContent })
        });

        const result = await res.json();

        if (!result.ok) {
          throw new Error(result.error || 'Server-Fehler');
        }

        // Alle Karten als "exported" markieren
        let marked = 0;
        for (const card of allCards) {
          if (!card.exported) {
            card.exported = true;
            card.exportedAt = Date.now();
            await cardDB.saveCard(card);
            marked++;
          }
        }

        btn.textContent = `Gesendet! (${allCards.length} Karten)`;
        btn.style.background = '#27AE60';

        if (marked > 0) {
          console.log(`[Library] ${marked} Karten als "gesendet" markiert.`);
        }

        setTimeout(() => {
          btn.textContent = 'Ans Spiel senden';
          btn.disabled = false;
          btn.style.background = '';
          render();
        }, 3000);
      } catch (err) {
        console.error('[Library] Export-Fehler:', err);

        // Fallback: Als Datei herunterladen wenn Server nicht erreichbar
        if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
          btn.textContent = 'Server nicht erreichbar -- lade Datei herunter...';
          try {
            const allCards = await cardDB.getAllCards();
            const jsContent = generateCardsJS(allCards);
            const blob = new Blob([jsContent], { type: 'application/javascript; charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'cards.js';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            btn.textContent = 'Datei heruntergeladen (manuell kopieren)';
            btn.style.background = '#F39C12';
          } catch (dlErr) {
            btn.textContent = 'Fehler: ' + dlErr.message;
            btn.style.background = '#E74C3C';
          }
        } else {
          btn.textContent = 'Fehler: ' + err.message;
          btn.style.background = '#E74C3C';
        }

        setTimeout(() => {
          btn.textContent = 'Ans Spiel senden';
          btn.disabled = false;
          btn.style.background = '';
        }, 4000);
      }
    });

    // Events: ZIP exportieren
    view.querySelector('#btn-export-zip')?.addEventListener('click', async () => {
      const cardsToExport = currentFilter === 'all' ? cards : filtered;
      const setName = currentFilter === 'all' ? 'Kopfnuss Kartenset' : currentFilter;

      const overlay = document.createElement('div');
      overlay.className = 'loading-overlay';
      overlay.innerHTML = `
        <div class="spinner"></div>
        <p>Spiel-ZIP wird erstellt (${cardsToExport.length} Karten)...</p>
      `;
      document.body.appendChild(overlay);

      try {
        const zip = await exportCardsAsZip(cardsToExport, setName, currentFilter || 'Gemischt');
        document.body.removeChild(overlay);
        const filename = `kopfnuss-${slugify(setName)}.zip`;
        await downloadOrShareZip(zip, filename);
      } catch (err) {
        document.body.removeChild(overlay);
        alert('Export-Fehler: ' + err.message);
      }
    });
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
  }

  function slugify(text) {
    return text.toLowerCase()
      .replace(/[äÄ]/g, 'ae').replace(/[öÖ]/g, 'oe').replace(/[üÜ]/g, 'ue')
      .replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
}
