import { CfgWordGenerator } from '../components/CfgWordGenerator.js';

export class Cfg {
    constructor(rules) {
        this.rules = rules;
        this.cfgObj = this.toObject();
        this.vars = Object.keys(this.cfgObj);
        this.terminals = this.getTerminals()
        this.wordGenerator = CfgWordGenerator;
    }

    getTerminals() {
        const terminals = [];
        this.rules.forEach(rule => {
            rule.productions.forEach(production => {
                for(const char of production.text) {
                    if (!this.vars.includes(char) && !terminals.includes(char) && char !== window.EMPTY_STRING) {
                        terminals.push(char);
                    }
                }
            });
        });

        return terminals;
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

    display() { }
}