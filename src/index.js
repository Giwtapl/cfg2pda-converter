function isUpperCase(letter) {
    return /^[A-Z]$/.test(letter);
}

const initInput = document.getElementById('init-input');

initInput.addEventListener('input', () => {
    const lastInputChar = initInput.value.slice(-1);
    console.log(lastInputChar);
    if (isUpperCase(lastInputChar)) {
        console.log(`create new rule for variable ${lastInputChar}`);
    }
});