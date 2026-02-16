/* ============================================
   Card-Editor-View: Einzelne Karte bearbeiten
   ============================================ */

import { cardDB } from './card-db.js';

export function registerCardEditor(app) {
  const view = document.getElementById('view-card-editor');

  app.on('show:card-editor', () => {
    render();
  });

  async function render() {
    const cardId = app.editCardId;
    let card = null;

    if (cardId) {
      card = await cardDB.getCard(cardId);
    }

    // Leere Karte fuer Neuanlage
    if (!card) {
      card = {
        prompt: '',
        category: '',
        cardType: 'boolean',
        items: Array.from({ length: 10 }, (_, i) => ({
          position: i + 1,
          label: '',
          solution: false,
          solutionText: ''
        }))
      };
    }

    const categories = await cardDB.getAllCategories();

    view.innerHTML = `
      <div class="admin-container">
        <button class="admin-back-btn" id="editor-back">&larr; Zurueck</button>
        <h2>${cardId ? 'Karte bearbeiten' : 'Neue Karte'}</h2>

        <div class="form-group mt-16">
          <label>Frage / Thema</label>
          <input type="text" id="edit-prompt" value="${escapeHtml(card.prompt || '')}">
        </div>

        <div class="form-group">
          <label>Kategorie</label>
          <select id="edit-category">
            ${categories.map(c =>
              `<option value="${c.name}" ${c.name === card.category ? 'selected' : ''}>
                ${c.name}
              </option>`
            ).join('')}
          </select>
        </div>

        <div class="form-group">
          <label>Kartentyp</label>
          <select id="edit-cardtype">
            <option value="boolean" ${card.cardType === 'boolean' ? 'selected' : ''}>Wahr / Falsch</option>
            <option value="text" ${card.cardType === 'text' ? 'selected' : ''}>Text</option>
            <option value="color" ${card.cardType === 'color' ? 'selected' : ''}>Farben</option>
            <option value="image" ${card.cardType === 'image' ? 'selected' : ''}>Bildkarte</option>
          </select>
        </div>

        <div class="form-group">
          <label style="display:flex; gap:6px; align-items:center;">
            <span style="width:24px;"></span>
            <span style="flex:1;">Moeglichkeit</span>
            <span style="${card.cardType === 'boolean' ? 'width:36px; text-align:center;' : 'flex:1; text-align:center;'}">Loesung</span>
          </label>
          <div id="edit-items">
          ${card.items.map((item, i) => {
            const isBool = card.cardType === 'boolean';
            let solutionEl;
            if (isBool) {
              const val = item.solution ? 'true' : 'false';
              const clr = item.solution ? '#27AE60' : '#E74C3C';
              const sym = item.solution ? '\u2713' : '\u2717';
              solutionEl = '<span class="item-solution-toggle" data-value="' + val + '"' +
                ' style="width:36px; text-align:center; font-size:18px; cursor:pointer;' +
                ' flex-shrink:0; color:' + clr + '; user-select:none;">' + sym + '</span>';
            } else {
              solutionEl = '<input type="text" class="edit-item-solution-text"' +
                ' value="' + escapeHtml(item.solutionText || '') + '"' +
                ' style="flex:1; padding:6px 8px; font-size:14px; border:1px solid #ddd; border-radius:4px;"' +
                ' placeholder="Loesung">';
            }
            return '<div class="batch-item-row">' +
              '<span class="batch-item-num">' + (i + 1) + '.</span>' +
              '<input type="text" class="edit-item-label" value="' + escapeHtml(item.label || '') + '"' +
              ' placeholder="Item ' + (i + 1) + '"' +
              ' style="flex:1; padding:6px 8px; font-size:14px; border:1px solid #ddd; border-radius:4px;">' +
              solutionEl +
              '</div>';
          }).join('')}
          </div>
        </div>

        <button class="btn btn-success" id="btn-save-card">Speichern</button>

        ${cardId ? `
          <button class="btn btn-danger mt-8" id="btn-delete-card">Karte loeschen</button>
        ` : ''}

        <button class="btn btn-secondary mt-8" id="btn-cancel-edit">Abbrechen</button>
      </div>
    `;

    // Zurueck-Button
    view.querySelector('#editor-back')?.addEventListener('click', () => { app.navigate('library'); });

    // Boolean-Toggle: Antippen wechselt zwischen richtig/falsch
    view.querySelectorAll('.item-solution-toggle').forEach(toggle => {
      toggle.addEventListener('click', () => {
        const current = toggle.dataset.value === 'true';
        const newVal = !current;
        toggle.dataset.value = newVal ? 'true' : 'false';
        toggle.textContent = newVal ? '\u2713' : '\u2717';
        toggle.style.color = newVal ? '#27AE60' : '#E74C3C';
      });
    });

    // Speichern
    view.querySelector('#btn-save-card').addEventListener('click', async () => {
      const items = [];
      view.querySelectorAll('#edit-items > div').forEach((row, i) => {
        const toggle = row.querySelector('.item-solution-toggle');
        const solutionInput = row.querySelector('.edit-item-solution-text');
        items.push({
          position: i + 1,
          label: row.querySelector('.edit-item-label').value.trim(),
          solution: toggle ? toggle.dataset.value === 'true' : (card.items[i]?.solution || false),
          solutionText: solutionInput ? solutionInput.value.trim() : (card.items[i]?.solutionText || '')
        });
      });

      const updatedCard = {
        ...card,
        prompt: view.querySelector('#edit-prompt').value.trim(),
        category: view.querySelector('#edit-category').value,
        cardType: view.querySelector('#edit-cardtype').value,
        items
      };

      if (!updatedCard.prompt) {
        alert('Bitte eine Frage eingeben.');
        return;
      }

      await cardDB.saveCard(updatedCard);
      app.navigate('library');
    });

    // Loeschen
    view.querySelector('#btn-delete-card')?.addEventListener('click', async () => {
      if (confirm('Karte wirklich loeschen?')) {
        if (card.imageId) {
          await cardDB.deleteImage(card.imageId);
        }
        await cardDB.deleteCard(cardId);
        app.navigate('library');
      }
    });

    // Abbrechen
    view.querySelector('#btn-cancel-edit').addEventListener('click', () => {
      app.navigate('library');
    });
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
