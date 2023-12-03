import { Rule } from "../entities/rule.js";
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
        this.rules.forEach(rule => {
            this.cfg.push(`${rule.varLetter} -> `);
            rule.productions.forEach((prod, i, ruleProductionsArr) => {
                const addedPart = i === ruleProductionsArr.length - 1 ? `${prod.text}` : `${prod.text} | `;
                this.cfg[this.cfg.length - 1] += addedPart;
            });
        });
    }

    showInputModal() {
        this._showLoadingModal();
        this.transformInputToCfg();
        // this.cfg.validate();
        this._hideLoadingModal();
        console.log('Done button was clicked. You provided the following CFG:');
        console.log(this.cfg.join('\n'));
        // writeCfgToInputModal(this.cfg);
        // displayInputModal();
    }

    _showLoadingModal() {
        const modal = document.getElementById('loading-modal');
        modal.style.display = 'flex';
    }

    _hideLoadingModal() {
        const modal = document.getElementById('loading-modal');
        modal.style.display = 'none';
    }
}