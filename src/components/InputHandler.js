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

    getRuleByExpressionElement(expressionEl) {
        return this.rules.filter(rule => rule.index === +expressionEl.parentElement.id.split('-')[2])[0];
    }

    getRuleByVarLetter(varLetter) {
        return this.rules.filter(rule => rule.varLetter === varLetter)[0];
    }

    addRule(varLetter='S', refererExpr=null) {
        this.rules.push(new Rule(this.rules.length + 1, varLetter, refererExpr));
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

    checkAndRemoveRule(currentRuleVarLetter, deletedText, expressionEl) {
        deletedText.split('').forEach(char => {
            if (isUpperCase(char)) {
                const rule = this.getRuleByVarLetter(char);
                rule.removeReferer(expressionEl.id);
                if (currentRuleVarLetter !== char && rule.refererExpressions.length === 0) {
                    this.removeRule(rule.index);
                }
            }
        });
    }

    transformInputToCfg() {
        this.rules.forEach(rule => {
            this.cfg.push(`${rule.varLetter} -> `);
            rule.expressions.forEach((expr, i, ruleExpressionsArr) => {
                const addedPart = i === ruleExpressionsArr.length - 1 ? `${expr.text}` : `${expr.text} | `;
                this.cfg[this.cfg.length - 1] += addedPart;
            });
        });
    }

    showInputModal() {
        this.transformInputToCfg();
        console.log('Done button was clicked. You provided the following CFG:');
        console.log(this.cfg.join('\n'));
        // writeCfgToInputModal(this.cfg);
        // displayInputModal();
    }
}