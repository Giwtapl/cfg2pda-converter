// src/components/earley/EarleyParser.js
//
// Earley parser w/ backpointers for CFGs of the app (A–Z nonterminals, single‑char terminals, ε).
// API:
//   const ep = new EarleyParser(window.inputHandler.cfg);
//   const res = ep.parse(inputString, { buildForest: true, debug: false });
//   res => { accepted, chart, furthestIndex, startSymbol, startAug, itemsCount }
//
// Notes:
// - No BFS over derivations; no length-DP prefilters.
// - Backpointers are stored so that a later EarleyForest can extract one derivation
//   and also map it to PDA transitions.
// - Lots of console logs if window.DEBUG_LOGS or opts.debug.
//
// Copyright (c) CFG2nPDA

export class EarleyParser {
  constructor(cfg) {
    this.cfg = cfg;                   // wrapper (entities/cfg.js)
    this.cfgObj = cfg.cfgObj;         // { A: ["aB", "ε", ...], ... }
    this.EMPTY = window.EMPTY_STRING; // 'ε'
    this.START = window.STARTING_VAR; // 'S'

    // Pre-normalise grammar: strings -> arrays of symbols; ε -> []
    this.grammar = this._normaliseGrammar(this.cfgObj);
  }

  /* ================================
   * Public API
   * ==============================*/
  parse(input, opts = { buildForest: true, debug: false }) {
    const debug = !!opts.debug || (typeof window !== "undefined" && window.DEBUG_LOGS);
    const log   = (...a) => { if (debug) console.log("[Earley]", ...a); };

    const tokens = this._tokenise(input);          // array of single‑char terminals
    const n = tokens.length;

    // Augment grammar with S' -> S
    const START_AUG = "S'";                        // safe (not uppercase A–Z)
    const chart = Array.from({ length: n + 1 }, () => new EarleySet());
    const items = [];                              // storage (id -> item)
    let nextId = 0;

    const makeItem = (lhs, rhs, dot, start, via = null) => {
      const item = { id: nextId++, lhs, rhs, dot, start, back: [] };
      if (via) item.back.push(via);
      return item;
    };

    // Seed item: S' -> • S, 0
    const seed = makeItem(START_AUG, [this.START], 0, 0);
    chart[0].add(seed);

    // Also expose productions for START_AUG
    const G = { ...this.grammar, [START_AUG]: [[this.START]] };

    // Process each position i
    for (let i = 0; i <= n; i++) {
      log(`=== position i=${i} ===`);
      const S = chart[i];     // current Earley set
      // closure over S with a classic agenda
      for (let p = 0; p < S.items.length; p++) {
        const it = S.items[p];
        if (!it) continue;
        if (!this._isComplete(it)) {
          const X = it.rhs[it.dot];
          if (this._isNonTerminal(X)) {
            // Predictor
            const prods = G[X] || [];
            for (const rhs of prods) {
              const predicted = makeItem(X, rhs, 0, i);
              const existed = chart[i].add(predicted);
              if (!existed && debug) log("predict", this._pp(predicted));
              // ε‑παραγωγές (rhs.length===0) θα ολοκληρωθούν από τον completer στη συνέχεια
            }
          } else {
            // Scanner
            if (i < n && X === tokens[i]) {
              const advanced = makeItem(it.lhs, it.rhs, it.dot + 1, it.start, {
                type: "scan",
                prev: it.id,
                ch: tokens[i],
                at: i
              });
              const existed = chart[i + 1].add(advanced);
              if (!existed && debug) log("scan", this._pp(advanced));
            }
          }
        } else {
          // Completer
          // For each item J in chart[it.start] with next symbol = it.lhs, advance it into chart[i]
          const lookingFor = it.lhs;
          const fromSet = chart[it.start];
          for (const prev of fromSet.items) {
            if (!prev) continue;
            if (!this._isComplete(prev) && prev.rhs[prev.dot] === lookingFor) {
              const advanced = makeItem(prev.lhs, prev.rhs, prev.dot + 1, prev.start, {
                type: "complete",
                left: prev.id,        // the item waiting for lookingFor
                right: it.id,         // the completed [lookingFor]
                at: i
              });
              const existed = chart[i].add(advanced);
              if (!existed && debug) log("complete", this._pp(advanced));
            }
          }
        }
      }
    }

    // Compute acceptance: S' -> S • in chart[n], start=0
    const acceptedItem = chart[n].find(START_AUG, [this.START], 1, 0);
    const accepted = !!acceptedItem;

    // Gather some stats + copy out all items for external forest building
    let itemsCount = 0;
    let furthestIndex = 0;
    for (let i = 0; i <= n; i++) {
      itemsCount += chart[i].items.length;
      // Heuristic furthest: if we have any item with dot>0 (i.e., progress), count i
      if (chart[i].items.some(x => x.dot > 0)) furthestIndex = i;
    }

    // Attach contiguous storage (ids stable) so a forest builder can walk pointers
    for (let i = 0; i <= n; i++) {
      for (const it of chart[i].items) {
        items[it.id] = it;
      }
    }

    log("done", { accepted, nItems: itemsCount, furthestIndex });

    return {
      accepted,
      chart: chart.map(es => es.items),   // array<array<Item>>
      items,                              // id -> Item
      furthestIndex,
      startSymbol: this.START,
      startAug: START_AUG,
    };
  }

  /* ================================
   * Helpers
   * ==============================*/
  _normaliseGrammar(cfgObj) {
    // turn "aB" -> ["a","B"]; "ε" -> []
    const out = {};
    for (const [lhs, rhss] of Object.entries(cfgObj)) {
      out[lhs] = rhss.map(rhs => (rhs === this.EMPTY ? [] : rhs.split("")));
    }
    return out;
  }

  _tokenise(str) {
    // Input in this app is single‑char terminals, ε is empty word ( => empty token array )
    if (!str) return [];
    return str.split("");
  }

  _isNonTerminal(sym) {
    return typeof sym === "string" && /^[A-Z]$/.test(sym);
  }

  _isComplete(item) {
    return item.dot >= item.rhs.length;
  }

  _pp(item) {
    const pre  = item.rhs.slice(0, item.dot).join("") || "•";
    const post = item.rhs.slice(item.dot).join("")     || "•";
    return `${item.lhs} → ${pre} · ${post} , ${item.start}`;
  }
}

/* ===========================================================
 * An Earley "set" with de‑duplication by (lhs,rhs,dot,start).
 * Also merges backpointers if identical items get re‑derived.
 * ===========================================================*/
class EarleySet {
  constructor() {
    this.map = new Map();   // key -> item
    this.items = [];        // stable insertion order
  }

  keyOf(lhs, rhsArr, dot, start) {
    // rhs as a compact string; ε as ""
    return `${lhs}#${rhsArr.join("")}#${dot}#${start}`;
  }

  add(item) {
    const k = this.keyOf(item.lhs, item.rhs, item.dot, item.start);
    const found = this.map.get(k);
    if (found) {
      // merge backpointers if any new
      if (item.back && item.back.length) found.back.push(...item.back);
      return true; // existed
    }
    this.map.set(k, item);
    this.items.push(item);
    return false; // new
  }

  find(lhs, rhsArr, dot, start) {
    return this.map.get(this.keyOf(lhs, rhsArr, dot, start)) || null;
  }
}
