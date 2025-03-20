import { Rule } from './rule.js';
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
        if (window.isMobile.any()) {
            inputElement.classList.add('fs-3');
        }
        inputElement.addEventListener('input', inputEventHandler);

        // Add keydown event listener for Tab and Shift+Tab keys
        inputElement.addEventListener('keydown', (event) => {
            if (event.key === 'Tab' && !event.shiftKey) {
                // Handle Tab (add new production to same rule)
                event.preventDefault(); // Prevent default Tab behavior
                const plusButton = document.getElementById(`plus-rule-${this.ruleIndex}`);
                this.parentRule.plusBtnHandler({ target: plusButton });
                // Focus on the new production's input field
                const latestProd = this.parentRule.productions[this.parentRule.productions.length - 1];
                const newInputEl = document.getElementById(latestProd.id);
                newInputEl.focus();
            } else if (event.key === 'Tab' && event.shiftKey) {
                // Handle Shift+Tab (move to next rule's first empty production)
                event.preventDefault();

                // Get the index of the current rule in Rule.instances
                const currentRuleIndex = Rule.instances.indexOf(this.parentRule);

                // Get the next rule
                const nextRule = Rule.instances[currentRuleIndex + 1];

                if (nextRule) {
                    // Find the first empty production input in the next rule
                    const emptyProd = nextRule.productions.find(prod => {
                        const inputEl = document.getElementById(prod.id);
                        return inputEl && inputEl.value === '';
                    });

                    if (emptyProd) {
                        const inputEl = document.getElementById(emptyProd.id);
                        inputEl.focus();
                    } else {
                        // If no empty production, add a new one
                        nextRule.plusBtnHandler({ target: document.getElementById(`plus-rule-${nextRule.index}`) });
                        const latestProd = nextRule.productions[nextRule.productions.length - 1];
                        const newInputEl = document.getElementById(latestProd.id);
                        newInputEl.focus();
                    }
                }
                // If no next rule, do nothing
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
