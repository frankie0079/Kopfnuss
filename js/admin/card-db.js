/* ============================================
   Kopfnuss Kartenmanager -- IndexedDB Service
   Karten und Kategorien lokal speichern
   ============================================ */

const DB_NAME = 'KopfnussKartenDB';
const DB_VERSION = 1;
const STORE_CARDS = 'cards';
const STORE_CATEGORIES = 'categories';
const STORE_IMAGES = 'images';

class CardDB {
  constructor() {
    /** @type {IDBDatabase|null} */
    this._db = null;
  }

  /** Datenbank oeffnen / erstellen */
  async open() {
    if (this._db) return this._db;

    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = (e) => {
        const db = e.target.result;

        if (!db.objectStoreNames.contains(STORE_CARDS)) {
          const cardStore = db.createObjectStore(STORE_CARDS, { keyPath: 'id' });
          cardStore.createIndex('category', 'category', { unique: false });
          cardStore.createIndex('setName', 'setName', { unique: false });
          cardStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORE_CATEGORIES)) {
          db.createObjectStore(STORE_CATEGORIES, { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains(STORE_IMAGES)) {
          db.createObjectStore(STORE_IMAGES, { keyPath: 'id' });
        }
      };

      req.onsuccess = (e) => {
        this._db = e.target.result;
        resolve(this._db);
      };

      req.onerror = () => reject(req.error);
    });
  }

  // ── Karten CRUD ───────────────────────────

  /** Karte speichern (neu oder aktualisieren) */
  async saveCard(card) {
    const db = await this.open();
    if (!card.id) card.id = this._generateId();
    if (!card.createdAt) card.createdAt = Date.now();
    card.updatedAt = Date.now();

    return this._put(db, STORE_CARDS, card);
  }

  /** Alle Karten laden */
  async getAllCards() {
    const db = await this.open();
    return this._getAll(db, STORE_CARDS);
  }

  /** Karten nach Kategorie laden */
  async getCardsByCategory(category) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CARDS, 'readonly');
      const store = tx.objectStore(STORE_CARDS);
      const index = store.index('category');
      const req = index.getAll(category);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  /** Einzelne Karte laden */
  async getCard(id) {
    const db = await this.open();
    return this._get(db, STORE_CARDS, id);
  }

  /** Karte loeschen */
  async deleteCard(id) {
    const db = await this.open();
    return this._delete(db, STORE_CARDS, id);
  }

  /** Anzahl Karten */
  async getCardCount() {
    const db = await this.open();
    return this._count(db, STORE_CARDS);
  }

  // ── Kategorien ────────────────────────────

  /** Kategorie speichern */
  async saveCategory(category) {
    const db = await this.open();
    if (!category.id) category.id = this._slugify(category.name);
    return this._put(db, STORE_CATEGORIES, category);
  }

  /** Alle Kategorien laden */
  async getAllCategories() {
    const db = await this.open();
    return this._getAll(db, STORE_CATEGORIES);
  }

  /** Kategorie loeschen */
  async deleteCategory(id) {
    const db = await this.open();
    return this._delete(db, STORE_CATEGORIES, id);
  }

  /** Standard-Kategorien anlegen (einmalig) */
  async initDefaultCategories() {
    const existing = await this.getAllCategories();
    if (existing.length > 0) return;

    const defaults = [
      { name: 'Allgemeinwissen', color: '#3498DB' },
      { name: 'Geschichte', color: '#E67E22' },
      { name: 'Geografie', color: '#27AE60' },
      { name: 'Politik', color: '#8E44AD' },
      { name: 'Wirtschaft', color: '#2C3E50' },
      { name: 'Musik/Entertainment/Movie', color: '#9B59B6' },
      { name: 'Sport', color: '#E74C3C' },
      { name: 'Wissenschaft', color: '#1ABC9C' },
      { name: 'Essen & Trinken', color: '#F39C12' },
    ];

    for (const cat of defaults) {
      await this.saveCategory(cat);
    }
  }

  /** Alle Kategorien loeschen und die 9 festen Standard-Kategorien neu anlegen */
  async resetCategories() {
    const existing = await this.getAllCategories();
    for (const cat of existing) {
      await this.deleteCategory(cat.id);
    }

    const defaults = [
      { name: 'Allgemeinwissen', color: '#3498DB' },
      { name: 'Geschichte', color: '#E67E22' },
      { name: 'Geografie', color: '#27AE60' },
      { name: 'Politik', color: '#8E44AD' },
      { name: 'Wirtschaft', color: '#2C3E50' },
      { name: 'Musik/Entertainment/Movie', color: '#9B59B6' },
      { name: 'Sport', color: '#E74C3C' },
      { name: 'Wissenschaft', color: '#1ABC9C' },
      { name: 'Essen & Trinken', color: '#F39C12' },
    ];

    for (const cat of defaults) {
      await this.saveCategory(cat);
    }
  }

  /** Alle Karten als exportiert markieren */
  async markAllAsExported() {
    const allCards = await this.getAllCards();
    let count = 0;
    for (const card of allCards) {
      if (!card.exported) {
        card.exported = true;
        card.exportedAt = Date.now();
        await this.saveCard(card);
        count++;
      }
    }
    return count;
  }

  /** Alle Karten loeschen */
  async deleteAllCards() {
    const allCards = await this.getAllCards();
    for (const card of allCards) {
      await this.deleteCard(card.id);
    }
  }

  // ── Bilder (fuer Bildkarten) ──────────────

  /** Bild speichern (als Blob) */
  async saveImage(id, blob) {
    const db = await this.open();
    return this._put(db, STORE_IMAGES, { id, blob, createdAt: Date.now() });
  }

  /** Bild laden */
  async getImage(id) {
    const db = await this.open();
    return this._get(db, STORE_IMAGES, id);
  }

  /** Bild loeschen */
  async deleteImage(id) {
    const db = await this.open();
    return this._delete(db, STORE_IMAGES, id);
  }

  // ── Hilfsmethoden ─────────────────────────

  _generateId() {
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  _slugify(text) {
    return text.toLowerCase()
      .replace(/[äÄ]/g, 'ae').replace(/[öÖ]/g, 'oe').replace(/[üÜ]/g, 'ue')
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  _put(db, store, data) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readwrite');
      const s = tx.objectStore(store);
      const req = s.put(data);
      req.onsuccess = () => resolve(data);
      req.onerror = () => reject(req.error);
    });
  }

  _get(db, store, key) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readonly');
      const req = tx.objectStore(store).get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  _getAll(db, store) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readonly');
      const req = tx.objectStore(store).getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  _delete(db, store, key) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readwrite');
      const req = tx.objectStore(store).delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  _count(db, store) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readonly');
      const req = tx.objectStore(store).count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
}

export const cardDB = new CardDB();
