/* ============================================
   Kopfnuss! -- Setup-Screen View
   Unified Card Architecture: Eine Datei, ein Kartenpool
   ============================================ */

import { state } from '../state.js';
import { router } from '../app.js';
import { GameModel } from '../models/game.js';
import { CARDS } from '../data/cards.js';
import { normalizeCardSet } from '../models/card.js';

// ── Konstanten ──────────────────────────────

const SLOT_COLORS = [
  '#22C55E',  // Slot 1: Grün
  '#EAB308',  // Slot 2: Gelb
  '#EF4444',  // Slot 3: Rot
  '#3B82F6',  // Slot 4: Blau
  '#EC4899',  // Slot 5: Magenta
];

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

const PICKER_ITEM_H = 40;
const PICKER_VISIBLE = 3;

const COOLDOWN_SESSIONS = 10;
const LS_COOLDOWN_KEY = 'kopfnuss_cooldown';

// ── State ───────────────────────────────────

let teamCount = 2;
let teamConfigs = [];
let targetScore = 10;
let timerSeconds = null;
let showCategoryMix = false;
let categoryWeights = {};

// ── Cooldown-Logik ──────────────────────────

function _getCooldownData() {
  try {
    const raw = localStorage.getItem(LS_COOLDOWN_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  return { session: 0, played: {} };
}

function _saveCooldownData(data) {
  localStorage.setItem(LS_COOLDOWN_KEY, JSON.stringify(data));
}

function _incrementSession() {
  const data = _getCooldownData();
  data.session++;
  _saveCooldownData(data);
  return data.session;
}

function _markCardPlayed(cardKey) {
  const data = _getCooldownData();
  data.played[cardKey] = data.session;
  _saveCooldownData(data);
}

// ── Kategorie-Helfer ────────────────────────

function _getCategories() {
  const cats = {};
  for (const card of CARDS.cards) {
    const cat = card.category || 'Allgemeinwissen';
    cats[cat] = (cats[cat] || 0) + 1;
  }
  return cats;
}

function _initCategoryWeights() {
  const cats = _getCategories();
  for (const cat of Object.keys(cats)) {
    if (!(cat in categoryWeights)) {
      categoryWeights[cat] = 100;
    }
  }
}

// ── Kartenpool-Aufbau ───────────────────────

function _getAvailableCards() {
  const data = _getCooldownData();
  const currentSession = data.session;
  let cards = [...CARDS.cards];

  // Kategorien-Filter
  if (showCategoryMix) {
    _initCategoryWeights();
    const cardsByCat = {};
    for (const card of cards) {
      const cat = card.category || 'Allgemeinwissen';
      if (!cardsByCat[cat]) cardsByCat[cat] = [];
      cardsByCat[cat].push(card);
    }

    const filtered = [];
    for (const [cat, catCards] of Object.entries(cardsByCat)) {
      const weight = categoryWeights[cat] ?? 100;
      if (weight <= 0) continue;
      const count = Math.max(1, Math.round(catCards.length * weight / 100));
      // Zufaellig auswaehlen
      const shuffled = [...catCards].sort(() => Math.random() - 0.5);
      filtered.push(...shuffled.slice(0, count));
    }
    cards = filtered;
  }

  // Cooldown-Filter
  const available = cards.filter(card => {
    const key = card.prompt?.text || '';
    const lastPlayed = data.played[key];
    if (lastPlayed === undefined) return true;
    return (currentSession - lastPlayed) >= COOLDOWN_SESSIONS;
  });

  // Wenn zu wenige Karten (< 5), Cooldown ignorieren
  if (available.length < 5) return cards;
  return available;
}

// ── Init / Destroy ──────────────────────────

function initSetup() {
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
  _initCategoryWeights();

  render();
}

function destroySetup() {
  const el = document.getElementById('view-setup');
  el.innerHTML = '';
}

function _ensureTeamConfigs() {
  const usedIndices = new Set(teamConfigs.filter(tc => tc.locked).map(tc => tc.nameIndex));
  while (teamConfigs.length < 5) {
    let idx = 0;
    while (usedIndices.has(idx) && idx < TEAM_NAME_POOL.length) idx++;
    teamConfigs.push({ nameIndex: idx, locked: false });
  }
}

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

function render() {
  const el = document.getElementById('view-setup');
  const availableCards = _getAvailableCards();
  const totalCards = CARDS.cards.length;
  const cats = _getCategories();

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

        <h3 style="margin-top: var(--space-lg)">Karten</h3>
        <p class="setup-card-info">
          Du spielst mit <strong>${availableCards.length}</strong> Karten
        </p>
        <button class="btn-ghost btn-toggle-cats" id="btn-toggle-categories">
          ${showCategoryMix ? '▼' : '▶'} Karten anpassen
        </button>
        ${showCategoryMix ? _renderCategorySliders(cats) : ''}
      </div>
    </div>

    <div class="setup-footer">
      ${_isDesktop() ? '<button class="btn-ghost btn-manage-sets" id="btn-manage-sets">Kartenverwaltung</button>' : ''}
      <button class="btn-start" id="btn-start">Spiel starten</button>
    </div>
  `;

  _bindEvents();
  _initPickers();
}

function _renderCategorySliders(cats) {
  _initCategoryWeights();
  return `
    <div class="category-sliders" id="category-sliders">
      ${Object.entries(cats).map(([name, count]) => {
        const w = categoryWeights[name] ?? 100;
        const included = Math.max(0, Math.round(count * w / 100));
        return `
          <div class="cat-slider-row">
            <span class="cat-slider-name">${_escapeHtml(name)}</span>
            <input type="range" min="0" max="100" step="10"
                   value="${w}" data-category="${name}"
                   class="cat-slider-input">
            <span class="cat-slider-pct" data-pct-for="${name}">${w}%</span>
            <span class="cat-slider-count">(${included}/${count})</span>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function _renderTeamRows() {
  let html = '';
  for (let i = 0; i < teamCount; i++) {
    const tc = teamConfigs[i];
    const color = SLOT_COLORS[i];
    const taken = _takenIndices(i);

    if (tc.locked) {
      html += `
        <div class="team-row">
          <div class="team-color-dot" style="background-color: ${color}"></div>
          <div class="team-name-locked">${_escapeHtml(TEAM_NAME_POOL[tc.nameIndex])}</div>
          <button class="btn-unlock" data-team="${i}" title="Entsperren">🔓</button>
        </div>
      `;
    } else {
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
    const targetTop = tc.nameIndex * PICKER_ITEM_H;
    scroll.scrollTop = targetTop;

    let scrollTimer = null;
    scroll.addEventListener('scroll', () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => _onPickerSnap(scroll, teamIdx), 80);
    });
  });
}

function _onPickerSnap(scrollEl, teamIdx) {
  const taken = _takenIndices(teamIdx);
  let rawIndex = Math.round(scrollEl.scrollTop / PICKER_ITEM_H);
  rawIndex = Math.max(0, Math.min(rawIndex, TEAM_NAME_POOL.length - 1));

  if (taken.has(rawIndex)) {
    for (let d = 1; d < TEAM_NAME_POOL.length; d++) {
      const up = rawIndex + d;
      const down = rawIndex - d;
      if (up < TEAM_NAME_POOL.length && !taken.has(up)) { rawIndex = up; break; }
      if (down >= 0 && !taken.has(down)) { rawIndex = down; break; }
    }
  }

  teamConfigs[teamIdx].nameIndex = rawIndex;
  scrollEl.scrollTo({ top: rawIndex * PICKER_ITEM_H, behavior: 'smooth' });
}

// ── Events ──────────────────────────────────

function _bindEvents() {
  // Team-Stepper
  document.getElementById('team-minus')?.addEventListener('click', () => {
    if (teamCount > 2) {
      teamCount--;
      if (teamConfigs[teamCount]) teamConfigs[teamCount].locked = false;
      render();
    }
  });

  document.getElementById('team-plus')?.addEventListener('click', () => {
    if (teamCount < 5) {
      teamCount++;
      _ensureTeamConfigs();
      const taken = _takenIndices(teamCount - 1);
      let idx = 0;
      while (taken.has(idx) && idx < TEAM_NAME_POOL.length) idx++;
      teamConfigs[teamCount - 1].nameIndex = idx;
      teamConfigs[teamCount - 1].locked = false;
      render();
    }
  });

  // Lock/Unlock
  document.querySelectorAll('.btn-lock').forEach(btn => {
    btn.addEventListener('click', () => {
      teamConfigs[parseInt(btn.dataset.team)].locked = true;
      render();
    });
  });

  document.querySelectorAll('.btn-unlock').forEach(btn => {
    btn.addEventListener('click', () => {
      teamConfigs[parseInt(btn.dataset.team)].locked = false;
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

  // Kategorien-Mix Toggle
  document.getElementById('btn-toggle-categories')?.addEventListener('click', () => {
    showCategoryMix = !showCategoryMix;
    render();
  });

  // Kategorien-Schieberegler
  document.querySelectorAll('.cat-slider-input').forEach(slider => {
    slider.addEventListener('input', (e) => {
      const cat = e.target.dataset.category;
      const val = parseInt(e.target.value);
      categoryWeights[cat] = val;

      // Live-Update der Anzeige
      const pctEl = document.querySelector(`[data-pct-for="${cat}"]`);
      if (pctEl) pctEl.textContent = `${val}%`;

      // Verfuegbare Karten neu berechnen
      const avail = _getAvailableCards();
      const infoEl = document.querySelector('.setup-card-info');
      if (infoEl) {
        infoEl.innerHTML = `Du spielst mit <strong>${avail.length}</strong> Karten`;
      }
    });
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

  // Kartenverwaltung -> Admin
  document.getElementById('btn-manage-sets')?.addEventListener('click', () => {
    router.navigate('admin');
  });

  // Spiel starten
  document.getElementById('btn-start')?.addEventListener('click', _startGame);
}

// ── Spiel starten ───────────────────────────

function _startGame() {
  // Session-Counter hochzaehlen
  _incrementSession();

  // Verfuegbare Karten ermitteln (mit Cooldown + Kategorienfilter)
  const availableCards = _getAvailableCards();

  if (availableCards.length === 0) {
    alert('Keine Karten verfuegbar! Bitte Kategorien anpassen oder Cooldown abwarten.');
    return;
  }

  // Kartenset aufbauen
  const cardSet = normalizeCardSet({
    id: 'kopfnuss',
    setName: 'Kopfnuss Kartenset',
    category: 'Gemischt',
    cards: availableCards
  });

  // Teams
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

  // Gespielte Karten tracken (Cooldown)
  game.onCardDrawn = (card) => {
    const key = card.prompt?.text || card.prompt;
    if (key) _markCardPlayed(key);
  };

  // In State speichern
  state.set('game', game);
  state.set('gameConfig', {
    teamCount,
    teamConfigs: teamConfigs.slice(0, teamCount).map(tc => ({ nameIndex: tc.nameIndex })),
    targetScore,
    timerSeconds,
    categoryWeights: showCategoryMix ? { ...categoryWeights } : null
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

function _isDesktop() {
  return !navigator.maxTouchPoints || navigator.maxTouchPoints <= 1;
}

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
