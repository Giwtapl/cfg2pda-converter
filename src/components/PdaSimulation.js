import { isLowerCase } from "../utilities/tools.js";


export class PdaSimulation {
    constructor(pdaTransitions) {
        // Simulation state variables
        this.currentState = 'Qstart';
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

        // Bind event listeners
        this.testPdaButton.addEventListener('click', () => {
            this.stackContainer.classList.remove('hidden');
            this.wordContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            this.startPdaTest();
        });
        this.nextStepButton.addEventListener('click', () => this.nextPdaStep());
        this.restartTestButton = document.getElementById('restart-test-button');
        this.restartTestButton.addEventListener('click', () => this.startPdaTest());
    }

    startPdaTest() {
        // Reset the simulation state
        this.resetSimulation();

        // Get the input word from the shared input field
        this.inputWord = document.getElementById('sharedWordInput').value.trim();

        // Find the accepting path
        this.transitionPath = this.findAcceptingPath();

        if (this.transitionPath) {
            this.isAccepted = true;
            this.displayMessage(`The provided word is recognised by this PDA. Please click 'Next' to see how.`, true);
            this.stackContainer.classList.add('accepted'); // Add CSS class to color the container green
        } else {
            this.isRejected = true;
            this.displayMessage(`The provided word is NOT recognised by this PDA. Please click 'Next' to see why.`, false);
            this.stackContainer.classList.add('rejected'); // Add CSS class to color the container red
        }

        // Display the word and stack
        this.displayWord();
        this.displayStack();

        // Highlight the initial state
        this.highlightState(this.currentState);

        // Show the Next button
        this.nextStepButton.style.display = 'block';
        this.restartTestButton.style.display = 'block';
    }

    resetSimulation() {
        this.currentState = 'Qstart';
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
        this.resetHighlighting();
        this.clearMessage();

        // Reset container colors
        this.stackContainer.classList.remove('accepted', 'rejected');
    }

    findAcceptingPath() {
        let visited = new Set();

        let initialState = this.currentState;
        let initialStack = [...this.stack];
        let initialInputIndex = this.currentInputIndex;

        let success = this.dfs(initialState, initialStack, initialInputIndex, this.transitionPath, visited);

        if (success) {
            return this.transitionPath;
        } else {
            return null;
        }
    }

    dfs(currentState, stack, inputIndex, path, visited, depth = 0) {
        const MAX_DEPTH = 1000; // Adjust as needed

        // Prevent infinite recursion by limiting the depth
        if (depth > MAX_DEPTH) {
            return false;
        }

        // Base case: Check for acceptance
        if (
            currentState === 'Qaccept' &&
            inputIndex === this.inputWord.length &&
            stack.length === 0
        ) {
            return true;
        }

        // Create a unique key for the current configuration to avoid loops
        let stackTop = stack[stack.length - 1] || window.EMPTY_STRING;
        let key = `${currentState},${inputIndex},${stackTop},${stack.length}`;

        if (visited.has(key)) {
            return false;
        }

        visited.add(key);

        // Get current input symbol
        let inputSymbol = this.inputWord[inputIndex] || window.EMPTY_STRING;

        // Find possible transitions from current state
        const possibleTransitions = this.shuffleArray(this.findTransitions(currentState, inputSymbol, stackTop, inputIndex));

        // Now for each possible transition, recursively search
        for (let transition of possibleTransitions) {
            // Clone the stack
            let newStack = [...stack];

            // Apply stack operations
            if (transition.stackTop !== window.EMPTY_STRING) {
                // Pop from stack
                newStack.pop();
            }
            if (transition.stackPush !== window.EMPTY_STRING) {
                const symbolsToPush = transition.stackPush.split('').reverse();
                symbolsToPush.forEach(symbol => newStack.push(symbol));
            }

            // Advance input index if input symbol is consumed
            let newInputIndex = inputIndex;
            if (transition.input !== window.EMPTY_STRING) {
                newInputIndex++;
            }

            // Clone the path
            let newPath = [...path, transition];

            // Recurse
            let success = this.dfs(transition.toState, newStack, newInputIndex, newPath, visited, depth + 1);

            if (success) {
                this.transitionPath = this.transitionPath.length ? this.transitionPath : newPath;
                return true;
            }

            // No need to explicitly backtrack since we used cloned variables
        }

        // No transitions led to acceptance
        return false;
    }

    // Utility function to shuffle an array (Fisher-Yates algorithm)
    shuffleArray(array) {
        let currentIndex = array.length, randomIndex;

        // While there remain elements to shuffle
        while (currentIndex !== 0) {

            // Pick a remaining element
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;

            // And swap it with the current element
            [array[currentIndex], array[randomIndex]] = [
                array[randomIndex], array[currentIndex]];
        }

        return array;
    }

    nextPdaStep() {
        if (this.transitionIndex >= this.transitionPath.length) {
            // Simulation complete
            this.nextStepButton.style.display = 'none';
            return;
        }

        // Get the next transition
        let transition = this.transitionPath[this.transitionIndex];

        // Update previous state and transition
        this.resetHighlighting();

        // Highlight current transition
        this.highlightTransition(transition);

        // Update PDA state
        this.previousState = this.currentState;
        this.currentState = transition.toState;

        // Update stack
        if (transition.stackTop !== window.EMPTY_STRING) {
            this.stack.pop();
        }
        if (transition.stackPush !== window.EMPTY_STRING) {
            const symbolsToPush = transition.stackPush.split('').reverse();
            symbolsToPush.forEach(symbol => this.stack.push(symbol));
        }

        // Consume input symbol if not epsilon
        if (transition.input !== window.EMPTY_STRING) {
            this.currentInputIndex++;
        }

        // Highlight current state
        this.highlightState(this.currentState);

        // Increment the transition index
        this.transitionIndex++;

        // Update the stack display and word visualization
        this.displayStack();
        this.updateWordVisualization();

        // Check for acceptance
        if (
            this.currentState === 'Qaccept' &&
            this.currentInputIndex === this.inputWord.length &&
            this.stack.length === 0
        ) {
            this.isAccepted = true;
            this.highlightState(this.currentState, 'green');
            this.displayMessage(`The PDA accepts the word '${this.inputWord}'.`, true);
            this.nextStepButton.style.display = 'none';
        }
    }

    findTransitions(currentState, inputSymbol, stackTop, inputIndex) {
        let possibleTransitions = this.pdaTransitions.filter(trans =>
            trans.fromState === currentState &&
            (trans.input === inputSymbol || trans.input === window.EMPTY_STRING) &&
            (trans.stackTop === stackTop || trans.stackTop === window.EMPTY_STRING)
        );

        possibleTransitions = possibleTransitions.filter(transition => {
            let terminalsInStack = this.countTerminalsInStack();
            let terminalsInPush = this.countTerminalsInString(transition.stackPush);
            return (inputIndex + terminalsInStack + terminalsInPush) <= this.inputWord.length;
        });

        return possibleTransitions;
    }

    // Helper method to count terminals in the current stack
    countTerminalsInStack() {
        let count = 0;
        for (let symbol of this.stack) {
            if (isLowerCase(symbol)) {
                count++;
            }
        }
        return count;
    }

    // Helper method to count terminals in a given string (stackPush)
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
        this.stackContainer.innerHTML = ''; // Clear previous stack

        const stackLabel = document.createElement('p');
        stackLabel.classList.add('stack-label');
        stackLabel.textContent = 'Stack:';
        this.stackContainer.appendChild(stackLabel);

        // Create stack elements
        for (let i = this.stack.length - 1; i >= 0; i--) {
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
        // Highlight current state's ellipse with new fill color and scale
        d3.select(`#${stateId}`)
            .select('ellipse')
            .style('fill', color);

        // Change the text color of the current state's label
        d3.select(`#${stateId}`)
            .selectAll('text, tspan')
            .style('fill', 'white');

        // Update the previousState tracker
        this.previousState = stateId;
    }

    highlightTransition(transition, color = '#2861ff') {
        // Highlight current transition
        if (transition?.transitionId) {
            d3.select(`#${transition.transitionId}`)
                .selectAll('path, polygon')
                .style('stroke', color);
            this.previousTransition = transition.transitionId;
            if (transition.transitionId === 'edge3') {
                this.paintQloopTransitionLabel(this.getTextContentFromLabel(transition), color);
                this.previousLabel = transition;
            }
        }
    }

    resetHighlighting() {
        // Reset previous state
        if (this.previousState) {
            d3.select(`#${this.previousState}`)
                .select('ellipse')
                .style('fill', 'white');

            d3.select(`#${this.previousState}`)
                .selectAll('text, tspan')
                .style('fill', 'black');
        }

        // Reset previous transition
        if (this.previousTransition) {
            d3.select(`#${this.previousTransition}`)
                .selectAll('path, polygon')
                .style('stroke', 'black');
        }

        // Reset previous label
        if (this.previousLabel) {
            this.paintQloopTransitionLabel(this.getTextContentFromLabel(this.previousLabel), 'black');
        }
    }

    getTextContentFromLabel(label) {
        return `${label.input || window.EMPTY_STRING}, ${label.stackTop} → ${label.stackPush}`;
    }

    paintQloopTransitionLabel(textContent, color) {
        const labels = d3.select('#edge3').selectAll('text');
        const matchingLabel = Array.from(labels._groups[0]).filter(
            textEl => textEl.textContent === textContent
        )[0];
        if (matchingLabel) {
            matchingLabel.style.fill = color;
        }
    }

    displayMessage(message, success) {
        let messageContainer = document.getElementById('pda-message');
        if (!messageContainer) {
            messageContainer = document.createElement('div');
            messageContainer.id = 'pda-message';
            messageContainer.classList.add('pda-message');
            document.querySelector('#pdaArea .rounded-container').appendChild(messageContainer);
        }
        messageContainer.textContent = '';
        const messageTextElement = document.createElement('span');
        messageTextElement.textContent = message;
        messageContainer.appendChild(messageTextElement);
        messageTextElement.classList.add(`${success ? 'success' : 'failure'}--text`);
    }

    clearMessage() {
        const messageContainer = document.getElementById('pda-message');
        if (messageContainer) {
            messageContainer.textContent = '';
        }
    }
}
