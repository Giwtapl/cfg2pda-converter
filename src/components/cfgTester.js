export class CfgTester {
    constructor(generatedWordInputEl) {
        this.generatedWordInputEl = generatedWordInputEl;
    }

    testCfgBtnHandler = () => {
        const word = this.generatedWordInputEl.value;
        const startSymbol = "S";
        const steps = [["Start → S", "Start", "S"]];
        const result = this.canGenerate(window.inputHandler.cfg.cfgObj, startSymbol, word, steps);
        console.log(`The word '${word}' is ${result ? "accepted" : "rejected"} by the CFG.`);
        const stepsTableEl = document.getElementById("stepsTable");
        this.displaySteps(stepsTableEl, steps, result ? 'lightgreen' : 'lightcoral');
        stepsTableEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    canStillGenerateRemainingWord(cfg, currentGeneratedWord, remainingWord) {
        // Calculate the number of variables in the currentGeneratedWord that can produce ε
        const currentGeneratedWordVariablesWithEpsilon = currentGeneratedWord.split('').filter(s => cfg[s] && cfg[s].includes(window.EMPTY_STRING));
        return currentGeneratedWord.length - currentGeneratedWordVariablesWithEpsilon.length <= remainingWord.length;
    }

    canGenerate(cfg, startSymbol, word, steps) {
        const parse = (currentGeneratedWord, remainingWord) => {
            // If currentGeneratedWord is longer than remaining word, this path is a dead end
            if (!this.canStillGenerateRemainingWord(cfg, currentGeneratedWord, remainingWord)) {
                return null;
            }

            // If both are empty, we have matched the word
            if (currentGeneratedWord === "" && remainingWord === "") {
                return true;
            }

            // If the currentGeneratedWord is empty but remainingWord is not, return null (dead end)
            if (currentGeneratedWord === "") {
                return null;
            }

            const [head, ...tail] = currentGeneratedWord;

            // If it's a non-terminal, try all productions
            if (cfg[head]) {
                for (const production of cfg[head]) {
                    let newCurrentGeneratedWord = (production === window.EMPTY_STRING ? "" : production) + tail.join("");
                    const previouslyDerivedWord = derivedWord;
                    derivedWord = previouslyDerivedWord.replace(head, production === window.EMPTY_STRING ? "" : production);

                    // Wrap capital letters in the first element
                    const ruleFormatted = `${head} → ${production}`.replace(/[A-Z]/g, "<span class='bold'>$&</span>");

                    // Wrap capital letters in the second element
                    const applicationFormatted = previouslyDerivedWord.replace(head, `<span class='colored'>${head}</span>`);

                    // Wrap the part of the third element that matches production in the third element
                    const resultFormatted = derivedWord.replace(production, `<span class='colored'>${production}</span>`);

                    steps.push([ruleFormatted, applicationFormatted, resultFormatted]);

                    const result = parse(newCurrentGeneratedWord, remainingWord);
                    if (result) {
                        return result; // Stop if this path leads to a solution
                    } else {
                        // If this production fails, remove the step and try the next production
                        steps.pop();
                        derivedWord = previouslyDerivedWord;
                        newCurrentGeneratedWord = currentGeneratedWord;
                    }
                }
            }
            // If it's a terminal, check if it matches the first char of remainingWord
            else if (remainingWord[0] === head) {
                return parse(tail.join(""), remainingWord.slice(1));
            }

            // If no productions or matches worked, return null to indicate failure
            return null;
        }

        let derivedWord = startSymbol;
        return parse(startSymbol, word);
    }

    displaySteps(stepsTableEl, steps, tableBgColor) {
        stepsTableEl.classList.remove("hidden");
        const tableBody = document.getElementById("parsingSteps");
        tableBody.style.backgroundColor = tableBgColor;
        tableBody.innerHTML = "";

        steps.forEach(step => {
            const row = document.createElement("tr");

            step.forEach(cellText => {
                const cell = document.createElement("td");
                cell.innerHTML = cellText;
                row.appendChild(cell);
            });

            tableBody.appendChild(row);
        });
    }
};