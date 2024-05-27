import { GenerateWordError } from "../utilities/exceptions.js";


export class CfgWordGenerator {
    constructor(cfg) {
        this.cfg = cfg;
        this.cfgObj = this.cfg.toObject();
        this.recursionDepth = 0;
        this.createChoicesStructure();
        this.path = [];
    }

    generateWord(length, symbol=this.cfg.rules[0].varLetter, acceptNull=false) {
        if (symbol === this.cfg.rules[0].varLetter && this.path.length === 1) {
            this.path.push({
                currentWord: symbol,
                curVar: symbol,
                validChoices: this.filterChoices(this.choicesStructure[symbol], length, acceptNull)
            })
        }

        this.path.push(this.generateWord())











        

        this.trace[this.recursionDepth] = this.choicesStructure[symbol];

        const choices = this.cfgObj[symbol];

        if (length === 0) {
            const word = this.handleZeroLengthCase(length, choices);
            this.recursionDepth--;
            return word;
        }

        const choicesStructure = this.getChoicesStructure(choices);
        const validChoices = this.filterChoices(choicesStructure, length, acceptNull);

        if (validChoices.length === 0) {
            this.recursionDepth--;
            return false;
        }

        const finalChoice = validChoices[Math.floor(Math.random() * validChoices.length)];
        this.path.push(finalChoice);
        length -= choicesStructure[finalChoice].terminals;

        let word = '';
        for (const [i, char] of Object.entries([...finalChoice])) {
            if (char in this.cfgObj) {
                const acceptNull = this.shouldAcceptNull(parseInt(i), finalChoice);
                const result = this.generateWord(length, char, acceptNull);
                if (result === false) {
                    this.recursionDepth--;
                    this.trace[this.recursionDepth]
                }
                word += result;
            } else {
                if (char !== window.EMPTY_STRING) {
                    word += char;
                }
            }
        }

        this.recursionDepth--;
        return word;
    }

    createChoicesStructure() {
        this.choicesStructure = {};
        this.cfg.vars.forEach(variable => {
            this.choicesStructure[variable] = [];
            this.cfgObj[variable].forEach(choice => {
                let terminals = 0;
                let vars = {
                    count: 0,
                    names: []
                };
                const empty = choice === window.EMPTY_STRING;
                for (const char of choice) {
                    if (this.cfg.terminals.includes(char)) {
                        terminals++;
                    } else if (this.cfg.vars.includes(char)) {
                        vars.count++;
                        vars.names.push(char);
                    }
                }
                this.choicesStructure[variable].push({ terminals, vars, empty });
            });
        });
    }

    shouldAcceptNull(index, choice) {
        let acceptNull = false;
        for (let j = index + 1; j <= choice.length - 1; j++) {
            if (choice[j] in this.cfgObj) {
                acceptNull = true;
            }
        }
        return acceptNull;
    }

    handleZeroLengthCase(length, choices) {
        const varLetterInFirstRuleProductions = Array.from(new Set(choices).intersection(new Set(Object.keys(this.cfgObj))));

        if (choices.includes(window.EMPTY_STRING)) {
            return window.EMPTY_STRING;
        } else if (varLetterInFirstRuleProductions.length) {
            return this.handleZeroLengthCase(length, this.cfgObj[varLetterInFirstRuleProductions[0]]);
        } else {
            throw new GenerateWordError();
        }
    }

    getChoicesStructure(choices) {
        const choicesStructure = {};
        choices.forEach(choice => {
            choicesStructure[choice] = {
                terminals: 0,
                vars: {
                    count: 0,
                    names: []
                },
                empty: choice === window.EMPTY_STRING
            };
            for (const char of choice) {
                if (this.cfg.terminals.includes(char)) {
                    choicesStructure[choice].terminals++;
                } else if (this.cfg.vars.includes(char)) {
                    choicesStructure[choice].vars.count++;
                    choicesStructure[choice].vars.names.push(char);
                }
            }
        });

        return choicesStructure;
    }

    filterChoices(choicesStructure, length, acceptNull) {
        const validChoices = [];
        for(const [choice, info] of Object.entries(choicesStructure)) {
            if (
                (
                    info.terminals < length
                    && info.vars.count > 0
                ) || (
                    info.terminals === length
                    && (
                        info.vars.count === 0
                        || info.vars.names.filter(varName => this.cfgObj[varName].includes(window.EMPTY_STRING)).length > 0
                    )
                ) || (
                    info.empty
                    && acceptNull
                )
            ) {
                validChoices.push(choice);
            }
        }

        return validChoices;
    }
};