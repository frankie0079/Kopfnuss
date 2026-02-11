/* ============================================
   Kopfnuss! -- Scoreboard Component
   Rechteck-Karten mit Punktekreisen.
   Fluganimation bei richtiger Antwort.
   ============================================ */

import { audio } from '../services/audio.js';

/** Vorherige aktive Team-ID */
let _previousActiveId = null;

// ── Render ──────────────────────────────────

/**
 * Scoreboard rendern.
 */
export function renderScoreboard(container, teams, targetScore, activeTeamId) {
  _previousActiveId = activeTeamId;

  // Kreisgroesse je nach Zielpunktzahl
  const dotSize = targetScore <= 10 ? 14 : targetScore <= 15 ? 11 : 9;

  let html = '';

  teams.forEach((team) => {
    const isActive     = (team.id === activeTeamId) && team.isActive;
    const isEliminated = !team.isActive;

    const effectiveScore = team.totalScore + team.roundScore;

    let classes = 'score-card';
    if (isEliminated) classes += ' eliminated';

    // Punktekreise generieren
    let dotsHtml = `<div class="score-dots">`;
    for (let c = 0; c < targetScore; c++) {
      let dotClass = 'score-dot';
      if (c < team.totalScore) {
        dotClass += ' dot-total';
      } else if (c < effectiveScore) {
        dotClass += ' dot-round';
      }
      dotsHtml += `<div class="${dotClass}" data-dot-index="${c}" data-team-id="${team.id}"
                        style="width:${dotSize}px;height:${dotSize}px"></div>`;
    }
    dotsHtml += '</div>';

    html += `
      <div class="${classes}" data-team-id="${team.id}"
           style="background-color: ${team.color};">
        <div class="score-card-name">
          ${_escapeHtml(team.name)}
          ${isEliminated ? ' <small style="opacity: 0.7">(raus)</small>' : ''}
        </div>
        <div class="score-card-scores">
          <span class="score-total">${effectiveScore}</span>
          ${team.roundScore > 0
            ? `<span class="score-round">+${team.roundScore}</span>`
            : ''}
        </div>
        ${dotsHtml}
      </div>
    `;
  });

  container.innerHTML = html;

  // Reflow erzwingen, dann aktive Karte hervorheben
  void container.offsetHeight;

  if (activeTeamId) {
    const card = container.querySelector(`[data-team-id="${activeTeamId}"]`);
    if (card && !card.classList.contains('eliminated')) {
      card.classList.add('active-team');
    }
  }

  // Inaktive Karten etwas abgedunkelt
  container.querySelectorAll('.score-card:not(.active-team)').forEach(card => {
    card.style.filter = 'brightness(0.75)';
  });
}

// ── Fluganimation ───────────────────────────

/**
 * Der Antwortkreis selbst fliegt vom Ring zum naechsten leeren
 * Punktekreis des Teams. 3 Boegen, dabei schrumpft er von 130px
 * auf die Dot-Groesse.
 *
 * @param {HTMLElement} ringItemEl  Das aufgedeckte Ring-Item
 * @param {string} teamId          Team-ID
 * @returns {Promise<void>}        Resolved wenn Animation fertig
 */
export function animateScorePoint(ringItemEl, teamId) {
  return new Promise((resolve) => {
    if (!ringItemEl) { resolve(); return; }

    // Naechsten leeren Punktekreis finden
    const targetDot = document.querySelector(
      `.score-dot[data-team-id="${teamId}"]:not(.dot-total):not(.dot-round)`
    );

    if (!targetDot) { resolve(); return; }

    // Positionen ermitteln
    const fromRect = ringItemEl.getBoundingClientRect();
    const toRect   = targetDot.getBoundingClientRect();

    const fromX = fromRect.left + fromRect.width / 2;
    const fromY = fromRect.top + fromRect.height / 2;
    const toX   = toRect.left + toRect.width / 2;
    const toY   = toRect.top + toRect.height / 2;

    const startSize = fromRect.width;  // 130px (Ring-Item Groesse)
    const endSize   = targetDot.offsetWidth || 12;

    // Ring-Item sofort unsichtbar machen (damit es nicht doppelt erscheint)
    ringItemEl.style.opacity = '0';

    // Fliegenden Kreis erzeugen - sieht aus wie das Ring-Item
    const fly = document.createElement('div');
    fly.className = 'score-dot-flying';
    fly.innerHTML = ringItemEl.querySelector('.item-content')?.innerHTML || '';
    fly.style.width  = startSize + 'px';
    fly.style.height = startSize + 'px';
    fly.style.display = 'flex';
    fly.style.alignItems = 'center';
    fly.style.justifyContent = 'center';
    fly.style.textAlign = 'center';
    fly.style.padding = '4px';
    fly.style.fontSize = '0.85rem';
    fly.style.fontWeight = '800';
    fly.style.overflow = 'hidden';
    fly.style.background = 'white';
    document.body.appendChild(fly);

    // Zufaelligen Freudensound abspielen
    audio.playRandomJoy();

    // 3 Boegen mit abnehmender Hoehe, Kreis schrumpft stufenweise
    const BOUNCES = 3;
    const totalDuration = 1000; // ms
    const keyframes = [];
    const steps = BOUNCES * 12; // 12 Frames pro Bogen

    for (let s = 0; s <= steps; s++) {
      const t = s / steps; // 0..1 Gesamtfortschritt

      // Lineare Interpolation x/y
      const x = fromX + (toX - fromX) * t;
      const y = fromY + (toY - fromY) * t;

      // Bogen-Offset: Sinus innerhalb jedes Bounce-Segments
      const bounceIndex = Math.min(Math.floor(t * BOUNCES), BOUNCES - 1);
      const bounceT = (t * BOUNCES) - bounceIndex;
      const bounceHeight = 100 * Math.pow(0.4, bounceIndex); // abnehmende Hoehe
      const arcOffset = -Math.sin(bounceT * Math.PI) * bounceHeight;

      // Groesse: schrumpft stufenweise bei jedem Bogen
      // Bogen 0: startSize -> 60%, Bogen 1: 60% -> 30%, Bogen 2: 30% -> endSize
      const sizeSteps = [startSize, startSize * 0.45, startSize * 0.2, endSize];
      const fromSize = sizeSteps[bounceIndex];
      const toSize   = sizeSteps[bounceIndex + 1];
      const size     = fromSize + (toSize - fromSize) * bounceT;

      keyframes.push({
        left:     `${x - size / 2}px`,
        top:      `${y + arcOffset - size / 2}px`,
        width:    `${size}px`,
        height:   `${size}px`,
        fontSize: `${Math.max(size * 0.12, 0)}px`,
        opacity:  size > 30 ? 1 : 0.8,
        offset:   t,
      });
    }

    const anim = fly.animate(keyframes, {
      duration: totalDuration,
      easing: 'ease-in-out',
      fill: 'forwards',
    });

    anim.onfinish = () => {
      fly.remove();
      // Punktekreis auf "Rundenpunkt" setzen
      targetDot.classList.add('dot-round');
      resolve();
    };
  });
}

/**
 * Zustand zuruecksetzen (z.B. bei Spielende).
 */
export function resetScoreboardState() {
  _previousActiveId = null;
}

// ── Hilfsfunktionen ─────────────────────────

function _escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
