/* ============================================
   Digital Smartbox -- Victory-Screen View
   ============================================ */

import { state } from '../state.js';
import { router } from '../app.js';
import { audio } from '../services/audio.js';
import { GameModel } from '../models/game.js';
import { DEMO_SET } from '../data/demo-set.js';
import { cardStore } from '../services/card-store.js';

// ── Init / Destroy ──────────────────────────

function initVictory() {
  const winner = state.get('winner');
  const finalTeams = state.get('finalTeams') || [];

  if (!winner) {
    router.navigate('setup');
    return;
  }

  const el = document.getElementById('view-victory');

  // Sortiere Teams nach Punktzahl (absteigend)
  const sorted = [...finalTeams].sort((a, b) => b.totalScore - a.totalScore);

  el.innerHTML = `
    <div class="victory-content">
      <div class="victory-trophy">🏆</div>
      <h1 class="victory-title" style="color: ${winner.color}">
        ${_escapeHtml(winner.name)} gewinnt!
      </h1>
      <p class="victory-score">${winner.totalScore} Punkte</p>

      <div class="victory-standings">
        ${sorted.map((team, i) => `
          <div class="victory-team-row ${team.id === winner.id ? 'winner' : ''}">
            <span class="victory-rank">${i + 1}.</span>
            <span class="victory-team-dot" style="background-color: ${team.color}"></span>
            <span class="victory-team-name">${_escapeHtml(team.name)}</span>
            <span class="victory-team-score">${team.totalScore}</span>
          </div>
        `).join('')}
      </div>

      <div class="victory-buttons">
        <button class="btn-start" id="btn-new-game">Neues Spiel</button>
        <button class="btn-ghost" id="btn-rematch">Nochmal spielen</button>
      </div>
    </div>
  `;

  // Konfetti starten
  _createConfetti(el);

  // Fanfare abspielen
  audio.play('fanfare');

  // Events
  document.getElementById('btn-new-game')?.addEventListener('click', () => {
    router.navigate('setup');
  });

  document.getElementById('btn-rematch')?.addEventListener('click', () => {
    _startRematch(finalTeams);
  });
}

/**
 * Rematch starten: Neues Spiel mit gleichen Teams und Einstellungen.
 * @param {Array} teams -- Team-Objekte aus dem letzten Spiel
 */
async function _startRematch(teams) {
  try {
    const config = state.get('gameConfig');
    if (!config) {
      console.warn('[Victory] Kein gameConfig vorhanden, gehe zu Setup.');
      router.navigate('setup');
      return;
    }

    // Kartenset laden (statische Imports, kein dynamisches import())
    let cardSet = null;
    const cardSetId = config.selectedCardSetId || 'demo';

    if (cardSetId === 'demo') {
      cardSet = DEMO_SET;
    } else {
      try {
        cardSet = await cardStore.getSet(cardSetId);
      } catch (dbErr) {
        console.warn('[Victory] Kartenset aus DB laden fehlgeschlagen:', dbErr);
      }
    }

    // Fallback auf Demo-Set
    if (!cardSet) {
      console.warn('[Victory] Kartenset nicht gefunden, nutze Demo-Set.');
      cardSet = DEMO_SET;
    }

    // Neues Spiel mit gleichen Teams und Settings erstellen
    const game = new GameModel({
      teams: teams.map(t => ({ name: t.name, color: t.color })),
      targetScore: config.targetScore,
      timerSeconds: config.timerSeconds,
      cardSet
    });

    state.set('game', game);
    router.navigate('game');
  } catch (err) {
    console.error('[Victory] Rematch fehlgeschlagen:', err);
    router.navigate('setup');
  }
}

function destroyVictory() {
  const el = document.getElementById('view-victory');
  el.innerHTML = '';
}

// ── Konfetti ────────────────────────────────

function _createConfetti(parentEl) {
  const container = document.createElement('div');
  container.className = 'confetti-container';

  const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A78BFA', '#FB923C', '#F472B6', '#00B894'];
  const count = 60;

  for (let i = 0; i < count; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';

    const color = colors[Math.floor(Math.random() * colors.length)];
    const left = Math.random() * 100;
    const size = 6 + Math.random() * 10;
    const delay = Math.random() * 2;
    const duration = 2 + Math.random() * 3;
    const drift = -40 + Math.random() * 80;
    const isCircle = Math.random() > 0.5;

    piece.style.setProperty('--confetti-color', color);
    piece.style.setProperty('--confetti-left', `${left}%`);
    piece.style.setProperty('--confetti-size', `${size}px`);
    piece.style.setProperty('--confetti-delay', `${delay}s`);
    piece.style.setProperty('--confetti-duration', `${duration}s`);
    piece.style.setProperty('--confetti-drift', `${drift}px`);
    piece.style.setProperty('--confetti-radius', isCircle ? '50%' : '2px');

    container.appendChild(piece);
  }

  parentEl.appendChild(container);

  // Konfetti nach 6 Sekunden entfernen
  setTimeout(() => container.remove(), 6000);
}

function _escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ── Export / Registrierung ──────────────────

export function registerVictory() {
  router.register('victory', initVictory, destroyVictory);
}
