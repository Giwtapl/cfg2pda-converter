// src/components/PdaSimulation.js
//
// Earley‑based PDA simulation (no BFS, no DP).
// - Παίρνουμε από EarleyForest ένα μονοπάτι expand/scan/accept
// - Το χαρτογραφούμε σε πραγματικά PDA edges (Qloop self-loop κ.λπ.)
// - Προσθέτουμε guard (Qo→Qloop με S$) και τελική (Qloop→Qaccept με $)
// - Προβάλλουμε βήμα‑βήμα με Next, με στοίβα και pointer στη λέξη.
//
// Απαιτεί: EarleyParser.js, EarleyForest.js, tools.js

import { isGreek, displayMessage } from "../utilities/tools.js";
import { EarleyParser } from "./earley/EarleyParser.js";
import { EarleyForest } from "./earley/EarleyForest.js";

export class PdaSimulation {
  constructor(pdaTransitions) {
    /* ---- PDA graph edges (from pda.js) ---- */
    this.pdaTransitions = pdaTransitions;

    /* ---- Simulation state ---- */
    this.currentState = "Qo";
    this.stack = [];
    this.inputWord = "";
    this.currentInputIndex = 0;
    this.isAccepted = false;
    this.isRejected = false;

    this.transitionPath = [];   // array of {fromState,toState,input,stackTop,stackPush,transitionId}
    this.transitionIndex = 0;

    /* ---- Visual tracking ---- */
    this.previousState = null;
    this.previousTransition = null;
    this.previousLabel = null;

    /* ---- DOM ---- */
    this.stackContainer = document.getElementById("stack-container");
    this.wordContainer  = document.getElementById("word-container");
    this.nextStepButton = document.getElementById("next-step");
    this.testPdaButton  = document.getElementById("btn-testpda");
    this.restartTestButton = document.getElementById("restart-test-button");

    /* ---- Events ---- */
    this.testPdaButton.addEventListener("click", () => {
      this.stackContainer.classList.remove("hidden");
      this.wordContainer.scrollIntoView({ behavior: "smooth", block: "nearest" });
      this.startPdaTest();
    });
    this.nextStepButton.addEventListener("click", () => this.nextPdaStep());
    this.restartTestButton.addEventListener("click", () => this.startPdaTest());
  }

  /* =====================================================
   *  START / RESET
   * ===================================================*/
  startPdaTest() {
    this.resetSimulation();

    const cfg = window.inputHandler.cfg;
    this.inputWord = document.getElementById("sharedWordInput").value.trim();

    // Έλεγχος αλφαβήτου (τερματικά πρέπει να ανήκουν στη CFG)
    const wordTerminals = [...new Set(this.inputWord.split(""))].filter(ch => !/[A-Z]/.test(ch));
    const cfgTerminals  = cfg.getTerminals();
    const invalidChars  = wordTerminals.filter(t => !cfgTerminals.includes(t));
    if (invalidChars.length > 0) {
      if (isGreek()) {
        displayMessage(`Η λέξη '${this.inputWord || "ε"}' περιέχει μη έγκυρα σύμβολα ('${invalidChars}').`, false, "pda");
      } else {
        displayMessage(`The string '${this.inputWord || "ε"}' contains invalid symbols ('${invalidChars}').`, false, "pda");
      }
      return;
    }

    // === Earley ===
    const parser = new EarleyParser(cfg);
    const debug  = typeof window !== "undefined" && window.DEBUG_LOGS;
    if (debug) {
      console.log("=== Earley PDA test ===");
      console.log("Input:", this.inputWord === "" ? "ε" : this.inputWord);
      console.log("CFG:", cfg.toObject());
    }
    const res = parser.parse(this.inputWord, { buildForest: true, debug });

    if (!res.accepted) {
      // Rejected: θα δείξουμε σαφές μήνυμα (χωρίς “Next”).
      const at = res.furthestIndex ?? 0;
      const msg = isGreek()
        ? `Η λέξη '${this.inputWord || "ε"}' ΔΕΝ αναγνωρίζεται από το αντίστοιχο nPDA. (Μέγιστο ταιριασμένο prefix: ${at} σύμβολ${at===1?"ο":"α"})`
        : `The string '${this.inputWord || "ε"}' is NOT recognised by the nPDA. (Furthest matched prefix: ${at} symbol${at===1?"":"s"})`;
      displayMessage(msg, false, "pda");

      // Ενημέρωση visuals
      this.displayWord();
      this.displayStack();             // κενή στοίβα
      this.highlightState("Qloop");    // θα μπούμε στο Qloop με το πρώτο βήμα, αλλά δεν δείχνουμε μονοπάτι
      this.nextStepButton.style.display = "none";
      this.restartTestButton.style.display = "block";
      this.isRejected = true;
      return;
    }

    // Accepted: ανασύνθεση διαδρομής από EarleyForest
    const forest = new EarleyForest(res, { debug });
    const earleyPath = forest.toPdaTransitions(this.inputWord);
    // earleyPath: [{kind:'expand'|'scan'|'accept', input, pop, push, pos, note}, ...]

    // Map σε πραγματικά edges για σωστό highlighting
    this.transitionPath = this._mapEarleyPathToGraph(earleyPath, window.STARTING_VAR);

    // Μηνύματα & visuals
    displayMessage(
      isGreek()
        ? `Η δοσμένη λέξη αναγνωρίζεται από το nPDA. Πατήστε “Next” για να δείτε τα βήματα.`
        : `The string is recognised by the nPDA. Click “Next” to step through the transitions.`,
      true,
      "pda"
    );

    this.displayWord();
    this.displayStack();
    this.highlightState(this.currentState);
    this.nextStepButton.style.display = "block";
    this.restartTestButton.style.display = "block";
    this.isAccepted = true;
  }

  resetSimulation() {
    this.currentState = "Qo";
    this.stack = [];
    this.currentInputIndex = 0;
    this.transitionPath = [];
    this.transitionIndex = 0;
    this.isAccepted = false;
    this.isRejected = false;
    this.resetAllHighlighting();
    this.clearMessage();
    this.stackContainer.classList.remove("accepted", "rejected");
  }

  /* =====================================================
   *  EARLEY → PDA GRAPH MAPPING
   * ===================================================*/
  _mapEarleyPathToGraph(earleyPath, startSym) {
    const EMPTY = window.EMPTY_STRING;
    const GUARD = window.SPECIAL_CHAR;

    const out = [];

    // 1) Guard: Qo --ε, ε→S$--> Qloop  (ώστε S να βρεθεί πάνω από $)
    const qoToLoop = this.pdaTransitions.find(e => e.fromState === "Qo" && e.toState === "Qloop");
    out.push({
      fromState   : "Qo",
      toState     : "Qloop",
      input       : EMPTY,
      stackTop    : EMPTY,
      stackPush   : `${startSym}${GUARD}`,
      transitionId: qoToLoop ? qoToLoop.transitionId : null
    });

    // 2) Για κάθε βήμα Earley, βρες το αντίστοιχο Qloop self‑loop edge
    for (const step of earleyPath) {
      if (step.kind === "accept") {
        // θα προστεθεί ως (3) παρακάτω
        continue;
      }

      const input = step.kind === "scan" ? step.input : EMPTY; // scan:'a' , expand:'ε'
      const pop   = step.pop;                                  // terminal ή nonterminal
      const push  = step.kind === "expand" ? (step.push || EMPTY) : EMPTY; // expand: RHS, scan: ε

      const edge = this.pdaTransitions.find(e =>
        e.fromState === "Qloop" && e.toState === "Qloop" &&
        e.input === (input || EMPTY) &&
        e.stackTop === (pop   || EMPTY) &&
        e.stackPush === (push || EMPTY)
      );

      out.push({
        fromState   : "Qloop",
        toState     : "Qloop",
        input       : input || EMPTY,
        stackTop    : pop   || EMPTY,
        stackPush   : push  || EMPTY,
        transitionId: edge ? edge.transitionId : null
      });
    }

    // 3) Τελική κατανάλωση guard: Qloop --ε,$→ε--> Qaccept
    const loopToAcc = this.pdaTransitions.find(e => e.fromState === "Qloop" && e.toState === "Qaccept");
    out.push({
      fromState   : "Qloop",
      toState     : "Qaccept",
      input       : EMPTY,
      stackTop    : GUARD,
      stackPush   : EMPTY,
      transitionId: loopToAcc ? loopToAcc.transitionId : null
    });

    return out;
  }

  /* =====================================================
   *  STEP‑BY‑STEP EXECUTION
   * ===================================================*/
  nextPdaStep() {
    // reset previous highlighting
    this.resetHighlighting();

    const t = this.transitionPath[this.transitionIndex];
    if (!t) return;

    // Visualise edge/label
    this.highlightTransition(t);

    // Stack ops
    if (t.stackTop !== window.EMPTY_STRING) this.stack.pop();
    if (t.stackPush !== window.EMPTY_STRING) {
      const syms = t.stackPush.split("").reverse(); // push reverse so last becomes top
      this.stack.push(...syms);
    }

    // Input pointer
    if (t.input !== window.EMPTY_STRING) this.currentInputIndex++;

    // Update state
    this.currentState = t.toState;

    // Visuals
    this.displayStack();
    this.updateWordVisualization();
    this.highlightState(t.toState);

    this.transitionIndex++;

    if (this.transitionIndex >= this.transitionPath.length) {
      this.nextStepButton.style.display = "none";
      // Καθάρισε προτρεπτικές φράσεις από το μήνυμα
      const msgEl = document.getElementById("pda-message");
      if (msgEl) {
        const spanEl = msgEl.firstElementChild;
        const rx = isGreek()
          ? /(\s?(Ακολουθήστε|Πατήστε)[^.]*\.)/gi
          : /(\s?(Follow|Click)[^.]*\.)/gi;
        spanEl.textContent = spanEl.textContent.replace(rx, "");
      }
      if (this.isRejected) {
        this.highlightState(this.currentState, "red");   // κόκκινο στο Qloop
      } else if (this.isAccepted) {
        this.highlightState("Qaccept", "green");         // πράσινο στο Qaccept
      }
    }
  }

  /* =====================================================
   *  VISUAL HELPERS
   * ===================================================*/
  highlightTransition(t, color = "#2861ff") {
    if (!t?.transitionId) return;
    const labelTxt = this.labelText(t);
    d3.select(`#${t.transitionId}`).selectAll("path, polygon").style("stroke", color);
    d3.select(`#${t.transitionId}`).selectAll("text").style("fill", function () {
      return d3.select(this).text() === labelTxt ? color : "black";
    });
    this.previousTransition = t.transitionId;
    this.previousLabel = labelTxt;
  }

  labelText(t) {
    const EMPTY = window.EMPTY_STRING;
    const i = t.input    === EMPTY ? "ε" : t.input;
    const s = t.stackTop === EMPTY ? "ε" : t.stackTop;
    const p = t.stackPush=== EMPTY ? "ε" : t.stackPush;
    return `${i}, ${s} → ${p}`;
  }

  highlightState(stateId, color = "#2861ff") {
    d3.select(`#${stateId}`).select("ellipse").style("fill", color);
    d3.select(`#${stateId}`).selectAll("text, tspan").style("fill", "white");
    this.previousState = stateId;
  }

  resetHighlighting() {
    if (this.previousState) {
      d3.select(`#${this.previousState}`).select("ellipse").style("fill", "white");
      d3.select(`#${this.previousState}`).selectAll("text, tspan").style("fill", "black");
    }
    if (this.previousTransition) {
      d3.select(`#${this.previousTransition}`).selectAll("path, polygon").style("stroke", "black");
    }
    if (this.previousTransition && this.previousLabel) {
      d3.select(`#${this.previousTransition}`)
        .selectAll("text")
        .filter((d, i, nodes) => d3.select(nodes[i]).text() === this.previousLabel)
        .style("fill", "black");
    }
  }

  resetAllHighlighting() {
    d3.selectAll(".node")
      .select("ellipse")
      .style("fill", "white")
      .style("stroke", "black");
    d3.selectAll(".node").selectAll("text, tspan").style("fill", "black");
    d3.selectAll(".edge").selectAll("path, polygon").style("stroke", "black");
    d3.selectAll(".edge").selectAll("text").style("fill", "black");
  }

  /* --- Stack and Word visuals --- */
  displayStack() {
    this.stackContainer.innerHTML = "";
    const lbl = document.createElement("p");
    lbl.classList.add("stack-label");
    lbl.textContent = isGreek() ? "Στοίβα:" : "Stack:";
    this.stackContainer.appendChild(lbl);
    this.stack.forEach(s => {
      const div = document.createElement("div");
      div.classList.add("stack-element", "fs-1");
      div.textContent = s;
      this.stackContainer.appendChild(div);
    });
  }

  displayWord() {
    this.wordContainer.innerHTML = "";
    for (let i = 0; i < this.inputWord.length; i++) {
      const span = document.createElement("span");
      span.classList.add("word-letter");
      if (i === this.currentInputIndex) span.classList.add("current-letter");
      span.textContent = this.inputWord[i];
      this.wordContainer.appendChild(span);
    }
  }

  updateWordVisualization() {
    const letters = document.querySelectorAll(".word-letter");
    letters.forEach((ltr, idx) => {
      if (idx === this.currentInputIndex) ltr.classList.add("current-letter");
      else ltr.classList.remove("current-letter");
    });
  }

  clearMessage() {
    const m = document.getElementById("pda-message");
    if (m) m.remove();
  }
}
