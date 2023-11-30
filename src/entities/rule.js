import {Production} from './production.js';


export class Rule {
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

        // Create the <button> element with the id, class, and text content
        const plusButtonElement = document.createElement('button');
        plusButtonElement.id = `plus-rule-${this.index}`;
        plusButtonElement.classList.add('btn', 'add-rule-production');
        plusButtonElement.textContent = '+';
        plusButtonElement.addEventListener('click', this.plusBtnHandler.bind(this));

        const minusButtonElement = document.createElement('button');
        minusButtonElement.id = `minus-rule-${this.index}`;
        minusButtonElement.classList.add('btn', 'remove-rule-production');
        minusButtonElement.textContent = '-';
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
        this.addProduction(this.productionIndex + 1);
        if (this.productions.length > 1) {
            event.target.nextElementSibling.style.display = 'block';
        }
    }

    minusBtnHandler(event) {
        const prodToRemove = this.productions[this.productionIndex - 1];
        const prodToRemoveElement = document.getElementById(prodToRemove.id);
        prodToRemoveElement.value = '';
        const inputEvent = new Event('input', { bubbles: true });
        prodToRemoveElement.dispatchEvent(inputEvent);
        prodToRemove.remove();
        this.productions = this.productions.filter(prod => prod.id !== prodToRemove.id);
        this.updateProductionIndex();
        if (this.productions.length <= 1) {
            event.target.style.display = 'none';
        }
    }

    addProduction() {
        this.productions.push(new Production(this.index,  this.productions.length + 1));
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
        const ruleEl = document.getElementById(`rule-${this.index}`);
        ruleEl.remove();
    }

    removeProduction(prodIndex) {
        this.productions.splice(prodIndex - 1, 1);
    }

    assignInputListener() {
        for (const prod of this.productions) {
            const inputEl = document.getElementById(prod.id);
        }
    }

    updateProductionIndex() {
        this.productionIndex = this.productions.length;
    }
}