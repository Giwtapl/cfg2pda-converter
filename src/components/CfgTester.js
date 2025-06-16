import { CfgWordGenerator } from "./CfgWordGenerator.js";
import { displayMessage, isGreek, minPossibleLength } from "../utilities/tools.js";


export class CfgTester {
    constructor(generatedWordInputEl) {
        this.generatedWordInputEl = generatedWordInputEl;
    }

    testCfgBtnHandler = () => {
        const word = this.generatedWordInputEl.value.trim();
        const startSymbol = "S";

        const cfg = window.inputHandler.cfg;
        const isvalidWordLength = new CfgWordGenerator(cfg).canGenerateLength(word.length);
        if (!isvalidWordLength) {
            if (isGreek()) {
                displayMessage(`Η CFG που παρέχεται ΔΕΝ μπορεί να παράξει λέξη μήκους ${word.length}.`, false, "cfg");
            } else {
                displayMessage(`The provided CFG cannot generate any word of length ${word.length}.`, false, "cfg");
            }
            return;
        }
        const wordTerminals = [...new Set(word.split(""))].filter(ch => !/[A-Z]/.test(ch));

        const cfgTerminals = cfg.getTerminals();
        const invalidChars = wordTerminals.filter(term => !cfgTerminals.includes(term));
        if (invalidChars.length > 0) {
            if (isGreek()) {
                displayMessage(`Η λέξη '${word}' περιέχει χαρακτήρες ('${invalidChars}') που δεν ανήκουν στα τερματικά σύμβολα της CFG.`, false, "cfg");
            } else {
                displayMessage(`The word '${word}' contains characters ('${invalidChars}') that are not part of the CFG's terminal symbols.`, false, "cfg");
            }
            return;
        }

        // We'll store only the expansions that actually lead to a successful derivation.
        // Each element is an array of the form [ruleUsed, oldString, newString].
        const steps = [
            ["--", "--", "S"] // A descriptive first row
        ];

        // Attempt to parse the word from the start symbol
        const recognized = this.canGenerate(
            window.inputHandler.cfg.cfgObj,
            startSymbol,
            word,
            steps
        );

        const stepsTableEl = document.getElementById("stepsTable");
        stepsTableEl.classList.add("hidden");

        if (recognized) {
            // If recognized, show final expansions
            this.displaySteps(stepsTableEl, steps, "lightgreen");
            stepsTableEl.classList.remove("hidden");
            if (isGreek()) {
                displayMessage(`Η παρεχόμενη CFG αναγνωρίζει τη λέξη '${word}'.`, true, "cfg");
            } else {
                displayMessage(`The provided CFG recognizes the word '${word}'.`, true, "cfg");
            }
        } else {
            // If not recognized, display a simple message
            if (isGreek()) {
                displayMessage(`Η παρεχόμενη CFG ΔΕΝ αναγνωρίζει τη λέξη '${word}'.`, false, "cfg");
            } else {
                displayMessage(`The provided CFG does NOT recognize the word '${word}'.`, false, "cfg");
            }
        }

        document.getElementById("cfg-message").scrollIntoView({ behavior: "smooth", block: "start" });
    }

    canGenerate(cfgObj, startSymbol, word, steps) {
        const EMPTY = window.EMPTY_STRING;              // "ε"

        /* queue items:  { derived: string, trace: [[rule,before,after], …] } */
        const queue   = [];
        const visited = new Set();

        console.clear();
        console.log("=== CFG recogniser ===");
        console.log("Target:", word);

        queue.push({ derived: startSymbol, trace: [] });

        while (queue.length) {
            const { derived, trace } = queue.shift();
            console.log("• pop  ->", derived);

            /* ---------- success ---------- */
            if (derived === word) {
                console.log("%c✓ recognised", "color:green;font-weight:bold");
                steps.push(...trace);
                return true;
            }

            /* ---------- fast-fail tests ---------- */

            // terminals already produced must not exceed the target length
            const termCount = [...derived].filter(ch => !/[A-Z]/.test(ch)).length;
            if (termCount > word.length) {
                console.log("  ✗ pruned – too many terminals");
                continue;
            }

            // even the *shortest* word reachable from ‹derived› would be too long
            if (minPossibleLength(derived, cfgObj) > word.length) {
                console.log("  ✗ pruned – min-length bound");
                continue;
            }

            if (derived.length > 2 * word.length) {
                console.log("  ✗ pruned – exceeds 2n bound");
                continue;
            }

            // the produced terminals **before the first NT** must match the prefix
            let prefixOK = true;
            for (let i = 0; i < derived.length && i < word.length; i++) {
                const ch = derived[i];
                if (/[A-Z]/.test(ch)) break;            // stop at 1st NT
                if (ch !== word[i]) { prefixOK = false; break; }
            }
            if (!prefixOK) {
                console.log("  ✗ pruned – prefix mismatch");
                continue;
            }

            /* ---------- duplicate check ---------- */
            if (visited.has(derived)) continue;
            visited.add(derived);

            /* ---------- expand the left-most non-terminal ---------- */
            const idx = derived.search(/[A-Z]/);
            if (idx === -1) continue;                   // no NTs left

            const nonTerm = derived[idx];

            for (const prod of cfgObj[nonTerm]) {
                const expansion = prod === EMPTY ? "" : prod;
                const newDerived =
                      derived.slice(0, idx) + expansion + derived.slice(idx + 1);

                /* pretty row for the UI table */
                const ruleCell        = `${nonTerm} → ${prod === EMPTY ? "ε" : prod}`;
                const applicationCell = derived.slice(0, idx) +
                                         `<span class="colored">${nonTerm}</span>` +
                                         derived.slice(idx + 1);
                const resultCell      = derived.slice(0, idx) +
                                         `<span class="colored">${expansion || ""}</span>` +
                                         derived.slice(idx + 1);

                console.log(`  ↳ push ->`, newDerived);

                queue.push({
                    derived : newDerived,
                    trace   : [...trace, [ruleCell, applicationCell, resultCell]]
                });
            }
        }

        console.log("%c✗ not recognised", "color:red;font-weight:bold");
        return false;                                    // queue exhausted
    }


    /**
     * Displays the final steps in the steps table (only if the word is recognized).
     */
    displaySteps(stepsTableEl, steps, tableBgColor) {
        stepsTableEl.classList.remove("hidden");
        const tableBody = document.getElementById("parsingSteps");
        tableBody.innerHTML = "";
        tableBody.style.backgroundColor = tableBgColor;

        steps.forEach(([ruleUsed, oldStr, newStr]) => {
            const row = document.createElement("tr");

            // Create the 3 columns
            const ruleCell = document.createElement("td");
            ruleCell.innerHTML = ruleUsed;

            const oldCell = document.createElement("td");
            oldCell.innerHTML = oldStr;

            const newCell = document.createElement("td");
            newCell.innerHTML = newStr;

            row.appendChild(ruleCell);
            row.appendChild(oldCell);
            row.appendChild(newCell);

            tableBody.appendChild(row);
        });
    }
}
