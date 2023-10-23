export class Expression {
    PARENT_ID = 'expression-container';

    constructor(ruleIndex, exprIndex) {
        this.ruleIndex = ruleIndex;
        this.exprIndex = exprIndex;
        this.create();
    }

    create() {
        // Create the <input> element with the type and id
        const inputElement = document.createElement('input');
        inputElement.type = 'text';
        inputElement.id = `input-rule-${this.ruleIndex}-expr-${this.exprIndex}`;
        inputElement.classList.add('input-text');

        const expressionContainerEl = document.getElementById(this.PARENT_ID);
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