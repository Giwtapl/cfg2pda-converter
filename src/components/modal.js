import { isGreek } from "../utilities/tools.js";

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
    // Disable the "Generate Word" button if the input element is not empty
    this.generatedWordInputEl.addEventListener('input', () => {
      this.generateWordBtnEl.disabled = !!this.generatedWordInputEl.value;
    });

    // When user clicks the "Generate Word" button, show the Bootstrap modal
    this.generateWordBtnEl.addEventListener('click', () => {
      this.bsModal.show();
    });

    // When user clicks Go, generate the word and then close the modal
    this.goBtnEl.addEventListener('click', () => {
      // Hide the Bootstrap modal
      this.bsModal.hide();
      window.showLoadingModal(); // Show loading modal
      const length = parseInt(document.getElementById('wordLength').value, 10);
      if (isNaN(length) || length < 1) {
        window.hideLoadingModal(); // Hide loading modal
        alert(
          isGreek()
          ? `Παρακαλώ εισάγετε έγκυρο μήκος. Πρέπει να είναι > 0.`
          : `Please enter a valid length. It should be > 0.`
        );
        return;
      }

      const generatedWord = window.inputHandler.cfg.wordGenerator.generateWord(length);

      if (!generatedWord) {
        window.hideLoadingModal(); // Hide loading modal
        const msg = isGreek()
            ? `Η CFG που δώσατε δεν παράγει καμία λέξη μήκους ${length}.`
            : `The CFG you provided does not generate any string of length ${length}.`;
            alert(msg);
        return;               // δεν κλείνουμε το modal
      }
      window.hideLoadingModal(); // Hide loading modal

      this.generatedWordInputEl.value = generatedWord;

      // Emit input event
      const inputEvent = new Event('input', { bubbles: true, cancelable: true });
      this.generatedWordInputEl.dispatchEvent(inputEvent);
    });
  }
}
