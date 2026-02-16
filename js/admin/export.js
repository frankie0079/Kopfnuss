/* ============================================
   Kopfnuss Kartenmanager -- Export-Funktionen
   Exportiert Karten im Kopfnuss-kompatiblen Format
   ============================================ */

import { cardDB } from './card-db.js';

/**
 * Karten ins Kopfnuss-Game-Format konvertieren.
 *
 * @param {Array} cards - Array von Kartenobjekten (internes Admin-Format)
 * @param {string} setName - Name des Kartensets
 * @param {string} category - Kategorie
 * @returns {Object} Kopfnuss-Set { id, setName, category, cards: [...] }
 */
export function buildKopfnussSet(cards, setName, category) {
  const setId = slugify(setName);

  const kopfnussCards = cards.map(card => {
    const isBool = card.cardType === 'boolean';
    return {
      prompt: {
        text: card.prompt,
        image: null
      },
      category: card.category || category || 'Allgemeinwissen',
      items: (card.items || []).map(item => ({
        label: {
          text: item.label,
          image: null
        },
        solution: {
          text: isBool
            ? (item.solution ? 'Richtig' : 'Falsch')
            : (item.solutionText || ''),
          type: isBool
            ? (item.solution ? 'boolean_true' : 'boolean_false')
            : 'text'
        }
      }))
    };
  });

  return {
    id: setId,
    setName: setName,
    category: category,
    cards: kopfnussCards
  };
}

/**
 * Spieldatei (cards.js) als Download-String generieren.
 * Enthaelt alle Karten im Game-Format.
 *
 * @param {Array} cards - Array von Kartenobjekten (internes Admin-Format)
 * @returns {string} JavaScript-Quellcode fuer cards.js
 */
export function generateCardsJS(cards) {
  const set = buildKopfnussSet(cards, 'Kopfnuss Kartenset', 'Gemischt');

  const cardsObj = {
    version: 1,
    updatedAt: new Date().toISOString(),
    cards: set.cards
  };

  const header = `/* ============================================
   Kopfnuss! -- Spieldatei
   Alle verifizierten Karten im Game-Format.
   Generiert aus der Kartenverwaltung.
   Bei Aenderungen: Admin > Spieldatei exportieren
   ============================================ */

`;

  return header + 'export const CARDS = ' + JSON.stringify(cardsObj, null, 2) + ';\n';
}

/**
 * Karten als ZIP exportieren (kompatibel mit Kopfnuss-Import).
 *
 * @param {Array} cards - Array von Kartenobjekten
 * @param {string} setName - Name des Kartensets
 * @param {string} category - Kategorie
 * @returns {Promise<Blob>} ZIP-Datei als Blob
 */
export async function exportCardsAsZip(cards, setName, category) {
  if (typeof JSZip === 'undefined') {
    throw new Error('JSZip nicht geladen. Bitte Internetverbindung pruefen.');
  }

  const zip = new JSZip();
  const imagesFolder = zip.folder('images');

  const setData = buildKopfnussSet(cards, setName, category);

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    if (card.imageId) {
      const imgData = await cardDB.getImage(card.imageId);
      if (imgData && imgData.blob) {
        const filename = `prompt_${String(i + 1).padStart(2, '0')}.jpg`;
        imagesFolder.file(filename, imgData.blob);
        setData.cards[i].prompt.image = `images/${filename}`;
      }
    }
  }

  zip.file('set.json', JSON.stringify(setData, null, 2));
  return zip.generateAsync({ type: 'blob' });
}

/**
 * ZIP-Datei herunterladen / teilen.
 */
export async function downloadOrShareZip(zipBlob, filename) {
  if (navigator.share && navigator.canShare) {
    const file = new File([zipBlob], filename, { type: 'application/zip' });
    const shareData = { files: [file], title: 'Kopfnuss Kartenset' };

    if (navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (e) {
        if (e.name === 'AbortError') return;
      }
    }
  }

  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Text in URL-freundlichen Slug umwandeln */
function slugify(text) {
  return text.toLowerCase()
    .replace(/[äÄ]/g, 'ae').replace(/[öÖ]/g, 'oe').replace(/[üÜ]/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
