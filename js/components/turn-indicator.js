/* ============================================
   Digital Smartbox -- Turn-Indikator Component
   ============================================ */

/**
 * Turn-Indikator rendern.
 *
 * @param {HTMLElement} container  -- .turn-indicator Element
 * @param {Object} team  -- aktives Team { name, color }
 * @param {string} [message]  -- optionale Zusatznachricht
 */
export function renderTurnIndicator(container, team, message) {
  if (!team) {
    container.style.backgroundColor = 'var(--bg-secondary)';
    container.textContent = message || '';
    return;
  }

  container.style.backgroundColor = team.color;
  container.innerHTML = `
    <span>${_escapeHtml(team.name)} ist dran!</span>
    ${message ? `<br><small>${_escapeHtml(message)}</small>` : ''}
  `;
}

function _escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
