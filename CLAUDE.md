## Working Principles

## Verbindlicher Interview-Modus nach Planerstellung

Bevor mit Implementierung oder Code-Aenderungen begonnen wird, gilt zwingend:

<!-- 1. Jeder Plan (`plan.md` oder gleichwertiger Text) muss vollstaendig -->
   und kritisch hinterfragt werden.
2. Du wechselst explizit in einen Interview-Modus.
3. Du stellst gezielte Rueckfragen, bis keine fachlichen,
   spielmechanischen, UI-, UX- oder Design-Unklarheiten mehr bestehen.
4. Du triffst keine stillschweigenden Annahmen.
5. Du beginnst erst mit der Umsetzung, wenn der Nutzer explizit bestaetigt,
   dass alle offenen Punkte geklaert sind.

### Interview-Frageachsen (mindestens pruefen)

- Ziel & Spielgefuehl
- Nutzer & Rolle des Spielleiters
- UI & UX (Bedienung, Uebersicht, Haptik, Animation)
- Grafikstil & visuelle Anmutung
- Spielregeln & Randfaelle
- Datenmodell & Zustaende
- Audio & Feedback
- Offline-Verhalten & Datenhaltung
- Nicht-Ziele / bewusst Ausgeschlossenes

Solange offene Fragen bestehen:
- darf kein Code geschrieben oder geaendert werden.

## Projekt: Kopfnuss!

**Entwicklung / Änderungen testen:**
- Server: `python server.py` (Port 8081, kein Cache) -- NICHT `python -m http.server` (cached!)
- `http://localhost:8081` – NICHT 8080 (dort gecachte alte Version)
- F5 nach Änderungen. Bei CSS-Links in `index.html`: `?v=X` bei Bedarf bumpen.

**Cache-Busting fuer ES-Module -- KRITISCH:**
- ES-Module werden im Browser anhand ihrer **vollstaendigen URL** identifiziert.
- `app.js?v=64` und `app.js` sind ZWEI verschiedene Module mit getrenntem State.
- Wenn `?v=X` auf dem `<script type="module">` Tag steht, MUSS derselbe `?v=X`
  auch in allen `import { router } from '../app.js?v=X'` Statements stehen!
- Betroffene Dateien: `index.html`, `setup.js`, `game.js`, `victory.js`, `import.js`, `admin.js`
- **Bei Version-Bump: ALLE 6 Stellen gleichzeitig aendern!**
- Auf localhost erzwingt `app.js` zusaetzlich Timestamp-Cache-Buster fuer dynamische Imports.

**PFLICHT bei JEDER Dateiänderung (CSS, JS, Sounds, HTML):**
- `CACHE_NAME` in `sw.js` hochzaehlen (z.B. `smartbox-v64` → `smartbox-v65`).
- `?v=X` in `index.html` (CSS + app.js Script-Tag) UND in allen 5 JS-Dateien
  die `import { router } from '../app.js?v=X'` haben, gleichzeitig bumpen.
- Falls Sound-Dateien hinzugefügt/entfernt wurden: `STATIC_ASSETS`-Liste in `sw.js` anpassen.
- Ohne das sieht das iPad die Änderungen nicht!

- Techstack: HTML5 + CSS3 + Vanilla JS (kein Framework)
- Nur iPad Landscape
- Sprache: Deutsch
- PWA mit Service Worker und IndexedDB