import { isLowerCase, displayMessage } from "../utilities/tools.js";

export class PdaSimulation {
    constructor(pdaTransitions) {
        // Simulation state
        this.currentState = 'Qo';
        this.stack = [];
        this.inputWord = '';
        this.currentInputIndex = 0;
        this.isAccepted = false;
        this.isRejected = false;
        this.previousState = null;
        this.previousTransition = null;
        this.previousLabel = null;  // track the exact line of a multiline label we highlighted
        this.step = 0;

        // PDA transitions data
        this.pdaTransitions = pdaTransitions;

        // DOM elements
        this.stackContainer = document.getElementById('stack-container');
        this.wordContainer = document.getElementById('word-container');
        this.nextStepButton = document.getElementById('next-step');
        this.testPdaButton = document.getElementById('btn-testpda');
        this.restartTestButton = document.getElementById('restart-test-button');

        // Bind event listeners
        this.testPdaButton.addEventListener('click', () => {
            this.stackContainer.classList.remove('hidden');
            this.wordContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            this.startPdaTest();
        });

        this.nextStepButton.addEventListener('click', () => this.nextPdaStep());
        this.restartTestButton.addEventListener('click', () => this.startPdaTest());
    }

    /**
     * Called when the user clicks “Test PDA.”
     * Resets everything, attempts to find a path to acceptance with DFS,
     * then uses the returned info (accepted + path) to set up acceptance or rejection.
     */
    startPdaTest() {
        this.resetSimulation();

        // Grab the user’s input
        this.inputWord = document.getElementById('sharedWordInput').value.trim();

        // Attempt to find a path to acceptance
        const result = this.findAcceptingPath();
        this.transitionPath = result.path;

        if (result.accepted) {
            this.isAccepted = true;
            displayMessage(
                `The provided word is recognised by this PDA. Please click 'Next' to see how.`,
                true,
                'pda'
            );
            this.stackContainer.classList.add('accepted');
        } else {
            this.isRejected = true;
            displayMessage(
                `The provided word is NOT recognised by this PDA. 
                 Click 'Next' to see how far it got before failing.`,
                false,
                'pda'
            );
            this.stackContainer.classList.add('rejected');
        }

        // Show the initial word/stack, highlight Qo, show Next button
        this.displayWord();
        this.displayStack();
        this.highlightState(this.currentState);
        this.nextStepButton.style.display = 'block';
        this.restartTestButton.style.display = 'block';
    }

    resetSimulation() {
        this.currentState = 'Qo';
        this.stack = [];
        this.currentInputIndex = 0;
        this.isAccepted = false;
        this.isRejected = false;
        this.previousState = null;
        this.previousTransition = null;
        this.previousLabel = null;
        this.step = 0;
        this.transitionIndex = 0;
        this.transitionPath = [];

        // Clear old highlights & messages
        this.resetAllHighlighting();
        this.clearMessage();

        this.stackContainer.classList.remove('accepted', 'rejected');
    }

    /**
     * Full DFS to see if the machine can accept the input.
     * Returns { accepted: boolean, path: Transition[] }.
     * If accepted = false, path is the best partial path discovered.
     */
    findAcceptingPath() {
        const visited = new Set();
        this.bestPartial = {
            path: [],
            consumed: 0
        };

        const pathSoFar = [];
        const success = this.dfs('Qo', [], 0, pathSoFar, visited);

        if (success) {
            // We found acceptance
            return {
                accepted: true,
                path: this.transitionPath
            };
        } else {
            return {
                accepted: false,
                path: (this.bestPartial.path.length ? this.bestPartial.path : [])
            };
        }
    }

    /**
     * DFS backtracking. If we find acceptance, we store the path in this.transitionPath and return true.
     * Otherwise, we track the best partial path in this.bestPartial.
     */
    dfs(currentState, stack, inputIndex, path, visited, depth = 0) {
        const MAX_DEPTH = 2000; // safeguard

        // Check acceptance
        if (
            currentState === 'Qaccept' &&
            inputIndex === this.inputWord.length &&
            stack.length === 0
        ) {
            this.transitionPath = [...path];
            return true;
        }

        if (depth > MAX_DEPTH) {
            return false;
        }

        // Avoid loops
        const stackTop = stack[stack.length - 1] || window.EMPTY_STRING;
        const configKey = `${currentState},${inputIndex},${stackTop},${stack.length}`;
        if (visited.has(configKey)) {
            return false;
        }
        visited.add(configKey);

        // Update best partial
        if (inputIndex > this.bestPartial.consumed) {
            this.bestPartial.consumed = inputIndex;
            this.bestPartial.path = [...path];
        }

        const inputSymbol = this.inputWord[inputIndex] || window.EMPTY_STRING;

        // Gather possible transitions
        let possibleTransitions = this.findTransitions(currentState, inputSymbol, stackTop, inputIndex);
        // You can shuffle if desired
        // possibleTransitions = this.shuffleArray(possibleTransitions);

        // Try each
        for (let t of possibleTransitions) {
            const newStack = [...stack];
            // Pop
            if (t.stackTop !== window.EMPTY_STRING) {
                newStack.pop();
            }
            // Push
            if (t.stackPush !== window.EMPTY_STRING) {
                let symbols = t.stackPush.split('');
                if (t.fromState !== 'Qo') {
                    symbols.reverse();
                }
                symbols.forEach(s => newStack.push(s));
            }

            let newInputIndex = inputIndex;
            if (t.input !== window.EMPTY_STRING) {
                newInputIndex++;
            }

            const newPath = [...path, t];
            if (this.dfs(t.toState, newStack, newInputIndex, newPath, visited, depth + 1)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Step forward along our stored path (either the full or best partial).
     */
    nextPdaStep() {
        if (this.transitionIndex >= this.transitionPath.length) {
            // No more transitions
            this.nextStepButton.style.display = 'none';

            // If not accepted, highlight final node in red, etc.
            if (!this.isAccepted) {
                d3.select(`#${this.currentState}`)
                    .select('ellipse')
                    .style('stroke', 'red')
                    .style('stroke-width', '3')
                    .style('fill', 'white');

                d3.select(`#${this.currentState}`)
                    .selectAll('text, tspan')
                    .style('fill', 'black');

                d3.select('#Qaccept')
                    .select('ellipse')
                    .style('fill', 'red');

                d3.select('#Qaccept')
                    .selectAll('text, tspan')
                    .style('fill', 'white');
            }
            return;
        }

        // Un‐highlight the previously highlighted state/transition
        this.resetHighlighting();

        // Highlight the next transition
        const transition = this.transitionPath[this.transitionIndex];
        this.highlightTransition(transition);

        // Update state, stack, input pointer
        this.previousState = this.currentState;
        this.currentState = transition.toState;

        if (transition.stackTop !== window.EMPTY_STRING) {
            this.stack.pop();
        }
        if (transition.stackPush !== window.EMPTY_STRING) {
            const symbolsToPush = transition.stackPush.split('');
            if (transition.fromState !== 'Qo') {
                symbolsToPush.reverse();
            }
            symbolsToPush.forEach(s => this.stack.push(s));
        }
        if (transition.input !== window.EMPTY_STRING) {
            this.currentInputIndex++;
        }

        // Highlight current state
        this.highlightState(this.currentState);

        // Move pointer
        this.transitionIndex++;

        // Update visuals
        this.displayStack();
        this.updateWordVisualization();

        // Check acceptance
        if (
            this.currentState === 'Qaccept' &&
            this.currentInputIndex === this.inputWord.length &&
            this.stack.length === 0
        ) {
            this.isAccepted = true;
            this.highlightState(this.currentState, 'green');
            displayMessage(`The PDA accepts the word '${this.inputWord}'.`, true, 'pda');
            this.nextStepButton.style.display = 'none';
        }
    }

    /**
     * For a transition with multiple lines in the label, only highlight the exact line used.
     * So we build the label string (e.g. “ε, S → aS”) that matches the transition.
     */
    highlightTransition(transition, color = '#2861ff') {
        if (!transition?.transitionId) return;

        // 1) Highlight the edge lines/polygon
        d3.select(`#${transition.transitionId}`)
            .selectAll('path, polygon')
            .style('stroke', color);

        // 2) Build the label text we need to match exactly:
        const labelText = this.buildLabelText(transition);

        // 3) Among all <text> elements in this edge’s group, we only color the matching line
        d3.select(`#${transition.transitionId}`)
            .selectAll('text')
            .style('fill', function() {
                // “this” is the <text> node; we compare its text content
                return d3.select(this).text() === labelText ? color : 'black';
            });

        // Store them so we can revert later
        this.previousTransition = transition.transitionId;
        this.previousLabel = labelText;
    }

    /**
     * Reverts the previously highlighted state and label line back to default colors.
     */
    resetHighlighting() {
        // Revert previous state fill
        if (this.previousState) {
            d3.select(`#${this.previousState}`)
                .select('ellipse')
                .style('fill', 'white');

            d3.select(`#${this.previousState}`)
                .selectAll('text, tspan')
                .style('fill', 'black');
        }

        // Revert previous transition edges
        if (this.previousTransition) {
            d3.select(`#${this.previousTransition}`)
                .selectAll('path, polygon')
                .style('stroke', 'black');
        }

        // Revert only the previously highlighted label line
        if (this.previousTransition && this.previousLabel) {
            d3.select(`#${this.previousTransition}`)
                .selectAll('text')
                .filter((d, i, nodes) => {
                    return d3.select(nodes[i]).text() === this.previousLabel;
                })
                .style('fill', 'black');
        }
    }

    resetAllHighlighting() {
        // Reset all states
        d3.selectAll('.node')
            .select('ellipse')
            .style('fill', 'white')
            .style('stroke', 'black')
            .style('stroke-width', '1');

        d3.selectAll('.node')
            .selectAll('text, tspan')
            .style('fill', 'black');

        // Reset all transitions
        d3.selectAll('.edge')
            .selectAll('path, polygon')
            .style('stroke', 'black');

        // Reset all label lines
        d3.selectAll('.edge')
            .selectAll('text')
            .style('fill', 'black');
    }

    /**
     * Returns the exact label text for the transition, matching the format in the graph:
     *   input, stackTop -> stackPush
     * where each empty symbol is shown as “ε” in the label.
     */
    buildLabelText(transition) {
        const i = transition.input === window.EMPTY_STRING ? "ε" : transition.input;
        const sTop = transition.stackTop === window.EMPTY_STRING ? "ε" : transition.stackTop;
        const sPush = transition.stackPush === window.EMPTY_STRING ? "ε" : transition.stackPush;
        return `${i}, ${sTop} → ${sPush}`;
    }

    /**
     * Finds transitions from (currentState, inputSymbol/ε, stackTop/ε) 
     * that do not exceed the user’s input length with terminal pushes.
     */
    findTransitions(currentState, inputSymbol, stackTop, inputIndex) {
        let possible = this.pdaTransitions.filter(t =>
            t.fromState === currentState &&
            (t.input === inputSymbol || t.input === window.EMPTY_STRING) &&
            (t.stackTop === stackTop || t.stackTop === window.EMPTY_STRING)
        );

        // Optionally skip transitions that push more terminals than we can fit
        possible = possible.filter(t => {
            let stackTerminals = this.countTerminalsInStack();
            let pushTerminals = this.countTerminalsInString(t.stackPush);
            return (inputIndex + stackTerminals + pushTerminals) <= this.inputWord.length;
        });

        return possible;
    }

    countTerminalsInStack() {
        let count = 0;
        for (let symbol of this.stack) {
            if (isLowerCase(symbol)) {
                count++;
            }
        }
        return count;
    }

    countTerminalsInString(str) {
        if (!str) return 0;
        let count = 0;
        for (let symbol of str.split('')) {
            if (isLowerCase(symbol)) {
                count++;
            }
        }
        return count;
    }

    displayStack() {
        this.stackContainer.innerHTML = '';

        const stackLabel = document.createElement('p');
        stackLabel.classList.add('stack-label');
        stackLabel.textContent = 'Stack:';
        this.stackContainer.appendChild(stackLabel);

        // Display the stack contents
        for (let i = 0; i < this.stack.length; i++) {
            const elem = document.createElement('div');
            elem.classList.add('stack-element');
            elem.textContent = this.stack[i];
            this.stackContainer.appendChild(elem);
        }
    }

    displayWord() {
        this.wordContainer.innerHTML = '';

        for (let i = 0; i < this.inputWord.length; i++) {
            const letterElement = document.createElement('span');
            letterElement.classList.add('word-letter');
            letterElement.textContent = this.inputWord[i];

            if (i === this.currentInputIndex) {
                letterElement.classList.add('current-letter');
            }

            this.wordContainer.appendChild(letterElement);
        }
    }

    updateWordVisualization() {
        const letters = document.querySelectorAll('.word-letter');
        letters.forEach((letter, index) => {
            if (index === this.currentInputIndex) {
                letter.classList.add('current-letter');
            } else {
                letter.classList.remove('current-letter');
            }
        });
    }

    highlightState(stateId, color = '#2861ff') {
        d3.select(`#${stateId}`)
            .select('ellipse')
            .style('fill', color);

        d3.select(`#${stateId}`)
            .selectAll('text, tspan')
            .style('fill', 'white');

        this.previousState = stateId;
    }

    clearMessage() {
        const messageContainer = document.getElementById('pda-message');
        if (messageContainer) {
            messageContainer.textContent = '';
        }
    }

    shuffleArray(array) {
        let currentIndex = array.length, randomIndex;
        while (currentIndex !== 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [array[currentIndex], array[randomIndex]] =
                [array[randomIndex], array[currentIndex]];
        }
        return array;
    }
}
