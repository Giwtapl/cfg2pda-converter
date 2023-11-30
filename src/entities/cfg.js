export class Cfg {
    constructor(variablesSet, terminalSymbolsSet, rules, startingVariable) {
        this.validate(variablesSet, terminalSymbolsSet, rules, startingVariable);
        this.variablesSet = variablesSet;
        this.terminalSymbolsSet = terminalSymbolsSet;
        this.rules = rules;
        this. startingVariable = startingVariable;
    }

    validate(variablesSet, terminalSymbolsSet, rules, startingVariable) {
        if (!variablesSet.has(startingVariable)) {
            console.log(`Provided starting variable: ${startingVariable} is not in the provided variablesSet: ${variablesSet}`);
        }
    }

    display() {

    }
}