import { Pda } from "../entities/pda.js";

export class Cfg2PdaConverter {
    NULL_STRING = window.EMPTY_STRING;
    SPECIAL_CHAR = window.SPECIAL_CHAR;
    STARTING_VAR = window.STARTING_VAR;
    ARROW = window.ARROW;
    STANDARD_TRANSITIONS = [
        { source: 'Qo', target: 'Qloop', label: `${this.NULL_STRING}, ${this.NULL_STRING} ${this.ARROW} ${this.SPECIAL_CHAR}${this.STARTING_VAR}` },
        { source: 'Qloop', target: 'Qaccept', label: `${this.NULL_STRING}, ${this.SPECIAL_CHAR} ${this.ARROW} ${this.NULL_STRING}` }
    ];

    constructor(cfg) {
        this.cfg = cfg;
        this.transitions = [...this.STANDARD_TRANSITIONS];
    }

    convert() {
        this.transitions.push(this._constructQLoopTransition());
        return new Pda(this.transitions);
    }

    _constructQLoopTransition() {
        return { source: 'Qloop', target: 'Qloop', label: this._getQLoopLabelsList() };
    }

    _getQLoopLabelsList() {
        const qLoopLabelsList = [];
        Object.entries(this.cfg.toObject()).forEach(([varLetter, prods]) => {
            prods.forEach((prod) => {
                qLoopLabelsList.push(`${this.NULL_STRING}, ${varLetter} ${this.ARROW} ${prod}`);
            });
        });
        this.cfg.getTerminalSymbols().forEach(termSym => {
            qLoopLabelsList.push(`${termSym}, ${termSym} ${this.ARROW} ${this.NULL_STRING}`);
        });

        return [...new Set(qLoopLabelsList)];
    }
}
