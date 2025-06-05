/**
 * CfgWordGenerator.js
 * ===================
 * Μη‑αναδρομική (BFS) γεννήτρια λέξεων για context‑free grammars.
 * 
 * ➤ Προσφέρει τη μέθοδο `generateWord(targetLength)` που επιστρέφει
 *    • μία ΝΕΑ (μη διπλότυπη) λέξη ακριβώς `targetLength` τερματικών, ή
 *    • `null` αν η CFG δεν παράγει καμία τέτοια λέξη.
 * 
 * ➤ Χρησιμοποιεί Breadth‑First Search ώστε να αποφεύγει stack overflows.
 *    Κλαδεύει τα μονοπάτια με βάση το ελάχιστο δυνατό μήκος τους, έτσι
 *    χειρίζεται σωστά παραγωγές ε (κενή λέξη).
 * 
 * Αναμένει αντικείμενο `cfg` της υπάρχουσας εφαρμογής:
 *   cfg.rules[0].varLetter  → start symbol (π.χ. 'S')
 *   cfg.cfgObj              → { 'S': ['ε', '0S1', ...], ... }
 *   window.EMPTY_STRING     → σταθερά για το "ε".
 */

export class CfgWordGenerator {
  constructor(cfg) {
    this.cfg = cfg;
    this.cfgObj = cfg.cfgObj;
    // Για να μην επιστρέφουμε ξανά την ίδια λέξη
    this.generatedWords = new Set();
  }

  /** ***************  private helpers  **************** */

  // true αν το string περιέχει μόνο τερματικά
  #isTerminal(word) {
    return !/[A-Z]/.test(word);
  }

  /*
   * Κατώτερο φράγμα μήκους που μπορεί να φτάσει το word, 
   * θεωρώντας ότι κάθε non‑terminal χωρίς παραγωγή ε
   * θα συνεισφέρει τουλάχιστον έναν χαρακτήρα.
   */
  #minPossibleLength(word) {
    const cfg = this.cfgObj;
    let min = 0;
    for (const ch of word) {
      if (cfg[ch]) {
        // non‑terminal
        if (!cfg[ch].includes(window.EMPTY_STRING)) {
          min += 1; // δεν μπορεί να εξαφανιστεί τελείως
        }
      } else {
        // terminal
        min += 1;
      }
    }
    return min;
  }

  /** *************************************************** */

  /**
   * Παράγει μία (νέα) λέξη μήκους `targetLength`·
   * επιστρέφει null όταν δεν υπάρχει καμία.
   */
  generateWord(targetLength) {
    const cfg = this.cfgObj;

    // BFS ουρά
    const queue = [this.cfg.rules[0].varLetter];
    const visited = new Set(queue);

    while (queue.length) {
      const current = queue.shift();

      // pruning: αν το ελάχιστο δυνατό μήκος ξεπερνά το ζητούμενο => skip
      if (this.#minPossibleLength(current) > targetLength) continue;

      // Πλήρως τερματικό string
      if (this.#isTerminal(current)) {
        if (current.length === targetLength && !this.generatedWords.has(current)) {
          this.generatedWords.add(current);
          return current;
        }
        // διαφορετικό μήκος ή ήδη παρήχθη — συνεχίζουμε
        continue;
      }

      /*
       * Επέκταση: βρίσκουμε το ΠΡΩΤΟ non‑terminal και δοκιμάζουμε
       * όλες τις παραγωγές του.
       */
      for (let i = 0; i < current.length; i++) {
        const symbol = current[i];
        const productions = cfg[symbol];
        if (!productions) continue; // terminal χαρακτήρας

        for (const prod of productions) {
          const replacement = prod === window.EMPTY_STRING ? "" : prod;
          const next = current.slice(0, i) + replacement + current.slice(i + 1);

          if (!visited.has(next)) {
            visited.add(next);
            queue.push(next);
          }
        }
        break; // Επεκτείνουμε μόνο το ΠΡΩΤΟ non‑terminal σε αυτό το βήμα BFS
      }
    }

    // Δεν βρέθηκε καμία λέξη κατάλληλου μήκους
    return null;
  }

  /**  Καθαρίζει το ιστορικό για νέο session  */
  reset() {
    this.generatedWords.clear();
  }
}
