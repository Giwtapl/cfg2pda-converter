// src/components/earley/EarleyForest.js
//
// Ανακατασκευή μίας έγκυρης παραγωγής από το Earley chart (backpointers)
// και εξαγωγή (α) βημάτων παραγωγής για UI, (β) μονοπατιού PDA μεταβάσεων.
// Χωρίς BFS/DP.
//
// Χρήση:
//   const parser = new EarleyParser(window.inputHandler.cfg);
//   const res = parser.parse(word, { buildForest: true });
//   const forest = new EarleyForest(res, { debug: true });
//   const steps = forest.oneDerivationSteps(word);
//   const path  = forest.toPdaTransitions(word); // expand/scan/accept sequence
//
// Η κλάση επιλέγει "ένα" μονοπάτι όταν υπάρχει αμφισημία (το πρώτο διαθέσιμο).
// Μπορείς να αλλάξεις τη στρατηγική με το option selectPointer = (backs) => backs[0]

export class EarleyForest {
  constructor(parseResult, opts = {}) {
    this.res   = parseResult;
    this.items = parseResult.items;
    this.chart = parseResult.chart;
    this.start = parseResult.startSymbol;
    this.startAug = parseResult.startAug;
    this.debug = !!opts.debug || (typeof window !== "undefined" && window.DEBUG_LOGS) || hasLogQueryParam();
    this.selectPointer = typeof opts.selectPointer === "function"
      ? opts.selectPointer
      : (backs) => backs[0];

    this.log = (...a) => { if (this.debug) console.log("[EarleyForest]", ...a); };

    if (!this.res || !Array.isArray(this.chart)) {
      throw new Error("EarleyForest: invalid parse result");
    }
  }

  /* ----------------------------------------------------------
   * Δημιουργεί τα βήματα αριστερότερης παραγωγής:
   *  [{ step, rule, before, after }, ...]
   *  όπου rule = "A → α", before/after = εμπρόθετες μορφές (sentential forms)
   * ---------------------------------------------------------*/
  oneDerivationSteps(input) {
    if (!this.res.accepted) return [];
    const n = (input || "").length;

    const accItem = findAccepted(this.chart, this.startAug, this.start);
    if (!accItem) return [];

    // Το "S" ολοκληρωμένο είναι στο backpointer 'complete' του acceptedItem
    const bp = accItem.back && accItem.back.find(b => b.type === "complete");
    if (!bp) return [];

    const root = this._buildCompletedTree(bp.right, n); // subtree του S, ολοκληρωμένο στο n
    const expansions = this._collectExpansions(root);

    // Παράγουμε τις εμπρόθετες μορφές με αριστερότερη αντικατάσταση
    const steps = [];
    let sentential = this.start; // αρχικά "S"
    let i = 1;
    for (const e of expansions) {
      const before = sentential;
      const rhsStr = e.rhsSymbols.map(s => isNonTerminal(s) ? s : s).join(""); // terminals/nonterms όπως είναι
      sentential = replaceLeftmostNonterminal(sentential, e.lhs, rhsStr);
      steps.push({
        step: i++,
        rule: `${e.lhs} → ${rhsStr === "" ? "ε" : rhsStr}`,
        before,
        after: sentential
      });
    }

    this.log("oneDerivationSteps:", steps);
    return steps;
  }

  /* ----------------------------------------------------------
   * Παράγει ένα πλήρες transition path για το PDA:
   *  [
   *    { kind:'expand', input:'ε', pop:'A', push:'α', pos, note },
   *    { kind:'scan',   input:'a', pop:'a', push:'',  pos, note },
   *    ...,
   *    { kind:'accept' }
   *  ]
   * Το μονοπάτι κατασκευάζεται με προσομοίωση στοίβας, οδηγούμενη
   * από την αριστερότερη παραγωγή που εξήγαμε.
   * ---------------------------------------------------------*/
  toPdaTransitions(input) {
    if (!this.res.accepted) {
      return [{ kind: "reject", reason: "not accepted", furthestIndex: this.res.furthestIndex ?? 0 }];
    }

    const n = (input || "").length;
    const tokens = (input || "").split("");
    const accItem = findAccepted(this.chart, this.startAug, this.start);
    if (!accItem) {
      return [{ kind: "reject", reason: "no accepted item" }];
    }
    const bp = accItem.back && accItem.back.find(b => b.type === "complete");
    if (!bp) {
      return [{ kind: "reject", reason: "no complete backpointer from S'→S" }];
    }

    const root = this._buildCompletedTree(bp.right, n);
    const expansions = this._collectExpansions(root); // [{lhs, rhsSymbols}...]

    // Πλήρης προσομοίωση NPDA (χωρίς explicit q0/qacc — αυτά τα αφήνουμε στο UI)
    const path = [];
    const stack = [this.start]; // ξεκινάμε με S στη στοίβα
    let ei = 0; // δείκτης expansions
    let i = 0;  // θέση στο input

    const logStep = (...a) => { if (this.debug) console.log("[PDA path]", ...a); };

    while (true) {
      if (stack.length === 0 && i === n) {
        path.push({ kind: "accept" });
        logStep("accept");
        break;
      }
      if (stack.length === 0) {
        path.push({ kind: "reject", reason: "stack empty before input consumed", pos: i });
        break;
      }
      const top = stack.pop();

      if (isNonTerminal(top)) {
        const exp = expansions[ei++];
        if (!exp || exp.lhs !== top) {
          // Αυτό δεν πρέπει να συμβαίνει αν η παραγωγή είναι συμβατή με NPDA στρατηγική
          path.push({ kind: "reject", reason: `derivation mismatch for nonterminal ${top}`, pos: i });
          break;
        }
        const rhs = exp.rhsSymbols; // array
        // push σε reverse ώστε το αριστερότερο να βρεθεί στην κορυφή
        for (let k = rhs.length - 1; k >= 0; k--) {
          const s = rhs[k];
          if (s === "") continue; // shouldn't happen; ε αποφεύγεται
          stack.push(s);
        }
        const pushStr = rhs.join("");
        path.push({
          kind: "expand",
          input: "ε",
          pop: top,
          push: pushStr,
          pos: i,
          note: `${top} → ${pushStr === "" ? "ε" : pushStr}`
        });
        logStep(`expand: pop ${top}, push ${pushStr || "ε"} @ i=${i}`);
      } else {
        // terminal
        if (i < n && tokens[i] === top) {
          path.push({
            kind: "scan",
            input: top,
            pop: top,
            push: "",
            pos: i,
            note: `${top}, ${top}→ε`
          });
          logStep(`scan '${top}' @ i=${i}`);
          i += 1;
        } else {
          path.push({ kind: "reject", reason: `expected '${top}'`, got: i < n ? `'${tokens[i]}'` : "EOS", pos: i });
          break;
        }
      }
    }

    this.log("toPdaTransitions:", path);
    return path;
  }

  /* =========================================================
   * ===========   ΕΣΩΤΕΡΙΚΕΣ ΒΟΗΘΗΤΙΚΕΣ ΣΥΝΑΡΤΗΣΕΙΣ   ======
   * =======================================================*/

  // Χτίζει parse-subtree από ΕΝΑ ολοκληρωμένο item (dot==rhs.length)
  // και γνωστό endIndex (π.χ. n για το S).
  _buildCompletedTree(itemId, endIndex) {
    const it = this.items[itemId];
    if (!it) throw new Error(`_buildCompletedTree: missing item #${itemId}`);
    if (it.dot !== it.rhs.length) {
      throw new Error(`_buildCompletedTree: item #${itemId} not complete`);
    }

    this.log("buildTree: start", this._pp(it), "end=", endIndex);

    // Πάμε προς τα πίσω: κάθε backpointer αντιστοιχεί σε ένα symbol της RHS (scan => terminal, complete => nonterminal)
    const pieces = [];
    let cur = it;
    let curEnd = endIndex;

    while (cur.back && cur.back.length) {
      const bp = this.selectPointer(cur.back); // επίλεξε 1 pointer (πρώτος by default)
      if (!bp) break;

      if (bp.type === "scan") {
        // terminal consumption
        const term = {
          type: "terminal",
          value: bp.ch,
          start: bp.at,
          end: bp.at + 1
        };
        pieces.push(term);
        cur = this.items[bp.prev];
        curEnd = bp.at; // πριν καταναλώσουμε αυτόν τον terminal, το end ήταν bp.at
        this.log("back scan ←", this._pp(cur), `ch='${term.value}'`);
      } else if (bp.type === "complete") {
        // completed nonterminal subtree στο right
        const child = this._buildCompletedTree(bp.right, bp.at);
        pieces.push({ type: "nonterminal", node: child });
        cur = this.items[bp.left];
        // curEnd δεν αλλάζει εδώ
        this.log("back complete ←", this._pp(cur), `child=${child.lhs}[${child.start},${child.end}]`);
      } else {
        this.log("unknown backpointer", bp);
        break;
      }
    }

    // Τα pieces είναι σε reverse σειρά RHS — τα γυρνάμε
    pieces.reverse();

    // Κατασκευάζουμε τον κόμβο κανόνα A→α
    const node = {
      type: "rule",
      lhs: it.lhs,
      rhsSymbols: it.rhs.slice(), // array of strings (terminals/nonterminals)
      children: [],
      start: it.start,
      end: endIndex
    };

    // Ταιριάζουμε children με RHS κατά θέση
    let p = 0;
    for (let k = 0; k < it.rhs.length; k++) {
      const sym = it.rhs[k];
      const piece = pieces[p++];
      if (!piece) {
        // ε‑παραγωγή ή ασυμφωνία — θα κρατήσουμε κενό
        break;
      }
      if (isNonTerminal(sym)) {
        // περιμένουμε nonterminal piece
        if (piece.type !== "nonterminal") {
          // αν για οποιονδήποτε λόγο προέκυψε terminal, δημιουργούμε leaf‑placeholder
          const fakeChild = {
            type: "rule",
            lhs: sym,
            rhsSymbols: [piece.value],
            children: [ { type: "terminal", value: piece.value, start: -1, end: -1 } ],
            start: -1, end: -1
          };
          node.children.push(fakeChild);
        } else {
          node.children.push(piece.node);
        }
      } else {
        // terminal expected
        if (piece.type === "terminal") {
          node.children.push(piece);
        } else {
          // fallback placeholder
          node.children.push({ type: "terminal", value: sym, start: -1, end: -1 });
        }
      }
    }

    return node;
  }

  // Συλλογή παραγωγών (expand steps) με αριστερότερη σειρά:
  // Επιστρέφει [{lhs, rhsSymbols}], όπου rhsSymbols είναι array (terminals & nonterminals)
  _collectExpansions(node) {
    const exps = [];
    const dfs = (nd) => {
      if (!nd || nd.type !== "rule") return;
      exps.push({ lhs: nd.lhs, rhsSymbols: nd.rhsSymbols.slice() });
      for (const ch of nd.children) {
        if (ch && ch.type === "rule") dfs(ch);
      }
    };
    dfs(node);
    this.log("_collectExpansions:", exps.map(e => `${e.lhs}→${e.rhsSymbols.join("") || "ε"}`));
    return exps;
  }

  _pp(it) {
    const pre  = it.rhs.slice(0, it.dot).join("") || "•";
    const post = it.rhs.slice(it.dot).join("")     || "•";
    return `${it.lhs} → ${pre} · ${post} , ${it.start}`;
  }
}

/* =====================  Βοηθητικά εκτός κλάσης  ===================== */

function findAccepted(chart, startAug, start) {
  const last = chart[chart.length - 1] || [];
  for (const it of last) {
    if (!it) continue;
    if (it.lhs === startAug &&
        it.dot === it.rhs.length &&
        it.start === 0 &&
        it.rhs && it.rhs.length === 1 &&
        it.rhs[0] === start) {
      return it;
    }
  }
  return null;
}

function isNonTerminal(sym) {
  return typeof sym === "string" && /^[A-Z]$/.test(sym);
}

function replaceLeftmostNonterminal(sentential, A, rhsStr) {
  // Βρίσκουμε το Α (κεφαλαίο) ως μονό χαρακτήρα και αντικαθιστούμε την ΠΡΩΤΗ εμφάνιση
  const idx = sentential.indexOf(A);
  if (idx === -1) return sentential; // δεν θα συμβεί σε σωστή παραγωγή
  return sentential.slice(0, idx) + rhsStr + sentential.slice(idx + 1);
}

function hasLogQueryParam() {
  try {
    if (typeof window === "undefined") return false;
    const u = new URL(window.location.href);
    return (u.searchParams.get("log") || "").toLowerCase() === "true";
  } catch (_) {
    return false;
  }
}
