/* ============================================
   Digital Smartbox -- Setup-Screen View
   ============================================ */

import { state } from '../state.js';
import { router } from '../app.js';
import { GameModel } from '../models/game.js';
import { DEMO_SET } from '../data/demo-set.js';
import { cardStore } from '../services/card-store.js';
import { getSetMeta } from '../models/card.js';

// ── Konstanten ──────────────────────────────

const TEAM_COLORS = [
  { id: 'red',    value: '#FF6B6B' },
  { id: 'teal',   value: '#4ECDC4' },
  { id: 'yellow', value: '#FFE66D' },
  { id: 'purple', value: '#A78BFA' },
  { id: 'orange', value: '#FB923C' },
  { id: 'pink',   value: '#F472B6' }
];

const TARGET_SCORES = [10, 15, 20];
const TIMER_OPTIONS = [
  { label: '45s',  value: 45 },
  { label: '60s',  value: 60 },
  { label: '75s',  value: 75 },
  { label: '90s',  value: 90 },
  { label: 'Aus',  value: null }
];

const DEFAULT_TEAM_NAMES = ['Team 1', 'Team 2', 'Team 3', 'Team 4'];

// ── State ───────────────────────────────────

let teamCount = 2;
let teamConfigs = [];  // { name, colorIndex }
let targetScore = 10;
let timerSeconds = null;
let selectedCardSetId = 'demo';

// ── Init / Destroy ──────────────────────────

async function initSetup() {
  // Defaults oder gespeicherte Werte laden
  const saved = state.get('lastTeamConfig');
  if (saved) {
    teamCount = saved.teamCount || 2;
    teamConfigs = saved.teamConfigs || [];
    targetScore = state.get('lastTargetScore') || 10;
    timerSeconds = state.get('lastTimerSeconds') ?? null;
  }

  // Team-Configs auffuellen falls noetig
  _ensureTeamConfigs();

  // IndexedDB initialisieren und importierte Sets laden
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
  while (teamConfigs.length < 4) {
    teamConfigs.push({
      name: DEFAULT_TEAM_NAMES[teamConfigs.length],
      colorIndex: teamConfigs.length
    });
  }
}

// ── Render ───────────────────────────────────

async function render() {
  const el = document.getElementById('view-setup');

  // Verfuegbare Kartensets laden (Demo + importierte)
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

    <h1 class="setup-title">Digital Smartbox</h1>
    <p class="setup-subtitle">Einstellungen fuer euer Spiel</p>

    <div class="setup-container">
      <!-- Linke Spalte: Teams -->
      <div class="setup-section">
        <h3>Teams</h3>

        <!-- Stepper: Teamanzahl -->
        <div class="team-stepper">
          <button class="stepper-btn btn-primary" id="team-minus" ${teamCount <= 2 ? 'disabled' : ''}>−</button>
          <span class="stepper-value" id="team-count-display">${teamCount}</span>
          <button class="stepper-btn btn-primary" id="team-plus" ${teamCount >= 4 ? 'disabled' : ''}>+</button>
        </div>

        <!-- Team-Liste -->
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

    <!-- Footer: Buttons -->
    <div class="setup-footer">
      <button class="btn-ghost btn-manage-sets" id="btn-manage-sets">Kartensets verwalten</button>
      <button class="btn-start" id="btn-start">Spiel starten</button>
    </div>
  `;

  _bindEvents();
}

function _renderTeamRows() {
  let html = '';
  for (let i = 0; i < teamCount; i++) {
    const tc = teamConfigs[i];
    html += `
      <div class="team-row">
        <div class="team-color-dot" style="background-color: ${TEAM_COLORS[tc.colorIndex].value}" data-team="${i}"></div>
        <input type="text" class="team-name-input" data-team="${i}" value="${tc.name}" maxlength="20" />
        <div class="color-picker" data-team="${i}">
          ${TEAM_COLORS.map((c, ci) =>
            `<div class="color-option ${ci === tc.colorIndex ? 'active' : ''}" style="background-color: ${c.value}" data-color="${ci}"></div>`
          ).join('')}
        </div>
      </div>
    `;
  }
  return html;
}

// ── Events ──────────────────────────────────

function _bindEvents() {
  // Team-Stepper
  document.getElementById('team-minus')?.addEventListener('click', () => {
    if (teamCount > 2) { teamCount--; render(); }
  });

  document.getElementById('team-plus')?.addEventListener('click', () => {
    if (teamCount < 4) { teamCount++; _ensureTeamConfigs(); render(); }
  });

  // Team-Namen
  document.querySelectorAll('.team-name-input').forEach(input => {
    input.addEventListener('input', (e) => {
      const idx = parseInt(e.target.dataset.team);
      teamConfigs[idx].name = e.target.value || DEFAULT_TEAM_NAMES[idx];
    });
  });

  // Farbwahl
  document.querySelectorAll('.color-picker').forEach(picker => {
    picker.addEventListener('click', (e) => {
      const dot = e.target.closest('.color-option');
      if (!dot) return;
      const teamIdx = parseInt(picker.dataset.team);
      const colorIdx = parseInt(dot.dataset.color);
      teamConfigs[teamIdx].colorIndex = colorIdx;
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
    alert('Kein Kartenset ausgewaehlt oder Laden fehlgeschlagen!');
    return;
  }

  // Teams zusammenbauen
  const teams = [];
  for (let i = 0; i < teamCount; i++) {
    teams.push({
      name: teamConfigs[i].name || DEFAULT_TEAM_NAMES[i],
      color: TEAM_COLORS[teamConfigs[i].colorIndex].value
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
  state.set('gameConfig', { teamCount, teamConfigs: teamConfigs.slice(0, teamCount), targetScore, timerSeconds });

  // Settings persistieren
  state.set('lastTeamConfig', { teamCount, teamConfigs: teamConfigs.slice(0, teamCount) });
  state.set('lastTargetScore', targetScore);
  state.set('lastTimerSeconds', timerSeconds);
  state.save();

  // Zum Spiel navigieren
  router.navigate('game');
}

// ── Export / Registrierung ──────────────────

export function registerSetup() {
  router.register('setup', initSetup, destroySetup);
}
