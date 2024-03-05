import { InputHandler } from './components/InputHandler.js';


window.inputHandler = new InputHandler();
window.inputHandler.addRule();

const doneBtnEl = document.getElementById("btn-done");
doneBtnEl.addEventListener('click', event => {
    window.inputHandler.doneBtnHandler.bind(window.inputHandler)(event);
});

const abortBtnEl = document.getElementById("btn-abort");
abortBtnEl.addEventListener('click', () => {
    location.reload();
});
