/* ============================================
   Kopfnuss! -- Game-Screen View
   Verdrahtet GameModel mit Ring, Scoreboard,
   Timer, Audio und Aktions-Buttons.
   ============================================ */

import { state } from '../state.js';
import { router } from '../app.js';
import { renderRing, updateRingItem, setItemRevealing } from '../components/ring.js';
import { renderScoreboard, resetScoreboardState, animateScorePoint } from '../components/scoreboard.js';
import { TimerComponent } from '../components/timer.js';
import { audio } from '../services/audio.js';

/** @type {import('../models/game.js').GameModel|null} */
let game = null;

/** @type {TimerComponent|null} */
let timer = null;

// DOM-Referenzen
let elRoot, elScoreboard, elRing, elActions, elFooter, elTimer;

// ── Init / Destroy ──────────────────────────

function initGame() {
  game = state.get('game');
  if (!game) {
    router.navigate('setup');
    return;
  }

  // Sounds vorladen (safe check fuer Cache-Kompatibilitaet)
  if (typeof audio.preload === 'function') audio.preload();

  const el = document.getElementById('view-game');

  el.innerHTML = `
    <div class="game-layout">
      <div class="game-scoreboard" id="game-scoreboard"></div>
      <div class="game-board">
        <div class="ring-container" id="game-ring"></div>
      </div>
      <div class="game-actions" id="game-actions"></div>
      <div class="game-footer" id="game-footer">
        <button class="btn-game-footer" id="btn-skip-card">Nächste Karte</button>
        <div class="timer-display" id="game-timer"></div>
        <button class="btn-game-footer" id="btn-quit-game">Spiel beenden</button>
      </div>
    </div>
  `;

  // DOM-Referenzen cachen
  elRoot = el;
  elScoreboard = document.getElementById('game-scoreboard');
  elRing = document.getElementById('game-ring');
  elActions = document.getElementById('game-actions');
  elFooter = document.getElementById('game-footer');
  elTimer = document.getElementById('game-timer');

  // Timer-Komponente erstellen (falls Timer aktiviert)
  if (game.timerSeconds) {
    timer = new TimerComponent(elTimer);
  }

  // GameModel Callback setzen
  game.onStateChange = _onGameStateChange;

  // Footer-Events
  document.getElementById('btn-skip-card')?.addEventListener('click', _onSkipCard);
  document.getElementById('btn-quit-game')?.addEventListener('click', _onQuitGame);

  // Erste Runde starten
  game.startRound();
}

function destroyGame() {
  if (typeof audio.stopAll === 'function') audio.stopAll();
  if (timer) {
    timer.destroy();
    timer = null;
  }
  if (game) {
    game.onStateChange = null;
  }
  game = null;
  resetScoreboardState();
}

// ── Timer Management ────────────────────────

function _startTurnTimer() {
  if (!timer || !game || !game.timerSeconds) return;

  timer.start(game.timerSeconds, () => {
    // Timer abgelaufen -> Team raus
    if (game && game.phase === 'turnActive') {
      audio.play('wrong');
      game.timerExpired();
    }
  });
}

function _stopTimer() {
  if (timer) timer.stop();
}

function _pauseTimer() {
  if (timer) timer.pause();
}

// ── Game-State-Change Handler ───────────────

function _onGameStateChange(event, model) {
  switch (event) {
    case 'roundStarted':
    case 'turnChanged':
    case 'cardSkipped':
      _renderFullBoard();
      _startTurnTimer();
      break;

    case 'itemRevealing':
      _pauseTimer();
      _startRevealAnimation();
      break;

    case 'revealComplete':
      _stopTimer();
      _showResultButtons();
      break;

    case 'itemCorrect':
      audio.play('correct');
      _onItemResult('correct');
      break;

    case 'itemWrong':
      audio.play('wrong');
      _onItemResult('wrong');
      break;

    case 'teamPassed':
      _stopTimer();
      // Nur Scoreboard aktualisieren. Turn-Indikator waere falsch, da activeTeam
      // noch das passende Team ist (_currentTeamIndex wird erst bei turnChanged gesetzt).
      renderScoreboard(elScoreboard, game.teams, game.targetScore, game.activeTeam?.id);
      break;

    case 'timerExpired':
      _stopTimer();
      audio.play('wrong');
      break;

    case 'roundEnded':
      _stopTimer();
      _showRoundEndOverlay();
      break;

    case 'victory':
      _stopTimer();
      _onVictory();
      break;
  }
}

// ── Render ───────────────────────────────────

function _renderFullBoard() {
  if (!game || !game.currentCard) return;

  // Scoreboard
  renderScoreboard(elScoreboard, game.teams, game.targetScore, game.activeTeam?.id);

  // Ring
  const isDisabled = game.phase !== 'turnActive';
  renderRing(elRing, game.currentCard, game.revealedItems, game.itemResults, {
    disabled: isDisabled,
    onItemClick: _onItemClick,
    itemTeamColors: game.itemTeamColors
  });

  // Aktions-Buttons
  _renderActionButtons();

  // Skip-Card Button Sichtbarkeit
  const skipBtn = document.getElementById('btn-skip-card');
  if (skipBtn) {
    skipBtn.classList.toggle('hidden', !game.canSkipCard);
  }
}

function _renderActionButtons() {
  if (!game) return;

  if (game.phase === 'turnActive') {
    // Passe-Button (nur wenn roundScore >= 1)
    elActions.innerHTML = `
      <button class="btn-success" id="btn-pass" ${game.canPass ? '' : 'disabled'}>
        Passe
      </button>
    `;

    document.getElementById('btn-pass')?.addEventListener('click', _onPass);
  } else if (game.phase === 'turnResult') {
    // Richtig/Falsch Buttons
    elActions.innerHTML = `
      <button class="btn-success" id="btn-correct">Richtig</button>
      <button class="btn-danger" id="btn-wrong">Falsch</button>
    `;

    document.getElementById('btn-correct')?.addEventListener('click', _onCorrect);
    document.getElementById('btn-wrong')?.addEventListener('click', _onWrong);
  } else {
    elActions.innerHTML = '';
  }
}

// ── Event-Handler ────────────────────────────

function _onItemClick(itemId) {
  if (!game || game.phase !== 'turnActive') return;

  try {
    game.selectItem(itemId);
  } catch (err) {
    console.warn('[Game] selectItem Fehler:', err.message);
  }
}

function _startRevealAnimation() {
  if (!game || !game.revealingItem) return;

  // Item visuell in Reveal-Modus setzen
  setItemRevealing(elRing, game.revealingItem.id);

  // Alle anderen Items deaktivieren
  elRing.querySelectorAll('.ring-item:not(.revealed):not(.revealing)').forEach(el => {
    el.classList.add('disabled');
  });

  // Aktions-Buttons ausblenden waehrend Animation
  elActions.innerHTML = `
    <div class="flex-center" style="padding: var(--space-lg); color: var(--text-secondary);">
      Aufdecken...
    </div>
  `;

  // Nach 2 Sekunden: Reveal abschliessen
  setTimeout(() => {
    if (game && game.phase === 'revealing') {
      game.revealComplete();
    }
  }, 2000);
}

function _showResultButtons() {
  if (!game || !game.revealingItem) return;

  // Item im Ring aktualisieren (Loesung zeigen, aber noch ohne Ergebnis-Farbe)
  const item = game.currentCard.items.find(i => i.id === [...game.revealedItems].pop());
  if (item) {
    updateRingItem(elRing, item.id, item, null);
  }

  // Richtig/Falsch Buttons anzeigen
  _renderActionButtons();
}

function _onCorrect() {
  if (!game || game.phase !== 'turnResult') return;

  try {
    game.markCorrect();
  } catch (err) {
    console.warn('[Game] markCorrect Fehler:', err.message);
  }
}

function _onWrong() {
  if (!game || game.phase !== 'turnResult') return;

  try {
    game.markWrong();
  } catch (err) {
    console.warn('[Game] markWrong Fehler:', err.message);
  }
}

function _onPass() {
  if (!game || game.phase !== 'turnActive') return;

  try {
    game.pass();
  } catch (err) {
    console.warn('[Game] pass Fehler:', err.message);
  }
}

function _onSkipCard() {
  if (!game) return;

  try {
    game.skipCard();
  } catch (err) {
    console.warn('[Game] skipCard Fehler:', err.message);
  }
}

function _onQuitGame() {
  _stopTimer();

  // Danke-Overlay anzeigen
  const overlay = document.createElement('div');
  overlay.className = 'round-overlay';
  overlay.innerHTML = `
    <div class="round-overlay-content goodbye-overlay">
      <h2>Dankeschön!</h2>
      <p>Bis zum nächsten Mal ...</p>
    </div>
  `;
  elRoot.appendChild(overlay);

  // Nach 2.5 Sekunden zurueck zum Setup
  setTimeout(() => {
    router.navigate('setup');
  }, 2500);
}

function _onItemResult(result) {
  if (!game) return;

  // Item im Ring mit Ergebnis-Farbe aktualisieren
  const lastItemId = [...game.revealedItems].pop();
  const lastItem = game.currentCard.items.find(i => i.id === lastItemId);

  if (lastItem) {
    // Bei richtig: kein Teamfarb-Ring mehr (Item verschwindet gleich)
    const teamColor = null;
    updateRingItem(elRing, lastItemId, lastItem, result, teamColor);
  }

  // Bei richtiger Antwort: Fluganimation ZUERST, dann Scoreboard aktualisieren
  if (result === 'correct' && lastItemId && game.activeTeam) {
    const ringItemEl = elRing.querySelector(`[data-item-id="${lastItemId}"]`);
    if (ringItemEl) {
      // Animation starten (Scoreboard wird NACH der Animation aktualisiert)
      animateScorePoint(ringItemEl, game.activeTeam.id).then(() => {
        ringItemEl.classList.add('ring-item-gone');
        if (game) {
          renderScoreboard(elScoreboard, game.teams, game.targetScore, game.activeTeam?.id);
        }
      });
    } else {
      renderScoreboard(elScoreboard, game.teams, game.targetScore, game.activeTeam?.id);
    }
  } else {
    // Bei falsch: Scoreboard sofort aktualisieren
    renderScoreboard(elScoreboard, game.teams, game.targetScore, game.activeTeam?.id);
  }

  // Aktions-Buttons entfernen waehrend der Pause
  elActions.innerHTML = '';

  // Siegeserkennung: Wenn ein Gewinner feststeht (durch markCorrect gesetzt),
  // kurz das Feedback zeigen und dann sofort zum Victory-Screen wechseln.
  if (game.winner) {
    setTimeout(() => {
      if (game) {
        _onVictory();
      }
    }, 600);
    return;
  }

  // Nach 700ms: zum naechsten Zug uebergehen
  setTimeout(() => {
    if (game && game.phase === 'showingResult') {
      game.advanceTurn();
    }
  }, 700);
}

function _showRoundEndOverlay() {
  if (!game) return;

  // Overlay anzeigen
  const overlay = document.createElement('div');
  overlay.className = 'round-overlay';
  overlay.innerHTML = `
    <div class="round-overlay-content">
      <h2>Runde beendet!</h2>
      <p>Naechste Runde startet gleich...</p>
    </div>
  `;
  elRoot.appendChild(overlay);

  // Nach 2 Sekunden: naechste Runde starten
  setTimeout(() => {
    overlay.remove();
    if (game) {
      game.startRound();
    }
  }, 2000);
}

function _onVictory() {
  // Zum Sieges-Screen navigieren
  state.set('winner', game.winner);
  state.set('finalTeams', [...game.teams]);
  router.navigate('victory');
}

// ── Export / Registrierung ──────────────────

export function registerGame() {
  router.register('game', initGame, destroyGame);
}
