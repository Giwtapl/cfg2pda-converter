import { Production } from './production.js';

export class Rule {
    static instances = [];
    PARENT_ID = 'user-input';

    constructor(index, varLetter, refererProd) {
        this.index = index;
        this.id = `rule-${this.index}`;
        this.productions = [];
        this.productionIndex = 0;
        this.refererProductions = [];
        this.addReferer(refererProd);
        this.varLetter = varLetter;

        this.createNew(varLetter);
        this.addProduction();
        Rule.instances.push(this);
    }

    createNew(varLetter) {
        // Create the main rule container
        const ruleDiv = document.createElement('div');
        ruleDiv.id = this.id;
        ruleDiv.classList.add('rule');

        // Create the <span> element that shows the variable, e.g. "S →"
        const spanElement = document.createElement('span');
        spanElement.classList.add('var');
        if (window.isMobile.any()) {
            spanElement.classList.add('fs-1');
        }
        // Use HTML entity for the arrow
        spanElement.innerHTML = `${varLetter} &rarr; `;

        // Container for all productions
        const productionsDiv = document.createElement('div');
        productionsDiv.id = `production-container-${this.index}`;
        // (Here’s the key: let it be a flex container that can wrap)
        productionsDiv.classList.add('productions', 'd-flex', 'flex-wrap', 'gap-2');

        // Create the plus ("+") button
        const plusButtonElement = document.createElement('button');
        plusButtonElement.id = `plus-rule-${this.index}`;
        plusButtonElement.classList.add('btn', 'add-rule-production');
        // plusButtonElement.textContent = '+';
        plusButtonElement.addEventListener('click', this.plusBtnHandler.bind(this));

        // Create the minus ("−") button
        const minusButtonElement = document.createElement('button');
        minusButtonElement.id = `minus-rule-${this.index}`;
        minusButtonElement.classList.add('btn', 'remove-rule-production');
        // minusButtonElement.textContent = '–';
        minusButtonElement.addEventListener('click', this.minusBtnHandler.bind(this));
        minusButtonElement.style.display = 'none';

        // Create a wrapper for “the last production + plus/minus buttons”
        const lastGroupDiv = document.createElement('div');
        // .d-inline-flex + .text-nowrap ensures they stay together on one line
        lastGroupDiv.classList.add('d-inline-flex', 'text-nowrap', 'gap-2');

        // Put both buttons inside that wrapper
        lastGroupDiv.appendChild(plusButtonElement);
        lastGroupDiv.appendChild(minusButtonElement);

        // Now add lastGroupDiv into productionsDiv
        productionsDiv.appendChild(lastGroupDiv);

        // Finally, render everything
        this.render(ruleDiv, spanElement, productionsDiv);
    }

    render(ruleDiv, spanElement, productionsDiv) {
        const userInputEl = document.getElementById(this.PARENT_ID);
        userInputEl.appendChild(ruleDiv);
        ruleDiv.appendChild(spanElement);
        ruleDiv.appendChild(productionsDiv);
    }

    plusBtnHandler(event) {
        // Insert a vertical bar ("|") as a separator
        const spanElement = document.createElement('span');
        spanElement.classList.add('prod-sep');
        spanElement.textContent = ' | ';

        const productionsDiv = document.getElementById(`production-container-${this.index}`);
        // Insert that separator just before our .d-inline-flex (the last group)
        const lastGroupDiv = productionsDiv.querySelector('.d-inline-flex.text-nowrap');
        productionsDiv.insertBefore(spanElement, lastGroupDiv);

        this.addProduction();

        if (this.productions.length > 1) {
            // Show the minus button
            const minusBtn = document.getElementById(`minus-rule-${this.index}`);
            minusBtn.style.display = 'block';
        }
    }

    minusBtnHandler(event) {
        // Remove the last production from this.productions array
        const lastProd = this.productions.pop();
        lastProd.remove();
        this.updateProductionIndex();

        // Also remove the preceding prod-sep if there is one
        const productionsDiv = document.getElementById(`production-container-${this.index}`);
        const lastSep = productionsDiv.querySelector('.prod-sep:last-of-type');
        if (lastSep) {
            lastSep.remove();
        }

        if (this.productions.length <= 1) {
            event.target.style.display = 'none';
        }
    }

    addProduction() {
        const newProd = new Production(this.index, this.productions.length + 1, this);
        this.productions.push(newProd);
        this.updateProductionIndex();
    }

    addReferer(refererProdId) {
        if (refererProdId) {
            this.refererProductions.push(refererProdId);
        }
    }

    removeReferer(refererProdId) {
        this.refererProductions = this.refererProductions.filter(refProdId => refProdId !== refererProdId);
    }

    remove() {
        if (this.index === 1) return;
        const ruleEl = document.getElementById(this.id);
        ruleEl.remove();

        // Remove this Rule instance from the static array
        Rule.instances = Rule.instances.filter(rule => rule !== this);
    }

    updateProductionIndex() {
        this.productionIndex = this.productions.length;
    }
}
