import { InputHandler } from './components/InputHandler.js';

window.EMPTY_STRING = 'ε';
window.SPECIAL_CHAR = '$';
window.STARTING_VAR = 'S';
window.ARROW = '→';
window.isPdaRendered = false;

window.inputHandler = new InputHandler();
window.inputHandler.addRule();
