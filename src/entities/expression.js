import {inputHandler} from '../utilities/tools.js';


export class Expression {
    PARENT_ID_TEMPLATE = 'expression-container';

    constructor(ruleIndex, exprIndex) {
        this.ruleIndex = ruleIndex;
        this.exprIndex = exprIndex;
        this.create();
    }

    create() {
        this.id = `input-rule-${this.ruleIndex}-expr-${this.exprIndex}`;
        // Create the <input> element with the type and id
        const inputElement = document.createElement('input');
        inputElement.type = 'text';
        inputElement.id = this.id;
        inputElement.classList.add('input-text');
        inputElement.addEventListener('input', inputHandler);

        const expressionContainerEl = document.getElementById(`${this.PARENT_ID_TEMPLATE}-${this.ruleIndex}`);
        const rulePlusBtnEl = document.getElementById(`plus-rule-${this.ruleIndex}`);
        expressionContainerEl.insertBefore(inputElement, rulePlusBtnEl);
    }

    remove() {
        const expressionEl = document.getElementById(`input-rule-${this.ruleIndex}-expr-${this.exprIndex}`);
        const expressionSeparatorElements = document.getElementsByClassName('expr-sep')
        const adjacentExprSepEl = expressionSeparatorElements[expressionSeparatorElements.length - 1];
        adjacentExprSepEl.remove();
        expressionEl.remove();
    }
}