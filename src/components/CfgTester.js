import { displayMessage } from "../utilities/tools.js";


export class CfgTester {
    constructor(generatedWordInputEl) {
        this.generatedWordInputEl = generatedWordInputEl;
    }

    testCfgBtnHandler = () => {
        const word = this.generatedWordInputEl.value.trim();
        const startSymbol = "S";

        // We'll store only the expansions that actually lead to a successful derivation.
        // Each element is an array of the form [ruleUsed, oldString, newString].
        const steps = [
            ["Start → S", "Start", "S"] // A descriptive first row
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
            stepsTableEl.scrollIntoView({ behavior: "smooth", block: "start" });
            displayMessage(`The provided CFG recognizes the word '${word}'.`, true, "cfg");
        } else {
            // If not recognized, display a simple message
            displayMessage(`The provided CFG does NOT recognize the word '${word}'.`, false, "cfg");
        }
    }

    /**
     * A top-down parser with memoization + length bounding to avoid infinite recursion,
     * while also highlighting each substitution step with <span class="colored">...</span>.
     *
     * @param {Object} cfgObj    - The CFG as an object { V: [productions...] }
     * @param {String} startSymbol
     * @param {String} word
     * @param {Array} steps      - Will store expansions if parse is successful
     *
     * @return {boolean} true if 'word' is derived; otherwise false
     */
    canGenerate(cfgObj, startSymbol, word, steps) {
        let derivedWord = startSymbol;

        // Keep track of visited states to avoid repeated expansions
        const visited = new Set();

        // Helper: can the derived string still match the remainder of the input,
        // considering ε-productions?
        const canStillMatch = (str, inputLeft) => {
            // Count how many variables in str can vanish (ε).
            let canDisappear = 0;
            for (const ch of str) {
                if (cfgObj[ch] && cfgObj[ch].includes(window.EMPTY_STRING)) {
                    canDisappear++;
                }
            }
            // If (str.length - canDisappear) > inputLeft.length, we can't match anymore.
            return (str.length - canDisappear) <= inputLeft.length;
        };

        const parse = (currentDerived, remaining) => {
            // Check for exact match
            if (currentDerived === "" && remaining === "") {
                return true;
            }
            // If derived is empty but leftover input remains → fail
            if (currentDerived === "" && remaining !== "") {
                return false;
            }
            // Basic bounding check to avoid huge expansions
            if (!canStillMatch(currentDerived, remaining)) {
                return false;
            }

            // Memo key
            const memoKey = currentDerived + "||" + remaining;
            if (visited.has(memoKey)) {
                // Already visited this config
                return false;
            }
            visited.add(memoKey);

            // Leftmost symbol
            const [head, ...tail] = currentDerived;

            // Case 1: If head is a nonterminal
            if (cfgObj[head]) {
                const productions = cfgObj[head];
                for (const production of productions) {
                    const oldDerived = derivedWord;

                    // Replace 'head' with production (or ε→"")
                    const expansion = production === window.EMPTY_STRING ? "" : production;
                    derivedWord = oldDerived.replace(head, expansion);
                    const newDerived = expansion + tail.join("");

                    // --- Highlighting for the steps table ---
                    const ruleCell = `${head} → ${production || "ε"}`;
                    // Mark where we replaced 'head' in the old string
                    const applicationCell = oldDerived.replace(
                        head,
                        `<span class="colored">${head}</span>`
                    );
                    // Mark the newly inserted production in the new string
                    const headIndex = oldDerived.indexOf(head);
                    const resultCell = derivedWord.replace(
                        new RegExp(`(.{0,${headIndex}})(${expansion})`),
                        `$1<span class="colored">$2</span>`
                    );
                    // Record this step
                    steps.push([ruleCell, applicationCell, resultCell]);

                    // Recurse
                    const result = parse(newDerived, remaining);
                    if (result) {
                        return true;
                    }
                    // Otherwise, backtrack
                    derivedWord = oldDerived;
                    steps.pop();
                }
                // None of the expansions worked
                return false;
            }

            // Case 2: If head is a terminal, it must match the next char
            if (remaining[0] === head) {
                // consume 1 char from both
                return parse(tail.join(""), remaining.slice(1));
            }

            // If we reach here, no match
            return false;
        };

        // Start recursion
        return parse(startSymbol, word);
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
