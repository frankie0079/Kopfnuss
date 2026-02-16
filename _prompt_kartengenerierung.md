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

Jede Karte besteht aus:

```
{
  prompt:    "Frage als vollstaendiger Satz mit Fragezeichen",
  category:  "Kategoriename",
  cardType:  "boolean",          // oder "text" fuer Ranking-Karten
  items: [
    { position: 1..10, label: "Antworttext", solution: true/false, solutionText: "Richtig/Falsch" }
  ]
}
```

### Regeln fuer Items:
- Exakt 10 Items pro Karte
- Boolean-Karten: ausgewogene Verteilung, ca. 5-7x richtig, 3-5x falsch
  (nicht 9:1 oder 1:9 -- das ist langweilig)
- Labels: kurz und praegnant (max. 3-4 Woerter ideal)
- Die Falsch-Antworten muessen plausibel sein (nicht offensichtlich falsch)

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

```
1. Kategorie und Anzahl festlegen
2. Fragen entwerfen (Prompt formulieren)
3. 10 Antworten pro Frage recherchieren
4. JEDE Antwort einzeln im Internet verifizieren (WebSearch)
5. Nicht verifizierbare Antworten ersetzen
6. Schwierigkeitsverteilung pruefen (2-3 leicht, 4-5 mittel, 2-3 schwer)
7. Karten dem Nutzer zur Abnahme vorlegen (Tabellen-Format)
8. Nach Freigabe: als JS-Modul in js/data/generated-{kategorie}.js speichern
9. Import-Button im Admin-Hub registrieren (GENERATED_SETS in admin.js)
10. Nutzer klickt Import-Button im Admin-Hub
11. KI-generierte Karten erscheinen oben in der Kartenbibliothek
    mit lila "KI"-Badge, dort einzeln pruefen und ggf. bearbeiten
12. Filter "KI-generiert" in der Bibliothek zeigt nur diese Karten
```

## 8. Technische Integration

### Dateiformat
Generierte Karten werden als ES-Modul gespeichert:
- Pfad: `js/data/generated-{kategorie}.js`
- Export: `export const {KATEGORIE}_CARDS = [ ... ];`

### Import-Registrierung
In `js/admin/admin.js` im Array `GENERATED_SETS`:
```javascript
{ module: '../data/generated-{kategorie}.js',
  exportName: '{KATEGORIE}_CARDS',
  label: 'N {Kategorie}-Karten',
  categoryName: '{Kategorie}' }
```

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

---

*Letzte Aktualisierung: Februar 2026*
*Erstellt nach dem ersten Kartengenerierungslauf (10 Kino-Karten)*
