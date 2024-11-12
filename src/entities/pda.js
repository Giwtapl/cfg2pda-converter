import { isSubset } from "../utilities/tools.js";
import { PdaTester } from "../components/PdaTester.js";
import { PdaValidationError } from "../utilities/exceptions.js";

export class Pda {
    STATES = ['Qstart', 'Qo', 'Qloop', 'Qaccept'];

    constructor(transitions) {
        this.nPdaData = this._getNPdaDataFromTransitions(transitions);
        this.tester = new PdaTester(this);
    }

    render() {
        d3.select('#graph').graphviz().renderDot(
            `digraph {
                rankdir=LR;
                ${this.nPdaData.nodes.map(node => `${node.id} [id="state-${node.id}", label=${node.label}];`).join('\n')}
                ${this.nPdaData.links.map(link => `${link.source} -> "${link.target}" [label="${link.label}"];`).join('\n')}
            }`
        );
    }

    _getNPdaDataFromTransitions(transitions) {
        const nPdaData = {
            nodes: [],
            links: []
        };
        this.STATES.forEach(state => {
            nPdaData.nodes.push({ id: state, label: `<Q<SUB>${state.split('Q')[1]}</SUB>>` });
        });
        transitions.forEach(transition => {
            const { source: transSource, target: transTarget, label: transLabel } = transition;
            if (Array.isArray(transLabel)) {
                nPdaData.links.push(
                    { source: transSource, target: transTarget, label: transLabel.join('\n') }
                )
            } else {
                nPdaData.links.push(
                    { source: transSource, target: transTarget, label: transLabel }
                )
            }
        });
        return nPdaData;
    }

    getNextTransition(currentState, nextChar, stackTop) {
        return this.nPdaData.links.find(link => {
            const [read, pop, push] = link.label.split(', ');
            return (
                link.source === currentState &&
                (read === nextChar || read === 'ε') &&
                (pop === stackTop || pop === 'ε')
            );
        });
    }
}