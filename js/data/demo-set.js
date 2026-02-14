/* ============================================
   Kopfnuss! -- Kartenset
   Spielkarten (digitalisiert per
   Foto + Gemini-OCR im Kartenmanager)
   ============================================ */

export const DEMO_SET = {
  id: 'demo',
  setName: 'Kopfnuss Kartenset',
  category: 'Gemischt',
  cards: [
    // ── Karte 1: Weissweinsorten ──────────────
    {
      prompt: { text: 'Ist eine Weißweinsorte?', image: null },
      items: [
        { label: { text: 'Parellada', image: null }, solution: { text: 'Richtig', type: 'boolean_true' } },
        { label: { text: 'Gamay', image: null }, solution: { text: 'Falsch', type: 'boolean_false' } },
        { label: { text: 'Viognier', image: null }, solution: { text: 'Richtig', type: 'boolean_true' } },
        { label: { text: 'Sémillon', image: null }, solution: { text: 'Richtig', type: 'boolean_true' } },
        { label: { text: 'Riesling', image: null }, solution: { text: 'Richtig', type: 'boolean_true' } },
        { label: { text: 'Nebbiolo', image: null }, solution: { text: 'Falsch', type: 'boolean_false' } },
        { label: { text: 'Chardonnay', image: null }, solution: { text: 'Richtig', type: 'boolean_true' } },
        { label: { text: 'Trebbiano', image: null }, solution: { text: 'Richtig', type: 'boolean_true' } },
        { label: { text: 'Pinotage', image: null }, solution: { text: 'Falsch', type: 'boolean_false' } },
        { label: { text: 'Colombard', image: null }, solution: { text: 'Richtig', type: 'boolean_true' } }
      ]
    },

    // ── Karte 2: Wiener Stadtbezirke ──────────
    {
      prompt: { text: 'Ist ein Wiener Stadtbezirk?', image: null },
      items: [
        { label: { text: 'Donaustadt', image: null }, solution: { text: 'Richtig', type: 'boolean_true' } },
        { label: { text: 'Wiesing', image: null }, solution: { text: 'Falsch', type: 'boolean_false' } },
        { label: { text: 'Wieden', image: null }, solution: { text: 'Richtig', type: 'boolean_true' } },
        { label: { text: 'Neuhaus', image: null }, solution: { text: 'Falsch', type: 'boolean_false' } },
        { label: { text: 'Rudolfstadt', image: null }, solution: { text: 'Falsch', type: 'boolean_false' } },
        { label: { text: 'Mariahilf', image: null }, solution: { text: 'Richtig', type: 'boolean_true' } },
        { label: { text: 'Alsergrund', image: null }, solution: { text: 'Richtig', type: 'boolean_true' } },
        { label: { text: 'Semmering', image: null }, solution: { text: 'Falsch', type: 'boolean_false' } },
        { label: { text: 'Meidling', image: null }, solution: { text: 'Richtig', type: 'boolean_true' } },
        { label: { text: 'Penzing', image: null }, solution: { text: 'Richtig', type: 'boolean_true' } }
      ]
    },

    // ── Karte 3: Beruehmte Songs ──────────────
    {
      prompt: { text: 'Wer ist berühmt für diesen Song?', image: null },
      items: [
        { label: { text: 'Jump', image: null }, solution: { text: 'Van Halen', type: 'text' } },
        { label: { text: '9 to 5', image: null }, solution: { text: 'Dolly Parton', type: 'text' } },
        { label: { text: 'I Will Always Love You', image: null }, solution: { text: 'Whitney Houston', type: 'text' } },
        { label: { text: 'Wrecking Ball', image: null }, solution: { text: 'Miley Cyrus', type: 'text' } },
        { label: { text: 'Halo', image: null }, solution: { text: 'Beyoncé', type: 'text' } },
        { label: { text: 'Mercedes Benz', image: null }, solution: { text: 'Janis Joplin', type: 'text' } },
        { label: { text: 'My Heart Will Go On', image: null }, solution: { text: 'Céline Dion', type: 'text' } },
        { label: { text: 'Someone Like You', image: null }, solution: { text: 'Adele', type: 'text' } },
        { label: { text: 'Imagine', image: null }, solution: { text: 'John Lennon', type: 'text' } },
        { label: { text: "I'm On Fire", image: null }, solution: { text: 'Bruce Springsteen', type: 'text' } }
      ]
    },

    // ── Karte 4: Wikinger ─────────────────────
    {
      prompt: { text: 'Trifft diese Aussage über die Wikinger zu?', image: null },
      items: [
        { label: { text: 'Stockholm war ihre Hauptstadt', image: null }, solution: { text: 'Falsch', type: 'boolean_false' } },
        { label: { text: 'sie kamen bis nach Nordamerika', image: null }, solution: { text: 'Richtig', type: 'boolean_true' } },
        { label: { text: 'sie waren Vorfaehren der Normannen', image: null }, solution: { text: 'Richtig', type: 'boolean_true' } },
        { label: { text: 'sie gründeten Dublin in Irland', image: null }, solution: { text: 'Richtig', type: 'boolean_true' } },
        { label: { text: 'die Mehrzahl lebte von Raubzügen', image: null }, solution: { text: 'Falsch', type: 'boolean_false' } },
        { label: { text: 'sie lebten von ca. 400-1200 n. Chr.', image: null }, solution: { text: 'Falsch', type: 'boolean_false' } },
        { label: { text: 'Birka war eine wichtige Handelsniederlassung', image: null }, solution: { text: 'Richtig', type: 'boolean_true' } },
        { label: { text: 'sie hatten Hörner an den Helmen', image: null }, solution: { text: 'Falsch', type: 'boolean_false' } },
        { label: { text: 'sie eroberten Paris', image: null }, solution: { text: 'Richtig', type: 'boolean_true' } },
        { label: { text: 'den Bug ihrer Schiffe zierte ein Drachenkopf', image: null }, solution: { text: 'Richtig', type: 'boolean_true' } }
      ]
    },

    // ── Karte 5: Literarische Werke (Reihenfolge) ──
    {
      prompt: { text: 'Ordne die Werke nach dem Jahr ihrer Veröffentlichung (1=ältestes)!', image: null },
      items: [
        { label: { text: 'Anonym: Gilgamesch-Epos', image: null }, solution: { text: '5', type: 'text' } },
        { label: { text: 'Franz Kafka: Der Prozess', image: null }, solution: { text: '9', type: 'text' } },
        { label: { text: 'William Shakespeare: Macbeth', image: null }, solution: { text: '4', type: 'text' } },
        { label: { text: 'Daniel Defoe: Robinson Crusoe', image: null }, solution: { text: '6', type: 'text' } },
        { label: { text: 'Sophokles: König Ödipus', image: null }, solution: { text: '2', type: 'text' } },
        { label: { text: 'Fjodor Dostojewski: Der Idiot', image: null }, solution: { text: '8', type: 'text' } },
        { label: { text: 'Mary Shelley: Frankenstein', image: null }, solution: { text: '7', type: 'text' } },
        { label: { text: 'Aldous Huxley: Schöne neue Welt', image: null }, solution: { text: '10', type: 'text' } },
        { label: { text: 'Dante Alighieri: Die göttliche Komödie', image: null }, solution: { text: '3', type: 'text' } },
        { label: { text: 'John Milton: Das verlorene Paradies', image: null }, solution: { text: '5', type: 'text' } }
      ]
    },

    // ── Karte 6: Himmelskoerper (Durchmesser) ──
    {
      prompt: { text: 'Ordne die Himmelskörper nach ihrem Durchmesser (1=größter)!', image: null },
      items: [
        { label: { text: 'Sonne', image: null }, solution: { text: '1', type: 'text' } },
        { label: { text: 'Erde', image: null }, solution: { text: '6', type: 'text' } },
        { label: { text: 'Saturn', image: null }, solution: { text: '3', type: 'text' } },
        { label: { text: 'Uranus', image: null }, solution: { text: '4', type: 'text' } },
        { label: { text: 'Neptun', image: null }, solution: { text: '5', type: 'text' } },
        { label: { text: 'Mars', image: null }, solution: { text: '7', type: 'text' } },
        { label: { text: 'Jupiter', image: null }, solution: { text: '2', type: 'text' } },
        { label: { text: 'Ganymed', image: null }, solution: { text: '8', type: 'text' } },
        { label: { text: 'Titan', image: null }, solution: { text: '9', type: 'text' } },
        { label: { text: 'Merkur', image: null }, solution: { text: '10', type: 'text' } }
      ]
    },

    // ── Karte 7: Sportlerinnen ────────────────
    {
      prompt: { text: 'Für welchen Sport ist diese Person berühmt?', image: null },
      items: [
        { label: { text: 'Fußball', image: null }, solution: { text: 'Marta Vieira da Silva', type: 'text' } },
        { label: { text: 'Tennis', image: null }, solution: { text: 'Serena Williams', type: 'text' } },
        { label: { text: 'Skilanglauf', image: null }, solution: { text: 'Marit Bjørgen', type: 'text' } },
        { label: { text: 'Snowboarden', image: null }, solution: { text: 'Anna Gasser', type: 'text' } },
        { label: { text: 'Tennis', image: null }, solution: { text: 'Marija Scharapowa', type: 'text' } },
        { label: { text: 'Fußball', image: null }, solution: { text: 'Birgit Prinz', type: 'text' } },
        { label: { text: 'Stabhochsprung', image: null }, solution: { text: 'Jelena Issinbajewa', type: 'text' } },
        { label: { text: 'Langstreckenlauf', image: null }, solution: { text: 'Paula Radcliffe', type: 'text' } },
        { label: { text: 'Kunstturnen', image: null }, solution: { text: 'Nadia Comăneci', type: 'text' } },
        { label: { text: 'Autorennen', image: null }, solution: { text: 'Danica Patrick', type: 'text' } }
      ]
    },

    // ── Karte 8: Anzahl von ... ───────────────
    {
      prompt: { text: 'Anzahl der ... ? (Stand 2019)', image: null },
      items: [
        { label: { text: 'Kapitel in der Bhagavad Gita', image: null }, solution: { text: '18', type: 'text' } },
        { label: { text: 'Nichten von Daisy Duck', image: null }, solution: { text: '3', type: 'text' } },
        { label: { text: 'Gesetze im Kodex Hammurabi', image: null }, solution: { text: '282', type: 'text' } },
        { label: { text: 'Karten in einem üblichen Tarot-Set', image: null }, solution: { text: '78', type: 'text' } },
        { label: { text: 'Jahre bei der Silberhochzeit', image: null }, solution: { text: '25', type: 'text' } },
        { label: { text: 'täglichen Gebete eines Muslimen', image: null }, solution: { text: '5', type: 'text' } },
        { label: { text: 'Nobelpreise für Marie Curie', image: null }, solution: { text: '2', type: 'text' } },
        { label: { text: 'olympischen Medaillen für Monaco', image: null }, solution: { text: '0', type: 'text' } },
        { label: { text: 'Silben in einem Daktylus', image: null }, solution: { text: '3', type: 'text' } },
        { label: { text: 'IBAN-Stellen (Deutschland)', image: null }, solution: { text: '22', type: 'text' } }
      ]
    },

    // ── Karte 9: Historische Ereignisse (Jahr) ──
    {
      prompt: { text: 'Nenne das Jahr des Ereignisses!', image: null },
      items: [
        { label: { text: 'Arabischer Frühling (Beginn)', image: null }, solution: { text: '2010', type: 'text' } },
        { label: { text: 'Hindenburg-Katastrophe', image: null }, solution: { text: '1937', type: 'text' } },
        { label: { text: 'Hurrikan Katrina', image: null }, solution: { text: '2005', type: 'text' } },
        { label: { text: 'Tschernobyl-Katastrophe', image: null }, solution: { text: '1986', type: 'text' } },
        { label: { text: 'Tod von Prinzessin Diana', image: null }, solution: { text: '1997', type: 'text' } },
        { label: { text: 'Ermordung von Erzherzog Franz Ferdinand', image: null }, solution: { text: '1914', type: 'text' } },
        { label: { text: 'Erste Mondlandung', image: null }, solution: { text: '1969', type: 'text' } },
        { label: { text: 'Angriff auf Pearl Harbor', image: null }, solution: { text: '1941', type: 'text' } },
        { label: { text: 'Ermordung von Benazir Bhutto', image: null }, solution: { text: '2007', type: 'text' } },
        { label: { text: 'Kuba-Krise', image: null }, solution: { text: '1962', type: 'text' } }
      ]
    },

    // ── Karte 10: Basketball-Abkuerzungen ─────
    {
      prompt: { text: 'Was bedeutet diese Abkürzung im Basketball?', image: null },
      items: [
        { label: { text: 'Turnover', image: null }, solution: { text: 'TO', type: 'text' } },
        { label: { text: 'Steals', image: null }, solution: { text: 'ST', type: 'text' } },
        { label: { text: 'Blocks', image: null }, solution: { text: 'BLK', type: 'text' } },
        { label: { text: 'Minuten pro Spiel', image: null }, solution: { text: 'MPG', type: 'text' } },
        { label: { text: 'Offensivrebounds', image: null }, solution: { text: 'OFF', type: 'text' } },
        { label: { text: 'Assists', image: null }, solution: { text: 'AST', type: 'text' } },
        { label: { text: 'Punkte', image: null }, solution: { text: 'PTS', type: 'text' } },
        { label: { text: 'Gesamt Rebounds', image: null }, solution: { text: 'REB', type: 'text' } },
        { label: { text: 'Freiwurf-Trefferquote', image: null }, solution: { text: 'FT%', type: 'text' } },
        { label: { text: 'Punkte pro Spiel', image: null }, solution: { text: 'PPG', type: 'text' } }
      ]
    },

    // ── Karte 11: Seemannssprache ─────────────
    {
      prompt: { text: 'Wofür steht dieses Wort in der Seemannssprache?', image: null },
      items: [
        { label: { text: 'Schiffsjunge', image: null }, solution: { text: 'Moses', type: 'text' } },
        { label: { text: 'links', image: null }, solution: { text: 'Backbord', type: 'text' } },
        { label: { text: 'rechts', image: null }, solution: { text: 'Steuerbord', type: 'text' } },
        { label: { text: 'Schmuggelschiff', image: null }, solution: { text: 'Blender', type: 'text' } },
        { label: { text: 'Schiffsgefängnis', image: null }, solution: { text: 'Brig', type: 'text' } },
        { label: { text: 'Besatzung', image: null }, solution: { text: 'Crew', type: 'text' } },
        { label: { text: 'Seile', image: null }, solution: { text: 'Ende', type: 'text' } },
        { label: { text: 'Vorsegel', image: null }, solution: { text: 'Fock', type: 'text' } },
        { label: { text: 'Teufel', image: null }, solution: { text: 'Der Gast', type: 'text' } },
        { label: { text: 'vorne', image: null }, solution: { text: 'Bug', type: 'text' } }
      ]
    },

    // ── Karte 12: Weltwunder der Neuzeit ──────
    {
      prompt: { text: 'Ist eines der sieben Weltwunder der Neuzeit?', image: null },
      items: [
        { label: { text: 'Moai-Statuen (Osterinseln)', image: null }, solution: { text: 'Falsch', type: 'boolean_false' } },
        { label: { text: 'Christo Redentor (Rio de Janeiro)', image: null }, solution: { text: 'Richtig', type: 'boolean_true' } },
        { label: { text: 'Chinesische Mauer (China)', image: null }, solution: { text: 'Richtig', type: 'boolean_true' } },
        { label: { text: 'Eiffelturm (Paris)', image: null }, solution: { text: 'Falsch', type: 'boolean_false' } },
        { label: { text: 'Burj Khalifa (Dubai)', image: null }, solution: { text: 'Falsch', type: 'boolean_false' } },
        { label: { text: 'Schloss Neuschwanstein (Deutschland)', image: null }, solution: { text: 'Falsch', type: 'boolean_false' } },
        { label: { text: 'Timbuktu (Mali)', image: null }, solution: { text: 'Falsch', type: 'boolean_false' } },
        { label: { text: 'Kolosseum (Rom)', image: null }, solution: { text: 'Richtig', type: 'boolean_true' } },
        { label: { text: 'Akropolis (Athen)', image: null }, solution: { text: 'Falsch', type: 'boolean_false' } },
        { label: { text: 'Chichén Itzá (Yucatán)', image: null }, solution: { text: 'Richtig', type: 'boolean_true' } }
      ]
    },

    // ── Karte 13: Ausgestorbene Tiere ─────────
    {
      prompt: { text: 'Ist in den letzten 100 Jahren ausgestorben? (Stand 2019)', image: null },
      items: [
        { label: { text: 'Java-Nashorn', image: null }, solution: { text: 'Falsch', type: 'boolean_false' } },
        { label: { text: 'Beutelwolf (Tasmanischer Tiger)', image: null }, solution: { text: 'Richtig', type: 'boolean_true' } },
        { label: { text: 'Kleiner Kaninchennasenbeutler', image: null }, solution: { text: 'Richtig', type: 'boolean_true' } },
        { label: { text: 'Baiji (Chinesischer Flussdelfin)', image: null }, solution: { text: 'Richtig', type: 'boolean_true' } },
        { label: { text: 'Schneeleopard', image: null }, solution: { text: 'Falsch', type: 'boolean_false' } },
        { label: { text: 'Java-Tiger', image: null }, solution: { text: 'Richtig', type: 'boolean_true' } },
        { label: { text: 'Sibirischer Tiger', image: null }, solution: { text: 'Falsch', type: 'boolean_false' } },
        { label: { text: 'Afrikanischer Elefant', image: null }, solution: { text: 'Falsch', type: 'boolean_false' } },
        { label: { text: 'Beutelteufel (Tasmanischer Teufel)', image: null }, solution: { text: 'Falsch', type: 'boolean_false' } },
        { label: { text: 'Kaspischer Tiger', image: null }, solution: { text: 'Richtig', type: 'boolean_true' } }
      ]
    },

    // ── Karte 14: Fiktive Charaktere ──────────
    {
      prompt: { text: 'Wer erschuf diesen fiktiven Charakter?', image: null },
      items: [
        { label: { text: 'Asterix', image: null }, solution: { text: 'Goscinny und Uderzo', type: 'text' } },
        { label: { text: 'James Bond', image: null }, solution: { text: 'Ian Fleming', type: 'text' } },
        { label: { text: 'Robert Langdon', image: null }, solution: { text: 'Dan Brown', type: 'text' } },
        { label: { text: 'The Spirit', image: null }, solution: { text: 'Will Eisner', type: 'text' } },
        { label: { text: 'Dick Tracy', image: null }, solution: { text: 'Chester Gould', type: 'text' } },
        { label: { text: 'Gaston', image: null }, solution: { text: '(André) Franquin', type: 'text' } },
        { label: { text: 'Die Schlümpfe', image: null }, solution: { text: 'Peyo', type: 'text' } },
        { label: { text: 'Adrian Monk', image: null }, solution: { text: 'Andy Breckman', type: 'text' } },
        { label: { text: 'Batman', image: null }, solution: { text: 'Bob Kane/ Bill Finger', type: 'text' } },
        { label: { text: 'Rip Kirby', image: null }, solution: { text: 'Alex Raymond', type: 'text' } }
      ]
    },

    // ── Karte 15: Chinesische Tierkreiszeichen ──
    {
      prompt: { text: 'Zählt zu den chinesischen Tierkreiszeichen?', image: null },
      items: [
        { label: { text: 'Ziege', image: null }, solution: { text: 'Richtig', type: 'boolean_true' } },
        { label: { text: 'Panda', image: null }, solution: { text: 'Falsch', type: 'boolean_false' } },
        { label: { text: 'Affe', image: null }, solution: { text: 'Richtig', type: 'boolean_true' } },
        { label: { text: 'Tiger', image: null }, solution: { text: 'Richtig', type: 'boolean_true' } },
        { label: { text: 'Katze', image: null }, solution: { text: 'Falsch', type: 'boolean_false' } },
        { label: { text: 'Elefant', image: null }, solution: { text: 'Falsch', type: 'boolean_false' } },
        { label: { text: 'Ratte', image: null }, solution: { text: 'Richtig', type: 'boolean_true' } },
        { label: { text: 'Grille', image: null }, solution: { text: 'Falsch', type: 'boolean_false' } },
        { label: { text: 'Antilope', image: null }, solution: { text: 'Falsch', type: 'boolean_false' } },
        { label: { text: 'Schlange', image: null }, solution: { text: 'Richtig', type: 'boolean_true' } }
      ]
    },

    // ── Karte 16: Jahr 1917 ───────────────────
    {
      prompt: { text: 'Geschah im Jahr 1917?', image: null },
      items: [
        { label: { text: 'Picasso wurde geboren', image: null }, solution: { text: 'Falsch', type: 'boolean_false' } },
        { label: { text: 'Erste Russische Revolution', image: null }, solution: { text: 'Richtig', type: 'boolean_true' } },
        { label: { text: 'das Fernsehen wurde erfunden', image: null }, solution: { text: 'Falsch', type: 'boolean_false' } },
        { label: { text: 'die Balfour-Deklaration wurde beschlossen', image: null }, solution: { text: 'Richtig', type: 'boolean_true' } },
        { label: { text: 'Marie Curie gewinnt den Nobelpreis', image: null }, solution: { text: 'Falsch', type: 'boolean_false' } },
        { label: { text: 'Hungeraufstände in Schweden', image: null }, solution: { text: 'Richtig', type: 'boolean_true' } },
        { label: { text: 'Beginn des 1. Weltkrieges', image: null }, solution: { text: 'Falsch', type: 'boolean_false' } },
        { label: { text: 'Finnland wird unabhängig', image: null }, solution: { text: 'Richtig', type: 'boolean_true' } },
        { label: { text: 'Astrid Lindgren wird geboren', image: null }, solution: { text: 'Falsch', type: 'boolean_false' } },
        { label: { text: 'USA kauften die Jungferninseln', image: null }, solution: { text: 'Richtig', type: 'boolean_true' } }
      ]
    }
  ]
};
