/* ============================================
   Kopfnuss! -- IndexedDB Card Store
   Speichert Kartensets und Bilder persistent.
   ============================================ */

const DB_NAME = 'smartbox_db';
const DB_VERSION = 1;
const STORE_SETS = 'cardSets';
const STORE_IMAGES = 'images';

class CardStore {
  constructor() {
    /** @type {IDBDatabase|null} */
    this._db = null;
  }

  /**
   * Datenbank oeffnen/erstellen.
   * @returns {Promise<void>}
   */
  async init() {
    if (this._db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Object Store fuer Kartensets
        if (!db.objectStoreNames.contains(STORE_SETS)) {
          db.createObjectStore(STORE_SETS, { keyPath: 'id' });
        }

        // Object Store fuer Bilder (Blobs)
        if (!db.objectStoreNames.contains(STORE_IMAGES)) {
          db.createObjectStore(STORE_IMAGES, { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        this._db = event.target.result;
        resolve();
      };

      request.onerror = (event) => {
        console.error('[CardStore] DB Oeffnung fehlgeschlagen:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  /**
   * Kartenset speichern (ohne Bilder -- die kommen separat).
   * @param {Object} cardSet
   * @returns {Promise<void>}
   */
  async saveSet(cardSet) {
    await this._ensureDb();
    return this._transaction(STORE_SETS, 'readwrite', store => {
      store.put(cardSet);
    });
  }

  /**
   * Kartenset laden.
   * @param {string} setId
   * @returns {Promise<Object|null>}
   */
  async getSet(setId) {
    await this._ensureDb();
    return this._transactionGet(STORE_SETS, 'readonly', store => {
      return store.get(setId);
    });
  }

  /**
   * Alle Kartensets laden (Metadaten).
   * @returns {Promise<Array<Object>>}
   */
  async getAllSets() {
    await this._ensureDb();
    return this._transactionGet(STORE_SETS, 'readonly', store => {
      return store.getAll();
    });
  }

  /**
   * Kartenset loeschen.
   * @param {string} setId
   * @returns {Promise<void>}
   */
  async deleteSet(setId) {
    await this._ensureDb();

    // Erst zugehoerige Bilder loeschen
    const set = await this.getSet(setId);
    if (set) {
      const imageIds = this._extractImageIds(set);
      for (const imgId of imageIds) {
        await this.deleteImage(imgId);
      }
    }

    return this._transaction(STORE_SETS, 'readwrite', store => {
      store.delete(setId);
    });
  }

  /**
   * Bild als Blob speichern.
   * @param {string} id  -- eindeutige Bild-ID
   * @param {Blob} blob
   * @returns {Promise<void>}
   */
  async saveImage(id, blob) {
    await this._ensureDb();
    return this._transaction(STORE_IMAGES, 'readwrite', store => {
      store.put({ id, blob, savedAt: Date.now() });
    });
  }

  /**
   * Bild laden und Blob-URL erstellen.
   * @param {string} id
   * @returns {Promise<string|null>}  -- Blob-URL oder null
   */
  async getImageUrl(id) {
    await this._ensureDb();
    const record = await this._transactionGet(STORE_IMAGES, 'readonly', store => {
      return store.get(id);
    });
    if (record && record.blob) {
      return URL.createObjectURL(record.blob);
    }
    return null;
  }

  /**
   * Bild loeschen.
   * @param {string} id
   * @returns {Promise<void>}
   */
  async deleteImage(id) {
    await this._ensureDb();
    return this._transaction(STORE_IMAGES, 'readwrite', store => {
      store.delete(id);
    });
  }

  // ── Hilfsmethoden ─────────────────────────

  async _ensureDb() {
    if (!this._db) await this.init();
  }

  /**
   * Transaktion ausfuehren (kein Rueckgabewert).
   */
  _transaction(storeName, mode, fn) {
    return new Promise((resolve, reject) => {
      const tx = this._db.transaction(storeName, mode);
      const store = tx.objectStore(storeName);
      fn(store);
      tx.oncomplete = () => resolve();
      tx.onerror = (e) => reject(e.target.error);
    });
  }

  /**
   * Transaktion mit Rueckgabewert.
   */
  _transactionGet(storeName, mode, fn) {
    return new Promise((resolve, reject) => {
      const tx = this._db.transaction(storeName, mode);
      const store = tx.objectStore(storeName);
      const request = fn(store);
      request.onsuccess = () => resolve(request.result);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  /**
   * Alle Bild-Referenzen aus einem Kartenset extrahieren.
   */
  _extractImageIds(set) {
    const ids = new Set();
    for (const card of set.cards || []) {
      if (card.prompt?.image) ids.add(card.prompt.image);
      for (const item of card.items || []) {
        if (item.label?.image) ids.add(item.label.image);
        if (item.solution?.image) ids.add(item.solution.image);
      }
    }
    return ids;
  }
}

export const cardStore = new CardStore();
