import { CfgTester } from "./CfgTester.js";
import { isGreek } from "../utilities/tools.js";
import { WordGenerationModal } from "./modal.js";

export class SharedInputHandler {
    constructor() {
        this.element = document.getElementById('shared-input-handler');
        this.element.style.display = 'block';
        this.testCfgBtnEl = document.getElementById('btn-testcfg');
        this.testPdaBtnEl = document.getElementById('btn-testpda');
        this.generatedWordInputEl = document.getElementById('sharedWordInput');
        this.cfgTester = new CfgTester(this.generatedWordInputEl);
        this.modal = new WordGenerationModal(this.generatedWordInputEl);
        this.setEventListeners();
        this.displayHint();
    }

    /* --------------------------------------------------
     *  UI – Hint about empty word (ε)
     * --------------------------------------------------*/
    displayHint() {
        // Avoid duplicates
        const existing = document.getElementById('word-input-hint');
        if (existing) existing.remove();

        const hint = document.createElement('div');
        hint.id = 'word-input-hint';
        hint.classList.add('alert', 'alert-info', 'mt-3');
        hint.style.fontSize = '14px';

        if (isGreek()) {
            hint.innerHTML = `💡 <strong>Hint:</strong> Για να δοκιμάσετε την κενή λέξη <strong>ε</strong>, αφήστε το πεδίο κενό και πατήστε «<strong>Δοκιμή CFG</strong>» ή «<strong>Δοκιμή PDA</strong>».`;
        } else {
            hint.innerHTML = `💡 <strong>Hint:</strong> To test the empty word <strong>ε</strong>, leave the input field blank and click “<strong>Test CFG</strong>” or “<strong>Test PDA</strong>”.`;
        }

        // Place the hint just above the test buttons
        const container = document.querySelector('#shared-input-handler .rounded-container.shared-input');
        const testButtons = document.getElementById('test-buttons');
        container.insertBefore(hint, testButtons);
    }

    setEventListeners() {
        this.generatedWordInputEl.addEventListener('input', () => {
            // const isWordEmpty = this.generatedWordInputEl.value.trim() === "";
            // this.testCfgBtnEl.disabled = isWordEmpty;
            this.testPdaBtnEl.disabled = !window.isPdaRendered;
        });

        this.testCfgBtnEl.onclick = this.cfgTester.testCfgBtnHandler.bind(this.cfgTester);
    }
};
