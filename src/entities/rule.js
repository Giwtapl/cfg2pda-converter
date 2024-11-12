import { Production } from './production.js';

export class Rule {
    static instances = []; // Static array to keep track of all Rule instances
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
        // Create the main <div> with the id and class
        const ruleDiv = document.createElement('div');
        ruleDiv.id = this.id;
        ruleDiv.classList.add('rule');

        // Create the <span> element with the class and text content
        const spanElement = document.createElement('span');
        spanElement.classList.add('var');
        spanElement.innerHTML = `${varLetter} &rarr; `;

        // Create the main <div> with the id and class
        const productionsDiv = document.createElement('div');
        productionsDiv.id = `production-container-${this.index}`;
        productionsDiv.classList.add('productions');

        // Create the <button> elements with ids, classes, and event listeners
        const plusButtonElement = document.createElement('button');
        plusButtonElement.id = `plus-rule-${this.index}`;
        plusButtonElement.classList.add('btn', 'add-rule-production');
        plusButtonElement.addEventListener('click', this.plusBtnHandler.bind(this));

        const minusButtonElement = document.createElement('button');
        minusButtonElement.id = `minus-rule-${this.index}`;
        minusButtonElement.classList.add('btn', 'remove-rule-production');
        minusButtonElement.addEventListener('click', this.minusBtnHandler.bind(this));
        minusButtonElement.style.display = 'none';

        this.render(ruleDiv, spanElement, productionsDiv, plusButtonElement, minusButtonElement);
    }

    render(ruleDiv, spanElement, productionsDiv, plusButtonElement, minusButtonElement) {
        const userInputEl = document.getElementById(this.PARENT_ID);
        userInputEl.appendChild(ruleDiv);
        ruleDiv.appendChild(spanElement);
        ruleDiv.appendChild(productionsDiv);
        productionsDiv.appendChild(plusButtonElement);
        productionsDiv.appendChild(minusButtonElement);
    }

    plusBtnHandler(event) {
        const spanElement = document.createElement('span');
        spanElement.classList.add('prod-sep');
        spanElement.textContent = ' | ';
        event.target.parentElement.insertBefore(spanElement, event.target);
        this.addProduction();
        if (this.productions.length > 1) {
            event.target.nextElementSibling.style.display = 'block';
        }
    }

    minusBtnHandler(event) {
        const lastProd = this.productions.pop();
        lastProd.remove();
        this.updateProductionIndex();
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
