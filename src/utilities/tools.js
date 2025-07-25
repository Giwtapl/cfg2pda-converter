export const isGreek = () => document.documentElement.lang === "el";

export const isUpperCase = letter => /^[A-Z]$/.test(letter);

export const isLowerCase = letter => /^[a-z]$/.test(letter);

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

    const added = findStrDifference(inputValue, currentProduction.text);
    [...added].forEach(ch => {
      if (isUpperCase(ch)) {
        const r = window.inputHandler.getRuleByVarLetter(ch);
        r ? r.addReferer(event.target.id)
          : window.inputHandler.addRule(ch, event.target.id);
      }
    });

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
            event.target.id
        );
    }
    currentProduction.text = inputValue;
}

export function displayMessage(message, success, entity) {
    const messageContainerId = `${entity}-message`;
    const outerContainerId = entity === 'cfg' ? 'cfg-area' : 'pda-area';
    let messageContainer = document.getElementById(messageContainerId);
    if (messageContainer) {
        // remove old message
        messageContainer.remove();
    }
    messageContainer = document.createElement('div');
    messageContainer.id = messageContainerId;
    messageContainer.classList.add('mt-3', 'fs-3', 'alert', success ? 'alert-success' : 'alert-danger');
    const nthChildToAppendMessageAfter = entity === 'cfg' ? 1 : null;
    const container = document.querySelector(`#${outerContainerId} .rounded-container`);

    if (nthChildToAppendMessageAfter) {
        const referenceChild = container.children[nthChildToAppendMessageAfter];
        if (referenceChild) {
            referenceChild.after(messageContainer);
        } else {
            container.appendChild(messageContainer);
        }
    } else {
        container.appendChild(messageContainer);
    }
    messageContainer.textContent = '';
    const messageTextElement = document.createElement('span');
    messageTextElement.textContent = message;
    messageContainer.appendChild(messageTextElement);
    messageTextElement.classList.add(`${success ? 'success' : 'failure'}--text`);
}

export const minPossibleLength = (word, cfgObj) => {
    const EMPTY = window.EMPTY_STRING;     // 'ε'
    let min = 0;
    for (const ch of word) {
        if (/[A-Z]/.test(ch)) {
            if (!(cfgObj[ch]?.includes(EMPTY))) min += 1;
        } else {
            min += 1;
        }
    }
    return min;
};
