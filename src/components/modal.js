export class WordGenerationModal {
    constructor() {
        this.element = document.getElementById('modal');

        const generateWordBtnEl = document.getElementById('generateWordButton');

        // Get the <span> element that closes the modal
        const spanEl = document.getElementsByClassName('close')[0];

        // When the user clicks the button, open the modal
        generateWordBtnEl.onclick = () => {
            this.element.style.display = 'block';
        }

        // When the user clicks on <span> (x), close the modal
        spanEl.onclick = () => {
            this.element.style.display = 'none';
        }

        // When the user clicks anywhere outside of the modal, close it
        window.onclick = event => {
            if (event.target == modal) {
                this.element.style.display = 'none';
            }
        }
    }
}