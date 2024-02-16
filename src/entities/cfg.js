export class Cfg {
    constructor(rules) {
        this.rules = rules;
    }

    toObject() {
        const cfgObj = {};
        this.rules.forEach(rule => {
            cfgObj[rule.varLetter] = rule.productions.map(prod => prod.text);
        });
        return cfgObj;
    }

    toStr() {
        const listOfStrRules = [];
        this.rules.forEach(rule => {
            listOfStrRules.push(`${rule.varLetter} -> `);
            rule.productions.forEach((prod, i, ruleProductionsArr) => {
                const addedPart = i === ruleProductionsArr.length - 1 ? `${prod.text}` : `${prod.text} | `;
                listOfStrRules[listOfStrRules.length - 1] += addedPart;
            });
        });
        return listOfStrRules.join('\n');
    }

    getTerminalSymbols() {
        const terminalSymbols = new Set();
        this.rules.forEach(rule => {
            rule.productions.forEach(production => {
                const terminals = production.text.match(/[^A-Zε]/g);
                if (terminals) {
                    terminals.forEach(char => terminalSymbols.add(char));
                }
            });
        });
        return Array.from(terminalSymbols);
    }

    display() {}
}