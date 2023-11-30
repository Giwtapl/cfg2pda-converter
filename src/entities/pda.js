import { isSubset } from "../utilities/tools.js";
import { PdaValidationError } from "../utilities/exceptions.js";

export class Pda {
    constructor(statesSet, inputSymbolsSet, stackSymbolsSet, startState, acceptedStatesSet) {
        this.validate(statesSet, inputSymbolsSet, stackSymbolsSet, startState, acceptedStatesSet);
        this.statesSet = statesSet;
        this.inputSymbolsSet = inputSymbolsSet;
        this.stackSymbolsSet = stackSymbolsSet;
        this.startState = startState;
        this.acceptedStatesSet = acceptedStatesSet;
    }

    validate(statesSet, inputSymbolsSet, stackSymbolsSet, startState, acceptedStatesSet) {
        const sets = [stateSet, inputSymbolsSet, stackSymbolsSet, acceptedStatesSet];
        if (!sets.every(set => set instanceof Set)) {
            throw new PdaValidationError(
                `All of the arguments: ${sets} should be of type Set.\n` +
                `Provided value types:\n` +
                `stateSet: ${typeof stateSet}\n` +
                `inputSymbolsSet: ${typeof inputSymbolsSet}\n` +
                `stackSymbolsSet: ${typeof stackSymbolsSet}\n` +
                `acceptedStatesSet: ${typeof acceptedStatesSet}`
            );
        }

        if (!isSubset(acceptedStatesSet, statesSet)) {
            throw new PdaValidationError(`Provided accepted states: ${acceptedStatesSet} are not a subset of the provided total states: ${statesSet}`)
        }

        if (!statesSet.has(startState)) {
            console.log(`Provided starting state: ${startState} is not in the provided statesSet: ${statesSet}`);
        }
    }

    display() {}
}