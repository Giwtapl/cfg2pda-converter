import { InputHandler } from './components/InputHandler.js';
import MobileDetection from './utilities/mobile.js';

const urlParams = new URLSearchParams(window.location.search);
window.DEBUG_LOGS = urlParams.get('log') === 'true';

window.isMobile = MobileDetection;
window.EMPTY_STRING = 'ε';
window.SPECIAL_CHAR = '$';
window.STARTING_VAR = 'S';
window.ARROW = '→';
window.isPdaRendered = false;

window.inputHandler = new InputHandler();
window.inputHandler.addRule();

window.showLoadingModal = function() {
    const modal = document.getElementById('loading-modal');
    modal.style.display = 'flex';
}

window.hideLoadingModal = function() {
    const modal = document.getElementById('loading-modal');
    modal.style.display = 'none';
}
