/**
 * CfgWordGenerator.js – BFS + Dynamic‑Programming word generator for CFGs
 * ----------------------------------------------------------------------
 * - Αποφεύγει τα stack‑overflows γιατί ΔΕΝ κάνει βαθιά αναδρομή
 * - Κάνει **προέλεγχο εφικτότητας** μήκους με δυναμικό προγραμματισμό· έτσι,
 *   για γραμματικές που παράγουν π.χ. μόνο άρτιες λέξεις, επιστρέφει αμέσως `null`
 *   όταν ζητηθεί περιττό μήκος, αντί να «κρεμάει».
 * - Επιστρέφει κάθε φορά **καινούργια** λέξη (Set `generatedWords`)
 *
 * Χρήση:
 *   const gen = new CfgWordGenerator(cfgInstance);
 *   const w = gen.generateWord(6);
 *
 * ----------------------------------------------------------------------*/

export class CfgWordGenerator {

  MAX_NODES = 500_000; // max nodes to explore in BFS

  constructor(cfg) {
    this.cfg = cfg;                 // wrapper που κρατά rules[] & cfgObj
    this.cfgObj = cfg.cfgObj;       // { NonTerminal: [productions...] }
    this.EMPTY = window.EMPTY_STRING;
    this.generatedWords = new Set();
  }

  /* -------------------------------------------------------------
   |  Βοηθητικά                                                       |
   ------------------------------------------------------------- */
  static isTerminal(word) {
    return !/[A-Z]/.test(word);
  }

  // Ελάχιστο δυνατό τελικό μήκος μιας μερικής λέξης (μετράει τα
  // terminals + μη‑τερματικά που **δεν** μπορούν να βγάλουν ε).
  minPossibleLength(word) {
    let min = 0;
    for (const ch of word) {
      if (/[A-Z]/.test(ch)) {
        if (!(this.cfgObj[ch]?.includes(this.EMPTY))) min += 1;
      } else {
        min += 1;
      }
    }
    return min;
  }

  /* -------------------------------------------------------------
   |  Προέλεγχος: μπορεί η CFG να δώσει λέξη μήκους targetLength;   |
   |  Δυναμικός προγραμματισμός μόνο στα ΜΗΚΗ — O(|V|·L²).         |
   |  Προστέθηκαν console logs.                                    |
   ------------------------------------------------------------- */
  canGenerateLength(targetLength, debug = false) {
    const logEnabled = debug || (typeof window !== "undefined" && window.DEBUG_LOGS);
    const log = (...args) => { if (logEnabled) console.log("[canGenerateLength]", ...args); };

    log("start", { targetLength });

    const V = Object.keys(this.cfgObj);
    const lenSets = Object.fromEntries(V.map(N => [N, new Set()]));

    let changed = true;
    let rounds = 0;
    let adds = 0;

    while (changed) {
      changed = false;
      rounds++;

      for (const [lhs, rhss] of Object.entries(this.cfgObj)) {
        for (const rhs of rhss) {
          // 1) ε-παραγωγή
          if (rhs === this.EMPTY) {
            if (!lenSets[lhs].has(0)) {
              lenSets[lhs].add(0);
              changed = true;
              adds++;
              log("ε-production discovered", `${lhs} → ε`);
            }
            continue;
          }

          // 2) terminals / variables split
          let termLen = 0;
          const vars = [];
          for (const ch of rhs) {
            if (/[A-Z]/.test(ch)) vars.push(ch);
            else termLen += 1;
          }

          const remaining = targetLength - termLen;
          if (remaining < 0) continue; // ήδη ξεπερνά το target

          // 3) Συνδυασμός μηκών για τις μεταβλητές (μέχρι remaining)
          let sums = [0]; // cartesian sum accumulator
          for (const v of vars) {
            const next = [];
            for (const base of sums) {
              for (const lv of lenSets[v]) {
                const tot = base + lv;
                if (tot <= remaining) next.push(tot);
              }
            }
            if (!next.length) { sums = []; break; }
            sums = Array.from(new Set(next));
          }

          // 4) Σπρώχνουμε νέα μήκη για το lhs
          for (const add of sums) {
            const tot = termLen + add;
            if (!lenSets[lhs].has(tot)) {
              lenSets[lhs].add(tot);
              changed = true;
              adds++;
              if (adds % 50 === 0) log(`progress: +${adds} lengths discovered so far`);
            }
          }
        }
      }

      log("round finished", { round: rounds });
    }

    const S = this.cfg.rules[0].varLetter;
    const ok = lenSets[S].has(targetLength);
    log("done", { ok, lengthsForS: Array.from(lenSets[S]).sort((a,b)=>a-b) });

    return ok;
  }

  /* -------------------------------------------------------------
   |  Κύρια ρουτίνα BFS για παραγωγή λέξης σταθερού μήκους          |
   |  Προστέθηκαν console logs.                                    |
   ------------------------------------------------------------- */
  generateWord(targetLength, maxNodes = this.MAX_NODES, debug = false) {
    const logEnabled = debug || (typeof window !== "undefined" && window.DEBUG_LOGS);
    const log = (...args) => { if (logEnabled) console.log("[generateWord]", ...args); };

    log("start", { targetLength, maxNodes });

    // Γρήγορος αποκλεισμός με DP
    if (!this.canGenerateLength(targetLength, debug)) {
      log("impossible length according to DP — abort");
      return null;
    }

    const startSym = this.cfg.rules[0].varLetter;
    const queue = [startSym];
    const visited = new Set(queue);
    let nodes = 0;

    while (queue.length) {
      const current = queue.shift();
      nodes++;
      if (nodes % 1000 === 0) log("progress", { nodes, queue: queue.length, current });

      const minLen = this.minPossibleLength(current);
      if (minLen > targetLength) {
        if (logEnabled) log("prune: minPossibleLength", { current, minLen });
        continue;
      }

      if (CfgWordGenerator.isTerminal(current)) {
        if (current.length === targetLength) {
          if (this.generatedWords.has(current)) {
            log("duplicate word (skipping)", current);
            continue;
          }
          this.generatedWords.add(current);
          log("FOUND", current, "after nodes", nodes);
          return current;
        }
        continue; // τερματική αλλά λάθος μήκος
      }

      // Επέκταση ΠΡΩΤΟΥ μη τερματικού
      for (let i = 0; i < current.length; i++) {
        const symbol = current[i];
        const prods = this.cfgObj[symbol];
        if (!prods) continue;

        for (const prod of prods) {
          const repl = (prod === this.EMPTY) ? "" : prod;
          const next = current.slice(0, i) + repl + current.slice(i + 1);

          // μικρό όριο για να μη φουσκώνει άσκοπα
          if (!visited.has(next) && next.length <= targetLength * 2 + 2) {
            visited.add(next);
            queue.push(next);
            if (logEnabled && queue.length % 2000 === 0) {
              log("enqueue", { from: current, symbol, prod, next, queue: queue.length });
            }
          }
        }
        break; // μόνο το αριστερότερο μη τερματικό
      }

      if (nodes > maxNodes) {
        log("safety-valve hit — abort", { nodes, maxNodes });
        break;
      }
    }

    // Δεν βρέθηκε νέα — αν υπάρχουν ήδη παραγόμενες του ίδιου μήκους, επέστρεψε μία
    const sameLen = Array.from(this.generatedWords).filter(w => w.length === targetLength);
    if (sameLen.length) {
      const pick = sameLen[Math.floor(Math.random() * sameLen.length)];
      log("no new word; returning an already generated of same length", pick);
      return pick;
    }

    log("no word found");
    return null;
  }

  // generateWord(targetLength, maxNodes = 50_000) {
  //   let w = START;                    // “S”
  //   while (/[A-Z]/.test(w)) {         // όσο υπάρχουν μεταβλητές
  //     const i = w.search(/[A-Z]/);    // αριστερότερη V
  //     const V = w[i];
  //     const restLen = L - (w.length   // τερματικά που έχουμε ήδη
  //                         - [...w].filter(c => /[A-Z]/.test(c)).length);
  //     // Φιλτράρουμε μόνο τις παραγωγές που *μπορούν* να φτάσουν το length
  //     const ok = CFG[V].filter(p => {
  //       const terminals = [...p].filter(c => !/[A-Z]/.test(c)).length;
  //       const need      = restLen - terminals;
  //       return splitIsPossible(p, need, lenSets);   // O(|p|·L)
  //     });
  //     const prod = ok[Math.floor(Math.random()*ok.length)]; // ή πάντα ok[0]
  //     w = w.slice(0,i) + (prod===ε?"":prod) + w.slice(i+1);
  //   }
  //   return w;      // πάντα Ο(L²) χρόνος / O(L) μνήμη
  // }

  reset() { this.generatedWords.clear(); }
}
