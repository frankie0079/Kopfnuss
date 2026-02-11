/* ============================================
   Kopfnuss! -- Kartenmodell
   ============================================ */

/**
 * Validiert ein Kartenset und gibt Fehler zurueck.
 * @param {Object} set
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateCardSet(set) {
  const errors = [];

  if (!set.id) errors.push('Kartenset hat keine ID.');
  if (!set.setName) errors.push('Kartenset hat keinen Namen.');
  if (!Array.isArray(set.cards) || set.cards.length === 0) {
    errors.push('Kartenset enthaelt keine Karten.');
    return { valid: false, errors };
  }

  set.cards.forEach((card, ci) => {
    if (!card.prompt) {
      errors.push(`Karte ${ci + 1}: Kein Prompt vorhanden.`);
    }
    if (!Array.isArray(card.items) || card.items.length !== 10) {
      errors.push(`Karte ${ci + 1}: Muss genau 10 Items haben (hat ${card.items?.length ?? 0}).`);
    } else {
      card.items.forEach((item, ii) => {
        if (!item.label) errors.push(`Karte ${ci + 1}, Item ${ii + 1}: Kein Label.`);
        if (!item.solution) errors.push(`Karte ${ci + 1}, Item ${ii + 1}: Keine Loesung.`);
      });
    }
  });

  return { valid: errors.length === 0, errors };
}

/**
 * Kartenset-Metadaten extrahieren (fuer Listen-Anzeige).
 * @param {Object} set
 * @returns {{ id: string, setName: string, category: string, cardCount: number }}
 */
export function getSetMeta(set) {
  return {
    id: set.id,
    setName: set.setName,
    category: set.category || 'Ohne Kategorie',
    cardCount: set.cards?.length ?? 0
  };
}

/**
 * Einzelne Karte mit IDs versehen (falls noch nicht vorhanden).
 * @param {Object} card
 * @param {number} index
 * @returns {Object}
 */
export function normalizeCard(card, index) {
  return {
    id: card.id || `card-${index}`,
    prompt: {
      text: card.prompt?.text || '',
      image: card.prompt?.image || null
    },
    items: (card.items || []).map((item, i) => ({
      id: item.id || `item-${i}`,
      label: {
        text: item.label?.text || '',
        image: item.label?.image || null
      },
      solution: {
        text: item.solution?.text || '',
        type: item.solution?.type || 'text',
        image: item.solution?.image || null
      }
    }))
  };
}

/**
 * Komplettes Kartenset normalisieren.
 * @param {Object} rawSet
 * @returns {Object}
 */
export function normalizeCardSet(rawSet) {
  return {
    id: rawSet.id || `set-${Date.now()}`,
    setName: rawSet.setName || 'Unbenannt',
    category: rawSet.category || 'Ohne Kategorie',
    cards: (rawSet.cards || []).map((c, i) => normalizeCard(c, i))
  };
}
