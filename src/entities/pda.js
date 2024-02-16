import { isSubset } from "../utilities/tools.js";
import { PdaValidationError } from "../utilities/exceptions.js";

export class Pda {
    STATES = ['Qstart', 'Qo', 'Qloop', 'Qaccept'];

    constructor(transitions) {
        this.nPdaData = this._getNPdaDataFromTransitions(transitions);
    }

    render() {
        d3.select('#graph').graphviz().renderDot(
            `digraph {
                ${this.nPdaData.nodes.map(node => `${node.id} [label=${node.label}];`).join('\n')}
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
}