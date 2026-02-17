/* ============================================
   Kopfnuss! -- Setup-Screen View
   Unified Card Architecture: Eine Datei, ein Kartenpool
   Slot Machine Teamname-Picker
   ============================================ */

import { state } from '../state.js';
import { router } from '../app.js';
import { GameModel } from '../models/game.js';
import { CARDS } from '../data/cards.js';
import { normalizeCardSet } from '../models/card.js';

// ── Konstanten ──────────────────────────────

const SLOT_COLORS = [
  '#2d6a4f',  // Slot 1: Gruen
  '#e9c46a',  // Slot 2: Gold
  '#d4704e',  // Slot 3: Terracotta
  '#A78BFA',  // Slot 4: Lila
  '#FB923C',  // Slot 5: Orange
];

const TEAM_NAME_POOL = [
  'Team Durchblicker',
  'Team Synapsensalat',
  'Team Erleuchteten',
  'Team Kopfgold',
  'Team Grips & Glory',
  'Team Denkfabrik',
  'Team Antwortmaschinen',
  'Team Wissensraketen',
  'Team Hirnakrobaten',
  'Team Quizkanonen',
  'Team Schlaumeier',
];

const TARGET_SCORES = [10, 15, 20];
const TIMER_OPTIONS = [
  { label: '15s',  value: 15 },
  { label: '30s',  value: 30 },
  { label: '45s',  value: 45 },
  { label: '60s',  value: 60 },
  { label: 'Aus',  value: null }
];

// Slot Machine Konstanten
const SM_SPIN_DURATION = 3000;
const SM_EXTRA_ROTATIONS = 4;

// Item-Hoehen je nach Teamanzahl (Fenster-Hoehe kommt aus DOM via flex)
const SM_ITEM_HEIGHTS = { 2: 34, 3: 30, 4: 26, 5: 22 };

function _itemH() {
  return SM_ITEM_HEIGHTS[teamCount] || 34;
}

const COOLDOWN_SESSIONS = 10;
const LS_COOLDOWN_KEY = 'kopfnuss_cooldown';

// ── State ───────────────────────────────────

let teamCount = 2;
let teamConfigs = [];   // { nameIndex: number }
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
      const shuffled = [...catCards].sort(() => Math.random() - 0.5);
      filtered.push(...shuffled.slice(0, count));
    }
    cards = filtered;
  }

  const available = cards.filter(card => {
    const key = card.prompt?.text || '';
    const lastPlayed = data.played[key];
    if (lastPlayed === undefined) return true;
    return (currentSession - lastPlayed) >= COOLDOWN_SESSIONS;
  });

  if (available.length < 5) return cards;
  return available;
}

// ── Init / Destroy ──────────────────────────

function initSetup() {
  const saved = state.get('lastTeamConfig');
  if (saved) {
    teamCount = saved.teamCount || 2;
    teamConfigs = (saved.teamConfigs || []).map(tc => ({
      nameIndex: tc.nameIndex ?? 0
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
  while (teamConfigs.length < 5) {
    const idx = teamConfigs.length % TEAM_NAME_POOL.length;
    teamConfigs.push({ nameIndex: idx });
  }
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

    <span class="star" style="top:90px;right:40px;">✦</span>
    <span class="star" style="bottom:120px;left:60px;">✧</span>
    <span class="star" style="top:300px;right:120px;">⋆</span>
    <span class="star" style="top:200px;left:30px;">⋆</span>
    <span class="star" style="bottom:200px;right:60px;">✧</span>

    <h1 class="setup-title">Kopfnuss!</h1>
    <div class="setup-subtitle">~ Wie wollt Ihr spielen? ~</div>

    <div class="setup-container">
      <!-- Linke Spalte: Teams -->
      <div class="setup-section">
        <h3>Team-Einstellungen</h3>

        <div class="team-stepper">
          <button class="stepper-btn btn-primary" id="team-minus" ${teamCount <= 2 ? 'disabled' : ''}>−</button>
          <span class="stepper-value" id="team-count-display">${teamCount}</span>
          <button class="stepper-btn btn-primary" id="team-plus" ${teamCount >= 5 ? 'disabled' : ''}>+</button>
        </div>

        <div class="team-list" id="team-list" data-team-count="${teamCount}">
          ${_renderSlotMachines()}
        </div>
        <div class="sm-hint">🎰 Drückt den Button und lasst das Glück entscheiden!</div>
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
          Du spielst mit <strong>${availableCards.length}</strong> von ${totalCards} Karten
          ${availableCards.length < totalCards
            ? `<span style="font-size:0.85em; color:#888;"> (${totalCards - availableCards.length} im Cooldown)
                 <button class="cooldown-help-btn" id="btn-cooldown-help" aria-label="Was ist Cooldown?">?</button>
               </span>`
            : ''}
        </p>
        <div class="cooldown-tooltip hidden" id="cooldown-tooltip">
          <p class="cooldown-tooltip-text">
            <strong>Was ist Cooldown?</strong><br>
            Karten, die kürzlich gespielt wurden, pausieren für ${COOLDOWN_SESSIONS} Runden,
            damit sich Fragen nicht zu schnell wiederholen.
            Danach sind sie automatisch wieder verfügbar.
          </p>
          <button class="cooldown-reset-btn" id="btn-cooldown-reset">Cooldown zurücksetzen</button>
        </div>
        <button class="btn-toggle-cats" id="btn-toggle-categories">
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
  // Warten bis Flex-Layout berechnet ist, damit clientHeight korrekt ist
  requestAnimationFrame(() => _initSlotMachines());
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

// ── Slot Machine HTML ───────────────────────

function _renderSlotMachines() {
  let html = '';
  for (let i = 0; i < teamCount; i++) {
    const colorClasses = ['green', 'gold', 'terra', 'lilac', 'orange'];
    const colorClass = colorClasses[i] || 'green';

    html += `
      <div class="slot-machine ${colorClass}" id="sm-team${i}">
        <div class="sm-confetti" id="sm-confetti${i}"></div>
        <div class="sm-header">
          <div class="sm-dot"></div>
          <span class="sm-label">Team ${i + 1}</span>
          <span class="sm-chosen-name" id="sm-result${i}"></span>
        </div>
        <div class="sm-body">
          <div class="sm-window" id="sm-window${i}">
            <div class="sm-reel" id="sm-reel${i}"></div>
          </div>
          <div class="sm-lever-wrap">
            <button class="sm-spin-btn" id="sm-spin${i}" data-team="${i}">🎰</button>
            <span class="sm-spin-label">Drücken!</span>
          </div>
        </div>
        <div class="sm-footer">
          <button class="sm-respin" id="sm-respin${i}" data-team="${i}">Nochmal drehen?</button>
        </div>
      </div>
    `;
  }
  return html;
}

// ── Slot Machine Logik ──────────────────────

function _initSlotMachines() {
  for (let i = 0; i < teamCount; i++) {
    _buildReel(i);
  }
}

function _buildReel(teamIdx) {
  const reel = document.getElementById(`sm-reel${teamIdx}`);
  const windowEl = document.getElementById(`sm-window${teamIdx}`);
  if (!reel || !windowEl) return;

  reel.innerHTML = '';
  const repeats = SM_EXTRA_ROTATIONS + 3;
  const itemH = _itemH();
  const windowH = windowEl.clientHeight;

  for (let r = 0; r < repeats; r++) {
    TEAM_NAME_POOL.forEach(name => {
      const div = document.createElement('div');
      div.className = 'sm-reel-item';
      div.textContent = name;
      div.dataset.name = name;
      div.style.height = itemH + 'px';
      reel.appendChild(div);
    });
  }

  const tc = teamConfigs[teamIdx];
  const centerOffset = (windowH / 2) - (itemH / 2);
  const startY = centerOffset - (tc.nameIndex * itemH);
  reel.style.transform = `translateY(${startY}px)`;
  _highlightCenter(reel, startY);
}

function _highlightCenter(reel, currentY) {
  const items = reel.querySelectorAll('.sm-reel-item');
  const itemH = _itemH();
  const windowH = reel.parentElement ? reel.parentElement.clientHeight : 110;
  const centerY = windowH / 2;

  items.forEach(item => {
    const itemTop = item.offsetTop + currentY;
    const itemCenter = itemTop + itemH / 2;
    const dist = Math.abs(itemCenter - centerY);
    item.classList.toggle('center', dist < itemH / 2);
  });
}

function _easeOutQuart(t) {
  return 1 - Math.pow(1 - t, 4);
}

function _spin(teamIdx) {
  const reel      = document.getElementById(`sm-reel${teamIdx}`);
  const spinBtn   = document.getElementById(`sm-spin${teamIdx}`);
  const windowEl  = document.getElementById(`sm-window${teamIdx}`);
  const resultEl  = document.getElementById(`sm-result${teamIdx}`);
  const respinEl  = document.getElementById(`sm-respin${teamIdx}`);
  const confettiEl = document.getElementById(`sm-confetti${teamIdx}`);

  if (!reel || !spinBtn) return;

  // UI zuruecksetzen
  spinBtn.disabled = true;
  spinBtn.classList.add('spinning');
  resultEl.textContent = '';
  resultEl.classList.remove('visible');
  respinEl.classList.remove('visible');
  windowEl.classList.remove('winner');
  confettiEl.innerHTML = '';

  // Zufaelliges Ziel
  const targetIndex = Math.floor(Math.random() * TEAM_NAME_POOL.length);
  const targetName = TEAM_NAME_POOL[targetIndex];

  // Endposition berechnen
  const totalNames = TEAM_NAME_POOL.length;
  const lastSetStart = SM_EXTRA_ROTATIONS * totalNames;
  const targetItemIndex = lastSetStart + targetIndex;
  const itemH = _itemH();
  const windowH = windowEl.clientHeight;
  const centerOffset = (windowH / 2) - (itemH / 2);
  const endY = centerOffset - (targetItemIndex * itemH);

  // Startposition (oben, erster Name)
  const startY = centerOffset;
  reel.style.transition = 'none';
  reel.style.transform = `translateY(${startY}px)`;

  const startTime = performance.now();
  const totalDistance = startY - endY;

  function animate(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / SM_SPIN_DURATION, 1);
    const easedProgress = _easeOutQuart(progress);

    const currentY = startY - (totalDistance * easedProgress);
    reel.style.transform = `translateY(${currentY}px)`;
    _highlightCenter(reel, currentY);

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      // Fertig
      spinBtn.disabled = false;
      spinBtn.classList.remove('spinning');

      // Ergebnis oben im Header anzeigen (ohne "Team ", Teamfarbe)
      const displayName = targetName.replace(/^Team\s+/i, '');
      resultEl.textContent = displayName;
      resultEl.style.color = SLOT_COLORS[teamIdx] || SLOT_COLORS[0];
      setTimeout(() => {
        resultEl.classList.add('visible');
        respinEl.classList.add('visible');
        windowEl.classList.add('winner');
        _spawnSlotConfetti(confettiEl);
      }, 100);

      // Teamnamen im State speichern
      teamConfigs[teamIdx].nameIndex = targetIndex;
    }
  }

  requestAnimationFrame(animate);
}

function _spawnSlotConfetti(container) {
  const colors = ['#b44d2d', '#e9c46a', '#2d6a4f', '#d4704e', '#95d5b2', '#fcd34d'];

  for (let i = 0; i < 16; i++) {
    const dot = document.createElement('div');
    dot.className = 'sm-confetti-dot';
    dot.style.background = colors[Math.floor(Math.random() * colors.length)];
    dot.style.left = (10 + Math.random() * 80) + '%';
    dot.style.top = (20 + Math.random() * 30) + '%';
    const size = (4 + Math.random() * 5) + 'px';
    dot.style.width = size;
    dot.style.height = size;
    dot.style.animation = `smConfettiFall ${0.6 + Math.random() * 0.8}s ease ${Math.random() * 0.3}s forwards`;
    container.appendChild(dot);
  }

  setTimeout(() => { container.innerHTML = ''; }, 2000);
}

// ── Events ──────────────────────────────────

function _bindEvents() {
  // Team-Stepper
  document.getElementById('team-minus')?.addEventListener('click', () => {
    if (teamCount > 2) {
      teamCount--;
      render();
    }
  });

  document.getElementById('team-plus')?.addEventListener('click', () => {
    if (teamCount < 5) {
      teamCount++;
      _ensureTeamConfigs();
      render();
    }
  });

  // Slot Machine Spin-Buttons
  document.querySelectorAll('.sm-spin-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      _spin(parseInt(btn.dataset.team));
    });
  });

  // Slot Machine Respin-Buttons
  document.querySelectorAll('.sm-respin').forEach(btn => {
    btn.addEventListener('click', () => {
      _spin(parseInt(btn.dataset.team));
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

      const pctEl = document.querySelector(`[data-pct-for="${cat}"]`);
      if (pctEl) pctEl.textContent = `${val}%`;

      const avail = _getAvailableCards();
      const infoEl = document.querySelector('.setup-card-info');
      if (infoEl) {
        const total = CARDS.cards.length;
        const cd = total - avail.length;
        infoEl.innerHTML = `Du spielst mit <strong>${avail.length}</strong> von ${total} Karten`
          + (cd > 0 ? ` <span style="font-size:0.85em; color:#888;">(${cd} im Cooldown) <button class="cooldown-help-btn" id="btn-cooldown-help" aria-label="Was ist Cooldown?">?</button></span>` : '');
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

  // Cooldown-Hilfe anzeigen/verstecken
  document.getElementById('btn-cooldown-help')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const tooltip = document.getElementById('cooldown-tooltip');
    if (tooltip) tooltip.classList.toggle('hidden');
  });

  // Cooldown zuruecksetzen
  document.getElementById('btn-cooldown-reset')?.addEventListener('click', () => {
    localStorage.removeItem(LS_COOLDOWN_KEY);
    document.getElementById('cooldown-tooltip')?.classList.add('hidden');
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
  _incrementSession();

  const availableCards = _getAvailableCards();

  if (availableCards.length === 0) {
    alert('Keine Karten verfuegbar! Bitte Kategorien anpassen oder Cooldown abwarten.');
    return;
  }

  const cardSet = normalizeCardSet({
    id: 'kopfnuss',
    setName: 'Kopfnuss Kartenset',
    category: 'Gemischt',
    cards: availableCards
  });

  const teams = [];
  for (let i = 0; i < teamCount; i++) {
    const tc = teamConfigs[i];
    teams.push({
      name: TEAM_NAME_POOL[tc.nameIndex],
      color: SLOT_COLORS[i]
    });
  }

  const game = new GameModel({
    teams,
    targetScore,
    timerSeconds,
    cardSet
  });

  game.onCardDrawn = (card) => {
    const key = card.prompt?.text || card.prompt;
    if (key) _markCardPlayed(key);
  };

  state.set('game', game);
  state.set('gameConfig', {
    teamCount,
    teamConfigs: teamConfigs.slice(0, teamCount).map(tc => ({ nameIndex: tc.nameIndex })),
    targetScore,
    timerSeconds,
    categoryWeights: showCategoryMix ? { ...categoryWeights } : null
  });

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
