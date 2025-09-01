// src/components/CfgTester.js
import { displayMessage, isGreek } from "../utilities/tools.js";
import { EarleyParser } from "./earley/EarleyParser.js";
import { EarleyForest } from "./earley/EarleyForest.js";

/* -----------------------------------------------
 * Rule-aware highlighting for derivation steps
 * ---------------------------------------------*/
function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Τονίζει με βάση τον *κανόνα* (π.χ. "S → SS"):
 * - βρίσκει την *αριστερότερη* εμφάνιση του LHS στο `before`
 * - στο Application τονίζει μόνο εκείνο το LHS
 * - στο Result τονίζει την RHS που μπήκε στη θέση του
 * Καλύπτει άψογα περιπτώσεις όπως S→SS, S→aSa, S→ε, κ.λπ.
 */
function highlightByRule(rule, before, after) {
  before = String(before ?? "");
  after  = String(after ?? "");

  // Αναμένουμε μορφή "A → α" (το βέλος είναι το window.ARROW = "→")
  const parts = String(rule).split("→");
  if (parts.length !== 2) {
    // Fallback: χωρίς markup
    return { beforeHTML: esc(before), afterHTML: esc(after) };
  }

  const lhs = parts[0].trim();              // "S"
  const rhsText = parts[1].trim();          // "SS" | "aSa" | "ε" ...
  const rhs = rhsText === "ε" ? "" : rhsText;

  const idx = before.indexOf(lhs);
  if (idx === -1) {
    // Αν για κάποιο λόγο δεν βρεθεί (δεν αναμένεται), fallback
    return { beforeHTML: esc(before), afterHTML: esc(after) };
  }

  const beforeHTML =
    esc(before.slice(0, idx)) +
    `<span class="hl">${esc(lhs)}</span>` +
    esc(before.slice(idx + lhs.length)); // lhs είναι 1 χαρακτήρας (A–Z)

  const afterHTML =
    esc(after.slice(0, idx)) +
    (rhs.length ? `<span class="hl">${esc(rhs)}</span>` : "") +
    esc(after.slice(idx + rhs.length));

  return { beforeHTML, afterHTML };
}

// Εισάγουμε μια απλή CSS κλάση για το μπλε highlighting (μία φορά)
(function injectHlCssOnce() {
  const ID = "cfgtester-hl-style";
  if (document.getElementById(ID)) return;
  const style = document.createElement("style");
  style.id = ID;
  style.textContent = `.hl{color:#1677ff;font-weight:700;}`;
  document.head.appendChild(style);
})();

/* =======================================================
 *                       CLASS
 * =====================================================*/
export class CfgTester {
  constructor(generatedWordInputEl) {
    this.generatedWordInputEl = generatedWordInputEl;
  }

  testCfgBtnHandler = () => {
    const stepsTableEl = document.getElementById("stepsTable");
    const tableBody = document.getElementById("parsingSteps");
    // καθάρισε/κρύψε προηγούμενα αποτελέσματα
    if (stepsTableEl) {
      stepsTableEl.classList.add("hidden");
      if (tableBody) tableBody.innerHTML = "";
    }

    // Reset visual PDA simulation αν υπάρχει
    const pdaAreaEl = document.getElementById("pda-area");
    if (pdaAreaEl && !pdaAreaEl.classList.contains("hidden") && window.pda) {
      window.pda.pdaSimulation.resetSimulation();
    }

    // Διάβασε τη λέξη (κενό => ε)
    const word = this.generatedWordInputEl.value.trim();
    const cfg = window.inputHandler.cfg;

    // Έλεγχος τερματικών
    const wordTerminals = [...new Set(word.split(""))].filter(ch => !/[A-Z]/.test(ch));
    const cfgTerminals = cfg.getTerminals();
    const invalidChars = wordTerminals.filter(term => !cfgTerminals.includes(term));
    if (invalidChars.length > 0) {
      if (isGreek()) {
        displayMessage(
          `Η λέξη '${word || "ε"}' περιέχει χαρακτήρες ('${invalidChars}') που δεν ανήκουν στα τερματικά σύμβολα της CFG.`,
          false,
          "cfg"
        );
      } else {
        displayMessage(
          `The string '${word || "ε"}' contains characters ('${invalidChars}') that are not part of the CFG's terminal symbols.`,
          false,
          "cfg"
        );
      }
      return;
    }

    // === Earley ===
    const parser = new EarleyParser(cfg);
    const debug = typeof window !== "undefined" && window.DEBUG_LOGS;
    console.clear?.();
    if (debug) {
      console.log("=== Earley CFG test ===");
      console.log("Input:", word === "" ? "ε" : word);
      console.log("CFG:", cfg.toObject());
    }

    const res = parser.parse(word, { buildForest: true, debug });

    if (debug) {
      console.log("Earley result:", {
        accepted: res.accepted,
        furthestIndex: res.furthestIndex,
        items: res.itemsCount
      });
    }

    if (!res.accepted) {
      const msgEl = isGreek()
        ? `Η δοσμένη CFG ΔΕΝ αναγνωρίζει τη λέξη '${word || "ε"}'.`
        : `The provided CFG does NOT generate the string '${word || "ε"}'.`;
      displayMessage(msgEl, false, "cfg");
      document.getElementById("cfg-message")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    // Accepted — εξαγωγή βημάτων παραγωγής
    const forest = new EarleyForest(res, { debug });
    const steps = forest.oneDerivationSteps(word); // [{ step, rule, before, after }]

    // UI: εμφάνιση πίνακα με rule-aware highlight
    this.displaySteps(stepsTableEl, steps, "#aee2ba");
    stepsTableEl.classList.remove("hidden");

    const okMsg = isGreek()
      ? `Η δοσμένη CFG αναγνωρίζει τη λέξη '${word || "ε"}'.`
      : `The provided CFG generates the string '${word || "ε"}'.`;
    displayMessage(okMsg, true, "cfg");

    document.getElementById("cfg-message")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /**
   * Απόδοση βημάτων παραγωγής στον πίνακα.
   * Κάθε step: { step, rule, before, after } όπου rule π.χ. "S → SS".
   */
  displaySteps(stepsTableEl, steps, tableBgColor) {
    if (!stepsTableEl) return;
    const tableBody = document.getElementById("parsingSteps");
    if (!tableBody) return;

    tableBody.innerHTML = "";
    if (tableBgColor) tableBody.style.backgroundColor = tableBgColor;

    // Γραμμή εκκίνησης
    tableBody.appendChild(this._mkRow("--", "--", "S", { noHighlight: true }));

    steps.forEach(({ rule, before, after }) => {
      tableBody.appendChild(this._mkRow(rule, before, after));
    });
  }

  /**
   * Δημιουργεί <tr>. Αν noHighlight=true, δεν εφαρμόζει markup.
   */
  _mkRow(ruleUsed, oldStr, newStr, opts = {}) {
    const tr = document.createElement("tr");

    const tdRule = document.createElement("td");
    tdRule.textContent = ruleUsed ?? "--";

    const tdOld = document.createElement("td");
    const tdNew = document.createElement("td");

    if (opts.noHighlight) {
      tdOld.textContent = oldStr ?? "";
      tdNew.textContent = newStr ?? "";
    } else {
      const { beforeHTML, afterHTML } = highlightByRule(ruleUsed, oldStr, newStr);
      tdOld.innerHTML = beforeHTML;
      tdNew.innerHTML = afterHTML;
    }

    tr.appendChild(tdRule);
    tr.appendChild(tdOld);
    tr.appendChild(tdNew);
    return tr;
  }
}
