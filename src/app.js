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
    const steps = [];
    const result = canGenerate(window.inputHandler.cfg.cfgObj, startSymbol, word, steps);
    console.log(`The word '${word}' is ${result ? "accepted" : "rejected"} by the CFG.`);
    displaySteps(steps);
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
                steps.push([`${head} → ${production}`, currentGeneratedWord, newCurrentGeneratedWord]);

                const result = parse(newCurrentGeneratedWord, remainingWord);
                if (result) {
                    return result; // Stop if this path leads to a solution
                } else {
                    // If this production fails, remove the step and try the next production
                    steps.pop();
                    newCurrentGeneratedWord = currentGeneratedWord;
                }
            }
        }
        // If it's a terminal, check if it matches the first char of remainingWord
        else if (remainingWord[0] === head) {
            const newCurrentGeneratedWord = tail.join("");
            steps.push([head, currentGeneratedWord, newCurrentGeneratedWord]);
            return parse(newCurrentGeneratedWord, remainingWord.slice(1));
        }

        // If no productions or matches worked, return null to indicate failure
        return null;
    }

    return parse(startSymbol, word);
}

function displaySteps(steps) {
    const tableBody = document.getElementById("parsingSteps");
    tableBody.innerHTML = "";

    steps.forEach(step => {
        const row = document.createElement("tr");

        step.forEach(cellText => {
            const cell = document.createElement("td");
            cell.textContent = cellText;
            row.appendChild(cell);
        });

        tableBody.appendChild(row);
    });
}