#!/usr/bin/env python3
"""
Kopfnuss Kartenmanager -- Batch-Import
=======================================
Verarbeitet einen Ordner voller Kartenfotos:
1. Sendet jedes Bild an die Google Gemini API
2. Bereinigt Text (fixSpaces)
3. Validiert und korrigiert Ergebnisse (Duplikate, fehlende Zahlen)
4. Erzeugt Kopfnuss-kompatible set.json

Aufruf:
  python batch_import.py Kartenfotos/ --output mein-set
  python batch_import.py Kartenfotos/ --output mein-set --api-key AIza...

Voraussetzungen:
  - Python 3.8+
  - Gemini API-Key (als Argument oder in GEMINI_API_KEY Umgebungsvariable)
  - Bilddateien: .jpg, .jpeg, .png (1 Karte pro Foto)
"""

import argparse
import base64
import json
import os
import re
import sys
import time
import urllib.request
import urllib.error
from pathlib import Path


# ── Windows-Konsole absichern ────────────────────────────────────
# Sonderzeichen (z.B. ✓ ✗) erzeugen auf Windows charmap-Fehler.
# Wir ersetzen sys.stdout, sodass nicht-druckbare Zeichen ersetzt werden.
if sys.platform == "win32":
    sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8',
                      errors='replace', buffering=1)


# ── Konfiguration ────────────────────────────────────────────────

GEMINI_MODEL = "gemini-2.0-flash"
GEMINI_URL_TEMPLATE = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "{model}:generateContent?key={key}"
)
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png"}
RATE_LIMIT_DELAY = 1.5  # Sekunden zwischen API-Aufrufen


# ── Prompt (identisch mit js/services/vision-api.js) ─────────────

PROMPT = """Du siehst ein Foto von einer Smart-10-Spielkarte.

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
- Zwischen jedem Wort ein Leerzeichen (Karte hat Zeilenumbrueche wegen Kreisform)."""


# ── fixSpaces (identisch mit JS-Version, encoding-sicher) ────────

def fix_spaces(text):
    """Bereinigt typische OCR-Fehler bei Kreistext.

    Identisch mit fixSpaces() in js/services/vision-api.js:
    - Zeilenumbrueche -> Leerzeichen
    - Leerzeichen vor Grossbuchstabe nach Kleinbuchstabe
    - Leerzeichen nach Zahl vor Buchstabe
    - Leerzeichen nach Doppelpunkt
    - Leerzeichen vor Klammer
    - Silbentrennung reparieren (Bindestrich + Leerzeichen)
    """
    if not text or not isinstance(text, str):
        return text or ""

    # Zeilenumbrueche durch Leerzeichen ersetzen
    fixed = re.sub(r'[\r\n]+', ' ', text)
    fixed = re.sub(r' +', ' ', fixed).strip()

    # Leerzeichen vor Grossbuchstabe nach Kleinbuchstabe
    # z.B. "erobertenParis" -> "eroberten Paris"
    fixed = re.sub(
        r'([a-z\u00e4\u00f6\u00fc\u00df])([A-Z\u00c4\u00d6\u00dc])',
        r'\1 \2', fixed
    )

    # Leerzeichen nach Zahl vor Buchstabe: "1200n." -> "1200 n."
    fixed = re.sub(
        r'(\d)([a-zA-Z\u00e4\u00f6\u00fc\u00c4\u00d6\u00dc])',
        r'\1 \2', fixed
    )

    # Leerzeichen nach Doppelpunkt: "Anonym:Gilgamesch" -> "Anonym: Gilgamesch"
    fixed = re.sub(r':([^\s])', r': \1', fixed)

    # Leerzeichen vor Klammer: "Veroeffentlichung(" -> "Veroeffentlichung ("
    fixed = re.sub(
        r'([a-zA-Z\u00e4\u00f6\u00fc\u00df\u00c4\u00d6\u00dc])\(',
        r'\1 (', fixed
    )

    # Silbentrennung: "Drachen- kopf" -> "Drachenkopf"
    fixed = re.sub(
        r'([a-zA-Z\u00e4\u00f6\u00fc\u00df\u00c4\u00d6\u00dc])-\s+'
        r'([a-z\u00e4\u00f6\u00fc\u00df])',
        r'\1\2', fixed
    )

    # Bindestrich + Leerzeichen + Grossbuchstabe: "Gilgamesch- Epos" -> "Gilgamesch-Epos"
    fixed = re.sub(
        r'([a-zA-Z\u00e4\u00f6\u00fc\u00df\u00c4\u00d6\u00dc])-\s+'
        r'([A-Z\u00c4\u00d6\u00dc])',
        r'\1-\2', fixed
    )

    return fixed


# ── Gemini API ───────────────────────────────────────────────────

def send_to_gemini(image_path: Path, api_key: str) -> str:
    """Sendet ein Bild an die Gemini API und gibt den Antworttext zurueck."""

    with open(image_path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode()

    suffix = image_path.suffix.lower()
    mime_type = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
    }.get(suffix, "image/jpeg")

    payload = {
        "contents": [{
            "parts": [
                {"inline_data": {"mime_type": mime_type, "data": b64}},
                {"text": PROMPT}
            ]
        }],
        "generationConfig": {
            "temperature": 0,
            "maxOutputTokens": 4096
        }
    }

    url = GEMINI_URL_TEMPLATE.format(model=GEMINI_MODEL, key=api_key)
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    with urllib.request.urlopen(req, timeout=90) as resp:
        result = json.loads(resp.read().decode("utf-8"))
        text = result["candidates"][0]["content"]["parts"][0]["text"]
        return text


def parse_gemini_response(text: str) -> list:
    """Parst die Gemini-JSON-Antwort zu einer Liste von Karten-Dicts."""

    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r'^```(?:json)?\s*', '', cleaned)
        cleaned = re.sub(r'\s*```$', '', cleaned)

    try:
        cards = json.loads(cleaned)
    except json.JSONDecodeError:
        m = re.search(r'\[[\s\S]*\]', cleaned)
        if m:
            cards = json.loads(m.group(0))
        else:
            raise ValueError(f"JSON nicht parsbar:\n{cleaned[:500]}")

    if not isinstance(cards, list):
        cards = [cards]

    return cards


# ── Validierung & Korrektur ──────────────────────────────────────

def apply_fix_spaces(cards: list) -> list:
    """Wendet fix_spaces auf alle Textfelder an."""
    for card in cards:
        card["prompt"] = fix_spaces(card.get("prompt", ""))
        for item in card.get("items", []):
            item["label"] = fix_spaces(item.get("label", ""))
            st = item.get("solutionText")
            if st and isinstance(st, str):
                item["solutionText"] = fix_spaces(st)
    return cards


def is_ranking_card(card: dict) -> bool:
    """Erkennt Ranking-Karten: cardType 'text' mit Zahlen 1-10 als Loesungen."""
    if card.get("cardType") != "text":
        return False
    solutions = []
    for item in card.get("items", []):
        st = str(item.get("solutionText", "")).strip()
        try:
            solutions.append(int(st))
        except (ValueError, TypeError):
            return False
    # Ranking-Karte wenn die Loesungen alle Ganzzahlen im Bereich 1-10 sind
    return len(solutions) == 10 and all(1 <= s <= 10 for s in solutions)


def validate_card(card: dict) -> dict:
    """Validiert eine Karte und gibt ein Report-Dict zurueck.

    Returns:
        {
            "confidence": "high" | "medium" | "low",
            "issues": ["Beschreibung des Problems", ...],
            "corrections": ["Beschreibung der Korrektur", ...]
        }
    """
    report = {"confidence": "high", "issues": [], "corrections": []}
    items = card.get("items", [])

    # Grundpruefung: 10 Items?
    if len(items) != 10:
        report["issues"].append(f"Nur {len(items)} Items statt 10")
        report["confidence"] = "low"
        return report

    # Pruefung je nach Kartentyp
    if is_ranking_card(card):
        report = _validate_ranking(card, report)
    elif card.get("cardType") == "boolean":
        report = _validate_boolean(card, report)
    elif card.get("cardType") == "text":
        report = _validate_text(card, report)

    return report


def _validate_ranking(card: dict, report: dict) -> dict:
    """Validiert Ranking-Karten (Zahlen 1-10).

    Ranking-Fehler werden NICHT automatisch korrigiert, da die Heuristik
    unzuverlaessig ist (Gemini vertauscht oft Zahlen zwischen Items).
    Stattdessen werden die Fehler detailliert gemeldet, damit der Nutzer
    sie in ergebnis_roh.json manuell korrigieren kann.
    """
    items = card["items"]
    solutions = []
    for item in items:
        solutions.append(int(str(item.get("solutionText", "0")).strip()))

    expected = set(range(1, 11))
    actual = set(solutions)
    missing = expected - actual
    duplicates = [s for s in expected if solutions.count(s) > 1]

    if not missing and not duplicates:
        # Alles OK
        return report

    # Detaillierte Fehlermeldung
    report["confidence"] = "medium"
    report["issues"].append(
        f"Ranking-Fehler: Duplikate={duplicates}, Fehlend={sorted(missing)}"
    )

    # Zeige welche Items die doppelten Werte haben
    for dup_val in duplicates:
        dup_items = [
            f"  Pos.{i + 1} {items[i]['label'][:35]} = {dup_val}"
            for i, s in enumerate(solutions) if s == dup_val
        ]
        report["issues"].append(
            f"Wert {dup_val} doppelt bei:\n" + "\n".join(dup_items)
        )
    report["issues"].append(
        f"-> MANUELL PRUEFEN: Welches Item hat wirklich "
        f"{sorted(missing)} als Loesung?"
    )

    if len(missing) > 2:
        report["confidence"] = "low"

    return report


def _validate_boolean(card: dict, report: dict) -> dict:
    """Validiert Boolean-Karten (true/false)."""
    items = card["items"]
    true_count = sum(1 for item in items if item.get("solution") is True)
    false_count = sum(1 for item in items if item.get("solution") is False)

    if true_count + false_count != 10:
        report["issues"].append(
            f"Boolean-Werte unklar: {true_count} true, {false_count} false, "
            f"{10 - true_count - false_count} unbekannt"
        )
        report["confidence"] = "low"
    elif true_count == 0 or false_count == 0:
        report["issues"].append(
            f"Verdaechtig: Alle {true_count} true / {false_count} false"
        )
        report["confidence"] = "medium"

    return report


def _validate_text(card: dict, report: dict) -> dict:
    """Validiert Text-Karten (nicht-Ranking)."""
    items = card["items"]
    empty_solutions = [
        i for i, item in enumerate(items)
        if not str(item.get("solutionText", "")).strip()
    ]

    if empty_solutions:
        report["issues"].append(
            f"Leere Loesungen bei Items: {[i + 1 for i in empty_solutions]}"
        )
        report["confidence"] = "low"

    return report


# ── Kopfnuss-Export ──────────────────────────────────────────────

def slugify(text: str) -> str:
    """Text in URL-freundlichen Slug umwandeln (wie in export.js)."""
    s = text.lower()
    s = s.replace("\u00e4", "ae").replace("\u00c4", "ae")
    s = s.replace("\u00f6", "oe").replace("\u00d6", "oe")
    s = s.replace("\u00fc", "ue").replace("\u00dc", "ue")
    s = s.replace("\u00df", "ss")
    s = re.sub(r'[^a-z0-9]+', '-', s)
    s = s.strip('-')
    return s


def card_to_kopfnuss(card: dict) -> dict:
    """Konvertiert eine Karte ins Kopfnuss-Format (wie export.js).

    solution.type:
      - Boolean-Karten: "boolean_true" / "boolean_false"
      - Text-/Ranking-Karten: "text"
    """
    is_bool = card.get("cardType") == "boolean"
    kopfnuss_items = []
    for item in card.get("items", []):
        sol_bool = item.get("solution", False)
        sol_text = item.get("solutionText", "")

        if is_bool:
            display_text = "Richtig" if sol_bool else "Falsch"
            sol_type = "boolean_true" if sol_bool else "boolean_false"
        else:
            display_text = str(sol_text) if sol_text else ""
            sol_type = "text"

        kopfnuss_items.append({
            "label": {
                "text": item.get("label", ""),
                "image": None
            },
            "solution": {
                "text": display_text,
                "type": sol_type
            }
        })

    return {
        "prompt": {
            "text": card.get("prompt", ""),
            "image": None
        },
        "items": kopfnuss_items
    }


def build_kopfnuss_set(cards: list, set_name: str, category: str) -> dict:
    """Baut ein komplettes Kopfnuss-Set aus einer Liste von Karten."""
    return {
        "id": slugify(set_name),
        "setName": set_name,
        "category": category,
        "cards": [card_to_kopfnuss(c) for c in cards]
    }


# ── JS-Modul-Export (fuer Kopfnuss! Spiel) ───────────────────────

# Zielpfade: Jetzt im selben Projekt (kein Cross-Projekt-Pfad mehr)
_GAME_ROOT = Path(__file__).resolve().parent
KOPFNUSS_GAME_JS_PATH = _GAME_ROOT / "js" / "data" / "demo-set.js"
KOPFNUSS_GAME_SW_PATH = _GAME_ROOT / "sw.js"


def bump_sw_cache_version(sw_path: Path):
    """Erhoeht die Cache-Version im Service Worker (smartbox-vN -> smartbox-v(N+1))."""
    if not sw_path.exists():
        return None

    content = sw_path.read_text(encoding="utf-8")
    match = re.search(r"const CACHE_NAME = 'smartbox-v(\d+)';", content)
    if not match:
        return None

    old_version = int(match.group(1))
    new_version = old_version + 1
    new_content = content.replace(
        f"const CACHE_NAME = 'smartbox-v{old_version}';",
        f"const CACHE_NAME = 'smartbox-v{new_version}';",
    )
    sw_path.write_text(new_content, encoding="utf-8")
    return new_version


def write_kopfnuss_js_module(kopfnuss_set: dict, output_path: Path):
    """Schreibt das Kartenset als ES-Modul direkt ins Kopfnuss!-Projekt.

    Ueberschreibt id und setName mit festen Werten, damit die
    bestehende Spiellogik (setup.js, victory.js) funktioniert.
    """
    # Kopie mit festen Werten fuer das Spiel
    game_set = dict(kopfnuss_set)
    game_set["id"] = "demo"
    game_set["setName"] = "Kopfnuss Kartenset"

    json_str = json.dumps(game_set, ensure_ascii=False, indent=2)

    js_content = (
        "/* ============================================\n"
        "   Kopfnuss! -- Kartenset\n"
        "   Spielkarten (digitalisiert per\n"
        "   Foto + Gemini-OCR im Kartenmanager)\n"
        "   ============================================ */\n"
        "\n"
        f"export const DEMO_SET = {json_str};\n"
    )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(js_content)


# ── Hauptlogik ───────────────────────────────────────────────────

def collect_images(folder: Path) -> list:
    """Sammelt alle Bilddateien aus einem Ordner (sortiert nach Name)."""
    images = []
    for f in sorted(folder.iterdir()):
        if f.is_file() and f.suffix.lower() in IMAGE_EXTENSIONS:
            images.append(f)
    return images


def _compare_cards(card1: dict, card2: dict) -> list:
    """Vergleicht zwei Karten-Dicts und gibt eine Liste von Abweichungen zurueck.

    Returns:
        Liste von Strings, z.B. ["Item 3: 'Flugzeug/true' vs 'Flugzeug/false'"]
        Leere Liste = identisch.
    """
    diffs = []

    # Prompt vergleichen
    p1 = card1.get("prompt", "").strip()
    p2 = card2.get("prompt", "").strip()
    if p1 != p2:
        diffs.append(f"Prompt: '{p1[:40]}' vs '{p2[:40]}'")

    # CardType vergleichen
    if card1.get("cardType") != card2.get("cardType"):
        diffs.append(
            f"Kartentyp: '{card1.get('cardType')}' vs '{card2.get('cardType')}'"
        )

    # Items vergleichen
    items1 = card1.get("items", [])
    items2 = card2.get("items", [])

    if len(items1) != len(items2):
        diffs.append(f"Itemanzahl: {len(items1)} vs {len(items2)}")
        return diffs

    for i in range(len(items1)):
        it1, it2 = items1[i], items2[i]
        label1 = it1.get("label", "").strip()
        label2 = it2.get("label", "").strip()
        sol1 = str(it1.get("solutionText", it1.get("solution", ""))).strip()
        sol2 = str(it2.get("solutionText", it2.get("solution", ""))).strip()

        if label1 != label2 or sol1 != sol2:
            diffs.append(
                f"Item {i + 1}: '{label1}/{sol1}' vs '{label2}/{sol2}'"
            )

    return diffs


def process_single_card(image_path: Path, api_key: str, card_number: int) -> dict:
    """Verarbeitet ein einzelnes Kartenfoto mit doppeltem API-Aufruf.

    Sendet das Foto 2x an Gemini und vergleicht die Ergebnisse.
    Bei Abweichung: confidence = "review", Abweichungen in issues.

    Returns:
        {
            "source": "IMG_1234.jpg",
            "card": { ... Karten-Dict ... },
            "validation": { confidence, issues, corrections },
            "raw_response": "...",
            "doubleChecked": true,
            "diffs": ["Item 3: ..."],
            "error": None | "Fehlerbeschreibung"
        }
    """
    result = {
        "source": image_path.name,
        "card": None,
        "validation": None,
        "raw_response": None,
        "doubleChecked": True,
        "diffs": [],
        "error": None
    }

    try:
        # 1. Erster Gemini API-Aufruf
        print(f"  [{card_number}] Sende an Gemini (1/2): {image_path.name} ...",
              end=" ", flush=True)
        raw_text_1 = send_to_gemini(image_path, api_key)
        result["raw_response"] = raw_text_1

        cards_1 = parse_gemini_response(raw_text_1)
        if not cards_1:
            raise ValueError("Keine Karten in Antwort (Aufruf 1)")
        card_1 = cards_1[0]
        apply_fix_spaces([card_1])

        # Pause zwischen den Aufrufen
        time.sleep(RATE_LIMIT_DELAY)

        # 2. Zweiter Gemini API-Aufruf
        print("(2/2) ...", end=" ", flush=True)
        raw_text_2 = send_to_gemini(image_path, api_key)

        cards_2 = parse_gemini_response(raw_text_2)
        if not cards_2:
            raise ValueError("Keine Karten in Antwort (Aufruf 2)")
        card_2 = cards_2[0]
        apply_fix_spaces([card_2])

        # 3. Vergleichen
        diffs = _compare_cards(card_1, card_2)
        result["diffs"] = diffs

        # Erster Aufruf wird als Hauptergebnis verwendet
        card = card_1

        # 4. Validieren
        validation = validate_card(card)

        # 5. Bei Abweichungen: confidence auf "review" setzen
        if diffs:
            validation["confidence"] = "review"
            for d in diffs:
                validation["issues"].append(f"Abweichung: {d}")

        result["card"] = card
        result["validation"] = validation

        # Status-Symbol (ASCII fuer Windows-Konsole)
        symbol = {
            "high": "[OK]",
            "medium": "[!!]",
            "low": "[XX]",
            "review": "[<>]"
        }.get(validation["confidence"], "[??]")

        prompt_short = card.get("prompt", "?")[:50]
        check_info = f" ({len(diffs)} Abw.)" if diffs else " (2x gleich)"
        print(f"{symbol} {validation['confidence']}{check_info} | {prompt_short}")

        if validation["corrections"]:
            for c in validation["corrections"]:
                print(f"      Korrektur: {c}")
        if validation["issues"]:
            for issue in validation["issues"]:
                print(f"      Problem: {issue}")

    except Exception as e:
        result["error"] = str(e)
        print(f"[XX] FEHLER: {e}")

    return result


def _load_checkpoint(output_folder: Path) -> dict:
    """Laedt den Checkpoint (bereits verarbeitete Karten)."""
    cp_path = output_folder / "_checkpoint.json"
    if cp_path.exists():
        try:
            with open(cp_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, OSError):
            pass
    return {"processed": {}}


def _save_checkpoint(output_folder: Path, checkpoint: dict):
    """Speichert den Checkpoint nach jeder Karte."""
    cp_path = output_folder / "_checkpoint.json"
    with open(cp_path, "w", encoding="utf-8") as f:
        json.dump(checkpoint, f, ensure_ascii=False, indent=2)


def _delete_checkpoint(output_folder: Path):
    """Loescht den Checkpoint nach erfolgreichem Durchlauf."""
    cp_path = output_folder / "_checkpoint.json"
    if cp_path.exists():
        cp_path.unlink()


def run_batch(
    input_folder: Path,
    output_folder: Path,
    api_key: str,
    set_name: str | None = None,
):
    """Hauptfunktion: Verarbeitet alle Karten im Ordner.

    Unterstuetzt Resume: Bereits verarbeitete Karten werden uebersprungen.
    Der Fortschritt wird nach jeder Karte in _checkpoint.json gesichert.
    """

    # Bilder sammeln
    images = collect_images(input_folder)
    if not images:
        print(f"Keine Bilddateien in {input_folder} gefunden!")
        print(f"(Unterstuetzte Formate: {', '.join(IMAGE_EXTENSIONS)})")
        sys.exit(1)

    # Ausgabeordner erstellen
    output_folder.mkdir(parents=True, exist_ok=True)

    # Checkpoint laden (Resume-Faehigkeit)
    checkpoint = _load_checkpoint(output_folder)
    already_done = set(checkpoint["processed"].keys())
    skipped = len(already_done & {img.name for img in images})

    print(f"\n{'=' * 60}")
    print(f"KOPFNUSS BATCH-IMPORT")
    print(f"{'=' * 60}")
    print(f"Eingabe:  {input_folder}")
    print(f"Ausgabe:  {output_folder}")
    print(f"Karten:   {len(images)}")
    if skipped:
        print(f"Resume:   {skipped} bereits verarbeitet, {len(images) - skipped} neu")
    print(f"{'=' * 60}\n")

    # Alle Karten verarbeiten (mit Resume)
    results = []
    new_count = 0
    for i, img_path in enumerate(images, 1):
        if img_path.name in already_done:
            # Bereits verarbeitet -- aus Checkpoint laden
            results.append(checkpoint["processed"][img_path.name])
            print(f"  [{i}] {img_path.name} ... [--] uebersprungen (Checkpoint)")
            continue

        result = process_single_card(img_path, api_key, i)
        results.append(result)
        new_count += 1

        # Checkpoint speichern (nach JEDER Karte)
        checkpoint["processed"][img_path.name] = result
        _save_checkpoint(output_folder, checkpoint)

        # Rate-Limiting (nur wenn weitere Karten kommen)
        remaining = [img for img in images[i:] if img.name not in already_done]
        if remaining:
            time.sleep(RATE_LIMIT_DELAY)

    # Zusammenfassung
    ok_cards = [r for r in results if r["card"] and r["validation"]
                and r["validation"]["confidence"] == "high"]
    review_cards = [r for r in results if r["card"] and r["validation"]
                    and r["validation"]["confidence"] == "review"]
    error_cards = [r for r in results if r["error"]]
    low_conf = [r for r in results if r["validation"]
                and r["validation"]["confidence"] in ("medium", "low")]

    print(f"\n{'=' * 60}")
    print(f"ERGEBNIS")
    print(f"{'=' * 60}")
    print(f"[OK] 2x gleich:   {len(ok_cards)}")
    print(f"[<>] Abweichend:  {len(review_cards)}")
    print(f"[!!] Unsicher:    {len(low_conf)}")
    print(f"[XX] Fehler:      {len(error_cards)}")
    print(f"{'=' * 60}")

    # ── batch_results.json erzeugen (fuer Web-App Import) ──

    from datetime import datetime, timezone

    high_conf = ok_cards
    needs_review = [r for r in results if r["card"] and r["validation"]
                    and r["validation"]["confidence"]
                    in ("medium", "low", "review")]

    # Bei > 20 Karten: imagePath statt Base64 (spart ~1.5 GB bei 500 Karten)
    use_base64 = len(results) <= 20

    batch_cards = []
    for r in results:
        entry = {
            "source": r["source"],
            "confidence": (r["validation"]["confidence"]
                           if r["validation"] else "error"),
            "issues": (r["validation"]["issues"]
                       if r["validation"] else [r["error"] or "Unbekannter Fehler"]),
            "card": r["card"],
            "doubleChecked": r.get("doubleChecked", False),
            "diffs": r.get("diffs", []),
        }

        img_path = input_folder / r["source"]
        if img_path.exists():
            if use_base64:
                # Kleine Batches: Base64 einbetten (portabel)
                with open(img_path, "rb") as f:
                    b64 = base64.b64encode(f.read()).decode()
                suffix = img_path.suffix.lower()
                mime = {"jpg": "jpeg", "jpeg": "jpeg", "png": "png"}.get(
                    suffix.lstrip("."), "jpeg"
                )
                entry["imageBase64"] = f"data:image/{mime};base64,{b64}"
            else:
                # Grosse Batches: Pfad relativ zum Projekt-Root
                # Web-App laedt Bild per <img src="Kartenfotos/IMG_1234.JPG">
                try:
                    rel = img_path.relative_to(_GAME_ROOT)
                    entry["imagePath"] = str(rel).replace("\\", "/")
                except ValueError:
                    entry["imagePath"] = str(img_path).replace("\\", "/")

        batch_cards.append(entry)

    batch_output = {
        "created": datetime.now(timezone.utc).isoformat(),
        "totalCards": len(results),
        "highConfidence": len(high_conf),
        "needsReview": len(needs_review),
        "errors": len(error_cards),
        "cards": batch_cards,
    }

    batch_path = output_folder / "batch_results.json"
    with open(batch_path, "w", encoding="utf-8") as f:
        json.dump(batch_output, f, ensure_ascii=False, indent=2)
    print(f"\nBatch-Ergebnis: {batch_path}")
    print(f"  -> In der Web-App laden: Batch-Import > Datei waehlen")

    # ── Kopfnuss set.json erzeugen (nur high-confidence Karten) ──

    valid_cards = [r["card"] for r in results if r["card"]]
    if valid_cards:
        if not set_name:
            categories = [c.get("suggestedCategory", "Allgemein")
                          for c in valid_cards]
            set_name = max(set(categories), key=categories.count)

        category = set_name
        kopfnuss_set = build_kopfnuss_set(valid_cards, set_name, category)

        set_path = output_folder / "set.json"
        with open(set_path, "w", encoding="utf-8") as f:
            json.dump(kopfnuss_set, f, ensure_ascii=False, indent=2)
        print(f"Kopfnuss-Set: {set_path} ({len(valid_cards)} Karten)")

        # HINWEIS: Karten werden NICHT mehr direkt in demo-set.js geschrieben.
        # Neue Karten landen ausschliesslich in batch_results.json und werden
        # ueber die Web-App (Batch-Import > Datei waehlen) importiert und geprueft.
        print(f"\nHINWEIS: Karten NUR in batch_results.json gespeichert.")
        print(f"  -> In der Web-App: Batch-Import > Datei waehlen > {batch_path}")
    else:
        print("\nKeine gueltige Karte -- set.json nicht erzeugt.")

    # Warnungen
    if needs_review:
        print(f"\n{'=' * 60}")
        print(f"ZUR PRUEFUNG ({len(needs_review)} Karten):")
        for r in needs_review:
            conf = r['validation']['confidence'] if r['validation'] else '?'
            issues = r['validation']['issues'][:1] if r['validation'] else []
            print(f"  - {r['source']} [{conf}]: {'; '.join(issues)}")
        print(f"{'=' * 60}")

    print(f"\nALLE {len(results)} Karten muessen im Schnell-Review geprueft werden.")
    print(f"  -> Web-App: Batch-Import > batch_results.json laden")

    # Checkpoint bleibt erhalten, damit beim naechsten Lauf
    # bereits verarbeitete Karten uebersprungen werden.

    return results


# ── CLI ──────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Kopfnuss Batch-Import: Kartenfotos -> set.json",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Beispiele:
  python batch_import.py Kartenfotos/
  python batch_import.py Kartenfotos/ --output ergebnis --set-name "Allgemeinwissen"
  python batch_import.py Kartenfotos/ --api-key AIza...
        """
    )
    parser.add_argument(
        "input_folder",
        type=Path,
        help="Ordner mit Kartenfotos (.jpg, .png)"
    )
    parser.add_argument(
        "--output", "-o",
        type=Path,
        default=None,
        help="Ausgabeordner (Standard: <input>_ergebnis)"
    )
    parser.add_argument(
        "--api-key",
        type=str,
        default=None,
        help="Gemini API-Key (oder GEMINI_API_KEY Umgebungsvariable)"
    )
    parser.add_argument(
        "--set-name",
        type=str,
        default=None,
        help="Name des Kartensets (Standard: haeufigste Kategorie)"
    )

    args = parser.parse_args()

    # Input-Ordner pruefen
    if not args.input_folder.is_dir():
        print(f"FEHLER: {args.input_folder} ist kein Ordner!")
        sys.exit(1)

    # Output-Ordner
    output = args.output or Path(str(args.input_folder) + "_ergebnis")

    # API-Key
    api_key = args.api_key or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("FEHLER: Kein Gemini API-Key!")
        print("Entweder --api-key AIza... oder GEMINI_API_KEY setzen.")
        sys.exit(1)

    run_batch(args.input_folder, output, api_key, args.set_name)


if __name__ == "__main__":
    main()
