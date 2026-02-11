/* ============================================
   Kopfnuss! -- ZIP Import Service
   Entpackt ZIP -> JSON + Bilder -> IndexedDB
   ============================================ */

import { cardStore } from './card-store.js';
import { normalizeCardSet, validateCardSet } from '../models/card.js';

/**
 * ZIP-Datei importieren.
 * Erwartet: set.json + images/ Ordner.
 *
 * @param {File} zipFile  -- ZIP-Datei vom File-Input
 * @returns {Promise<{ success: boolean, setName: string, cardCount: number, errors: string[] }>}
 */
export async function importZip(zipFile) {
  const errors = [];

  try {
    // JSZip muss global verfuegbar sein (CDN)
    if (typeof JSZip === 'undefined') {
      throw new Error('JSZip ist nicht geladen. Bitte pruefe die Internetverbindung.');
    }

    const zip = await JSZip.loadAsync(zipFile);

    // set.json suchen
    let jsonFile = zip.file('set.json');
    if (!jsonFile) {
      // Fallback: erste JSON-Datei im Root
      const jsonFiles = zip.file(/\.json$/);
      if (jsonFiles.length > 0) {
        jsonFile = jsonFiles[0];
      }
    }

    if (!jsonFile) {
      return { success: false, setName: '', cardCount: 0, errors: ['Keine set.json in der ZIP-Datei gefunden.'] };
    }

    // JSON parsen
    const jsonText = await jsonFile.async('text');
    let rawSet;
    try {
      rawSet = JSON.parse(jsonText);
    } catch (e) {
      return { success: false, setName: '', cardCount: 0, errors: ['set.json ist kein gueltiges JSON.'] };
    }

    // Normalisieren und validieren
    const cardSet = normalizeCardSet(rawSet);
    const validation = validateCardSet(cardSet);

    if (!validation.valid) {
      return { success: false, setName: cardSet.setName, cardCount: 0, errors: validation.errors };
    }

    // Bilder extrahieren und speichern
    const imageFiles = zip.file(/^images\//);
    const imageMap = new Map(); // originalPath -> IndexedDB-ID

    for (const imgFile of imageFiles) {
      if (imgFile.dir) continue;

      const fileName = imgFile.name; // z.B. "images/prompt_01.jpg"
      const blob = await imgFile.async('blob');
      const imageId = `${cardSet.id}/${fileName}`;

      await cardStore.saveImage(imageId, blob);
      imageMap.set(fileName, imageId);
    }

    // Bild-Referenzen im Kartenset aktualisieren
    _updateImageReferences(cardSet, imageMap);

    // Kartenset in IndexedDB speichern
    await cardStore.saveSet(cardSet);

    return {
      success: true,
      setName: cardSet.setName,
      cardCount: cardSet.cards.length,
      errors: []
    };

  } catch (err) {
    console.error('[ZipImport] Fehler:', err);
    return { success: false, setName: '', cardCount: 0, errors: [err.message] };
  }
}

/**
 * Bild-Referenzen im Kartenset von Dateipfaden zu IndexedDB-IDs aendern.
 */
function _updateImageReferences(cardSet, imageMap) {
  for (const card of cardSet.cards) {
    if (card.prompt.image && imageMap.has(card.prompt.image)) {
      card.prompt.image = imageMap.get(card.prompt.image);
    }
    for (const item of card.items) {
      if (item.label.image && imageMap.has(item.label.image)) {
        item.label.image = imageMap.get(item.label.image);
      }
      if (item.solution.image && imageMap.has(item.solution.image)) {
        item.solution.image = imageMap.get(item.solution.image);
      }
    }
  }
}
