export class PdaTester {
    constructor(pda) {
        this.pda = pda;
        this.stack = ['$'];
        this.word = '';
        this.currentState = 'Qstart';
        this.visualElements = {
            stackContainer: document.getElementById('stack-container'),
            wordContainer: document.getElementById('word-container'),
            nextButton: document.getElementById('next-step')
        };

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        document.getElementById('btn-testpda').addEventListener('click', () => {
            this.startTesting();
        });

        this.visualElements.nextButton.addEventListener('click', () => {
            this.processNextStep();
        });
    }

    startTesting() {
        // Get the input word to be tested
        this.word = document.getElementById('sharedWordInput').value.trim();
        if (!this.word) {
            alert("Please provide a word to test against the PDA.");
            return;
        }

        // Reset stack and state
        this.stack = ['$'];
        this.currentState = 'Qstart';

        // Update visuals
        this.updateVisuals();

        // Highlight the starting state
        this.highlightState('Qstart', 'blue');
        this.visualElements.nextButton.style.display = 'block';
    }

    processNextStep() {
        const topStack = this.stack[this.stack.length - 1];
        const nextChar = this.word[0];
        const transition = this.pda.getNextTransition(this.currentState, nextChar, topStack);

        if (transition) {
            // Manage the stack
            this.stack.pop(); // Remove current stack symbol
            if (transition.push) {
                this.stack.push(...transition.push.split("").reverse()); // Push symbols onto stack
            }

            // Update current state
            const previousState = this.currentState;
            this.currentState = transition.target;

            // Visual updates
            this.highlightTransition(transition);
            this.highlightState(this.currentState, 'blue');
            this.unhighlightState(previousState);

            // Update the word to process
            if (transition.read === nextChar) {
                this.word = this.word.slice(1);
            }

            this.updateVisuals();

            if (this.currentState === 'Qaccept' && this.word.length === 0 && this.stack.length === 0) {
                alert("The provided PDA accepts the word.");
                this.highlightState(this.currentState, 'green');
            }
        } else {
            // No valid transition found
            this.highlightState(this.currentState, 'red');
            alert("The provided PDA does not recognize the word.");
        }
    }

    highlightState(state, color) {
        d3.select(`#state-${state}`).style('fill', color).attr('transform', 'scale(1.2)');
    }

    unhighlightState(state) {
        d3.select(`#state-${state}`).style('fill', 'black').attr('transform', 'scale(1.0)');
    }

    highlightTransition(transition) {
        d3.select(`#arrow-${transition.id}`).style('stroke', 'blue').attr('transform', 'scale(1.2)');
    }

    updateVisuals() {
        // Update stack visuals
        this.visualElements.stackContainer.innerHTML = this.stack.map(symbol => `<div class="stack-cell">${symbol}</div>`).join('');

        // Update word visuals
        this.visualElements.wordContainer.innerText = this.word;
    }
}
