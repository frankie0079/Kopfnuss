/* ============================================
   Kopfnuss! -- Demo-Kartenset
   15 Allgemeinwissen-Karten (rein Text)
   ============================================ */

export const DEMO_SET = {
  id: 'demo',
  setName: 'Allgemeinwissen',
  category: 'Demo',
  cards: [
    // ── Karte 1: Hauptstaedte ────────────────
    {
      id: 'card-01',
      prompt: { text: 'Welche dieser Staedte sind Hauptstaedte?', image: null },
      items: [
        { id: 'c01-0', label: { text: 'Berlin', image: null }, solution: { text: '✓ Deutschland', type: 'boolean_true' } },
        { id: 'c01-1', label: { text: 'Muenchen', image: null }, solution: { text: '✗', type: 'boolean_false' } },
        { id: 'c01-2', label: { text: 'Paris', image: null }, solution: { text: '✓ Frankreich', type: 'boolean_true' } },
        { id: 'c01-3', label: { text: 'Barcelona', image: null }, solution: { text: '✗', type: 'boolean_false' } },
        { id: 'c01-4', label: { text: 'Rom', image: null }, solution: { text: '✓ Italien', type: 'boolean_true' } },
        { id: 'c01-5', label: { text: 'Istanbul', image: null }, solution: { text: '✗', type: 'boolean_false' } },
        { id: 'c01-6', label: { text: 'Wien', image: null }, solution: { text: '✓ Oesterreich', type: 'boolean_true' } },
        { id: 'c01-7', label: { text: 'Genf', image: null }, solution: { text: '✗', type: 'boolean_false' } },
        { id: 'c01-8', label: { text: 'Lissabon', image: null }, solution: { text: '✓ Portugal', type: 'boolean_true' } },
        { id: 'c01-9', label: { text: 'Marseille', image: null }, solution: { text: '✗', type: 'boolean_false' } }
      ]
    },

    // ── Karte 2: Planeten ────────────────────
    {
      id: 'card-02',
      prompt: { text: 'Welche davon sind Planeten unseres Sonnensystems?', image: null },
      items: [
        { id: 'c02-0', label: { text: 'Mars', image: null }, solution: { text: '✓', type: 'boolean_true' } },
        { id: 'c02-1', label: { text: 'Pluto', image: null }, solution: { text: '✗ Zwergplanet', type: 'boolean_false' } },
        { id: 'c02-2', label: { text: 'Venus', image: null }, solution: { text: '✓', type: 'boolean_true' } },
        { id: 'c02-3', label: { text: 'Sonne', image: null }, solution: { text: '✗ Stern', type: 'boolean_false' } },
        { id: 'c02-4', label: { text: 'Jupiter', image: null }, solution: { text: '✓', type: 'boolean_true' } },
        { id: 'c02-5', label: { text: 'Mond', image: null }, solution: { text: '✗ Trabant', type: 'boolean_false' } },
        { id: 'c02-6', label: { text: 'Saturn', image: null }, solution: { text: '✓', type: 'boolean_true' } },
        { id: 'c02-7', label: { text: 'Europa', image: null }, solution: { text: '✗ Jupiter-Mond', type: 'boolean_false' } },
        { id: 'c02-8', label: { text: 'Neptun', image: null }, solution: { text: '✓', type: 'boolean_true' } },
        { id: 'c02-9', label: { text: 'Merkur', image: null }, solution: { text: '✓', type: 'boolean_true' } }
      ]
    },

    // ── Karte 3: Elemente ────────────────────
    {
      id: 'card-03',
      prompt: { text: 'Ordne die chemischen Symbole den Elementen zu!', image: null },
      items: [
        { id: 'c03-0', label: { text: 'Fe', image: null }, solution: { text: 'Eisen', type: 'text' } },
        { id: 'c03-1', label: { text: 'Au', image: null }, solution: { text: 'Gold', type: 'text' } },
        { id: 'c03-2', label: { text: 'O', image: null }, solution: { text: 'Sauerstoff', type: 'text' } },
        { id: 'c03-3', label: { text: 'H', image: null }, solution: { text: 'Wasserstoff', type: 'text' } },
        { id: 'c03-4', label: { text: 'Na', image: null }, solution: { text: 'Natrium', type: 'text' } },
        { id: 'c03-5', label: { text: 'Ag', image: null }, solution: { text: 'Silber', type: 'text' } },
        { id: 'c03-6', label: { text: 'Cu', image: null }, solution: { text: 'Kupfer', type: 'text' } },
        { id: 'c03-7', label: { text: 'Pb', image: null }, solution: { text: 'Blei', type: 'text' } },
        { id: 'c03-8', label: { text: 'C', image: null }, solution: { text: 'Kohlenstoff', type: 'text' } },
        { id: 'c03-9', label: { text: 'N', image: null }, solution: { text: 'Stickstoff', type: 'text' } }
      ]
    },

    // ── Karte 4: Tiere ──────────────────────
    {
      id: 'card-04',
      prompt: { text: 'Welche dieser Tiere sind Saeugetiere?', image: null },
      items: [
        { id: 'c04-0', label: { text: 'Delfin', image: null }, solution: { text: '✓', type: 'boolean_true' } },
        { id: 'c04-1', label: { text: 'Krokodil', image: null }, solution: { text: '✗ Reptil', type: 'boolean_false' } },
        { id: 'c04-2', label: { text: 'Fledermaus', image: null }, solution: { text: '✓', type: 'boolean_true' } },
        { id: 'c04-3', label: { text: 'Pinguin', image: null }, solution: { text: '✗ Vogel', type: 'boolean_false' } },
        { id: 'c04-4', label: { text: 'Wal', image: null }, solution: { text: '✓', type: 'boolean_true' } },
        { id: 'c04-5', label: { text: 'Schildkroete', image: null }, solution: { text: '✗ Reptil', type: 'boolean_false' } },
        { id: 'c04-6', label: { text: 'Elefant', image: null }, solution: { text: '✓', type: 'boolean_true' } },
        { id: 'c04-7', label: { text: 'Hai', image: null }, solution: { text: '✗ Fisch', type: 'boolean_false' } },
        { id: 'c04-8', label: { text: 'Schnabeltier', image: null }, solution: { text: '✓', type: 'boolean_true' } },
        { id: 'c04-9', label: { text: 'Schlange', image: null }, solution: { text: '✗ Reptil', type: 'boolean_false' } }
      ]
    },

    // ── Karte 5: Erfindungen ────────────────
    {
      id: 'card-05',
      prompt: { text: 'In welchem Jahrhundert wurden diese Dinge erfunden?', image: null },
      items: [
        { id: 'c05-0', label: { text: 'Buchdruck', image: null }, solution: { text: '15. Jhd.', type: 'text' } },
        { id: 'c05-1', label: { text: 'Telefon', image: null }, solution: { text: '19. Jhd.', type: 'text' } },
        { id: 'c05-2', label: { text: 'Internet', image: null }, solution: { text: '20. Jhd.', type: 'text' } },
        { id: 'c05-3', label: { text: 'Dampfmaschine', image: null }, solution: { text: '18. Jhd.', type: 'text' } },
        { id: 'c05-4', label: { text: 'Gluehbirne', image: null }, solution: { text: '19. Jhd.', type: 'text' } },
        { id: 'c05-5', label: { text: 'Kompass', image: null }, solution: { text: '12. Jhd.', type: 'text' } },
        { id: 'c05-6', label: { text: 'Fernsehen', image: null }, solution: { text: '20. Jhd.', type: 'text' } },
        { id: 'c05-7', label: { text: 'Schiesspulver', image: null }, solution: { text: '9. Jhd.', type: 'text' } },
        { id: 'c05-8', label: { text: 'Penicillin', image: null }, solution: { text: '20. Jhd.', type: 'text' } },
        { id: 'c05-9', label: { text: 'Rad', image: null }, solution: { text: '4. Jtsd. v. Chr.', type: 'text' } }
      ]
    },

    // ── Karte 6: Laender & Kontinente ────────
    {
      id: 'card-06',
      prompt: { text: 'Auf welchem Kontinent liegen diese Laender?', image: null },
      items: [
        { id: 'c06-0', label: { text: 'Brasilien', image: null }, solution: { text: 'Suedamerika', type: 'text' } },
        { id: 'c06-1', label: { text: 'Aegypten', image: null }, solution: { text: 'Afrika', type: 'text' } },
        { id: 'c06-2', label: { text: 'Japan', image: null }, solution: { text: 'Asien', type: 'text' } },
        { id: 'c06-3', label: { text: 'Australien', image: null }, solution: { text: 'Ozeanien', type: 'text' } },
        { id: 'c06-4', label: { text: 'Kanada', image: null }, solution: { text: 'Nordamerika', type: 'text' } },
        { id: 'c06-5', label: { text: 'Norwegen', image: null }, solution: { text: 'Europa', type: 'text' } },
        { id: 'c06-6', label: { text: 'Indien', image: null }, solution: { text: 'Asien', type: 'text' } },
        { id: 'c06-7', label: { text: 'Nigeria', image: null }, solution: { text: 'Afrika', type: 'text' } },
        { id: 'c06-8', label: { text: 'Argentinien', image: null }, solution: { text: 'Suedamerika', type: 'text' } },
        { id: 'c06-9', label: { text: 'Neuseeland', image: null }, solution: { text: 'Ozeanien', type: 'text' } }
      ]
    },

    // ── Karte 7: Musik ──────────────────────
    {
      id: 'card-07',
      prompt: { text: 'Welche dieser Kuenstler sind Solo-Kuenstler (keine Band)?', image: null },
      items: [
        { id: 'c07-0', label: { text: 'Ed Sheeran', image: null }, solution: { text: '✓', type: 'boolean_true' } },
        { id: 'c07-1', label: { text: 'Coldplay', image: null }, solution: { text: '✗ Band', type: 'boolean_false' } },
        { id: 'c07-2', label: { text: 'Adele', image: null }, solution: { text: '✓', type: 'boolean_true' } },
        { id: 'c07-3', label: { text: 'AC/DC', image: null }, solution: { text: '✗ Band', type: 'boolean_false' } },
        { id: 'c07-4', label: { text: 'Taylor Swift', image: null }, solution: { text: '✓', type: 'boolean_true' } },
        { id: 'c07-5', label: { text: 'Queen', image: null }, solution: { text: '✗ Band', type: 'boolean_false' } },
        { id: 'c07-6', label: { text: 'Drake', image: null }, solution: { text: '✓', type: 'boolean_true' } },
        { id: 'c07-7', label: { text: 'Nirvana', image: null }, solution: { text: '✗ Band', type: 'boolean_false' } },
        { id: 'c07-8', label: { text: 'Billie Eilish', image: null }, solution: { text: '✓', type: 'boolean_true' } },
        { id: 'c07-9', label: { text: 'ABBA', image: null }, solution: { text: '✗ Band/Gruppe', type: 'boolean_false' } }
      ]
    },

    // ── Karte 8: Sport ──────────────────────
    {
      id: 'card-08',
      prompt: { text: 'Wie viele Spieler hat ein Team bei diesen Sportarten (auf dem Feld)?', image: null },
      items: [
        { id: 'c08-0', label: { text: 'Fussball', image: null }, solution: { text: '11', type: 'number' } },
        { id: 'c08-1', label: { text: 'Basketball', image: null }, solution: { text: '5', type: 'number' } },
        { id: 'c08-2', label: { text: 'Volleyball', image: null }, solution: { text: '6', type: 'number' } },
        { id: 'c08-3', label: { text: 'Eishockey', image: null }, solution: { text: '6', type: 'number' } },
        { id: 'c08-4', label: { text: 'Rugby', image: null }, solution: { text: '15', type: 'number' } },
        { id: 'c08-5', label: { text: 'Handball', image: null }, solution: { text: '7', type: 'number' } },
        { id: 'c08-6', label: { text: 'Baseball', image: null }, solution: { text: '9', type: 'number' } },
        { id: 'c08-7', label: { text: 'Wasserball', image: null }, solution: { text: '7', type: 'number' } },
        { id: 'c08-8', label: { text: 'Cricket', image: null }, solution: { text: '11', type: 'number' } },
        { id: 'c08-9', label: { text: 'Tennis Doppel', image: null }, solution: { text: '2', type: 'number' } }
      ]
    },

    // ── Karte 9: Filme ──────────────────────
    {
      id: 'card-09',
      prompt: { text: 'Welche Filme haben einen Oscar fuer den besten Film gewonnen?', image: null },
      items: [
        { id: 'c09-0', label: { text: 'Titanic', image: null }, solution: { text: '✓ 1998', type: 'boolean_true' } },
        { id: 'c09-1', label: { text: 'Avatar', image: null }, solution: { text: '✗', type: 'boolean_false' } },
        { id: 'c09-2', label: { text: 'Der Pate', image: null }, solution: { text: '✓ 1973', type: 'boolean_true' } },
        { id: 'c09-3', label: { text: 'Star Wars', image: null }, solution: { text: '✗', type: 'boolean_false' } },
        { id: 'c09-4', label: { text: 'Forrest Gump', image: null }, solution: { text: '✓ 1995', type: 'boolean_true' } },
        { id: 'c09-5', label: { text: 'Der Weisse Hai', image: null }, solution: { text: '✗', type: 'boolean_false' } },
        { id: 'c09-6', label: { text: 'Schindlers Liste', image: null }, solution: { text: '✓ 1994', type: 'boolean_true' } },
        { id: 'c09-7', label: { text: 'Inception', image: null }, solution: { text: '✗', type: 'boolean_false' } },
        { id: 'c09-8', label: { text: 'Gladiator', image: null }, solution: { text: '✓ 2001', type: 'boolean_true' } },
        { id: 'c09-9', label: { text: 'Die Matrix', image: null }, solution: { text: '✗', type: 'boolean_false' } }
      ]
    },

    // ── Karte 10: Geographie ─────────────────
    {
      id: 'card-10',
      prompt: { text: 'Welches sind die laengsten Fluesse der Welt (Top 10)?', image: null },
      items: [
        { id: 'c10-0', label: { text: 'Nil', image: null }, solution: { text: '✓ ~6.650 km', type: 'boolean_true' } },
        { id: 'c10-1', label: { text: 'Rhein', image: null }, solution: { text: '✗ ~1.230 km', type: 'boolean_false' } },
        { id: 'c10-2', label: { text: 'Amazonas', image: null }, solution: { text: '✓ ~6.400 km', type: 'boolean_true' } },
        { id: 'c10-3', label: { text: 'Donau', image: null }, solution: { text: '✗ ~2.850 km', type: 'boolean_false' } },
        { id: 'c10-4', label: { text: 'Jangtse', image: null }, solution: { text: '✓ ~6.300 km', type: 'boolean_true' } },
        { id: 'c10-5', label: { text: 'Themse', image: null }, solution: { text: '✗ ~346 km', type: 'boolean_false' } },
        { id: 'c10-6', label: { text: 'Mississippi', image: null }, solution: { text: '✓ ~6.275 km', type: 'boolean_true' } },
        { id: 'c10-7', label: { text: 'Seine', image: null }, solution: { text: '✗ ~777 km', type: 'boolean_false' } },
        { id: 'c10-8', label: { text: 'Ob', image: null }, solution: { text: '✓ ~5.410 km', type: 'boolean_true' } },
        { id: 'c10-9', label: { text: 'Mekong', image: null }, solution: { text: '✓ ~4.350 km', type: 'boolean_true' } }
      ]
    },

    // ── Karte 11: Sprachen ──────────────────
    {
      id: 'card-11',
      prompt: { text: 'Was bedeuten diese Woerter auf Deutsch?', image: null },
      items: [
        { id: 'c11-0', label: { text: 'Merci (FR)', image: null }, solution: { text: 'Danke', type: 'text' } },
        { id: 'c11-1', label: { text: 'Gracias (ES)', image: null }, solution: { text: 'Danke', type: 'text' } },
        { id: 'c11-2', label: { text: 'Cat (EN)', image: null }, solution: { text: 'Katze', type: 'text' } },
        { id: 'c11-3', label: { text: 'Casa (IT)', image: null }, solution: { text: 'Haus', type: 'text' } },
        { id: 'c11-4', label: { text: 'Agua (ES)', image: null }, solution: { text: 'Wasser', type: 'text' } },
        { id: 'c11-5', label: { text: 'Livre (FR)', image: null }, solution: { text: 'Buch', type: 'text' } },
        { id: 'c11-6', label: { text: 'Bread (EN)', image: null }, solution: { text: 'Brot', type: 'text' } },
        { id: 'c11-7', label: { text: 'Amico (IT)', image: null }, solution: { text: 'Freund', type: 'text' } },
        { id: 'c11-8', label: { text: 'Sol (ES)', image: null }, solution: { text: 'Sonne', type: 'text' } },
        { id: 'c11-9', label: { text: 'Fleur (FR)', image: null }, solution: { text: 'Blume', type: 'text' } }
      ]
    },

    // ── Karte 12: Koerper ───────────────────
    {
      id: 'card-12',
      prompt: { text: 'Wie viele hat ein erwachsener Mensch davon?', image: null },
      items: [
        { id: 'c12-0', label: { text: 'Knochen', image: null }, solution: { text: '206', type: 'number' } },
        { id: 'c12-1', label: { text: 'Zaehne', image: null }, solution: { text: '32', type: 'number' } },
        { id: 'c12-2', label: { text: 'Rippen', image: null }, solution: { text: '24', type: 'number' } },
        { id: 'c12-3', label: { text: 'Wirbel', image: null }, solution: { text: '33', type: 'number' } },
        { id: 'c12-4', label: { text: 'Finger', image: null }, solution: { text: '10', type: 'number' } },
        { id: 'c12-5', label: { text: 'Lungen', image: null }, solution: { text: '2', type: 'number' } },
        { id: 'c12-6', label: { text: 'Nieren', image: null }, solution: { text: '2', type: 'number' } },
        { id: 'c12-7', label: { text: 'Herzkammern', image: null }, solution: { text: '4', type: 'number' } },
        { id: 'c12-8', label: { text: 'Chromosomen', image: null }, solution: { text: '46', type: 'number' } },
        { id: 'c12-9', label: { text: 'Blutgruppen', image: null }, solution: { text: '4 (A,B,AB,0)', type: 'text' } }
      ]
    },

    // ── Karte 13: Geschichte ────────────────
    {
      id: 'card-13',
      prompt: { text: 'In welchem Jahr fanden diese Ereignisse statt?', image: null },
      items: [
        { id: 'c13-0', label: { text: 'Mondlandung', image: null }, solution: { text: '1969', type: 'number' } },
        { id: 'c13-1', label: { text: 'Mauerfall', image: null }, solution: { text: '1989', type: 'number' } },
        { id: 'c13-2', label: { text: 'Entdeckung Amerikas', image: null }, solution: { text: '1492', type: 'number' } },
        { id: 'c13-3', label: { text: 'Franzoesische Revolution', image: null }, solution: { text: '1789', type: 'number' } },
        { id: 'c13-4', label: { text: 'Ende 2. Weltkrieg', image: null }, solution: { text: '1945', type: 'number' } },
        { id: 'c13-5', label: { text: 'Titanic Untergang', image: null }, solution: { text: '1912', type: 'number' } },
        { id: 'c13-6', label: { text: 'Erfindung Telefon', image: null }, solution: { text: '1876', type: 'number' } },
        { id: 'c13-7', label: { text: 'Deutsche Einheit', image: null }, solution: { text: '1990', type: 'number' } },
        { id: 'c13-8', label: { text: 'Erster Flug (Wright)', image: null }, solution: { text: '1903', type: 'number' } },
        { id: 'c13-9', label: { text: 'Euro-Einfuehrung', image: null }, solution: { text: '2002', type: 'number' } }
      ]
    },

    // ── Karte 14: Essen & Trinken ────────────
    {
      id: 'card-14',
      prompt: { text: 'Aus welchem Land stammen diese Gerichte/Getraenke urspruenglich?', image: null },
      items: [
        { id: 'c14-0', label: { text: 'Pizza', image: null }, solution: { text: 'Italien', type: 'text' } },
        { id: 'c14-1', label: { text: 'Sushi', image: null }, solution: { text: 'Japan', type: 'text' } },
        { id: 'c14-2', label: { text: 'Croissant', image: null }, solution: { text: 'Oesterreich', type: 'text' } },
        { id: 'c14-3', label: { text: 'Hamburger', image: null }, solution: { text: 'USA', type: 'text' } },
        { id: 'c14-4', label: { text: 'Kebab', image: null }, solution: { text: 'Tuerkei', type: 'text' } },
        { id: 'c14-5', label: { text: 'Paella', image: null }, solution: { text: 'Spanien', type: 'text' } },
        { id: 'c14-6', label: { text: 'Whiskey', image: null }, solution: { text: 'Irland/Schottland', type: 'text' } },
        { id: 'c14-7', label: { text: 'Kimchi', image: null }, solution: { text: 'Korea', type: 'text' } },
        { id: 'c14-8', label: { text: 'Gulasch', image: null }, solution: { text: 'Ungarn', type: 'text' } },
        { id: 'c14-9', label: { text: 'Tee', image: null }, solution: { text: 'China', type: 'text' } }
      ]
    },

    // ── Karte 15: Mathe & Logik ──────────────
    {
      id: 'card-15',
      prompt: { text: 'Wie lautet das Ergebnis?', image: null },
      items: [
        { id: 'c15-0', label: { text: '7 × 8', image: null }, solution: { text: '56', type: 'number' } },
        { id: 'c15-1', label: { text: '√144', image: null }, solution: { text: '12', type: 'number' } },
        { id: 'c15-2', label: { text: '15²', image: null }, solution: { text: '225', type: 'number' } },
        { id: 'c15-3', label: { text: '1000 ÷ 8', image: null }, solution: { text: '125', type: 'number' } },
        { id: 'c15-4', label: { text: '3⁴', image: null }, solution: { text: '81', type: 'number' } },
        { id: 'c15-5', label: { text: '17 + 28', image: null }, solution: { text: '45', type: 'number' } },
        { id: 'c15-6', label: { text: '99 - 37', image: null }, solution: { text: '62', type: 'number' } },
        { id: 'c15-7', label: { text: '11 × 11', image: null }, solution: { text: '121', type: 'number' } },
        { id: 'c15-8', label: { text: '√256', image: null }, solution: { text: '16', type: 'number' } },
        { id: 'c15-9', label: { text: '2¹⁰', image: null }, solution: { text: '1024', type: 'number' } }
      ]
    }
  ]
};
