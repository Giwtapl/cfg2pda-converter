import {Expression} from './expression.js';


export class Rule {
    PARENT_ID = 'user-input';

    constructor(index, varLetter='S') {
        this.index = index;
        this.expressions = [];
        this.varLetter = varLetter;
        this.createNew(varLetter);
        this.expressionIndex = 1;
    }

    createNew(varLetter) {
        this.id = `rule-${this.index}`;
        // Create the main <div> with the id and class
        const ruleDiv = document.createElement('div');
        ruleDiv.id = this.id;
        ruleDiv.classList.add('rule');

        // Create the <span> element with the class and text content
        const spanElement = document.createElement('span');
        spanElement.classList.add('var');
        spanElement.innerHTML = `${varLetter} &rarr; `;

        // Create the main <div> with the id and class
        const expressionsDiv = document.createElement('div');
        expressionsDiv.id = `expression-container-${this.index}`;
        expressionsDiv.classList.add('expressions');

        // Create the <button> element with the id, class, and text content
        const plusButtonElement = document.createElement('button');
        plusButtonElement.id = `plus-rule-${this.index}`;
        plusButtonElement.classList.add('btn', 'add-rule-expression');
        plusButtonElement.textContent = '+';
        plusButtonElement.addEventListener('click', this.plusBtnHandler.bind(this));

        const minusButtonElement = document.createElement('button');
        minusButtonElement.id = `minus-rule-${this.index}`;
        minusButtonElement.classList.add('btn', 'remove-rule-expression');
        minusButtonElement.textContent = '-';
        minusButtonElement.addEventListener('click', this.minusBtnHandler.bind(this));
        minusButtonElement.style.display = 'none';

        this.render(ruleDiv, spanElement, expressionsDiv, plusButtonElement, minusButtonElement);
    }

    render(ruleDiv, spanElement, expressionsDiv, plusButtonElement, minusButtonElement) {
        const userInputEl = document.getElementById(this.PARENT_ID);
        userInputEl.appendChild(ruleDiv);
        ruleDiv.appendChild(spanElement);
        ruleDiv.appendChild(expressionsDiv);
        expressionsDiv.appendChild(plusButtonElement);
        expressionsDiv.appendChild(minusButtonElement);
        this.addExpression(1);
    }

    plusBtnHandler(event) {
        // Create the <span> element with the class and text content
        const spanElement = document.createElement('span');
        spanElement.classList.add('expr-sep');
        spanElement.textContent = ' | ';
        event.target.parentElement.insertBefore(spanElement, event.target);
        this.addExpression(this.expressionIndex + 1);
        if (this.expressions.length > 1) {
            event.target.nextElementSibling.style.display = 'block';
        }
    }

    minusBtnHandler(event) {
        const exprToRemove = this.expressions[this.expressionIndex - 1];
        exprToRemove.remove();
        this.expressions = this.expressions.filter(expr => expr.id !== exprToRemove.id);
        if (this.expressions.length <= 1) {
            event.target.style.display = 'none';
        }
    }

    addExpression(exprIndex) {
        this.expressions.push(new Expression(this.index, exprIndex));
        this.updateExpressionIndex();
    }

    remove() {
        if (this.index === 1) return;
        const ruleEl = document.getElementById(`rule-${this.index}`);
        ruleEl.remove();
        rules = rules.filter(rule => rule.index !== this.index);
    }

    removeExpression(exprIndex) {
        this.expressions.splice(exprIndex - 1, 1);
    }

    assignInputListener() {
        for (const expr of this.expressions) {
            const inputEl = document.getElementById(expr.id);
        }
    }

    updateExpressionIndex() {
        this.expressionIndex = this.expressions.length;
    }
}