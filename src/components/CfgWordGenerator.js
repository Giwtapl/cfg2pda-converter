export class CfgWordGenerator {
    constructor(cfg) {
        this.cfg = cfg;
        this.cfgObj = this.cfg.cfgObj;
        this.generatedWords = new Set(); // Use Set for unique generated words
        this.duplicateGeneratedWords = new Set(); // Use Set for duplicate words
    }

    canStillGenerateRemainingWord(cfg, currentGeneratedWord, targetLength) {
        // Calculate the number of variables in the currentGeneratedWord that can produce ε
        const currentGeneratedWordVariablesWithEpsilon = currentGeneratedWord.split('').filter(s => cfg[s] && cfg[s].includes(window.EMPTY_STRING));
        return currentGeneratedWord.length - currentGeneratedWordVariablesWithEpsilon.length <= targetLength;
    }

    generateWord(targetLength) {
        const cfg = this.cfgObj;

        const generateWordRec = currentWord => {
            if (!this.canStillGenerateRemainingWord(cfg, currentWord, targetLength)) {
                return null;
            }

            if (isTerminal(currentWord)) {
                // If the current word has the correct length and consists only of terminals, return it
                if (currentWord.length === targetLength) {
                    if (this.generatedWords.has(currentWord)) {
                        this.duplicateGeneratedWords.add(currentWord); // Add to set of duplicates
                    }
                    return currentWord;
                } else {
                    return null;
                }
            }

            const cfgClone = JSON.parse(JSON.stringify(cfg));

            // Find the first non-terminal symbol in the word
            for (let i = 0; i < currentWord.length; i++) {
                if (cfg[currentWord[i]]) { // Check if it's a non-terminal (present in the CFG)
                    const nonTerminal = currentWord[i];

                    // Randomly choose one of the productions for this non-terminal
                    const productions = cfgClone[nonTerminal];
                    const randomIndex = Math.floor(Math.random() * productions.length);
                    let chosenProduction = productions.splice(randomIndex, 1)[0];
                    chosenProduction = chosenProduction === window.EMPTY_STRING ? "" : chosenProduction;

                    // Replace the non-terminal with the chosen production
                    const newWord = currentWord.slice(0, i) + chosenProduction + currentWord.slice(i + 1);

                    // Recursive call to generate further
                    const result = generateWordRec(newWord);

                    // If a valid word is generated, return it
                    if (result) {
                        return result;
                    } else {
                        i = -1;
                    }
                }
            }

            // If no valid word is found after trying all productions, return null (backtrack)
            return null;
        }

        // Helper function to check if a word is fully terminal
        const isTerminal = word => !/[A-Z]/.test(word);

        // Start the recursive process with the start symbol
        const generatedWord = generateWordRec(this.cfg.rules[0].varLetter);

        if (!generatedWord && this.duplicateGeneratedWords.size > 0) {
            // Convert set to array to randomly select a duplicate word
            const duplicatesArray = Array.from(this.duplicateGeneratedWords).filter(dWord => dWord.length === targetLength);
            return duplicatesArray[Math.floor(Math.random() * duplicatesArray.length)];
        } else if (generatedWord && !this.generatedWords.has(generatedWord)) {
            this.generatedWords.add(generatedWord); // Add unique word to set
            return generatedWord;
        } else if (generatedWord && this.duplicateGeneratedWords.has(generatedWord)) {
            if (this.duplicateGeneratedWords.size === 1) {
                return generatedWord;
            } else {
                const duplicatesArray = Array.from(this.duplicateGeneratedWords).filter(dWord => dWord.length === targetLength);
                const idx = duplicatesArray.indexOf(generatedWord);
                const allDuplicatesNotCurrent = duplicatesArray.splice(idx, 1)[0];
                return duplicatesArray[Math.floor(Math.random() * allDuplicatesNotCurrent.length)];
            }
        }
    }
};
