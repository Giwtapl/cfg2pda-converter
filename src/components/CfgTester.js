// src/components/CfgTester.js
import { displayMessage, isGreek } from "../utilities/tools.js";
import { EarleyParser } from "./earley/EarleyParser.js";
import { EarleyForest } from "./earley/EarleyForest.js";

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

        // Αν υπάρχει ήδη αποδομημένη PDA προσομοίωση, κάνε reset για “καθαρό” UI
        const pdaAreaEl = document.getElementById("pda-area");
        if (pdaAreaEl && !pdaAreaEl.classList.contains("hidden") && window.pda) {
            window.pda.pdaSimulation.resetSimulation();
        }

        // Διάβασε τη λέξη (το κενό input σημαίνει ε)
        const word = this.generatedWordInputEl.value.trim(); // "" == ε
        const cfg = window.inputHandler.cfg;

        // Έλεγχος αλφαβήτου (τερματικά) — πιο φιλικό μήνυμα στον χρήστη
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

        // === Earley === (χωρίς BFS/DP προ-ελέγχους)
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
            // Αποτυχία — ενημέρωση χρήστη, χωρίς να εμφανίσουμε πίνακα βημάτων
            const msgEl = isGreek()
                ? `Η δοσμένη CFG ΔΕΝ αναγνωρίζει τη λέξη '${word || "ε"}'.`
                : `The provided CFG does NOT generate the string '${word || "ε"}'.`;
            displayMessage(msgEl, false, "cfg");

            // έξτρα πληροφορία για debugging
            if (debug) {
                console.log(
                    `%cReject. Furthest consumed index: ${res.furthestIndex} (0-based).`,
                    "color:#b00;font-weight:bold"
                );
            }

            document.getElementById("cfg-message")?.scrollIntoView({ behavior: "smooth", block: "start" });
            return;
        }

        // Accepted — εξαγωγή βημάτων μιας παραγωγής με EarleyForest
        const forest = new EarleyForest(res, { debug });
        const steps = forest.oneDerivationSteps(word); // πίνακας με { step, rule, before, after }

        // UI: εμφάνιση πίνακα βημάτων
        this.displaySteps(stepsTableEl, steps, "#d4edda"); // ανοιχτό πράσινο
        stepsTableEl.classList.remove("hidden");

        const okMsg = isGreek()
            ? `Η δοσμένη CFG αναγνωρίζει τη λέξη '${word || "ε"}'.`
            : `The provided CFG generates the string '${word || "ε"}'.`;
        displayMessage(okMsg, true, "cfg");

        document.getElementById("cfg-message")?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    /**
     * Απόδοση βημάτων παραγωγής στον πίνακα (Rule / Application / Result).
     * Το EarleyForest.oneDerivationSteps επιστρέφει αντικείμενα:
     *   { step, rule, before, after }
     */
    displaySteps(stepsTableEl, steps, tableBgColor) {
        if (!stepsTableEl) return;
        const tableBody = document.getElementById("parsingSteps");
        if (!tableBody) return;

        tableBody.innerHTML = "";
        if (tableBgColor) tableBody.style.backgroundColor = tableBgColor;

        // Προσθέτω προεξέχουσα "γραμμή έναρξης" όπως πριν (προαιρετικό)
        tableBody.appendChild(this._mkRow("--", "--", "S"));

        steps.forEach(({ rule, before, after }) => {
            tableBody.appendChild(this._mkRow(rule, before, after));
        });
    }

    _mkRow(ruleUsed, oldStr, newStr) {
        const tr = document.createElement("tr");

        const tdRule = document.createElement("td");
        tdRule.innerHTML = ruleUsed;

        const tdOld = document.createElement("td");
        tdOld.innerHTML = oldStr;

        const tdNew = document.createElement("td");
        tdNew.innerHTML = newStr;

        tr.appendChild(tdRule);
        tr.appendChild(tdOld);
        tr.appendChild(tdNew);
        return tr;
    }
}
