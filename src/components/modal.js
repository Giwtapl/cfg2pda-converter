export class WordGenerationModal {
    constructor(generatedWordInputEl) {
        this.element = document.getElementById('modal');
        this.goBtnEl = document.getElementById('goButton');
        this.generateWordBtnEl = document.getElementById('generateWordButton');
        this.spanEl = document.getElementsByClassName('close')[0];
        this.generatedWordInputEl = generatedWordInputEl;
        this.setEventListeners();
    }

    setEventListeners() {
        // When the user clicks the button, open the modal
        this.generateWordBtnEl.onclick = () => {
            this.element.style.display = 'block';
        }
        // When the user clicks on <span> (x), close the modal
        this.spanEl.onclick = () => {
            this.element.style.display = 'none';
        }
        // When the user clicks anywhere outside of the modal, close it
        window.onclick = event => {
            if (event.target == modal) {
                this.element.style.display = 'none';
            }
        }

        this.goBtnEl.onclick = () => {
            const length = parseInt(document.getElementById('wordLength').value);
            if (isNaN(length) || length < 1) {
                alert('Please enter a valid length');
                return;
            }

            const generatedWord = window.inputHandler.cfg.wordGenerator.generateWord(length);

            this.generatedWordInputEl.value = generatedWord;
            // Emit input event
            const event = new Event('input', {
                bubbles: true,
                cancelable: true,
            });
            this.generatedWordInputEl.dispatchEvent(event);
            this.element.style.display = 'none';
            // this.testCfgBtnEl.removeAttribute("disabled");
        }
    }
}