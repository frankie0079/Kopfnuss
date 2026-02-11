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

## Projekt: Digital Smartbox

**Entwicklung / Änderungen testen:**
- Server: `start.bat` (Port 8081) oder `python -m http.server 8081`
- `http://localhost:8081` – NICHT 8080 (dort gecachte alte Version)
- F5 nach Änderungen. Bei `index.html` Script-Tag: `?v=X` bei Bedarf bumpen.

- Techstack: HTML5 + CSS3 + Vanilla JS (kein Framework)
- Nur iPad Landscape
- Sprache: Deutsch
- PWA mit Service Worker und IndexedDB