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
        let derivedWord = startSymbol;

        const parse = (currentGeneratedWord, remainingWord) => {
            if (!this.canStillGenerateRemainingWord(cfg, currentGeneratedWord, remainingWord)) {
                return null;
            }

            if (currentGeneratedWord === "" && remainingWord === "") {
                return true;
            }

            if (currentGeneratedWord === "") {
                return null;
            }

            const [head, ...tail] = currentGeneratedWord;

            if (cfg[head]) {
                for (const production of cfg[head]) {
                    const previouslyDerivedWord = derivedWord;

                    derivedWord = previouslyDerivedWord.replace(
                        head,
                        production === window.EMPTY_STRING ? "" : production
                    );

                    let newCurrentGeneratedWord = (production === window.EMPTY_STRING ? "" : production) + tail.join("");

                    const ruleFormatted = `${head} → ${production}`.replace(/[A-Z]/g, "<span class='bold'>$&</span>");
                    const applicationFormatted = previouslyDerivedWord.replace(
                        head,
                        `<span class='colored'>${head}</span>`
                    );
                    const resultFormatted = derivedWord.replace(
                        production,
                        `<span class='colored'>${production}</span>`
                    );

                    // Push the new step with 'isMarked = false'
                    // steps array shape: [ ruleCell, applicationCell, resultCell, isMarkedFlag ]
                    steps.push([ruleFormatted, applicationFormatted, resultFormatted, false]);

                    // Recurse
                    const result = parse(newCurrentGeneratedWord, remainingWord);
                    if (result) {
                        return result; // success
                    } else {
                        // Grab the last step
                        const lastStep = steps[steps.length - 1];
                        // lastStep is: [ruleCell, applicationCell, resultCell, isMarkedFlag]

                        if (!lastStep[3]) {
                            // If it's not yet marked, modify it in place
                            lastStep[0] = `${ruleFormatted} <span class="dead-end">(dead-end)</span>`;
                            lastStep[3] = true;
                        } else {
                            // Otherwise, it's already been marked once.
                            // Push a brand new step as a dead-end.
                            steps.push([
                                `${ruleFormatted} <span class="dead-end">(dead-end)</span>`,
                                applicationFormatted,
                                resultFormatted,
                                true
                            ]);
                        }

                        // revert
                        derivedWord = previouslyDerivedWord;
                        newCurrentGeneratedWord = currentGeneratedWord;
                    }
                }
            } else if (remainingWord[0] === head) {
                // If terminal matches the input, move on
                return parse(tail.join(""), remainingWord.slice(1));
            }

            return null;
        };

        return parse(startSymbol, word);
    }

    displaySteps(stepsTableEl, steps, tableBgColor) {
        stepsTableEl.classList.remove("hidden");
        const tableBody = document.getElementById("parsingSteps");
        tableBody.style.backgroundColor = tableBgColor;
        tableBody.innerHTML = "";

        steps.forEach(step => {
            // step is [ ruleCell, applicationCell, resultCell, isMarkedFlag ]
            const row = document.createElement("tr");

            const isDeadEnd = step[0].includes("(dead-end)");

            // Optional: style dead-end rows
            if (isDeadEnd) {
                row.classList.add("dead-end-row");
            }

            // Only show columns 0..2 (rule, application, result)
            for (let i = 0; i < 3; i++) {
                const cell = document.createElement("td");
                cell.innerHTML = step[i];
                row.appendChild(cell);
            }

            tableBody.appendChild(row);
        });
    }
};