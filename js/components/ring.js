/* ============================================
   Kopfnuss! -- Ring-Layout Component
   10 Items kreisfoermig um den Prompt
   ============================================ */

/**
 * Ring rendern: Prompt im Zentrum, 10 Items drum herum.
 *
 * @param {HTMLElement} container  -- .ring-container Element
 * @param {Object} card  -- aktuelle Karte (normalisiert)
 * @param {Set<string>} revealedItems  -- bereits aufgedeckte Item-IDs
 * @param {Map<string, string>} itemResults  -- itemId -> 'correct'|'wrong'
 * @param {Object} [options]
 * @param {boolean} [options.disabled]  -- alle Items deaktiviert?
 * @param {Function} [options.onItemClick]  -- Callback(itemId)
 * @param {Map<string, string>} [options.itemTeamColors]  -- itemId -> Teamfarbe fuer richtig beantwortete Items
 */
export function renderRing(container, card, revealedItems, itemResults, options = {}) {
  const { disabled = false, onItemClick = null, itemTeamColors = new Map() } = options;

  // Container-Groesse (groesser fuer maximale Lesbarkeit auf iPad)
  const size = 640;
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = 255;  // Abstand Items vom Zentrum
  const itemSize = 130;

  let html = '';

  // Prompt (Zentrum)
  html += `<div class="prompt-center">`;
  if (card.prompt.image) {
    html += `<img class="prompt-image" src="${card.prompt.image}" alt="Prompt">`;
  }
  if (card.prompt.text) {
    html += `<span class="prompt-text">${_escapeHtml(card.prompt.text)}</span>`;
  }
  html += `</div>`;

  // 10 Items im Kreis
  card.items.forEach((item, index) => {
    const angle = (index / 10) * 2 * Math.PI - Math.PI / 2; // Start: oben (12 Uhr)
    const x = centerX + radius * Math.cos(angle) - itemSize / 2;
    const y = centerY + radius * Math.sin(angle) - itemSize / 2;

    const isRevealed = revealedItems.has(item.id);
    const result = itemResults.get(item.id); // 'correct' | 'wrong' | undefined
    const teamColor = itemTeamColors.get(item.id); // Teamfarbe fuer Umrandung

    let classes = 'ring-item';
    if (isRevealed) classes += ' revealed';
    if (result === 'correct') classes += ' correct ring-item-gone';
    if (result === 'wrong') classes += ' wrong';
    if (disabled && !isRevealed) classes += ' disabled';

    // translate als CSS-Variable fuer Hover-Effekt; Teamfarbe fuer richtig beantwortete Items
    const translateVal = `translate(${x}px, ${y}px)`;
    const teamColorStyle = result === 'correct' && teamColor ? ` --team-color: ${teamColor};` : '';

    html += `
      <div class="${classes}"
           data-item-id="${item.id}"
           style="transform: ${translateVal}; --item-translate: ${translateVal};${teamColorStyle}"
           ${isRevealed || disabled ? '' : 'tabindex="0" role="button"'}
           ${isRevealed || disabled ? 'aria-disabled="true"' : ''}>
        <div class="item-content">
          ${_renderItemContent(item, isRevealed)}
        </div>
      </div>
    `;
  });

  container.innerHTML = html;

  // Click-Events binden
  if (onItemClick) {
    container.querySelectorAll('.ring-item:not(.revealed):not(.disabled)').forEach(el => {
      el.addEventListener('click', () => {
        const itemId = el.dataset.itemId;
        if (itemId) onItemClick(itemId);
      });
    });
  }
}

/**
 * Einzelnes Item-Inhalt rendern (Label + ggf. Loesung).
 */
function _renderItemContent(item, isRevealed) {
  let html = '';

  // Label
  if (item.label.image) {
    html += `<img class="item-image" src="${item.label.image}" alt="${_escapeHtml(item.label.text)}">`;
  }
  html += `<span class="item-label">${_escapeHtml(item.label.text)}</span>`;

  // Loesung (nur sichtbar wenn revealed, per CSS)
  if (isRevealed) {
    if (item.solution.image) {
      html += `<img class="item-image" src="${item.solution.image}" alt="Loesung">`;
    }
    html += `<span class="item-solution">${_escapeHtml(item.solution.text)}</span>`;
  }

  return html;
}

/**
 * HTML escapen.
 */
function _escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Ein einzelnes Item im DOM aktualisieren (nach Reveal).
 *
 * @param {HTMLElement} container
 * @param {string} itemId
 * @param {Object} item  -- das Item-Objekt
 * @param {string} result  -- 'correct' | 'wrong'
 * @param {string} [teamColor]  -- Teamfarbe fuer Umrandung (nur bei correct)
 */
export function updateRingItem(container, itemId, item, result, teamColor = null) {
  const el = container.querySelector(`[data-item-id="${itemId}"]`);
  if (!el) return;

  el.classList.add('revealed');
  if (result) el.classList.add(result);
  el.classList.remove('revealing', 'disabled');
  el.removeAttribute('tabindex');
  el.removeAttribute('role');
  el.setAttribute('aria-disabled', 'true');

  // Teamfarbe fuer Umrandung (richtig beantwortet)
  if (result === 'correct' && teamColor) {
    el.style.setProperty('--team-color', teamColor);
  }

  // Inhalt aktualisieren (Loesung einblenden)
  const content = el.querySelector('.item-content');
  if (content) {
    content.innerHTML = _renderItemContent(item, true);
  }
}

/**
 * Item in Reveal-Modus setzen (Animation starten).
 *
 * @param {HTMLElement} container
 * @param {string} itemId
 */
export function setItemRevealing(container, itemId) {
  const el = container.querySelector(`[data-item-id="${itemId}"]`);
  if (!el) return;
  el.classList.add('revealing');
}
