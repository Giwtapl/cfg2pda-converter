export class WordGenerationModal {
  constructor(generatedWordInputEl) {
    // 1) Reference the Bootstrap modal element and create a new bootstrap.Modal instance
    this.modalEl = document.getElementById('modal'); // The <div class="modal fade" id="modal">...
    this.bsModal = new bootstrap.Modal(this.modalEl, {
      backdrop: true,    // or 'static' if we don’t want it to close on backdrop click
      keyboard: true,    // allows ESC key to close
    });

    // 2) Grab your existing elements
    this.goBtnEl = document.getElementById('goButton');
    this.generateWordBtnEl = document.getElementById('generateWordButton');
    this.generatedWordInputEl = generatedWordInputEl;

    // 3) Set up event listeners
    this.setEventListeners();
  }

  setEventListeners() {
    // When user clicks the "Generate Word" button, show the Bootstrap modal
    this.generateWordBtnEl.addEventListener('click', () => {
      this.bsModal.show();
    });

    // When user clicks Go, generate the word and then close the modal
    this.goBtnEl.addEventListener('click', () => {
      const length = parseInt(document.getElementById('wordLength').value, 10);
      if (isNaN(length) || length < 1) {
        alert('Please enter a valid length');
        return;
      }

      const generatedWord = window.inputHandler.cfg.wordGenerator.generateWord(length);
      this.generatedWordInputEl.value = generatedWord;

      // Emit input event
      const inputEvent = new Event('input', { bubbles: true, cancelable: true });
      this.generatedWordInputEl.dispatchEvent(inputEvent);

      // Hide the Bootstrap modal
      this.bsModal.hide();
    });
  }
}
