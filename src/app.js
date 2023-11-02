import { InputHandler } from './components/InputHandler.js';

window.inputHandler = new InputHandler();
window.inputHandler.addRule();

const doneBtnEl = document.getElementById("btn-done");
doneBtnEl.addEventListener('click', window.inputHandler.showInputModal.bind(window.inputHandler));