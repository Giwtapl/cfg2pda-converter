import { Cfg } from "../entities/cfg.js";
import { Rule } from "../entities/rule.js";
import { SharedInputHandler } from "./sharedInputHandler.js";
import { Cfg2PdaConverter } from "./converter.js";
import { isUpperCase, isGreek } from "../utilities/tools.js";


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
            const pdaArea = document.getElementById('pda-area');
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
                this.doneBtnHandler();
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

        this.displayInstructionBelowLastRule();
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
        this.removeExistingInstruction();
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
        // this.disableProductionsInput();

        this.replaceInputsWithParagraphs();

        /*  NEW: squeeze everything for the “read-only” stage */
        const rulesRoot = document.getElementById('user-input');   // #user-input is the <div class="rules" …>
        rulesRoot.classList.add('compressed');

        /* optional: the empty .d-inline-flex wrappers only held the +/– buttons.
        Now that the buttons are gone, remove the wrappers so they don't eat space. */
        document.querySelectorAll('.productions .d-inline-flex.text-nowrap')
                .forEach(w => w.remove());

        this.hideDoneButton(document.getElementById('btn-done'));
        this.transformInputToCfg();

        this.hideLoadingModal();
        console.log('Done button was clicked. You provided the following CFG:');
        console.log(this.cfg.toStr());
        console.log(this.cfg.toObject());
        new SharedInputHandler();
    }

    /**
     * Αντικαθιστά όλα τα <input> μιας παραγωγής με ένα
     * απλό <p> που δείχνει το “ενοποιημένο” RHS.
     */
    replaceInputsWithParagraphs() {
        this.rules.forEach(rule => {
            // ενοποιημένο κείμενο: ε | SS | 0S1 | 1S0 ...
            const rhs = rule.productions.map(p => p.text).join(' | ');

            // container που μέχρι τώρα είχε τα input fields
            const container = document.getElementById(
                `production-container-${rule.index}`
            );

            // εξαφανίζουμε ΟΛΑ τα children (inputs, separatοrs, κ.λπ.)
            container.innerHTML = '';

            // δημιουργούμε το <p>
            const p = document.createElement('p');
            // ό,τι inline bootstrap classes θες· παράδειγμα:
            // p.className = 'd-inline mb-0 fw-normal fs-5';
            p.className = 'd-inline mb-0 px-2 py-1 rounded fs-1';
            p.textContent = rhs;

            container.appendChild(p);
        });
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

    displayInstructionBelowLastRule() {
        this.removeExistingInstruction();

        // Create new instruction container
        const instruction = document.createElement('div');
        instruction.id = 'cfg-instruction';
        instruction.className = 'alert alert-info mt-3';
        instruction.role = 'alert';

        if (isGreek()) {
            instruction.innerHTML = `
            <div style="text-align: left; font-size: 14px;">
            <p style="margin-bottom: 0.4rem;">💡 <strong>Υπόδειξη 1:</strong> Όταν πληκτρολογείτε ένα κεφαλαίο γράμμα (A–Z) για μια μεταβλητή, δημιουργείται αυτόματα νέος κανόνας για αυτή τη μεταβλητή.</p>
            <p style="margin-bottom: 0.4rem;">💡 <strong>Υπόδειξη 2:</strong> Όταν δημιουργείτε νέα γραμμή για μια νέα μεταβλητή, συμπληρώνεται αυτόματα με τον κανόνα <variable> → ε αλλά μπορεί να τροποποιηθεί.</p>
            ${!window.isMobile.any() ? `
            <p style="margin-bottom: 0.4rem;">💡 <strong>Υπόδειξη 3:</strong> Συντομεύσεις πληκτρολογίου:</p>
            <ul style="margin-bottom: 0; padding-left: 1.2rem; list-style-type: disc;">
                <li style="margin-bottom: 0.3rem;"><kbd>Tab</kbd> → Προσθήκη νέου κανόνα για την ίδια μεταβλητή</li>
                <li style="margin-bottom: 0.3rem;"><kbd>Shift</kbd> + <kbd>Tab</kbd> → Εστίαση στον πρώτο κανόνα για την επόμενη μεταβλητή</li>
                <li style="margin-bottom: 0;"><kbd>Enter</kbd> → Ισοδύναμο με το πάτημα του κουμπιού <strong>Υποβολή</strong></li>
            </ul>
            ` : ''}
            </div>
            `;
        } else {
            instruction.innerHTML = `
            <div style="text-align: left; font-size: 14px;">
            <p style="margin-bottom: 0.4rem;">💡 <strong>Hint 1:</strong> When you type a capital letter (A–Z) for a variable, a new rule for that variable is automatically created.</p>
            <p style="margin-bottom: 0.4rem;">💡 <strong>Hint 2:</strong> When a new row is generated for a newly detected variable, it is automatically filled with the rule <variable> → ε but can be modified.</p>
            ${!window.isMobile.any() ? `
            <p style="margin-bottom: 0.4rem;">💡 <strong>Hint 3:</strong> Keyboard shortcuts:</p>
            <ul style="margin-bottom: 0; padding-left: 1.2rem; list-style-type: disc;">
                <li style="margin-bottom: 0.3rem;"><kbd>Tab</kbd> → Add a new production to the same rule</li>
                <li style="margin-bottom: 0.3rem;"><kbd>Shift</kbd> + <kbd>Tab</kbd> → Focus on the next rule's first empty production</li>
                <li style="margin-bottom: 0;"><kbd>Enter</kbd> → Equivalent to clicking the <strong>Done</strong> button</li>
            </ul>
            ` : ''}
            </div>
            `;
        }

        // Append under last rule
        const lastRule = document.querySelector('#user-input .rule:last-of-type');
        lastRule.parentNode.insertBefore(instruction, lastRule.nextSibling);
    }

    removeExistingInstruction() {
        // Remove existing instruction if any
        const existingInstruction = document.getElementById('cfg-instruction');
        if (existingInstruction) existingInstruction.remove();
    }
}