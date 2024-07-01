import { Rule } from "../entities/rule.js";
import { Cfg } from "../entities/cfg.js"
import { Cfg2PdaConverter } from "./converter.js";
import { isUpperCase } from "../utilities/tools.js";

export class InputHandler {
    constructor() {
        this.rules = [];
        this.cfg = [];
    }

    getRules() {
        return this.rules;
    }

    getRuleByProductionElement(productionEl) {
        return this.rules.filter(rule => rule.index === +productionEl.parentElement.id.split('-')[2])[0];
    }

    getRuleByVarLetter(varLetter) {
        return this.rules.filter(rule => rule.varLetter === varLetter)[0];
    }

    addRule(varLetter='S', refererProd=null) {
        this.rules.push(new Rule(this.rules.length + 1, varLetter, refererProd));
    }

    removeRule(ruleIndex) {
        this.rules = this.rules.filter(rule => {
            if (rule.index === ruleIndex) {
                rule.remove();
                return false;
            }
            return true;
        });
    }

    checkAndRemoveRule(currentRuleVarLetter, deletedText, productionEl) {
        deletedText.split('').forEach(char => {
            if (isUpperCase(char)) {
                const rule = this.getRuleByVarLetter(char);
                rule.removeReferer(productionEl.id);
                if (currentRuleVarLetter !== char && rule.refererProductions.length === 0) {
                    this.removeRule(rule.index);
                }
            }
        });
    }

    transformInputToCfg() {
        this.cfg = new Cfg(this.rules);
    }

    doneBtnHandler(event) {
        const currentProductions = Array.from(document.getElementsByClassName('input-text'));
        if (this.isCfgEmpty(currentProductions)) {
            alert('No CFG has been provided yet.\nPlease input the CFG rules and then press the "Done" button.');
            return;
        }
        const emptyRules = this.checkForEmptyRules();
        if (emptyRules.length) {
            alert(
                `The rules with the following starting variables: (${this.getVarLettersOfEmptyRulesInString(emptyRules)}) do not contain any non empty productions.\n` +
                'Please fill in at least one production for each rule and then press the "Done" button.'
            );
            return;
        }
        this.showLoadingModal();

        document.querySelector('.test-wrapper').classList.toggle('hidden');
        this.enableButtons();
        this.destroyPlusMinusRuleButtons();
        this.handleEmptyProductions();
        this.disableProductionsInput();
        this.hideDoneButton(event.target);
        this.transformInputToCfg();

        this.hideLoadingModal();
        console.log('Done button was clicked. You provided the following CFG:');
        console.log(this.cfg.toStr());
        console.log(this.cfg.toObject());
        for (let i = 0; i < 14; i++) {
            try {
                console.log(`Word of length ${i}:`, this.cfg.wordGenerator.generateWord(i));
            } catch(err) {
                console.log(`The provided CFG does not recognize any words of length ${i}.`)
            }
        }

        const converter = new Cfg2PdaConverter(this.cfg);
        const equivPda = converter.convert();
        equivPda.render();
    }

    isCfgEmpty(currentProductions) {
        return currentProductions.length === 1 && currentProductions[0].value === '';
    }

    checkForEmptyRules() {
        return this.rules.filter(rule => {
            const productionsNum = rule.productions.length;
            let emptyProductions = 0;
            rule.productions.forEach(production => {
                if (production.text === '') {
                    emptyProductions++;
                }
            });
            return productionsNum === emptyProductions;
        });
    }

    getVarLettersOfEmptyRulesInString(emptyRules) {
        return emptyRules.map(rule => rule.varLetter).join(', ');
    }

    enableButtons() {
        Array.from(document.getElementsByClassName('btn--primary')).forEach(buttonEl => {
            buttonEl.disabled = false;
        });
    }

    destroyPlusMinusRuleButtons() {
        for (let sign of ['add', 'remove']) {
            Array.from(document.getElementsByClassName(`${sign}-rule-production`)).forEach(buttonEl => {
                buttonEl.remove();
            });
        }
    }

    handleEmptyProductions() {
        this.rules.forEach(rule => {
            rule.productions.forEach(production => {
                if (production.text === '') {
                    document.getElementById(production.id).value = window.EMPTY_STRING;
                }
            });
        });
    }

    disableProductionsInput() {
        Array.from(document.getElementsByClassName('input-text')).forEach(productionInputEl => {
            productionInputEl.disabled = true;
        });
    }

    hideDoneButton(doneBtnEl) {
        doneBtnEl.style.display = 'none'
    }


    showLoadingModal() {
        const modal = document.getElementById('loading-modal');
        modal.style.display = 'flex';
    }

    hideLoadingModal() {
        const modal = document.getElementById('loading-modal');
        modal.style.display = 'none';
    }
}