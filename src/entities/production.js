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

        // Create the production input
        const inputElement = document.createElement('input');
        inputElement.type = 'text';
        inputElement.id = this.id;
        inputElement.placeholder = window.EMPTY_STRING;
        inputElement.classList.add('input-text', 'input-text--rule');

        if (window.isMobile.any()) {
            inputElement.classList.add('fs-3');
        }
        inputElement.addEventListener('input', inputEventHandler);

        // Add Tab / Shift+Tab logic
        inputElement.addEventListener('keydown', (event) => {
            if (event.key === 'Tab' && !event.shiftKey) {
                // Tab => Add a new production to the same rule
                event.preventDefault();
                const plusButton = document.getElementById(`plus-rule-${this.ruleIndex}`);
                this.parentRule.plusBtnHandler({ target: plusButton });

                // Focus on the newest production's input
                const latestProd = this.parentRule.productions[this.parentRule.productions.length - 1];
                const newInputEl = document.getElementById(latestProd.id);
                newInputEl.focus();
            } else if (event.key === 'Tab' && event.shiftKey) {
                // Shift+Tab => jump to next rule's empty production
                event.preventDefault();

                const currentRuleIndex = Rule.instances.indexOf(this.parentRule);
                const nextRule = Rule.instances[currentRuleIndex + 1];
                if (nextRule) {
                    const emptyProd = nextRule.productions.find(prod => {
                        const inputEl = document.getElementById(prod.id);
                        return inputEl && inputEl.value === '';
                    });
                    if (emptyProd) {
                        document.getElementById(emptyProd.id).focus();
                    } else {
                        // If no empty production, add a new one
                        const plusBtnEl = document.getElementById(`plus-rule-${nextRule.index}`);
                        nextRule.plusBtnHandler({ target: plusBtnEl });
                        const latestProd = nextRule.productions[nextRule.productions.length - 1];
                        document.getElementById(latestProd.id).focus();
                    }
                }
            }
        });

        // Insert this new input into production-container, just before the .d-inline-flex group
        const productionContainerEl = document.getElementById(`${this.PARENT_ID_TEMPLATE}-${this.ruleIndex}`);
        const lastGroupDiv = productionContainerEl.querySelector('.d-inline-flex.text-nowrap');
        productionContainerEl.insertBefore(inputElement, lastGroupDiv);
    }

    remove() {
        // Remove the input itself
        const productionEl = document.getElementById(this.id);
        if (productionEl) {
            productionEl.remove();
        }
    }
}
