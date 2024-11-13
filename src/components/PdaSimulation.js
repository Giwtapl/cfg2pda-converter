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

        // PDA transitions data
        this.pdaTransitions = pdaTransitions;

        // DOM elements
        this.stackContainer = document.getElementById('stack-container');
        this.wordContainer = document.getElementById('word-container');
        this.nextStepButton = document.getElementById('next-step');
        this.testPdaButton = document.getElementById('btn-testpda');

        // Bind event listeners
        this.testPdaButton.addEventListener('click', () => this.startPdaTest());
        this.nextStepButton.addEventListener('click', () => this.nextPdaStep());
    }

    // Start the PDA test
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

    // Reset the simulation state
    resetSimulation() {
        this.currentState = 'Qstart';
        this.stack = [];
        this.currentInputIndex = 0;
        this.isAccepted = false;
        this.isRejected = false;
        this.previousState = null;
        this.previousTransition = null;

        // Clear previous messages and highlights
        this.resetHighlighting();
        this.clearMessage();
    }

    // Perform the next step in the PDA simulation
    nextPdaStep() {
        if (this.isAccepted || this.isRejected) {
            return;
        }

        // Perform the next transition
        let result = this.performNextTransition();

        if (result === 'accepted') {
            this.isAccepted = true;
            this.highlightState(this.currentState, 'green');
            this.displayMessage(`The PDA accepts the word '${this.inputWord}'.`);
            this.nextStepButton.style.display = 'none';
        } else if (result === 'rejected') {
            this.isRejected = true;
            this.highlightState(this.currentState, 'red');
            this.displayMessage(`The PDA does not accept the word '${this.inputWord}'.`);
            this.nextStepButton.style.display = 'none';
        } else {
            // Continue to next step
            this.displayStack();
            this.updateWordVisualization();
        }
    }

    // Perform the next transition based on the current state
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
            // For simplicity, we'll take the first valid transition
            const transition = possibleTransitions[0];

            // Update previous state and transition
            this.resetHighlighting();

            // Highlight current transition
            this.highlightTransition(transition.transitionId);

            // Update PDA state
            this.previousState = this.currentState;
            this.currentState = transition.toState;

            // Update stack
            if (transition.stackTop !== '') {
                this.stack.pop();
            }
            if (transition.stackPush !== '') {
                // For multiple symbols, push them individually
                const symbolsToPush = transition.stackPush.split('').reverse();
                symbolsToPush.forEach(symbol => this.stack.push(symbol));
            }

            // Consume input symbol if not epsilon
            if (transition.input !== '') {
                this.currentInputIndex++;
            }

            // Highlight current state
            this.highlightState(this.currentState);

            // Check for acceptance
            if (this.currentState === 'Qaccept') {
                return 'accepted';
            }

            return 'continue';
        } else {
            return 'rejected';
        }
    }

    // Find valid transitions from the current state
    findTransitions(currentState, inputSymbol, stackTop) {
        return this.pdaTransitions.filter(trans => 
            trans.fromState === currentState &&
            (trans.input === inputSymbol || trans.input === '') &&
            (trans.stackTop === stackTop || trans.stackTop === '')
        );
    }

    // Display the stack visualization
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

    // Display the word visualization
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

    // Update the word visualization to indicate the current input symbol
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

    // Highlight a state in the PDA graph
    highlightState(stateId, color = 'lightblue') {
        // Reset previous state
        if (this.previousState) {
            d3.select(`#${this.previousState}`)
                .select('ellipse')
                .style('fill', 'white')
                .attr('transform', 'scale(1)');
        }

        // Highlight current state
        d3.select(`#${stateId}`)
            .select('ellipse')
            .style('fill', color)
            .attr('transform', 'scale(1.2)');

        this.previousState = stateId;
    }

    // Highlight a transition in the PDA graph
    highlightTransition(transitionId, color = 'lightblue') {
        // Reset previous transition
        if (this.previousTransition) {
            d3.select(`#${this.previousTransition}`)
                .select('path')
                .style('stroke', 'black')
                .attr('transform', 'scale(1)');
        }

        // Highlight current transition
        d3.select(`#${transitionId}`)
            .select('path')
            .style('stroke', color)
            .attr('transform', 'scale(1.2)');

        this.previousTransition = transitionId;
    }

    // Reset highlighting of states and transitions
    resetHighlighting() {
        // Reset previous state
        if (this.previousState) {
            d3.select(`#${this.previousState}`)
                .select('ellipse')
                .style('fill', 'white')
                .attr('transform', 'scale(1)');
        }

        // Reset previous transition
        if (this.previousTransition) {
            d3.select(`#${this.previousTransition}`)
                .select('path')
                .style('stroke', 'black')
                .attr('transform', 'scale(1)');
        }
    }

    // Display a message to the user
    displayMessage(message) {
        let messageContainer = document.getElementById('pda-message');
        if (!messageContainer) {
            messageContainer = document.createElement('div');
            messageContainer.id = 'pda-message';
            messageContainer.classList.add('pda-message');
            document.querySelector('#pdaArea .rounded-container').appendChild(messageContainer);
        }
        messageContainer.textContent = message;
    }

    // Clear any existing messages
    clearMessage() {
        const messageContainer = document.getElementById('pda-message');
        if (messageContainer) {
            messageContainer.textContent = '';
        }
    }
}
