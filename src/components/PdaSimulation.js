import { isLowerCase, displayMessage } from "../utilities/tools.js";

export class PdaSimulation {
    constructor(pdaTransitions) {
        // Simulation state variables
        this.currentState = 'Qo';
        this.stack = [];
        this.inputWord = '';
        this.currentInputIndex = 0;
        this.isAccepted = false;
        this.isRejected = false;
        this.previousState = null;
        this.previousTransition = null;
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

    startPdaTest() {
        // Reset everything
        this.resetSimulation();

        // Grab the user’s input
        this.inputWord = document.getElementById('sharedWordInput').value.trim();

        // Attempt to find a path to acceptance with DFS
        this.transitionPath = this.findAcceptingPath();

        if (this.transitionPath) {
            // We found an accepting path
            this.isAccepted = true;
            displayMessage(
                `The provided word is recognised by this PDA. Please click 'Next' to see how.`,
                true,
                'pda'
            );
            this.stackContainer.classList.add('accepted');
        } else {
            // No accepting path was found, so the DFS logic gave us a bestPartial path
            this.isRejected = true;
            displayMessage(
                `The provided word is NOT recognised by this PDA. ` +
                `Click 'Next' to see how far it got before failing.`,
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
        this.step = 0;
        this.transitionIndex = 0;
        this.transitionPath = [];

        // Clear previous messages and highlights
        this.resetAllHighlighting();
        this.clearMessage();

        // Reset container colors
        this.stackContainer.classList.remove('accepted', 'rejected');
    }

    /**
     * Uses DFS to find a path from (Qo, empty stack) to (Qaccept, entire input consumed, empty stack).
     * If no full acceptance is found, we’ll store the “best partial” path that got furthest in input consumption
     * and return that at the end.
     */
    findAcceptingPath() {
        // Global visited set
        let visited = new Set();
        // This object tracks the best partial path that has consumed the most input so far
        this.bestPartial = {
            path: [],
            consumed: 0
        };

        // The array that eventually will hold the final path
        let path = [];

        const success = this.dfs(
            'Qo',        // current state
            [],          // stack
            0,           // input index
            path,        // path so far
            visited
        );

        if (success) {
            // If we reached acceptance, path is stored in this.transitionPath from the DFS
            return this.transitionPath;
        } else {
            // Return the best partial path we found
            return this.bestPartial.path.length ? this.bestPartial.path : null;
        }
    }

    /**
     * DFS backtracking
     */
    dfs(currentState, stack, inputIndex, path, visited, depth = 0) {
        const MAX_DEPTH = 2000; // Avoid infinite recursion

        // If we are at Qaccept with full input consumed and stack empty, we’ve accepted
        if (
            currentState === 'Qaccept' &&
            inputIndex === this.inputWord.length &&
            stack.length === 0
        ) {
            // Store the path as the actual path to acceptance
            this.transitionPath = [...path];
            return true;
        }

        if (depth > MAX_DEPTH) {
            return false; // Guard
        }

        // Mark visited config so we don’t loop
        const stackTop = stack[stack.length - 1] || window.EMPTY_STRING;
        const key = `${currentState},${inputIndex},${stackTop},${stack.length}`;
        if (visited.has(key)) {
            return false;
        }
        visited.add(key);

        // Each time we see that we’ve consumed more input than before, we update bestPartial
        if (inputIndex > this.bestPartial.consumed) {
            // Save a copy of the path
            this.bestPartial.consumed = inputIndex;
            this.bestPartial.path = [...path];
        }

        // Current input symbol (or ε if we’re at end)
        const inputSymbol = this.inputWord[inputIndex] || window.EMPTY_STRING;

        // Gather all transitions from current state that might match inputSymbol or ε
        const possibleTransitions = this.findTransitions(currentState, inputSymbol, stackTop, inputIndex);

        // Shuffle them if you want random order, or keep as-is. (We do not necessarily need random.)
        // possibleTransitions = this.shuffleArray(possibleTransitions);

        // For each possible transition, apply it and recurse
        for (let transition of possibleTransitions) {
            // Clone stack
            let newStack = [...stack];

            // Pop?
            if (transition.stackTop !== window.EMPTY_STRING) {
                newStack.pop();
            }

            // Push?
            if (transition.stackPush !== window.EMPTY_STRING) {
                let symbolsToPush = transition.stackPush.split('');
                // Typically reverse if fromState != Qo, depending on how your app wants it:
                if (transition.fromState !== 'Qo') {
                    symbolsToPush.reverse();
                }
                symbolsToPush.forEach(s => newStack.push(s));
            }

            // Advance input pointer if consuming a real symbol
            let newInputIndex = inputIndex;
            if (transition.input !== window.EMPTY_STRING) {
                newInputIndex++;
            }

            // Extend the path
            let newPath = [...path, transition];

            // Recurse
            let found = this.dfs(transition.toState, newStack, newInputIndex, newPath, visited, depth + 1);
            if (found) {
                // If we found an accepting path, bubble success upward
                return true;
            }
            // If not, backtrack (implicit with our cloned copies)
        }

        // If no transitions lead to acceptance, fail
        return false;
    }

    // Step forward once in the discovered transitionPath
    nextPdaStep() {
        if (this.transitionIndex >= this.transitionPath.length) {
            // No more transitions to show
            this.nextStepButton.style.display = 'none';

            // If we did not accept, highlight the final node in red
            if (!this.isAccepted) {
                // Current node border = red
                d3.select(`#${this.currentState}`)
                  .select('ellipse')
                  .style('stroke', 'red')
                  .style('stroke-width', '3')
                  .style('fill', 'white');

                d3.select(`#${this.currentState}`)
                  .selectAll('text, tspan')
                  .style('fill', 'black');

                // Qaccept interior = red
                d3.select('#Qaccept')
                  .select('ellipse')
                  .style('fill', 'red');

                // Make Qaccept label white
                d3.select('#Qaccept')
                  .selectAll('text, tspan')
                  .style('fill', 'white');
            }
            return;
        }

        // Otherwise, take the next transition in our stored path
        let transition = this.transitionPath[this.transitionIndex];

        // Un-highlight whatever was previous
        this.resetHighlighting();

        // Highlight the transition
        this.highlightTransition(transition);

        // Update the state
        this.previousState = this.currentState;
        this.currentState = transition.toState;

        // Update the stack
        if (transition.stackTop !== window.EMPTY_STRING) {
            this.stack.pop();
        }
        if (transition.stackPush !== window.EMPTY_STRING) {
            const symbolsToPush = transition.stackPush.split('');
            if (transition.fromState !== 'Qo') {
                symbolsToPush.reverse();
            }
            symbolsToPush.forEach(symbol => this.stack.push(symbol));
        }

        // Consume input symbol
        if (transition.input !== window.EMPTY_STRING) {
            this.currentInputIndex++;
        }

        // Highlight the new state
        this.highlightState(this.currentState);

        // Move pointer
        this.transitionIndex++;

        // Update the stack display and input visualization
        this.displayStack();
        this.updateWordVisualization();

        // Check acceptance condition
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
     * Finds transitions from the current configuration that can match
     * (state, inputSymbol/ε, stackTop/ε).
     * Also includes a small logic that checks if pushing more terminals
     * would not exceed the input length, as in your original approach.
     */
    findTransitions(currentState, inputSymbol, stackTop, inputIndex) {
        let possibleTransitions = this.pdaTransitions.filter(trans =>
            trans.fromState === currentState &&
            (trans.input === inputSymbol || trans.input === window.EMPTY_STRING) &&
            (trans.stackTop === stackTop || trans.stackTop === window.EMPTY_STRING)
        );

        // Additional check: if we push more terminals than the user’s input has left, skip it
        // so we don't get stuck in silly expansions.
        possibleTransitions = possibleTransitions.filter(transition => {
            let terminalsInStack = this.countTerminalsInStack();
            let terminalsInPush = this.countTerminalsInString(transition.stackPush);
            return (inputIndex + terminalsInStack + terminalsInPush) <= this.inputWord.length;
        });

        return possibleTransitions;
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

    // --- Visual Updates below here ---

    displayStack() {
        this.stackContainer.innerHTML = ''; // Clear previous stack

        const stackLabel = document.createElement('p');
        stackLabel.classList.add('stack-label');
        stackLabel.textContent = 'Stack:';
        this.stackContainer.appendChild(stackLabel);

        // Show the current stack top at the bottom (or top, depending on your UI preference)
        for (let i = 0; i < this.stack.length; i++) {
            const stackElement = document.createElement('div');
            stackElement.classList.add('stack-element');
            stackElement.textContent = this.stack[i];
            this.stackContainer.appendChild(stackElement);
        }
    }

    displayWord() {
        this.wordContainer.innerHTML = ''; // Clear previous word

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
        // Fill that state’s ellipse with the color
        d3.select(`#${stateId}`)
            .select('ellipse')
            .style('fill', color);

        // Change text color to white for contrast
        d3.select(`#${stateId}`)
            .selectAll('text, tspan')
            .style('fill', 'white');

        this.previousState = stateId;
    }

    highlightTransition(transition, color = '#2861ff') {
        if (transition?.transitionId) {
            d3.select(`#${transition.transitionId}`)
                .selectAll('path, polygon')
                .style('stroke', color);
            this.previousTransition = transition.transitionId;
        }
    }

    resetHighlighting() {
        // Reset the previously highlighted state
        if (this.previousState) {
            d3.select(`#${this.previousState}`)
                .select('ellipse')
                .style('fill', 'white');

            d3.select(`#${this.previousState}`)
                .selectAll('text, tspan')
                .style('fill', 'black');
        }

        // Reset the previously highlighted transition
        if (this.previousTransition) {
            d3.select(`#${this.previousTransition}`)
                .selectAll('path, polygon')
                .style('stroke', 'black');
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

        // Reset all labels
        d3.selectAll('.edge')
            .selectAll('text')
            .style('fill', 'black');
    }

    clearMessage() {
        const messageContainer = document.getElementById('pda-message');
        if (messageContainer) {
            messageContainer.textContent = '';
        }
    }

    // Optional: if you want transitions in random order
    shuffleArray(array) {
        let currentIndex = array.length, randomIndex;
        while (currentIndex !== 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }
        return array;
    }
}
