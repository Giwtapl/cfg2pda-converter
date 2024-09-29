import { InputHandler } from './components/InputHandler.js';

window.EMPTY_STRING = 'ε';

window.inputHandler = new InputHandler();
window.inputHandler.addRule();

const doneBtnEl = document.getElementById("btn-done");
doneBtnEl.addEventListener('click', event => {
    window.inputHandler.doneBtnHandler.bind(window.inputHandler)(event);
});

const abortBtnEl = document.getElementById("btn-restart");
abortBtnEl.addEventListener('click', () => {
    location.reload();
});

// Get modal element
const modal = document.getElementById('modal');

// Get the button that opens the modal
const generateWordBtn = document.getElementById('generateWordButton');

// Get the <span> element that closes the modal
const span = document.getElementsByClassName('close')[0];

// Get the generate word button inside the modal
const generateBtn = document.getElementById('generateButton');

// Get the TestCFG button
const testCfgBtn = document.getElementById('btn-testcfg');

const generatedWordInputEl = document.getElementById('cfgWordInput');

generatedWordInputEl.addEventListener('input', function() {
    // Check if the input value is not empty
    if (generatedWordInputEl.value.trim() !== "") {
        testCfgBtn.disabled = false; // Enable the button
    } else {
        testCfgBtn.disabled = true; // Disable the button
    }
});

// When the user clicks the button, open the modal
generateWordBtn.onclick = function() {
    modal.style.display = 'block';
}

// When the user clicks on <span> (x), close the modal
span.onclick = function() {
    modal.style.display = 'none';
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

// When the user clicks the generate button inside the modal
generateBtn.onclick = function() {
    const length = parseInt(document.getElementById('wordLength').value);
    if (isNaN(length) || length < 1) {
        alert('Please enter a valid length');
        return;
    }

    const generatedWord = generateRandomWord(length);
    generatedWordInputEl.value = generatedWord;
    modal.style.display = 'none';
    testCfgBtn.removeAttribute("disabled");
}

function generateRandomWord(length) {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    let word = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * alphabet.length);
        word += alphabet[randomIndex];
    }
    return word;
}

testCfgBtn.onclick = function() {
    const word = generatedWordInputEl.value;
    const startSymbol = "S";
    const steps = [["Start → S", "Start", "S"]];
    const result = canGenerate(window.inputHandler.cfg.cfgObj, startSymbol, word, steps);
    console.log(`The word '${word}' is ${result ? "accepted" : "rejected"} by the CFG.`);
    displaySteps(steps, result ? 'lightgreen' : 'lightcoral');
}

function canStillGenerateRemainingWord(cfg, currentGeneratedWord, remainingWord) {
    // Calculate the number of variables in the currentGeneratedWord that can produce ε
    const currentGeneratedWordVariablesWithEpsilon = currentGeneratedWord.split('').filter(s => cfg[s] && cfg[s].includes('ε'));
    return currentGeneratedWord.length - currentGeneratedWordVariablesWithEpsilon.length <= remainingWord.length;
}

function canGenerate(cfg, startSymbol, word, steps) {
    function parse(currentGeneratedWord, remainingWord) {
        // If currentGeneratedWord is longer than remaining word, this path is a dead end
        if (!canStillGenerateRemainingWord(cfg, currentGeneratedWord, remainingWord)) {
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
                let newCurrentGeneratedWord = (production === "ε" ? "" : production) + tail.join("");
                const previouslyDerivedWord = derivedWord;
                derivedWord = previouslyDerivedWord.replace(head, production === "ε" ? "" : production);

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

function displaySteps(steps, tableBgColor) {
    const stepsTable = document.getElementById("stepsTable");
    stepsTable.classList.remove("hidden");
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