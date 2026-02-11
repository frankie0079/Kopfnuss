/* ============================================
   Kopfnuss! -- Setup-Screen View
   ============================================ */

import { state } from '../state.js';
import { router } from '../app.js';
import { GameModel } from '../models/game.js';
import { DEMO_SET } from '../data/demo-set.js';
import { cardStore } from '../services/card-store.js';
import { getSetMeta } from '../models/card.js';

// ── Konstanten ──────────────────────────────

/** Feste Farben pro Team-Slot (Index = Slot) */
const SLOT_COLORS = [
  '#22C55E',  // Slot 1: Grün
  '#EAB308',  // Slot 2: Gelb
  '#EF4444',  // Slot 3: Rot
  '#3B82F6',  // Slot 4: Blau
  '#EC4899',  // Slot 5: Magenta
];

/** Wählbare Teamnamen */
const TEAM_NAME_POOL = [
  'Team Grips & Glory',
  'Team Synapsensalat',
  'Team Denkfabrik',
  'Team Antwortmaschinen',
  'Team Wissensraketen',
  'Team Durchblicker',
  'Team Erleuchteten',
  'Team Kopfgold',
  'Team Lichtblick',
];

const TARGET_SCORES = [10, 15, 20];
const TIMER_OPTIONS = [
  { label: '15s',  value: 15 },
  { label: '30s',  value: 30 },
  { label: '45s',  value: 45 },
  { label: '60s',  value: 60 },
  { label: 'Aus',  value: null }
];

const PICKER_ITEM_H = 40;  // px Höhe pro Picker-Item
const PICKER_VISIBLE = 3;  // sichtbare Zeilen

// ── State ───────────────────────────────────

let teamCount = 2;
let teamConfigs = [];  // { nameIndex: number, locked: boolean }
let targetScore = 10;
let timerSeconds = null;
let selectedCardSetId = 'demo';

// ── Init / Destroy ──────────────────────────

async function initSetup() {
  const saved = state.get('lastTeamConfig');
  if (saved) {
    teamCount = saved.teamCount || 2;
    teamConfigs = (saved.teamConfigs || []).map(tc => ({
      nameIndex: tc.nameIndex ?? 0,
      locked: false
    }));
    targetScore = state.get('lastTargetScore') || 10;
    timerSeconds = state.get('lastTimerSeconds') ?? null;
  }

  _ensureTeamConfigs();

  try {
    await cardStore.init();
  } catch (err) {
    console.warn('[Setup] IndexedDB init fehlgeschlagen:', err);
  }

  render();
}

function destroySetup() {
  const el = document.getElementById('view-setup');
  el.innerHTML = '';
}

function _ensureTeamConfigs() {
  // Sicherstellen, dass für jeden möglichen Slot eine Config existiert
  const usedIndices = new Set(teamConfigs.filter(tc => tc.locked).map(tc => tc.nameIndex));

  while (teamConfigs.length < 5) {
    // Nächsten freien Namen finden
    let idx = 0;
    while (usedIndices.has(idx) && idx < TEAM_NAME_POOL.length) idx++;
    teamConfigs.push({ nameIndex: idx, locked: false });
  }
}

/** Welche nameIndex-Werte sind von ANDEREN Teams (locked) belegt? */
function _takenIndices(excludeTeamIdx) {
  const taken = new Set();
  for (let i = 0; i < teamCount; i++) {
    if (i !== excludeTeamIdx && teamConfigs[i].locked) {
      taken.add(teamConfigs[i].nameIndex);
    }
  }
  return taken;
}

// ── Render ───────────────────────────────────

async function render() {
  const el = document.getElementById('view-setup');

  const cardSets = [{ id: 'demo', name: 'Allgemeinwissen (Demo)', count: DEMO_SET.cards.length }];
  try {
    const importedSets = await cardStore.getAllSets();
    if (importedSets) {
      for (const s of importedSets) {
        const meta = getSetMeta(s);
        cardSets.push({ id: meta.id, name: `${meta.setName} (${meta.category})`, count: meta.cardCount });
      }
    }
  } catch (err) {
    console.warn('[Setup] Importierte Sets laden fehlgeschlagen:', err);
  }

  el.innerHTML = `
    <button class="theme-toggle" id="theme-toggle" aria-label="Tag/Nacht umschalten">
      ${document.documentElement.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙'}
    </button>

    <h1 class="setup-title">Kopfnuss!</h1>
    <p class="setup-subtitle">Einstellungen für euer Spiel</p>

    <div class="setup-container">
      <!-- Linke Spalte: Teams -->
      <div class="setup-section">
        <h3>Teams</h3>

        <div class="team-stepper">
          <button class="stepper-btn btn-primary" id="team-minus" ${teamCount <= 2 ? 'disabled' : ''}>−</button>
          <span class="stepper-value" id="team-count-display">${teamCount}</span>
          <button class="stepper-btn btn-primary" id="team-plus" ${teamCount >= 5 ? 'disabled' : ''}>+</button>
        </div>

        <div class="team-list" id="team-list">
          ${_renderTeamRows()}
        </div>
      </div>

      <!-- Rechte Spalte: Spieleinstellungen -->
      <div class="setup-section">
        <h3>Zielpunktzahl</h3>
        <div class="option-group" id="target-score-group">
          ${TARGET_SCORES.map(s =>
            `<button class="option-btn ${s === targetScore ? 'active' : ''}" data-value="${s}">${s} Punkte</button>`
          ).join('')}
        </div>

        <h3 style="margin-top: var(--space-lg)">Timer pro Zug</h3>
        <div class="option-group" id="timer-group">
          ${TIMER_OPTIONS.map(opt =>
            `<button class="option-btn ${(opt.value === timerSeconds) ? 'active' : ''}" data-value="${opt.value}">${opt.label}</button>`
          ).join('')}
        </div>

        <h3 style="margin-top: var(--space-lg)">Kartenset</h3>
        <select class="cardset-select" id="cardset-select">
          ${cardSets.map(s =>
            `<option value="${s.id}" ${s.id === selectedCardSetId ? 'selected' : ''}>${s.name} (${s.count} Karten)</option>`
          ).join('')}
        </select>
      </div>
    </div>

    <div class="setup-footer">
      <button class="btn-ghost btn-manage-sets" id="btn-manage-sets">Kartensets verwalten</button>
      <button class="btn-start" id="btn-start">Spiel starten</button>
    </div>
  `;

  _bindEvents();

  // Picker nach dem Rendern initialisieren (scroll-Position setzen)
  _initPickers();
}

function _renderTeamRows() {
  let html = '';
  for (let i = 0; i < teamCount; i++) {
    const tc = teamConfigs[i];
    const color = SLOT_COLORS[i];
    const taken = _takenIndices(i);

    if (tc.locked) {
      // Eingelockter Zustand: fester Name + Entsperren-Button
      html += `
        <div class="team-row">
          <div class="team-color-dot" style="background-color: ${color}"></div>
          <div class="team-name-locked">${_escapeHtml(TEAM_NAME_POOL[tc.nameIndex])}</div>
          <button class="btn-unlock" data-team="${i}" title="Entsperren">🔓</button>
        </div>
      `;
    } else {
      // Scroll-Picker Zustand
      const pickerH = PICKER_ITEM_H * PICKER_VISIBLE;
      html += `
        <div class="team-row">
          <div class="team-color-dot" style="background-color: ${color}"></div>
          <div class="team-picker" data-team="${i}" style="height: ${pickerH}px">
            <div class="team-picker-highlight"></div>
            <div class="team-picker-scroll" data-team="${i}">
              ${TEAM_NAME_POOL.map((name, ni) => {
                const isTaken = taken.has(ni);
                return `<div class="team-picker-item ${isTaken ? 'taken' : ''}"
                             data-name-index="${ni}"
                             style="height: ${PICKER_ITEM_H}px; line-height: ${PICKER_ITEM_H}px">
                          ${_escapeHtml(name)}
                        </div>`;
              }).join('')}
            </div>
          </div>
          <button class="btn-lock" data-team="${i}" title="Bestätigen">✓</button>
        </div>
      `;
    }
  }
  return html;
}

// ── Picker-Initialisierung ──────────────────

function _initPickers() {
  document.querySelectorAll('.team-picker-scroll').forEach(scroll => {
    const teamIdx = parseInt(scroll.dataset.team);
    const tc = teamConfigs[teamIdx];

    // Zum aktuell gewählten Namen scrollen
    const targetTop = tc.nameIndex * PICKER_ITEM_H;
    scroll.scrollTop = targetTop;

    // Scroll-Snap-Ende erkennen
    let scrollTimer = null;
    scroll.addEventListener('scroll', () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => _onPickerSnap(scroll, teamIdx), 80);
    });
  });
}

function _onPickerSnap(scrollEl, teamIdx) {
  const taken = _takenIndices(teamIdx);

  // Nächsten gültigen Index finden
  let rawIndex = Math.round(scrollEl.scrollTop / PICKER_ITEM_H);
  rawIndex = Math.max(0, Math.min(rawIndex, TEAM_NAME_POOL.length - 1));

  // Falls der Name vergeben ist, nächsten freien suchen
  if (taken.has(rawIndex)) {
    let found = false;
    // Vorwärts suchen
    for (let d = 1; d < TEAM_NAME_POOL.length; d++) {
      const up = rawIndex + d;
      const down = rawIndex - d;
      if (up < TEAM_NAME_POOL.length && !taken.has(up)) {
        rawIndex = up;
        found = true;
        break;
      }
      if (down >= 0 && !taken.has(down)) {
        rawIndex = down;
        found = true;
        break;
      }
    }
    if (!found) rawIndex = 0; // Fallback
  }

  teamConfigs[teamIdx].nameIndex = rawIndex;

  // Smooth zum korrekten Snap-Punkt scrollen
  scrollEl.scrollTo({ top: rawIndex * PICKER_ITEM_H, behavior: 'smooth' });
}

// ── Events ──────────────────────────────────

function _bindEvents() {
  // Team-Stepper
  document.getElementById('team-minus')?.addEventListener('click', () => {
    if (teamCount > 2) {
      teamCount--;
      // Entsperren des entfernten Teams
      if (teamConfigs[teamCount]) teamConfigs[teamCount].locked = false;
      render();
    }
  });

  document.getElementById('team-plus')?.addEventListener('click', () => {
    if (teamCount < 5) {
      teamCount++;
      _ensureTeamConfigs();
      // Neues Team soll einen freien Namen bekommen
      const taken = _takenIndices(teamCount - 1);
      let idx = 0;
      while (taken.has(idx) && idx < TEAM_NAME_POOL.length) idx++;
      teamConfigs[teamCount - 1].nameIndex = idx;
      teamConfigs[teamCount - 1].locked = false;
      render();
    }
  });

  // Lock-Buttons (Bestätigen)
  document.querySelectorAll('.btn-lock').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.team);
      teamConfigs[idx].locked = true;
      render();
    });
  });

  // Unlock-Buttons (Entsperren)
  document.querySelectorAll('.btn-unlock').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.team);
      teamConfigs[idx].locked = false;
      render();
    });
  });

  // Zielpunktzahl
  document.getElementById('target-score-group')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.option-btn');
    if (!btn) return;
    targetScore = parseInt(btn.dataset.value);
    render();
  });

  // Timer
  document.getElementById('timer-group')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.option-btn');
    if (!btn) return;
    const val = btn.dataset.value;
    timerSeconds = val === 'null' ? null : parseInt(val);
    render();
  });

  // Kartenset
  document.getElementById('cardset-select')?.addEventListener('change', (e) => {
    selectedCardSetId = e.target.value;
  });

  // Theme Toggle
  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    state.set('theme', next);
    state.save();
    render();
  });

  // Kartensets verwalten
  document.getElementById('btn-manage-sets')?.addEventListener('click', () => {
    router.navigate('import');
  });

  // Spiel starten
  document.getElementById('btn-start')?.addEventListener('click', _startGame);
}

// ── Spiel starten ───────────────────────────

async function _startGame() {
  // Kartenset laden
  let cardSet = null;
  if (selectedCardSetId === 'demo') {
    cardSet = DEMO_SET;
  } else {
    try {
      cardSet = await cardStore.getSet(selectedCardSetId);
    } catch (err) {
      console.error('[Setup] Kartenset laden fehlgeschlagen:', err);
    }
  }

  if (!cardSet) {
    alert('Kein Kartenset ausgewählt oder Laden fehlgeschlagen!');
    return;
  }

  // Teams zusammenbauen
  const teams = [];
  for (let i = 0; i < teamCount; i++) {
    const tc = teamConfigs[i];
    teams.push({
      name: TEAM_NAME_POOL[tc.nameIndex],
      color: SLOT_COLORS[i]
    });
  }

  // GameModel erstellen
  const game = new GameModel({
    teams,
    targetScore,
    timerSeconds,
    cardSet
  });

  // In State speichern
  state.set('game', game);
  state.set('gameConfig', {
    teamCount,
    teamConfigs: teamConfigs.slice(0, teamCount).map(tc => ({ nameIndex: tc.nameIndex })),
    targetScore,
    timerSeconds,
    selectedCardSetId
  });

  // Settings persistieren
  state.set('lastTeamConfig', {
    teamCount,
    teamConfigs: teamConfigs.slice(0, teamCount).map(tc => ({ nameIndex: tc.nameIndex }))
  });
  state.set('lastTargetScore', targetScore);
  state.set('lastTimerSeconds', timerSeconds);
  state.save();

  router.navigate('game');
}

// ── Hilfsfunktionen ─────────────────────────

function _escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ── Export / Registrierung ──────────────────

export function registerSetup() {
  router.register('setup', initSetup, destroySetup);
}
