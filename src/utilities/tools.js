export const isUpperCase = letter => /^[A-Z]$/.test(letter);

function findStrDifference(str1, str2) {
    let result = '';
    const str2Set = new Set(str2);

    for (const char of str1) {
        if (!str2Set.has(char)) {
            result += char;
        }
    }

    return result;
}

export function isSubset(setA, setB) {
    for (const element of setA) {
        if (!setB.has(element)) {
            return false;
        }
    }
    return true;
}

export function inputEventHandler(event) {
    const inputValue = event.target.value;
    const currentChar = event.data;
    const currentRule = window.inputHandler.getRuleByProductionElement(event.target);
    const currentProduction = currentRule.productions.filter(prod => prod.id === event.target.id)[0];

    if (currentChar) {
        if (!isUpperCase(currentChar)) {
            currentProduction.text = inputValue;
            return;
        }
        const matchingRule = window.inputHandler.getRuleByVarLetter(currentChar);

        if (matchingRule) {
            matchingRule.addReferer(event.target.id);
        } else {
            window.inputHandler.addRule(currentChar, event.target.id);
        }
    } else {
        window.inputHandler.checkAndRemoveRule(
            currentRule.varLetter,
            findStrDifference(currentProduction.text, inputValue),
            event.target
        );
    }
    currentProduction.text = inputValue;
}