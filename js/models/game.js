/* ============================================
   Digital Smartbox -- Spiellogik (GameModel)
   Reine Zustandsmaschine, kein DOM-Zugriff.
   ============================================ */

/**
 * @typedef {'roundStart'|'turnActive'|'revealing'|'turnResult'|'showingResult'|'roundEnd'|'victory'} GamePhase
 *
 * @typedef {Object} Team
 * @property {string} id
 * @property {string} name
 * @property {string} color
 * @property {number} totalScore
 * @property {number} roundScore
 * @property {boolean} isActive  -- noch aktiv in der aktuellen Runde?
 */

export class GameModel {
  /**
   * @param {Object} config
   * @param {Array<{name: string, color: string}>} config.teams
   * @param {number} config.targetScore
   * @param {number|null} config.timerSeconds  -- null = kein Timer
   * @param {Object} config.cardSet  -- normalisiertes Kartenset
   */
  constructor({ teams, targetScore, timerSeconds, cardSet }) {
    // Konfiguration
    this.targetScore = targetScore;
    this.timerSeconds = timerSeconds;

    // Karten: Kopie mischen
    this._allCards = [...cardSet.cards];
    this._shuffleArray(this._allCards);
    this._cardIndex = 0;

    // Teams initialisieren
    this.teams = teams.map((t, i) => ({
      id: `team-${i}`,
      name: t.name,
      color: t.color,
      totalScore: 0,
      roundScore: 0,
      isActive: true
    }));

    // Spielzustand
    /** @type {GamePhase} */
    this.phase = 'roundStart';
    this._currentTeamIndex = 0;
    this._startTeamIndex = 0;
    this._roundNumber = 0;

    // Aktuelle Karte
    /** @type {Object|null} */
    this.currentCard = null;

    // Aufgedeckte Items in der aktuellen Runde
    /** @type {Set<string>} */
    this.revealedItems = new Set();

    // Aktuell aufgedecktes Item (waehrend Reveal)
    /** @type {Object|null} */
    this.revealingItem = null;

    // Ergebnis-Tracking pro aufgedecktem Item
    /** @type {Map<string, 'correct'|'wrong'>} */
    this.itemResults = new Map();

    // Gewinner
    /** @type {Team|null} */
    this.winner = null;

    // Callbacks fuer UI-Benachrichtigung
    /** @type {Function|null} */
    this.onStateChange = null;
  }

  // ── Getter ────────────────────────────────

  /** Aktives Team (das gerade am Zug ist) */
  get activeTeam() {
    return this.teams[this._currentTeamIndex] || null;
  }

  /** Alle noch aktiven Teams in der Runde */
  get activeTeams() {
    return this.teams.filter(t => t.isActive);
  }

  /** Anzahl aufgedeckter Items */
  get revealedCount() {
    return this.revealedItems.size;
  }

  /** Ob Karte uebersprungen werden kann (nur vor erstem Reveal) */
  get canSkipCard() {
    return this.phase === 'turnActive' && this.revealedItems.size === 0;
  }

  /** Ob das aktive Team passen kann (mindestens 1 Rundenpunkt) */
  get canPass() {
    const team = this.activeTeam;
    return this.phase === 'turnActive' && team && team.roundScore >= 1;
  }

  // ── Aktionen ──────────────────────────────

  /**
   * Neue Runde starten: Karte ziehen, alle Teams aktiv setzen.
   */
  startRound() {
    this._roundNumber++;

    // Alle Teams fuer die Runde aktivieren
    for (const team of this.teams) {
      team.isActive = true;
      team.roundScore = 0;
    }

    // Karte ziehen
    this.currentCard = this._drawCard();
    this.revealedItems.clear();
    this.itemResults.clear();
    this.revealingItem = null;

    // Startteam setzen
    this._currentTeamIndex = this._startTeamIndex;

    this.phase = 'turnActive';
    this._notify('roundStarted');
  }

  /**
   * Item auswaehlen (aufdecken starten).
   * @param {string} itemId
   */
  selectItem(itemId) {
    if (this.phase !== 'turnActive') {
      throw new Error(`selectItem nicht moeglich in Phase '${this.phase}'.`);
    }
    if (this.revealedItems.has(itemId)) {
      throw new Error(`Item '${itemId}' wurde bereits aufgedeckt.`);
    }

    const item = this.currentCard.items.find(i => i.id === itemId);
    if (!item) {
      throw new Error(`Item '${itemId}' nicht gefunden.`);
    }

    this.revealingItem = item;
    this.phase = 'revealing';
    this._notify('itemRevealing');
  }

  /**
   * Reveal-Animation ist fertig -- wechsle zu turnResult.
   * Wird vom UI aufgerufen nach der 2s Animation.
   */
  revealComplete() {
    if (this.phase !== 'revealing') return;

    this.revealedItems.add(this.revealingItem.id);
    this.phase = 'turnResult';
    this._notify('revealComplete');
  }

  /**
   * Antwort als richtig markieren.
   * Aendert nur den Zustand, OHNE automatisch zum naechsten Team zu wechseln.
   * Die UI muss danach advanceTurn() aufrufen (nach visuellem Feedback).
   */
  markCorrect() {
    if (this.phase !== 'turnResult') {
      throw new Error(`markCorrect nicht moeglich in Phase '${this.phase}'.`);
    }

    const team = this.activeTeam;
    team.roundScore += 1;
    this.itemResults.set(this.revealingItem.id, 'correct');
    this.revealingItem = null;

    // Pruefen: alle 10 Items aufgedeckt?
    if (this.revealedItems.size >= 10) {
      team.totalScore += team.roundScore;
      team.isActive = false;
    }

    // Phase: warte auf advanceTurn() von der UI
    this.phase = 'showingResult';
    this._notify('itemCorrect');
  }

  /**
   * Antwort als falsch markieren.
   * Aendert nur den Zustand, OHNE automatisch zum naechsten Team zu wechseln.
   * Die UI muss danach advanceTurn() aufrufen (nach visuellem Feedback).
   */
  markWrong() {
    if (this.phase !== 'turnResult') {
      throw new Error(`markWrong nicht moeglich in Phase '${this.phase}'.`);
    }

    const team = this.activeTeam;
    team.roundScore = 0;
    team.isActive = false;
    this.itemResults.set(this.revealingItem.id, 'wrong');
    this.revealingItem = null;

    // Phase: warte auf advanceTurn() von der UI
    this.phase = 'showingResult';
    this._notify('itemWrong');
  }

  /**
   * Zum naechsten Zug/Runde uebergehen.
   * Wird von der UI aufgerufen NACHDEM das Ergebnis angezeigt wurde.
   */
  advanceTurn() {
    if (this.phase !== 'showingResult') return;

    // Alle 10 Items aufgedeckt?
    if (this.revealedItems.size >= 10) {
      // Alle noch aktiven Teams bekommen ihre Rundenpunkte
      for (const team of this.teams) {
        if (team.isActive) {
          team.totalScore += team.roundScore;
          team.isActive = false;
        }
      }
      this._endRound();
      return;
    }

    // Noch aktive Teams?
    this._checkRoundEndOrAdvance();
  }

  /**
   * Team passt (nur moeglich ab roundScore >= 1).
   */
  pass() {
    if (this.phase !== 'turnActive') {
      throw new Error(`pass nicht moeglich in Phase '${this.phase}'.`);
    }

    const team = this.activeTeam;

    if (team.roundScore < 1) {
      throw new Error('Passen nur moeglich ab mindestens 1 Rundenpunkt.');
    }

    // Rundenpunkte sichern
    team.totalScore += team.roundScore;
    team.isActive = false;

    this._notify('teamPassed');

    // Siegpruefung
    if (team.totalScore >= this.targetScore) {
      this.winner = team;
      this.phase = 'victory';
      this._notify('victory');
      return;
    }

    this._checkRoundEndOrAdvance();
  }

  /**
   * Karte ueberspringen (nur vor dem ersten Reveal).
   */
  skipCard() {
    if (!this.canSkipCard) {
      throw new Error('Karte ueberspringen nur vor dem ersten Reveal moeglich.');
    }

    this.currentCard = this._drawCard();
    this.revealedItems.clear();
    this.itemResults.clear();
    this.revealingItem = null;

    this._notify('cardSkipped');
  }

  /**
   * Timer abgelaufen: Team wird automatisch rausgeworfen.
   */
  timerExpired() {
    if (this.phase !== 'turnActive') return;

    const team = this.activeTeam;
    team.roundScore = 0;
    team.isActive = false;

    this._notify('timerExpired');
    this._checkRoundEndOrAdvance();
  }

  // ── Interne Methoden ──────────────────────

  /**
   * Naechstes aktives Team finden und Zug starten.
   */
  _advanceToNextTeam() {
    const nextIndex = this._findNextActiveTeam();

    if (nextIndex === -1) {
      // Keine aktiven Teams mehr -> Rundenende
      this._endRound();
      return;
    }

    this._currentTeamIndex = nextIndex;
    this.phase = 'turnActive';
    this._notify('turnChanged');
  }

  /**
   * Pruefen ob die Runde enden soll oder zum naechsten Team wechseln.
   */
  _checkRoundEndOrAdvance() {
    // Alle 10 Items aufgedeckt?
    if (this.revealedItems.size >= 10) {
      // Alle noch aktiven Teams bekommen ihre Rundenpunkte
      for (const team of this.teams) {
        if (team.isActive) {
          team.totalScore += team.roundScore;
          team.isActive = false;
        }
      }
      this._endRound();
      return;
    }

    // Noch aktive Teams?
    const nextIndex = this._findNextActiveTeam();
    if (nextIndex === -1) {
      this._endRound();
      return;
    }

    this._currentTeamIndex = nextIndex;
    this.phase = 'turnActive';
    this._notify('turnChanged');
  }

  /**
   * Runde beenden.
   */
  _endRound() {
    // Siegpruefung: wer hat zuerst die Zielpunktzahl erreicht?
    // Reihenfolge: ab Startteam im Uhrzeigersinn
    for (let i = 0; i < this.teams.length; i++) {
      const idx = (this._startTeamIndex + i) % this.teams.length;
      const team = this.teams[idx];
      if (team.totalScore >= this.targetScore) {
        this.winner = team;
        this.phase = 'victory';
        this._notify('victory');
        return;
      }
    }

    // Kein Sieger: naechste Runde vorbereiten
    this._startTeamIndex = (this._startTeamIndex + 1) % this.teams.length;
    this.phase = 'roundEnd';
    this._notify('roundEnded');
  }

  /**
   * Index des naechsten aktiven Teams finden (im Uhrzeigersinn ab aktuellem).
   * @returns {number} -1 wenn kein aktives Team mehr
   */
  _findNextActiveTeam() {
    const len = this.teams.length;
    for (let offset = 1; offset <= len; offset++) {
      const idx = (this._currentTeamIndex + offset) % len;
      if (this.teams[idx].isActive) {
        return idx;
      }
    }
    return -1;
  }

  /**
   * Zufaellige ungespielte Karte ziehen.
   * @returns {Object}
   */
  _drawCard() {
    if (this._cardIndex >= this._allCards.length) {
      // Alle Karten gespielt: neu mischen
      this._shuffleArray(this._allCards);
      this._cardIndex = 0;
    }
    return this._allCards[this._cardIndex++];
  }

  /**
   * Fisher-Yates Shuffle.
   * @param {Array} arr
   */
  _shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  /**
   * State-Change Callback aufrufen.
   * @param {string} event
   */
  _notify(event) {
    if (this.onStateChange) {
      this.onStateChange(event, this);
    }
  }

  // ── Serialisierung (fuer Debug) ───────────

  /**
   * Aktuellen Zustand als lesbares Objekt zurueckgeben.
   */
  toJSON() {
    return {
      phase: this.phase,
      roundNumber: this._roundNumber,
      activeTeam: this.activeTeam?.name,
      teams: this.teams.map(t => ({
        name: t.name,
        totalScore: t.totalScore,
        roundScore: t.roundScore,
        isActive: t.isActive
      })),
      revealedCount: this.revealedItems.size,
      currentCard: this.currentCard?.prompt?.text,
      winner: this.winner?.name
    };
  }
}
