/* ============================================
   Kopfnuss! -- Timer Component
   SVG-Ring-Countdown mit Tick-Sound
   ============================================ */

import { audio } from '../services/audio.js';

export class TimerComponent {
  /**
   * @param {HTMLElement} container -- Element in dem der Timer gerendert wird
   */
  constructor(container) {
    this._container = container;
    this._intervalId = null;
    this._remaining = 0;
    this._total = 0;
    this._onExpired = null;
    this._running = false;
  }

  /**
   * Timer starten.
   * @param {number} seconds
   * @param {Function} onExpired -- Callback wenn Zeit abgelaufen
   */
  start(seconds, onExpired) {
    this.stop();

    this._total = seconds;
    this._remaining = seconds;
    this._onExpired = onExpired;
    this._running = true;

    this._render();

    this._intervalId = setInterval(() => {
      if (!this._running) return;

      this._remaining -= 1;

      // Tick-Sound in den letzten 5 Sekunden
      if (this._remaining <= 5 && this._remaining > 0) {
        audio.play('tick');
      }

      this._render();

      if (this._remaining <= 0) {
        this.stop();
        if (this._onExpired) {
          this._onExpired();
        }
      }
    }, 1000);
  }

  /**
   * Timer stoppen.
   */
  stop() {
    if (this._intervalId) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
    this._running = false;
  }

  /**
   * Timer pausieren.
   */
  pause() {
    this._running = false;
  }

  /**
   * Timer fortsetzen.
   */
  resume() {
    this._running = true;
  }

  /**
   * Timer komplett entfernen.
   */
  destroy() {
    this.stop();
    if (this._container) {
      this._container.innerHTML = '';
    }
  }

  /**
   * Timer-Anzeige rendern (SVG-Ring + Zahl).
   */
  _render() {
    if (!this._container) return;

    const progress = this._total > 0 ? this._remaining / this._total : 0;
    const isWarning = this._remaining <= 5;

    // SVG-Ring
    const radius = 24;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - progress);

    const color = isWarning ? 'var(--danger)' : 'var(--accent)';

    this._container.innerHTML = `
      <div class="flex-center gap-sm">
        <svg class="timer-ring" width="60" height="60" viewBox="0 0 60 60">
          <!-- Hintergrund-Ring -->
          <circle cx="30" cy="30" r="${radius}"
                  fill="none" stroke="var(--border)" stroke-width="4" />
          <!-- Fortschritts-Ring -->
          <circle cx="30" cy="30" r="${radius}"
                  fill="none" stroke="${color}" stroke-width="4"
                  stroke-dasharray="${circumference}"
                  stroke-dashoffset="${offset}"
                  stroke-linecap="round"
                  transform="rotate(-90 30 30)"
                  style="transition: stroke-dashoffset 1s linear;" />
        </svg>
        <span class="timer-text ${isWarning ? 'warning' : ''}">${this._remaining}s</span>
      </div>
    `;
  }
}
