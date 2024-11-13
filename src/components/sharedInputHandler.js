import { CfgTester } from "./CfgTester.js";
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
    }

    setEventListeners() {
        this.generatedWordInputEl.addEventListener('input', () => {
            const isWordEmpty = this.generatedWordInputEl.value.trim() === "";
            this.testCfgBtnEl.disabled = isWordEmpty;
            this.testPdaBtnEl.disabled = isWordEmpty || !window.isPdaRendered;
        });

        this.testCfgBtnEl.onclick = this.cfgTester.testCfgBtnHandler.bind(this.cfgTester);
    }
};