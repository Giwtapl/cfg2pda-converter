import {Rule} from '../entities/rule.js';


const isUpperCase = letter => /^[A-Z]$/.test(letter);

function findExtraDeletedCharacter(str1, str2) {
    // Determine the longer and shorter strings
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    for (let i = 0; i < shorter.length; i++) {
      if (str1[i] !== str2[i]) {
        return longer[i];
      }
    }

    // If no extra character is found in the loop, the extra character is at the end of the longer string
    return longer[longer.length - 1];
}

const getCurrentRule = expressionEl => rules.filter(rule => rule.index === +expressionEl.parentElement.id.split('-')[2])[0];

export function inputHandler(event) {
    const inputValue = event.target.value;
    const currentChar = event.data;
    const currentRule = getCurrentRule(event.target);
    const currentExpression = currentRule.expressions.filter(expr => expr.id === event.target.id)[0];

    if (currentChar) {
        if (!isUpperCase(currentChar)) {
            currentExpression.previousInputValue = inputValue;
            return;
        }
        let matchingRule;
        for (const rule of rules) {
            if (rule.varLetter === currentChar) {
                matchingRule = rule;
                break;
            }
        }

        if (matchingRule) {
            matchingRule.addReferer(event.target.id)
        } else {
            const rule = new Rule(rules.length + 1, currentChar);
            rule.addReferer(event.target.id);
            rules.push(rule);
        }
    } else {
        const deletedLetter = findExtraDeletedCharacter(currentExpression.previousInputValue, inputValue);
        if (isUpperCase(deletedLetter)) {
            const rule = rules.filter(rule => rule.varLetter === deletedLetter)[0];
            rule.removeReferer(event.target.id);
            if (currentRule.varLetter !== deletedLetter && rule.refererExpressions.length === 0) {
                rule.remove();
            }
        }
    }
    currentExpression.previousInputValue = inputValue;
}