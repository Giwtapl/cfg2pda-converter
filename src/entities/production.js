import { inputEventHandler } from '../utilities/tools.js';


export class Production {
    PARENT_ID_TEMPLATE = 'production-container';

    constructor(ruleIndex, prodIndex) {
        this.ruleIndex = ruleIndex;
        this.prodIndex = prodIndex;
        this.text = window.EMPTY_STRING;
        this.create();
    }

    create() {
        this.id = `input-rule-${this.ruleIndex}-prod-${this.prodIndex}`;
        const inputElement = document.createElement('input');
        inputElement.type = 'text';
        inputElement.id = this.id;
        inputElement.placeholder = window.EMPTY_STRING;
        inputElement.classList.add('input-text');
        inputElement.addEventListener('input', inputEventHandler);

        const productionContainerEl = document.getElementById(`${this.PARENT_ID_TEMPLATE}-${this.ruleIndex}`);
        const rulePlusBtnEl = document.getElementById(`plus-rule-${this.ruleIndex}`);
        productionContainerEl.insertBefore(inputElement, rulePlusBtnEl);
    }

    remove() {
        const productionEl = document.getElementById(`input-rule-${this.ruleIndex}-prod-${this.prodIndex}`);
        const adjacentProdSepEl = productionEl.previousElementSibling;
        adjacentProdSepEl.remove();
        productionEl.remove();
    }
}