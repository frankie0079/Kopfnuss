# Kopfnuss! -- Briefing: Kartengenerierung durch KI

## Zweck

Dieses Dokument beschreibt verbindlich, wie neue Spielkarten fuer
Kopfnuss! durch KI (Claude) generiert werden. Es wird bei jeder
Kartenerstellung als Kontext mitgegeben.

---

## 1. Zielgruppe

- Gut gebildete deutsche Akademiker, Studenten, Abiturienten
- Triviale Fragen sind beleidigend -- die Spieler erwarten Anspruch
- Aber: nicht jeder kennt sich in jedem Feld gleich gut aus

## 2. Schwierigkeitsverteilung pro Karte

Jede Karte hat genau 10 Antwortmoeglichkeiten. Davon:
- **2-3 Antworten**: eher leicht (Einstieg, die meisten Spieler wissen es)
- **4-5 Antworten**: mittelschwer (wer sich im Thema auskennt, weiss es)
- **2-3 Antworten**: schwer bis knifflig (nur Kenner wissen es sicher)

Ziel: Jeder Spieler kann mindestens 2-3 Items sicher beantworten,
aber kaum jemand schafft alle 10. Das erzeugt Spielspannung.

## 3. Faktenprüfung -- ZWINGEND

**Keine Karte darf ungepruefte Fakten enthalten.**

- Vor dem Vorschlagen einer Karte: jede einzelne Antwort im Internet
  verifizieren (WebSearch-Tool nutzen)
- Wenn eine Information nicht eindeutig verifizierbar ist:
  diese Antwort NICHT verwenden, stattdessen eine andere waehlen
- Niemals Fakten aus dem Trainingsgedaechtnis uebernehmen ohne Pruefung
- Besonders kritisch pruefen:
  - Jahreszahlen und Zahlen (Box-Office, Einwohner, Entfernungen)
  - Zugehoerigkeiten (welcher Regisseur, welches Studio, welches Land)
  - Titel in deutscher Uebersetzung
  - Rankings und Rekorde (aendern sich ueber die Zeit)

## 4. Kartenformat

### 4a. Ausgabeformat (JSON) -- fuer alle KIs

**Dieses Format ist die Standardschnittstelle.** Wenn du Karten generierst,
gib sie als JSON-Array in genau diesem Format aus. Keine Kommentare,
kein Markdown drumherum -- nur das reine JSON.

**Boolean-Karten** (Richtig/Falsch):

```json
[
  {
    "prompt": "Ist ein Planet unseres Sonnensystems?",
    "category": "Wissenschaft",
    "cardType": "boolean",
    "items": [
      { "label": "Mars", "solution": true },
      { "label": "Pluto", "solution": false },
      { "label": "Venus", "solution": true },
      { "label": "Sirius", "solution": false }
    ]
  }
]
```

**Text-Karten** (Zuordnung Moeglichkeit -> Loesung):

```json
[
  {
    "prompt": "Welche Marke ist bekannt fuer diesen Werbeslogan?",
    "category": "Wirtschaft",
    "cardType": "text",
    "items": [
      { "label": "Just do it", "solution": "Nike" },
      { "label": "Think different", "solution": "Apple" },
      { "label": "Vorsprung durch Technik", "solution": "Audi" }
    ]
  }
]
```

### 4b. Internes JS-Format (fuer Datei-Import)

Beim Speichern als JS-Datei (Weg B, siehe Abschnitt 7) wird das
erweiterte Format mit `position` und `solutionText` verwendet:

```
{
  prompt:    "Frage als vollstaendiger Satz mit Fragezeichen",
  category:  "Kategoriename",
  cardType:  "boolean",          // oder "text"
  items: [
    { position: 1..10, label: "Antworttext", solution: true/false, solutionText: "Richtig/Falsch" }
  ]
}
```

### Regeln fuer Items:
- Exakt 10 Items pro Karte
- Boolean-Karten: ausgewogene Verteilung, ca. 5-7x richtig, 3-5x falsch
  (nicht 9:1 oder 1:9 -- das ist langweilig)
- Text-Karten: `solution` enthaelt den Loesungstext (z.B. Markenname)
- Labels: kurz und praegnant (max. 3-4 Woerter ideal)
- Die Falsch-Antworten muessen plausibel sein (nicht offensichtlich falsch)
- **WICHTIG:** Wenn mehrere Karten die gleiche Frage haben (z.B.
  mehrere Werbeslogan-Karten), MUSS der Prompt leicht variiert werden,
  damit die Duplikat-Erkennung sie nicht ueberspringt.
  Beispiel: "Welche Marke steckt hinter dem Slogan?" statt nochmal
  "Welche Marke ist bekannt fuer diesen Werbeslogan?"

## 5. Fragequalitaet

- Die Frage (prompt) muss als vollstaendiger Satz formuliert sein
- Sie muss eindeutig beantwortbar sein (kein "kommt drauf an")
- Gute Fragen beginnen oft mit: "Ist ein...", "Gehoert zu...",
  "Hat... Regie gefuehrt?", "Gewann den...", "Wurde vor... gegruendet?"
- Die Frage darf NICHT die Antworten vorwegnehmen

## 6. Beliebte Kategorien

Priorisierte Themenbereiche (nach Beliebtheit):
1. **Kino** (Marvel, Star Wars, Manga/Anime, Regisseure, Oscars)
2. **Musik** (Bands, Hits, Alben, Genres, Festivals)
3. **Geografie** (Laender, Staedte, Fluesse, Hauptstaedte)
4. **Geschichte** (Ereignisse, Persoenlichkeiten, Jahreszahlen)
5. **Sport** (Fussball, Olympia, Rekorde)
6. **Wissenschaft** (Erfindungen, Elemente, Koerper)
7. **Essen & Trinken** (Kuechen, Weine, Zutaten)
8. **Natur** (Tiere, Pflanzen, Rekorde der Natur)
9. **Literatur** (Autoren, Werke, Figuren)
10. **Technik & Digital** (Firmen, Erfindungen, Internet)

## 7. Prozess der Kartenerstellung

### Weg A: Schnell-Import (Paste) -- empfohlen fuer Einzelkarten

```
1. Kategorie und Anzahl festlegen
2. KI (Claude, ChatGPT, Gemini, ...) mit der Prompt-Vorlage
   aus Abschnitt 10 beauftragen
3. Die KI gibt ein JSON-Array im Standardformat (Abschnitt 4a) aus
4. Fakten pruefen (KI sollte das bereits getan haben)
5. JSON kopieren
6. Im Kopfnuss-Admin-Hub: "Karten importieren (JSON)" aufklappen
7. JSON einfuegen und "Importieren" klicken
8. Karten erscheinen sofort in der Kartenbibliothek
9. Dort einzeln pruefen, ggf. bearbeiten
10. "Ans Spiel senden" klicken -> Karten sind im Spiel
```

### Weg B: Datei-Import -- fuer groessere Kartensets

```
1. Kategorie und Anzahl festlegen
2. Karten generieren und verifizieren (wie bei Weg A)
3. Als JS-Modul in js/data/generated-{kategorie}.js speichern
   (Format siehe Abschnitt 4b)
4. In js/admin/admin.js im Array GENERATED_SETS registrieren
5. Admin-Hub oeffnen -- Karten werden automatisch importiert
6. In der Kartenbibliothek pruefen und ggf. bearbeiten
7. "Ans Spiel senden" klicken -> Karten sind im Spiel
```

## 8. Technische Integration

### Paste-Import (primaer)
Im Admin-Hub gibt es den Bereich "Karten importieren (JSON)".
Dort wird das JSON-Array aus Abschnitt 4a eingefuegt.
- Duplikat-Erkennung ueber Prompt-Text (gleicher Prompt = wird uebersprungen)
- Neue Kategorien werden automatisch angelegt
- Feedback: "X Karten importiert, Y uebersprungen"

### Datei-Import (Auto-Import)
Generierte Karten koennen auch als ES-Modul gespeichert werden:
- Pfad: `js/data/generated-{kategorie}.js`
- Export: `export const {KATEGORIE}_CARDS = [ ... ];`
- Registrierung in `js/admin/admin.js` im Array `GENERATED_SETS`:
```javascript
{ module: '../data/generated-{kategorie}.js',
  exportName: '{KATEGORIE}_CARDS',
  label: 'N {Kategorie}-Karten',
  categoryName: '{Kategorie}' }
```
- Beim Oeffnen des Admin-Hubs werden neue Karten **automatisch**
  importiert (kein Button-Klick noetig).

### Kategorien
Neue Kategorien werden automatisch in der IndexedDB angelegt,
wenn sie beim Import noch nicht existieren.

### Kennzeichnung in der Bibliothek
KI-generierte Karten werden mit `sourceType: "generated"` gespeichert.
In der Bibliothek:
- Lila "KI"-Badge neben der Kategorie
- Lila linker Rand an der Kartenzeile
- Sortierung: KI-Karten immer oben
- Eigener Filter-Button "KI-generiert (N)" in der Filterleiste

## 9. Was wir NICHT tun

- Keine Karten ohne Faktencheck generieren
- Keine "Scherzfragen" oder unseriösen Inhalte
- Keine politisch kontroversen oder beleidigenden Fragen
- Keine Fragen, deren Antworten sich schnell aendern
  (z.B. "Wer ist aktueller Praesident von...")
- Keine Fragen mit nur einer einzigen schwierigen Antwort
  (alle 10 muessen spielerisch relevant sein)

## 10. Prompt-Vorlage fuer externe KIs

Den folgenden Text kannst du 1:1 an Claude, ChatGPT oder jede andere
KI schicken. Ersetze die Platzhalter [in eckigen Klammern].

---

**Prompt zum Kopieren:**

```
Erstelle [ANZAHL] Quizkarten zum Thema "[THEMA]" fuer das Spiel "Kopfnuss!".

Zielgruppe: Gut gebildete deutsche Erwachsene (Akademiker, Studenten).
Die Fragen sollen anspruchsvoll sein, aber nicht unmoeglich.

Regeln:
- Jede Karte hat exakt 10 Items
- Schwierigkeitsverteilung: 2-3 leicht, 4-5 mittel, 2-3 schwer
- Falsch-Antworten muessen plausibel sein
- JEDE Antwort muss faktisch korrekt sein -- bitte verifizieren
- Labels kurz und praegnant (max. 3-4 Woerter)

Gib die Karten als reines JSON-Array aus, ohne Markdown, ohne Kommentare.

Fuer Boolean-Karten (Richtig/Falsch) dieses Format:

[
  {
    "prompt": "Frage als vollstaendiger Satz?",
    "category": "[KATEGORIE]",
    "cardType": "boolean",
    "items": [
      { "label": "Antwort 1", "solution": true },
      { "label": "Antwort 2", "solution": false }
    ]
  }
]

Fuer Text-Karten (Zuordnung) dieses Format:

[
  {
    "prompt": "Frage als vollstaendiger Satz?",
    "category": "[KATEGORIE]",
    "cardType": "text",
    "items": [
      { "label": "Moeglichkeit", "solution": "Loesung" }
    ]
  }
]

Wichtig: Wenn du mehrere Karten mit aehnlichem Thema erstellst,
formuliere die Frage (prompt) jedes Mal leicht anders,
damit keine Duplikate entstehen.
```

---

*Letzte Aktualisierung: Februar 2026*
*Aktualisiert: Paste-Import, Auto-Import, JSON-Standardformat*
