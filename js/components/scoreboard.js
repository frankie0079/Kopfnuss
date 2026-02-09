/* ============================================
   Digital Smartbox -- Scoreboard Component
   ============================================ */

/**
 * Scoreboard rendern.
 *
 * @param {HTMLElement} container  -- .game-scoreboard Element
 * @param {Array<Object>} teams  -- Array von Team-Objekten aus GameModel
 * @param {number} targetScore
 * @param {string} activeTeamId  -- ID des aktiven Teams
 */
export function renderScoreboard(container, teams, targetScore, activeTeamId) {
  let html = '';

  teams.forEach(team => {
    const isActive = team.id === activeTeamId;
    const isEliminated = !team.isActive;
    const progress = Math.min((team.totalScore / targetScore) * 100, 100);

    let classes = 'score-card';
    if (isActive && !isEliminated) classes += ' active-team';
    if (isEliminated) classes += ' eliminated';

    html += `
      <div class="${classes}" style="border-left-color: ${team.color}">
        <div class="score-card-name" style="color: ${team.color}">
          ${_escapeHtml(team.name)}
          ${isEliminated ? ' <small style="color: var(--text-secondary)">(raus)</small>' : ''}
        </div>
        <div class="score-card-scores">
          <span class="score-total">${team.totalScore}</span>
          ${team.roundScore > 0
            ? `<span class="score-round">+${team.roundScore}</span>`
            : ''}
        </div>
        <div class="score-progress">
          <div class="score-progress-bar"
               style="width: ${progress}%; background-color: ${team.color}"></div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function _escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
