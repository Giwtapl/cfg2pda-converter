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
   ------------------------------------------------------------- */
  canGenerateLength(targetLength) {
    const V = Object.keys(this.cfgObj);
    const lenSets = Object.fromEntries(V.map(N => [N, new Set()]));

    let changed = true;
    while (changed) {
      changed = false;
      for (const [lhs, rhss] of Object.entries(this.cfgObj)) {
        for (const rhs of rhss) {
          // 1️⃣ Παραγωγή ε
          if (rhs === this.EMPTY) {
            if (!lenSets[lhs].has(0)) {
              lenSets[lhs].add(0);
              changed = true;
            }
            continue;
          }

          // 2️⃣ Υπολογισμός terminals/variables
          let termLen = 0;
          const vars = [];
          for (const ch of rhs) {
            if (/[A-Z]/.test(ch)) {
              vars.push(ch);
            } else {
              termLen += 1;
            }
          }
          const remaining = targetLength - termLen;
          if (remaining < 0) continue;   // ξεπερνά ήδη το target

          // Cartesian sum των μηκών των μεταβλητών (μέχρι targetLength)
          let frontier = [0];
          for (const v of vars) {
            const next = [];
            for (const base of frontier) {
              for (const lv of lenSets[v]) {
                const total = base + lv;
                if (total <= remaining) next.push(total);
              }
            }
            if (!next.length) { frontier = []; break; }  // dead end
            frontier = [...new Set(next)];
          }
          for (const add of frontier) {
            const tot = termLen + add;
            if (!lenSets[lhs].has(tot)) {
              lenSets[lhs].add(tot);
              changed = true;
            }
          }
        }
      }
    }
    return lenSets[this.cfg.rules[0].varLetter].has(targetLength);
  }

  /* -------------------------------------------------------------
   |  Κύρια ρουτίνα BFS                                             |
   ------------------------------------------------------------- */
  generateWord(targetLength, maxNodes = 50_000) {
    // ✔️ Γρήγορος αποκλεισμός
    if (!this.canGenerateLength(targetLength)) return null;

    const startSym = this.cfg.rules[0].varLetter;
    const queue = [startSym];
    const visited = new Set(queue);
    let nodes = 0;

    while (queue.length) {
      const current = queue.shift();
      if (++nodes > maxNodes) return null; // safety‑valve

      const minLen = this.minPossibleLength(current);
      if (minLen > targetLength) continue;   // δεν μπορεί ποτέ να μικρύνει αρκετά

      if (CfgWordGenerator.isTerminal(current)) {
        if (current.length === targetLength && !this.generatedWords.has(current)) {
          this.generatedWords.add(current);
          return current;
        }
        continue;    // λάθος μήκος ή διπλότυπο
      }

      // Επέκταση του ΠΡΩΤΟΥ μη‑τερματικού (αρκεί για BFS)
      for (let i = 0; i < current.length; i++) {
        const symbol = current[i];
        const prods = this.cfgObj[symbol];
        if (!prods) continue;

        for (const prod of prods) {
          const repl = prod === this.EMPTY ? "" : prod;
          const next = current.slice(0, i) + repl + current.slice(i + 1);

          // Μικρό «ταβάνι» στο μήκος ώστε να μη φουσκώνει άσκοπα
          if (!visited.has(next) && next.length <= targetLength * 2 + 2) {
            visited.add(next);
            queue.push(next);
          }
        }
        break; // only first NT
      }
    }

    return null; // δεν βρέθηκε (το DP λέει ψέματα μόνο αν ξεπεράσαμε maxNodes)
  }

  reset() { this.generatedWords.clear(); }
}
