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
var modal = document.getElementById('modal');

// Get the button that opens the modal
var btn = document.getElementById('generateButton');

// Get the <span> element that closes the modal
var span = document.getElementsByClassName('close')[0];

// Get the generate word button inside the modal
var generateWordBtn = document.getElementById('generateWordButton');

// When the user clicks the button, open the modal 
btn.onclick = function() {
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
generateWordBtn.onclick = function() {
    const length = parseInt(document.getElementById('wordLength').value);
    if (isNaN(length) || length < 1) {
        alert('Please enter a valid length');
        return;
    }

    const generatedWord = generateRandomWord(length);
    document.getElementById('wordInput').value = generatedWord;
    modal.style.display = 'none';
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

const productions = [
    ['S', 'AB'],
    ['A', 'a'],
    ['B', 'b']
];
const startSymbol = 'S';
const word = 'ab';

const stepsTable = document.getElementById('steps-table').getElementsByTagName('tbody')[0];
const resultDiv = document.getElementById('result');

function addStep(stepNumber, production, remainingString) {
    const row = stepsTable.insertRow();
    row.insertCell(0).innerText = stepNumber;
    row.insertCell(1).innerText = production;
    row.insertCell(2).innerText = remainingString;
}

function recognize(cfg, start, input) {
    let steps = [];
    let queue = [[start, input, 0]];

    while (queue.length > 0) {
        let [current, remaining, stepNumber] = queue.shift();

        if (remaining === "") {
            steps.push([stepNumber, current, remaining]);
            steps.forEach(([stepNumber, production, remainingString]) => {
                addStep(stepNumber, production, remainingString);
            });
            document.body.classList.add('success');
            resultDiv.innerText = "SUCCESS";
            return true;
        }

        for (let production of cfg) {
            if (current.startsWith(production[0])) {
                let newString = current.replace(production[0], production[1]);
                steps.push([stepNumber, `${production[0]} -> ${production[1]}`, remaining]);
                queue.push([newString, remaining.slice(production[1].length), stepNumber + 1]);
            }
        }
    }

    steps.forEach(([stepNumber, production, remainingString]) => {
        addStep(stepNumber, production, remainingString);
    });
    document.body.classList.add('failure');
    resultDiv.innerText = "FAILURE";
    return false;
}

if (recognize(productions, startSymbol, word)) {
    stepsTable.classList.add('success');
} else {
    stepsTable.classList.add('failure');
}