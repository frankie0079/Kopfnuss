/* ============================================
   Kopfnuss Kartenmanager -- Vision API
   Karten-Foto analysieren und Daten extrahieren
   Unterstuetzt: Google Gemini und Anthropic Claude
   ============================================ */

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const GEMINI_MODEL = 'gemini-2.0-flash';

// ── API-Key Verwaltung ──────────────────────

export function getApiKey() {
  return localStorage.getItem('anthropic_api_key');
}

export function setApiKey(key) {
  localStorage.setItem('anthropic_api_key', key.trim());
}

export function getGeminiKey() {
  return localStorage.getItem('gemini_api_key');
}

export function setGeminiKey(key) {
  localStorage.setItem('gemini_api_key', key.trim());
}

/** Aktives Modell lesen/setzen ("gemini" oder "claude") */
export function getActiveModel() {
  return localStorage.getItem('active_vision_model') || 'gemini';
}

export function setActiveModel(model) {
  localStorage.setItem('active_vision_model', model);
}

// ── Hilfsfunktionen ─────────────────────────

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function buildPrompt(expectedCards) {
  return `Du siehst ein Foto von ${expectedCards === 1 ? 'einer Smart-10-Spielkarte' : expectedCards + ' Smart-10-Spielkarten'}.

Die Karte ist rund. In der Mitte steht eine Frage. Drumherum sind 10 Begriffe im Kreis angeordnet. Ganz aussen steht bei jedem Begriff eine Loesung (Zahl, Text, Haken oder X, Farbpunkt).

SCHRITT-FUER-SCHRITT VORGEHEN:
1. Schau auf die Karte und finde das Item ganz OBEN (12-Uhr-Position).
2. Lies dort den Begriff (mittlerer Ring) und die Loesung (aeusserer Ring).
3. Gehe dann im Uhrzeigersinn zum naechsten Item (ca. 1-2 Uhr).
4. Wiederhole bis alle 10 Items gelesen sind.

Fuer jeden Begriff: WOERTLICH abschreiben! Auch wenn Text ueber mehrere Zeilen geht. NIEMALS umformulieren!
Fuer jede Loesung: Den EXAKTEN Wert ablesen, NICHT dein Weltwissen benutzen!

Kartentypen: "boolean" (gruener Haken=true, rotes X=false), "text" (Zahl oder Text als Loesung), "color" (Farbpunkt).

Antworte NUR mit JSON, kein anderer Text:
[{
  "prompt": "Frage aus der Mitte (woertlich abgelesen)",
  "cardType": "boolean|text|color",
  "suggestedCategory": "z.B. Wissenschaft, Geografie, Natur",
  "items": [
    {"position": 1, "clockPosition": "12 Uhr", "label": "Begriff bei 12 Uhr", "solution": true, "solutionText": "Loesung bei 12 Uhr"},
    {"position": 2, "clockPosition": "ca. 1 Uhr", "label": "Naechster Begriff im Uhrzeigersinn", "solution": false, "solutionText": "..."}
  ]
}]

KRITISCH - REIHENFOLGE:
- "position" und "clockPosition" beschreiben WO auf der Karte das Item PHYSISCH steht.
- Position 1 = Item ganz oben (12 Uhr). Position 2 = naechstes Item im Uhrzeigersinn. Usw.
- Die Loesungswerte (z.B. Zahlen 1-10) haben NICHTS mit der Position zu tun!
- VERBOTEN: Items nach Loesung, Rang, Alphabet oder Bedeutung sortieren.
- Wenn bei 12 Uhr ein Item mit Loesung "7" steht, dann ist das position:1 mit solutionText:"7".

TEXT-REGELN:
- BUCHSTABENGENAU von der Karte kopieren. Nicht interpretieren, nicht zusammenfassen.
- Zwischen jedem Wort ein Leerzeichen (Karte hat Zeilenumbrueche wegen Kreisform).`;
}

// ── Hauptfunktion ───────────────────────────

/**
 * Smart-10-Karten im Foto erkennen.
 * Nutzt automatisch das aktive Modell (Gemini oder Claude).
 */
export async function analyzeCardImage(imageFile, expectedCards = 1) {
  const model = getActiveModel();

  if (model === 'gemini') {
    return analyzeWithGemini(imageFile, expectedCards);
  } else {
    return analyzeWithClaude(imageFile, expectedCards);
  }
}

// ── Google Gemini ───────────────────────────

async function analyzeWithGemini(imageFile, expectedCards) {
  const apiKey = getGeminiKey();
  if (!apiKey) {
    throw new Error('Kein Gemini API-Key gespeichert. Bitte unter Einstellungen eintragen.');
  }

  const base64 = await fileToBase64(imageFile);
  const mediaType = imageFile.type || 'image/jpeg';
  const prompt = buildPrompt(expectedCards);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          {
            inline_data: {
              mime_type: mediaType,
              data: base64
            }
          },
          { text: prompt }
        ]
      }],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 4096
      }
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const msg = error.error?.message || 'Unbekannter Fehler';
    throw new Error(`Gemini-Fehler ${response.status}: ${msg}`);
  }

  const result = await response.json();
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('Gemini hat keine Antwort geliefert. Bitte nochmal versuchen.');
  }

  return parseJsonResponse(text);
}

// ── Anthropic Claude ────────────────────────

async function analyzeWithClaude(imageFile, expectedCards) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Kein Claude API-Key gespeichert. Bitte unter Einstellungen eintragen.');
  }

  const base64 = await fileToBase64(imageFile);
  const mediaType = imageFile.type || 'image/jpeg';
  const prompt = buildPrompt(expectedCards);

  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      temperature: 0,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: base64
            }
          },
          { type: 'text', text: prompt }
        ]
      }]
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Claude-Fehler ${response.status}: ${error.error?.message || 'Unbekannter Fehler'}`);
  }

  const result = await response.json();
  const text = result.content[0].text;
  return parseJsonResponse(text);
}

// ── JSON-Parsing ────────────────────────────

function parseJsonResponse(text) {
  // Markdown-Codeblock entfernen falls vorhanden
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
  }

  let cards;
  try {
    cards = JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (match) {
      cards = JSON.parse(match[0]);
    } else {
      throw new Error('Konnte die KI-Antwort nicht als JSON lesen. Bitte nochmal versuchen.');
    }
  }

  // Debug: Rohe API-Antwort loggen
  console.log('[Kartenmanager] Rohe API-Antwort (vor fixSpaces):', JSON.stringify(cards, null, 2));

  // Fehlende Leerzeichen reparieren (Gemini verschluckt sie bei Kreistext)
  cards.forEach(card => {
    card.prompt = fixSpaces(card.prompt || '');
    (card.items || []).forEach(item => {
      const origLabel = item.label;
      item.label = fixSpaces(item.label || '');
      item.solutionText = fixSpaces(item.solutionText || '');
      if (origLabel !== item.label) {
        console.log('[fixSpaces] Label korrigiert:', JSON.stringify(origLabel), '->', JSON.stringify(item.label));
      }
    });
  });

  console.log('[Kartenmanager] Nach fixSpaces:', JSON.stringify(cards, null, 2));

  return cards;
}

/**
 * Fehlende Leerzeichen einfuegen.
 * Typisches Problem: "sie erobertenParis" → "sie eroberten Paris"
 * Regel: Kleinbuchstabe direkt gefolgt von Grossbuchstabe = Leerzeichen einfuegen.
 * Ausnahme: Bindestriche (wie "Nord-amerika") bleiben.
 */
function fixSpaces(text) {
  // Unicode-Escapes statt Umlaute (encoding-sicher!)
  // \u00e4=ae \u00f6=oe \u00fc=ue \u00df=ss \u00c4=Ae \u00d6=Oe \u00dc=Ue
  const lc = 'a-z\\u00e4\\u00f6\\u00fc\\u00df';   // a-z + aeoeuess
  const uc = 'A-Z\\u00c4\\u00d6\\u00dc';           // A-Z + AeOeUe
  const all = lc + uc;

  // Zeilenumbrueche durch Leerzeichen ersetzen (Gemini gibt manchmal \n zurueck)
  let fixed = text.replace(/[\r\n]+/g, ' ').replace(/ +/g, ' ').trim();
  // Leerzeichen vor Grossbuchstabe nach Kleinbuchstabe einfuegen
  // z.B. "erobertenParis" -> "eroberten Paris"
  fixed = fixed.replace(new RegExp('([' + lc + '])([' + uc + '])', 'g'), '$1 $2');
  // Leerzeichen nach Zahl vor Buchstabe: "1200n." -> "1200 n."
  fixed = fixed.replace(new RegExp('(\\d)([' + all + '])', 'g'), '$1 $2');
  // Leerzeichen nach Doppelpunkt: "Anonym:Gilgamesch" -> "Anonym: Gilgamesch"
  fixed = fixed.replace(/:([^\s])/g, ': $1');
  // Leerzeichen nach Klammer-auf: "ihrerVeroeffentlichung(" -> "ihrer Veroeffentlichung ("
  fixed = fixed.replace(new RegExp('([' + all + '])\\(', 'g'), '$1 (');
  // Bindestrich + Leerzeichen reparieren: "Drachen- kopf" -> "Drachenkopf"
  fixed = fixed.replace(new RegExp('([' + all + '])-\\s+([' + lc + '])', 'g'), '$1$2');
  // Bindestrich + Leerzeichen + Grossbuchstabe: "Gilgamesch- Epos" -> "Gilgamesch-Epos"
  fixed = fixed.replace(new RegExp('([' + all + '])-\\s+([' + uc + '])', 'g'), '$1-$2');
  return fixed;
}
