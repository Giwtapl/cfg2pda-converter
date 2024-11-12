import { inputEventHandler } from '../utilities/tools.js';


export class Production {
    PARENT_ID_TEMPLATE = 'production-container';

    constructor(ruleIndex, prodIndex, parentRule) {
        this.ruleIndex = ruleIndex;
        this.prodIndex = prodIndex;
        this.text = window.EMPTY_STRING;
        this.parentRule = parentRule; // Reference to the parent Rule
        this.create();
    }

    create() {
        this.id = `input-rule-${this.ruleIndex}-prod-${this.prodIndex}`;
        const inputElement = document.createElement('input');
        inputElement.type = 'text';
        inputElement.id = this.id;
        inputElement.placeholder = window.EMPTY_STRING;
        inputElement.classList.add('input-text', 'input-text--rule');
        inputElement.addEventListener('input', inputEventHandler);

        // Add keydown event listener for the Tab key
        inputElement.addEventListener('keydown', (event) => {
            if (event.key === 'Tab') {
                event.preventDefault(); // Prevent default Tab behavior
                const plusButton = document.getElementById(`plus-rule-${this.ruleIndex}`);
                this.parentRule.plusBtnHandler({ target: plusButton });
                // Focus on the new production's input field
                const latestProd = this.parentRule.productions[this.parentRule.productions.length - 1];
                const newInputEl = document.getElementById(latestProd.id);
                newInputEl.focus();
            }
        });

        const productionContainerEl = document.getElementById(`${this.PARENT_ID_TEMPLATE}-${this.ruleIndex}`);
        const rulePlusBtnEl = document.getElementById(`plus-rule-${this.ruleIndex}`);
        productionContainerEl.insertBefore(inputElement, rulePlusBtnEl);
    }

    remove() {
        const productionEl = document.getElementById(this.id);
        const adjacentProdSepEl = productionEl.previousElementSibling;
        if (adjacentProdSepEl && adjacentProdSepEl.classList.contains('prod-sep')) {
            adjacentProdSepEl.remove();
        }
        productionEl.remove();
    }
}
