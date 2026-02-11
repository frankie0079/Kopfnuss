# Digital Smartbox

*Digitale Spielbegleitung fuer Smart 10*

---

## Was ist Digital Smartbox?

Eine offline-faehige Web-App (iPad-optimiert), die das physische Spiel "Smart 10" digital erweitert:

- Bunt-verspielte Optik im Partyspiel-Stil
- Spannende Reveal-Animationen mit Sound-Feedback
- Einfache Bedienung -- Teams steuern das Spiel selbst (Ehrlichkeitsprinzip)
- Vollstaendig offline nutzbar nach dem ersten Laden

---

## Features (V1)

- **2-4 Teams** mit Preset-Farben und editierbaren Namen
- **Kreisfoermiges Ring-Layout** (wie die physische Smart-10-Box)
- **10 Items pro Karte** mit Reveal-Animation
- **Strenge Punkteregel**: Falsch = alle Rundenpunkte weg
- **Optionaler Timer** (45s / 60s / 75s / 90s / Aus)
- **Zielpunktzahl** waehlbar (10 / 15 / 20)
- **Tag-/Nachtmodus**
- **Demo-Kartenset** (15 Allgemeinwissen-Karten)
- **ZIP-Import** fuer eigene Kartensets (JSON + Bilder)
- **PWA** -- installierbar, offline-faehig
- **Sound-Feedback** (Richtig/Falsch/Sieg via Web Audio API)
- **Konfetti-Animation** bei Spielende

---

## Technik

- HTML5 + CSS3 + Vanilla JavaScript (keine Frameworks)
- IndexedDB fuer persistente Kartenset-Speicherung
- Service Worker fuer Offline-Caching
- Web Audio API fuer synthetische Sounds
- JSZip (CDN) fuer ZIP-Import

---

## Lokal starten

**Einfach:** Doppelklick auf `start.bat` – startet Server und öffnet den Browser.

**Oder manuell:**
```bash
python -m http.server 8081
```
Dann im Browser: `http://localhost:8081`

**Wichtig:** Port 8081 nutzen (nicht 8080). Der Service Worker ist an 8080 gebunden – dort würden alte Dateien aus dem Cache geladen. Nach Code-Änderungen: F5 zum Neuladen.

---

## ZIP-Kartenset-Format

```
kartenset.zip
  set.json
  images/
    prompt_01.jpg
    label_03.png
    ...
```

**set.json Beispiel:**

```json
{
  "id": "mein-set",
  "setName": "Mein Kartenset",
  "category": "Quiz",
  "cards": [
    {
      "prompt": { "text": "Frage...", "image": "images/prompt_01.jpg" },
      "items": [
        {
          "label": { "text": "Antwort A", "image": null },
          "solution": { "text": "Richtig!", "type": "boolean_true" }
        }
      ]
    }
  ]
}
```

**Solution-Types:** `boolean_true`, `boolean_false`, `text`, `number`, `image`

Jede Karte muss genau **10 Items** haben.

---

## Projektstruktur

```
index.html          -- SPA Entry Point
manifest.json       -- PWA Manifest
sw.js               -- Service Worker
css/
  variables.css     -- Design Tokens, Farben, Theme
  base.css          -- Reset, Grundstile, Buttons
  layout.css        -- Fullscreen-Views, Flexbox-Helfer
  setup.css         -- Setup-Screen Styles
  game.css          -- Spiel-Screen Styles
  animations.css    -- Reveal, Konfetti, Uebergaenge
  victory.css       -- Sieges-Screen Styles
js/
  app.js            -- Entry Point, SPA-Router
  state.js          -- Zentraler State + EventBus
  models/
    card.js         -- Kartenmodell + Validierung
    game.js         -- Spiellogik (Zustandsmaschine)
  data/
    demo-set.js     -- 15 Demo-Karten
  views/
    setup.js        -- Setup-Screen
    game.js         -- Spiel-Screen
    victory.js      -- Sieges-Screen
    import.js       -- Kartenset-Import
  components/
    ring.js         -- 10-Item-Ring-Layout
    scoreboard.js   -- Team-Scores
    turn-indicator.js -- Zuganzeige
    timer.js        -- Countdown-Timer
  services/
    audio.js        -- Sound-Manager (Web Audio API)
    card-store.js   -- IndexedDB CRUD
    zip-import.js   -- ZIP-Entpacken
```
