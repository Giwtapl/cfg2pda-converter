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
        this.step = 0; // Add a step counter to track the simulation progress

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
    }

    startPdaTest() {
        // Reset the simulation state
        this.resetSimulation();

        // Get the input word from the shared input field
        this.inputWord = document.getElementById('sharedWordInput').value.trim();

        // Display the word and stack
        this.displayWord();
        this.displayStack();

        // Highlight the initial state
        this.highlightState(this.currentState);

        // Show the Next button
        this.nextStepButton.style.display = 'block';
    }

    resetSimulation() {
        this.currentState = 'Qstart';
        this.stack = [];
        this.currentInputIndex = 0;
        this.isAccepted = false;
        this.isRejected = false;
        this.previousState = null;
        this.previousTransition = null;
        this.step = 0; // Reset the step counter

        // Clear previous messages and highlights
        this.resetHighlighting();
        this.clearMessage();
    }

    nextPdaStep() {
        if (this.isAccepted || this.isRejected) {
            return;
        }

        // Perform the next transition
        let result = this.performNextTransition();

        if (result === 'accepted') {
            this.isAccepted = true;
            this.highlightState(this.currentState, 'green');
            this.displayMessage(`The PDA accepts the word '${this.inputWord}'.`, true);
            this.nextStepButton.style.display = 'none';
        } else if (result === 'rejected') {
            this.isRejected = true;
            this.highlightState(this.currentState, 'red');
            this.displayMessage(`The PDA does not accept the word '${this.inputWord}'.`, false);
            this.nextStepButton.style.display = 'none';
        } else {
            // Continue to next step
            this.displayStack();
            this.updateWordVisualization();
        }
    }

    performNextTransition() {
        let inputSymbol = this.inputWord[this.currentInputIndex] || '';
        let stackTop = this.stack[this.stack.length - 1] || '';

        // Find possible transitions
        let possibleTransitions = this.findTransitions(this.currentState, inputSymbol, stackTop);

        if (possibleTransitions.length === 0) {
            // Try epsilon transitions
            possibleTransitions = this.findTransitions(this.currentState, '', stackTop);
        }

        if (possibleTransitions.length > 0) {
            // For this simulation, we'll proceed step by step, so we pick the first valid transition
            const transition = possibleTransitions[0];

            // Update previous state and transition
            this.resetHighlighting();

            // Highlight current transition
            this.highlightTransition(transition);

            // Update PDA state
            this.previousState = this.currentState;
            this.currentState = transition.toState;

            // Update stack
            if (transition.stackTop !== '') {
                this.stack.pop();
            }
            if (transition.stackPush !== '') {
                const symbolsToPush = transition.stackPush.split('').reverse();
                symbolsToPush.forEach(symbol => this.stack.push(symbol));
            }

            // Consume input symbol if not epsilon
            if (transition.input !== '') {
                this.currentInputIndex++;
            }

            // Highlight current state
            this.highlightState(this.currentState);

            // Increment the step counter
            this.step++;

            // Check for acceptance
            if (this.currentState === 'Qaccept' && this.stack.length === 0) {
                return 'accepted';
            }

            return 'continue';
        } else {
            return 'rejected';
        }
    }

    findTransitions(currentState, inputSymbol, stackTop) {
        return this.pdaTransitions.filter(trans =>
            trans.fromState === currentState &&
            (trans.input === inputSymbol || trans.input === '') &&
            (trans.stackTop === stackTop || trans.stackTop === '')
        );
    }

    displayStack() {
        this.stackContainer.innerHTML = ''; // Clear previous stack

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
            .style('fill', 'white'); // Or any color that contrasts with the fill

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
        matchingLabel.style.fill = color;
    }

    displayMessage(message, success) {
        let messageContainer = document.getElementById('pda-message');
        if (!messageContainer) {
            messageContainer = document.createElement('div');
            messageContainer.id = 'pda-message';
            messageContainer.classList.add('pda-message');
            document.querySelector('#pdaArea .rounded-container').appendChild(messageContainer);
        }
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
