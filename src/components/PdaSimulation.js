import { CfgWordGenerator } from "./CfgWordGenerator.js";
import { isGreek, displayMessage, minPossibleLength } from "../utilities/tools.js";


export class PdaSimulation {
    constructor(pdaTransitions) {
        /* ---------------- Simulation State ---------------- */
        this.currentState = "Qo";
        this.stack = [];
        this.inputWord = "";
        this.currentInputIndex = 0;
        this.isAccepted = false;
        this.isRejected = false;

        /* ---- Visual tracking ---- */
        this.previousState = null;
        this.previousTransition = null;
        this.previousLabel = null;

        this.transitionPath = [];   // will contain either full path (accept) or best‑partial (reject)
        this.transitionIndex = 0;

        /* ---------------- PDA definition ---------------- */
        this.pdaTransitions = pdaTransitions; // real graph edges (for ids)

        /* ---------------- DOM ---------------- */
        this.stackContainer = document.getElementById("stack-container");
        this.wordContainer  = document.getElementById("word-container");
        this.nextStepButton = document.getElementById("next-step");
        this.testPdaButton  = document.getElementById("btn-testpda");
        this.restartTestButton = document.getElementById("restart-test-button");

        /* ---------------- Events ---------------- */
        this.testPdaButton.addEventListener("click", () => {
            this.stackContainer.classList.remove("hidden");
            this.wordContainer.scrollIntoView({ behavior: "smooth", block: "nearest" });
            this.startPdaTest();
        });
        this.nextStepButton.addEventListener("click", () => this.nextPdaStep());
        this.restartTestButton.addEventListener("click", () => this.startPdaTest());
    }

    /* =====================================================
     *  START / RESET
     * ===================================================*/
    startPdaTest() {
        this.resetSimulation();
        this.inputWord = document.getElementById("sharedWordInput").value.trim();

        const cfg = window.inputHandler.cfg;
        const isvalidWordLength = new CfgWordGenerator(cfg).canGenerateLength(this.inputWord.length);
        if (!isvalidWordLength) {
            if (isGreek()) {
                displayMessage(`Η CFG που παρέχεται ΔΕΝ μπορεί να παράξει λέξη μήκους ${this.inputWord.length}.`, false, "pda");
            } else {
                displayMessage(`The provided CFG cannot generate any word of length ${this.inputWord.length}.`, false, "pda");
            }
            return;
        }

        const wordTerminals = [...new Set(this.inputWord.split(""))].filter(ch => !/[A-Z]/.test(ch));

        const cfgTerminals = cfg.getTerminals();
        const invalidChars = wordTerminals.filter(term => !cfgTerminals.includes(term));
        if (invalidChars.length > 0) {
            if (isGreek()) {
                displayMessage(`Η λέξη '${this.inputWord}' περιέχει χαρακτήρες ('${invalidChars}') που δεν ανήκουν στα τερματικά σύμβολα της CFG.`, false, "pda");
            } else {
                displayMessage(`The word '${this.inputWord}' contains characters ('${invalidChars}') that are not part of the CFG's terminal symbols.`, false, "pda");
            }
            return;
        }

        const cfgObj = cfg.cfgObj;
        const accepted = this.buildTransitionPath(cfgObj, window.STARTING_VAR, this.inputWord);

        if (accepted) {
            this.isAccepted = true;
            displayMessage(
                isGreek()
                    ? `Η παρεχόμενη λέξη αναγνωρίζεται από αυτό το PDA. Ακολουθήστε τα βήματα για να δείτε τις μεταβάσεις.`
                    : `The provided word is recognised by this PDA. Follow the steps to see the transitions.`,
                true,
                "pda"
            );
            this.stackContainer.classList.add("accepted");
        } else {
            this.isRejected = true;
            displayMessage(
                isGreek()
                    ? `Η παρεχόμενη λέξη ΔΕΝ αναγνωρίζεται από αυτό το PDA. Πατήστε "Next" για να δείτε τη διαδρομή πριν κολλήσει.`
                    : `The provided word is NOT recognised by this PDA. Click "Next" to see the path before it got stuck.`,
                false,
                "pda"
            );
            this.stackContainer.classList.add("rejected");
        }

        /* initial visuals */
        this.displayWord();
        this.displayStack();
        this.highlightState(this.currentState);
        this.nextStepButton.style.display = "block";
        this.restartTestButton.style.display = "block";
    }

    resetSimulation() {
        this.currentState = "Qo";
        this.stack = [];
        this.currentInputIndex = 0;
        this.transitionPath = [];
        this.transitionIndex = 0;
        this.isAccepted = false;
        this.isRejected = false;
        this.resetAllHighlighting();
        this.clearMessage();
        this.stackContainer.classList.remove("accepted", "rejected");
    }

    /* =====================================================
     *  CFG‑LIKE PARSING – ALSO BUILDS BEST PARTIAL PATH
     * ===================================================*/
    buildTransitionPath(cfgObj, startSymbol, word) {
        const EMPTY = window.EMPTY_STRING;

        /* queue items: { stack: string[], idx: number, path: [] } */
        const queue   = [];
        const visited = new Set();
        const best    = { consumed: 0, path: [] };   // for the reject case

        const keyOf = (stack, idx) => stack.join("") + "|" + idx;

        /* quick bound: if the *produced* terminals already exceed the target */
        const tooManyTerminals = (stack, idx) =>
            stack.filter(ch => !cfgObj[ch]).length > word.length - idx;

        queue.push({ stack: [startSymbol], idx: 0, path: [] });

        while (queue.length) {
            const { stack, idx, path } = queue.shift();

            /* ---- accept ---- */
            if (stack.length === 0 && idx === word.length) {
                this.transitionPath = path;
                return true;
            }

            /* ---- quick rejections / pruning ---- */
            if (idx > word.length) continue;
            if (stack.length + (word.length - idx) > 2 * word.length) continue;
            if (stack.length === 0) {
                if (idx > best.consumed) { best.consumed = idx; best.path = path; }
                continue;
            }
            if (tooManyTerminals(stack, idx)) continue;
            if (minPossibleLength(stack.join(""), cfgObj) > word.length - idx) continue;

            const memo = keyOf(stack, idx);
            if (visited.has(memo)) continue;
            visited.add(memo);

            const [top, ...rest] = stack;

            /* ---- variable on top of the stack ---- */
            if (cfgObj[top]) {
                for (const prod of cfgObj[top]) {
                    const pushSyms = prod === EMPTY ? [] : prod.split("").reverse(); // reverse → first symbol on top
                    const newStack = [...pushSyms.reverse(), ...rest];  // keep left-to-right order

                    const label = `${EMPTY}, ${top} → ${prod || EMPTY}`;
                    const trans = this.syntheticTransition(label, EMPTY, top, prod || EMPTY);

                    queue.push({
                        stack : newStack,
                        idx,
                        path  : [...path, trans]
                    });
                }
                continue;
            }

            /* ---- terminal on top ---- */
            if (idx < word.length && word[idx] === top) {
                const label = `${top}, ${top} → ${EMPTY}`;
                const trans = this.syntheticTransition(label, top, top, EMPTY);

                queue.push({
                    stack : rest,
                    idx   : idx + 1,
                    path  : [...path, trans]
                });
            } else {
                if (idx > best.consumed) { best.consumed = idx; best.path = path; }
            }
        }

        /* no accept state – keep best partial path for step-through view */
        this.transitionPath = best.path;
        return false;
    }

    /* produce an object that mimics a real edge, including id if found */
    syntheticTransition(label, input, stackTop, stackPush) {
        const realEdge = this.pdaTransitions.find(e => `${e.input}, ${e.stackTop} → ${e.stackPush}` === label);
        return {
            fromState: "Qloop",
            toState: "Qloop",
            input,
            stackTop,
            stackPush,
            transitionId: realEdge ? realEdge.transitionId : null
        };
    }

    /* =====================================================
     *  STEP‑BY‑STEP EXECUTION
     * ===================================================*/
    nextPdaStep() {
        if (this.transitionIndex >= this.transitionPath.length) {
            this.nextStepButton.style.display = "none";
            if (this.isAccepted) {
                this.highlightState("Qaccept", "green");
            } else {
                // rejection: keep current state highlighted in red
                this.highlightState(this.currentState, "red");
            }
            return;
        }

        // reset previous highlighting
        this.resetHighlighting();

        const t = this.transitionPath[this.transitionIndex];
        // visualise edge/label
        this.highlightTransition(t);

        // stack ops
        if (t.stackTop !== window.EMPTY_STRING) this.stack.pop();
        if (t.stackPush !== window.EMPTY_STRING) {
            const syms = t.stackPush.split("").reverse();
            this.stack.push(...syms);
        }

        // input pointer
        if (t.input !== window.EMPTY_STRING) this.currentInputIndex++;

        /* update current state **before** visuals */
        this.currentState = t.toState;

        // visuals
        this.displayStack();
        this.updateWordVisualization();
        this.highlightState(t.toState);

        this.transitionIndex++;
    }

    /* =====================================================
     *  VISUAL HELPERS
     * ===================================================*/
    highlightTransition(t, color = "#2861ff") {
        if (!t?.transitionId) return;
        const labelTxt = this.labelText(t);
        d3.select(`#${t.transitionId}`).selectAll("path, polygon").style("stroke", color);
        d3.select(`#${t.transitionId}`).selectAll("text").style("fill", function () {
            return d3.select(this).text() === labelTxt ? color : "black";
        });
        this.previousTransition = t.transitionId;
        this.previousLabel = labelTxt;
    }

    labelText(t) {
        const EMPTY = window.EMPTY_STRING;
        const i = t.input === EMPTY ? "ε" : t.input;
        const sTop = t.stackTop === EMPTY ? "ε" : t.stackTop;
        const sPush = t.stackPush === EMPTY ? "ε" : t.stackPush;
        return `${i}, ${sTop} → ${sPush}`;
    }

    highlightState(stateId, color = "#2861ff") {
        d3.select(`#${stateId}`).select("ellipse").style("fill", color);
        d3.select(`#${stateId}`).selectAll("text, tspan").style("fill", "white");
        this.previousState = stateId;
    }

    resetHighlighting() {
        if (this.previousState) {
            d3.select(`#${this.previousState}`).select("ellipse").style("fill", "white");
            d3.select(`#${this.previousState}`).selectAll("text, tspan").style("fill", "black");
        }
        if (this.previousTransition) {
            d3.select(`#${this.previousTransition}`).selectAll("path, polygon").style("stroke", "black");
        }
        if (this.previousTransition && this.previousLabel) {
            d3.select(`#${this.previousTransition}`)
                .selectAll("text")
                .filter((d, i, nodes) => d3.select(nodes[i]).text() === this.previousLabel)
                .style("fill", "black");
        }
    }

    resetAllHighlighting() {
        d3.selectAll(".node")
            .select("ellipse")
            .style("fill", "white")
            .style("stroke", "black");
        d3.selectAll(".node").selectAll("text, tspan").style("fill", "black");
        d3.selectAll(".edge").selectAll("path, polygon").style("stroke", "black");
        d3.selectAll(".edge").selectAll("text").style("fill", "black");
    }

    /* --- Stack and Word visuals --- */
    displayStack() {
        this.stackContainer.innerHTML = "";
        const lbl = document.createElement("p");
        lbl.classList.add("stack-label");
        lbl.textContent = "Stack:";
        this.stackContainer.appendChild(lbl);
        this.stack.forEach(s => {
            const div = document.createElement("div");
            div.classList.add("stack-element", "fs-1");
            div.textContent = s;
            this.stackContainer.appendChild(div);
        });
    }

    displayWord() {
        this.wordContainer.innerHTML = "";
        for (let i = 0; i < this.inputWord.length; i++) {
            const span = document.createElement("span");
            span.classList.add("word-letter");
            if (i === this.currentInputIndex) span.classList.add("current-letter");
            span.textContent = this.inputWord[i];
            this.wordContainer.appendChild(span);
        }
    }

    updateWordVisualization() {
        const letters = document.querySelectorAll(".word-letter");
        letters.forEach((ltr, idx) => {
            if (idx === this.currentInputIndex) ltr.classList.add("current-letter");
            else ltr.classList.remove("current-letter");
        });
    }

    clearMessage() {
        const m = document.getElementById("pda-message");
        if (m) m.textContent = "";
    }
}
