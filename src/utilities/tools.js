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

const getCurrentRuleVarLetter = expressionEl => rules.filter(rule => rule.index === +expressionEl.parentElement.id.split('-')[2])[0].varLetter;

let previousInputValue = '';

export function inputHandler(event) {
    const inputValue = event.target.value;
    const currentChar = event.data;

    if (currentChar) {
        if (!isUpperCase(currentChar)) {
            previousInputValue = inputValue;
            return;
        }
        let matchingRule;
        for (const rule of rules) {
            if (rule.varLetter === currentChar) {
                matchingRule = rule;
                break;
            }
        }

        if (!matchingRule) {
            rules.push(new Rule(rules.length + 1, currentChar));
        }
    } else {
        const deletedLetter = findExtraDeletedCharacter(previousInputValue, inputValue);
        if (isUpperCase(deletedLetter) && getCurrentRuleVarLetter(event.target) !== deletedLetter) {
            rules.filter(rule => rule.varLetter === deletedLetter)[0].remove();
        }
    }

    previousInputValue = inputValue;
}