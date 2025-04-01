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
        // Reset everything
        this.resetSimulation();

        // Grab the user’s input
        this.inputWord = document.getElementById('sharedWordInput').value.trim();

        // Attempt to find a full accepting path
        this.transitionPath = this.findAcceptingPath();

        if (this.transitionPath) {
          // If we found a path to Qaccept, mark it accepted
          this.isAccepted = true;
          displayMessage(
            `The provided word is recognised by this PDA. Please click 'Next' to see how.`,
            true,
            'pda'
          );
          this.stackContainer.classList.add('accepted');
        } else {
          // If there is no accepting path, build a partial path of valid transitions
          this.transitionPath = this.findPartialPath();

          // Mark it rejected, but still allow stepping
          this.isRejected = true;
          displayMessage(
            `The provided word is NOT recognised by this PDA. ` +
            `Please click 'Next' to see how far it got before failing.`,
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

    findPartialPath() {
        let path = [];
        let currentState = 'Qo';
        let stack = [];
        let inputIndex = 0;

        while (true) {
          // If we’re in Qaccept with empty stack and fully consumed input,
          // we’d have accepted. But since we’re in partial mode, just break
          if (currentState === 'Qaccept' && stack.length === 0 && inputIndex === this.inputWord.length) {
            break;
          }

          const inputSymbol = this.inputWord[inputIndex] || window.EMPTY_STRING;
          const stackTop = stack[stack.length - 1] || window.EMPTY_STRING;
          const possibleTransitions = this.findTransitions(currentState, inputSymbol, stackTop, inputIndex);

          if (possibleTransitions.length === 0) {
            // No moves → done building partial path
            break;
          }

          // Just pick the first possible transition
          const t = possibleTransitions[0];

          // Push it onto the path
          path.push(t);

          // Update state and stack
          currentState = t.toState;
          if (t.stackTop !== window.EMPTY_STRING) {
            stack.pop();
          }
          if (t.stackPush !== window.EMPTY_STRING) {
            const symbolsToPush = t.stackPush.split('');
            if (t.fromState !== 'Qo') {
                symbolsToPush.reverse();
            }
            // const symbolsToPush = t.stackPush.split('').reverse();
            symbolsToPush.forEach(s => stack.push(s));
          }

          if (t.input !== window.EMPTY_STRING) {
            inputIndex++;
          }
        }

        return path;
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
                const symbolsToPush = transition.stackPush.split('');
                if (transition.fromState !== 'Qo') {
                    symbolsToPush.reverse();
                }
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
          // No more transitions to show
          this.nextStepButton.style.display = 'none';

          // If we did not accept, color the current node border red,
          // and fill Qaccept with red
          if (!this.isAccepted) {
            // Current node border = red
            d3.select(`#${this.currentState}`)
              .select('ellipse')
              .style('stroke', 'red')
              .style('stroke-width', '3')    // or whatever thickness you like
              .style('fill', 'white');       // keep interior white

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

        // Otherwise, take the next transition and highlight it
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
            const symbolsToPush = transition.stackPush.split('');
            if (transition.fromState !== 'Qo') {
                symbolsToPush.reverse();
            }
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
            displayMessage(`The PDA accepts the word '${this.inputWord}'.`, true, 'pda');
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

    clearMessage() {
        const messageContainer = document.getElementById('pda-message');
        if (messageContainer) {
            messageContainer.textContent = '';
        }
    }
}
