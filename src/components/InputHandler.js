import { Cfg } from "../entities/cfg.js";
import { Rule } from "../entities/rule.js";
import { SharedInputHandler } from "./sharedInputHandler.js";
import { Cfg2PdaConverter } from "./converter.js";
import { isUpperCase } from "../utilities/tools.js";


export class InputHandler {
    constructor() {
        this.rules = [];
        this.cfg = null;
        this.isDone = false;
        this.setButtonEventListeners();
        this.setEnterKeyListener();
    }

    setButtonEventListeners() {
        const doneBtnEl = document.getElementById("btn-done");
        doneBtnEl.addEventListener('click', event => {
            this.doneBtnHandler.bind(this)(event);
        });

        const abortBtnEl = document.getElementById("btn-restart");
        abortBtnEl.addEventListener('click', () => {
            location.reload();
        });

        const convertBtn = document.getElementById('btn-convert');
        convertBtn.addEventListener('click', (event) => {
            const pdaArea = document.getElementById('pdaArea');
            pdaArea.classList.toggle('hidden');
            const converter = new Cfg2PdaConverter(window.inputHandler.cfg);
            const equivPda = converter.convert();
            equivPda.render();
            event.target.style.display = 'none';
        });
    }

    setEnterKeyListener() {
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                // Prevent default Enter key behavior
                event.preventDefault();

                // Check if there are any rules
                if (this.rules.length > 0) {
                    // Get the last rule
                    const lastRule = this.rules[this.rules.length - 1];

                    // Check if the last rule has any productions
                    if (lastRule.productions.length > 0) {
                        // Get the last production of the last rule
                        const lastProduction = lastRule.productions[lastRule.productions.length - 1];

                        // Get the input element of the last production
                        const lastProdInputEl = document.getElementById(lastProduction.id);

                        // Check if the currently focused element is the last production's input
                        if (document.activeElement === lastProdInputEl) {
                            this.doneBtnHandler(event);
                        }
                    }
                }
            }
        });
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

    doneBtnHandler() {
        if (this.isDone) return; // Prevent multiple submissions
        this.isDone = true;
        const currentProductions = Array.from(document.getElementsByClassName('input-text--rule'));
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
        this.hideDoneButton(document.getElementById('btn-done'));
        this.transformInputToCfg();

        this.hideLoadingModal();
        console.log('Done button was clicked. You provided the following CFG:');
        console.log(this.cfg.toStr());
        console.log(this.cfg.toObject());
        new SharedInputHandler();
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
        Array.from(document.getElementsByClassName('btn-primary')).forEach(buttonEl => {
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
                if (production.text === window.EMPTY_STRING) {
                    document.getElementById(production.id).value = window.EMPTY_STRING;
                }
            });
        });
    }

    disableProductionsInput() {
        Array.from(document.getElementsByClassName('input-text--rule')).forEach(productionInputEl => {
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