/* ============================================
   Settings-View: API-Keys und Einstellungen
   ============================================ */

import {
  getApiKey, setApiKey,
  getGeminiKey, setGeminiKey,
  getActiveModel, setActiveModel
} from './vision-api.js';

export function registerSettings(app) {
  const view = document.getElementById('view-settings');

  app.on('show:settings', async () => {
    // Einmalige Reparatur: falsch als 'boolean' importierte Text-Karten fixen
    const repaired = await repairCardTypes();
    if (repaired > 0) {
      console.log(`Auto-Reparatur: ${repaired} Kartentypen korrigiert.`);
    }
    render();
  });

  function render() {
    const claudeKey = getApiKey();
    const geminiKey = getGeminiKey();
    const activeModel = getActiveModel();

    const maskKey = (k) => k ? k.slice(0, 8) + '...' + k.slice(-4) : '';

    view.innerHTML =
      '<div class="admin-container">' +
        '<button class="admin-back-btn" id="settings-back">&larr; Zurueck</button>' +
        '<h2>Einstellungen</h2>' +

        '<div class="form-group mt-16">' +
          '<label>KI-Modell fuer Kartenerkennung</label>' +
          '<select id="select-model">' +
            '<option value="gemini"' + (activeModel === 'gemini' ? ' selected' : '') + '>Google Gemini (empfohlen)</option>' +
            '<option value="claude"' + (activeModel === 'claude' ? ' selected' : '') + '>Anthropic Claude</option>' +
          '</select>' +
        '</div>' +

        '<div class="form-group mt-16" id="gemini-key-group">' +
          '<label>Google Gemini API-Key</label>' +
          '<input type="password" id="input-gemini-key" placeholder="AIza..."' +
            ' value="' + (geminiKey || '') + '">' +
          (geminiKey ? '<p class="capture-hint mt-8">Gespeichert: ' + maskKey(geminiKey) + '</p>' : '') +
          '<p style="font-size:12px; color:#888; margin-top:4px;">Kostenlos auf <strong>aistudio.google.com</strong> &rarr; Get API Key</p>' +
        '</div>' +

        '<div class="form-group mt-16" id="claude-key-group">' +
          '<label>Anthropic Claude API-Key</label>' +
          '<input type="password" id="input-claude-key" placeholder="sk-ant-..."' +
            ' value="' + (claudeKey || '') + '">' +
          (claudeKey ? '<p class="capture-hint mt-8">Gespeichert: ' + maskKey(claudeKey) + '</p>' : '') +
          '<p style="font-size:12px; color:#888; margin-top:4px;">Auf <strong>console.anthropic.com</strong> &rarr; API Keys</p>' +
        '</div>' +

        '<button class="btn btn-primary mt-8" id="btn-save-settings">' +
          'Einstellungen speichern' +
        '</button>' +

        '<div class="mt-24">' +
          '<h3 style="font-size:14px; color:#666; margin-bottom:8px;">Hinweis</h3>' +
          '<p style="font-size:13px; color:#888; line-height:1.6;">' +
            'Die API-Keys werden nur auf deinem Geraet gespeichert (localStorage) ' +
            'und nie an Dritte gesendet. Sie werden ausschliesslich fuer die ' +
            'Kartenerkennung direkt an den jeweiligen KI-Anbieter geschickt.' +
          '</p>' +
        '</div>' +

        '<div class="mt-24">' +
          '<h3 style="font-size:14px; color:#666; margin-bottom:8px;">Datenbank</h3>' +
          '<p id="db-info" style="font-size:13px; color:#888;">Wird geladen...</p>' +
        '</div>' +
      '</div>';

    loadDbInfo();

    // Zurueck-Button
    view.querySelector('#settings-back')?.addEventListener('click', () => app.navigate('admin'));

    // Modellauswahl
    view.querySelector('#select-model').addEventListener('change', (e) => {
      setActiveModel(e.target.value);
    });

    // Speichern
    view.querySelector('#btn-save-settings').addEventListener('click', () => {
      const model = view.querySelector('#select-model').value;
      const gKey = view.querySelector('#input-gemini-key').value.trim();
      const cKey = view.querySelector('#input-claude-key').value.trim();

      setActiveModel(model);

      if (gKey) {
        if (!gKey.startsWith('AIza')) {
          alert('Der Gemini API-Key sollte mit "AIza" beginnen. Bitte pruefen.');
          return;
        }
        setGeminiKey(gKey);
      }

      if (cKey) {
        if (!cKey.startsWith('sk-')) {
          alert('Der Claude API-Key sollte mit "sk-" beginnen. Bitte pruefen.');
          return;
        }
        setApiKey(cKey);
      }

      alert('Einstellungen gespeichert!');
      render();
    });
  }

  async function loadDbInfo() {
    try {
      const { cardDB } = await import('./card-db.js');
      const count = await cardDB.getCardCount();
      const cats = await cardDB.getAllCategories();
      const el = view.querySelector('#db-info');
      if (el) {
        el.textContent = count + ' Karten gespeichert, ' + cats.length + ' Kategorien';
      }
    } catch {
      // Ignorieren
    }
  }

  /** Einmalig: Falsch als 'boolean' importierte Text-Karten reparieren */
  async function repairCardTypes() {
    const { cardDB } = await import('./card-db.js');
    const allCards = await cardDB.getAllCards();
    let repaired = 0;

    for (const card of allCards) {
      if (card.cardType !== 'boolean') continue;

      // Pruefen ob mindestens ein Item ein nicht-leeres solutionText hat
      const hasTextSolution = (card.items || []).some(
        item => item.solutionText && item.solutionText.trim() !== ''
              && item.solutionText !== 'Richtig' && item.solutionText !== 'Falsch'
      );

      if (hasTextSolution) {
        card.cardType = 'text';
        await cardDB.saveCard(card);
        repaired++;
        console.log(`Repariert: "${card.prompt}" → cardType: text`);
      }
    }

    if (repaired > 0) {
      console.log(`repairCardTypes: ${repaired} Karten von boolean → text korrigiert.`);
    }
    return repaired;
  }
}
