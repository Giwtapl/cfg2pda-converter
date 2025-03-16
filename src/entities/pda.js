import { PdaSimulation } from "../components/PdaSimulation.js";


export class Pda {
    constructor(transitions) {
        this.transitions = transitions;
        this.nPdaData = this._getNPdaDataFromTransitions(transitions);
        this.pdaSimulation = null;
    }

    render() {
        d3.select('#graph')
            .graphviz()
            .zoom(false) // Disable zooming if you wish
            .renderDot(
                `digraph {
                    rankdir=LR;
                    ${
                        this.nPdaData.nodes.map(node => {
                            if (node.id === 'Qaccept') {
                                return `${node.id} [id="${node.id}", label=${node.label}, shape=ellipse, peripheries=2];`;
                            } else {
                                return `${node.id} [id="${node.id}", label=${node.label}];`;
                            }
                        }).join('\n')
                    }
                    ${
                        this.nPdaData.links.map((link, index) =>
                            `${link.source} -> ${link.target} [label="${link.label}", id="edge${index}"];`
                        ).join('\n')
                    }
                }`
            )
            .on("end", () => {
                const pdaArea = document.getElementById('pdaArea');
                pdaArea.scrollIntoView({ behavior: 'smooth', block: 'start' });  // start, center, end, nearest
                window.isPdaRendered = true;
                const event = new Event('input', {
                    bubbles: true,
                    cancelable: true,
                });
                document.getElementById('sharedWordInput').dispatchEvent(event);
                this.addDownloadButtonListener();

                // Initialize PDA simulation after the graph is rendered
                const pdaTransitions = this.getTransitions();
                this.pdaSimulation = new PdaSimulation(pdaTransitions);
            });
    }

    addDownloadButtonListener() {
        document.getElementById('download-image').addEventListener('click', function() {
            const svgElement = document.querySelector('#graph svg');

            if (svgElement) {
                const serializer = new XMLSerializer();
                let svgString = serializer.serializeToString(svgElement);

                // Add name spaces if they are missing
                if (!svgString.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)){
                    svgString = svgString.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
                }
                if (!svgString.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)){
                    svgString = svgString.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
                }

                // Create a Blob from the SVG string
                const svgBlob = new Blob([svgString], {type: 'image/svg+xml;charset=utf-8'});
                const URL = window.URL || window.webkitURL || window;
                const blobURL = URL.createObjectURL(svgBlob);

                const image = new Image();
                image.onload = function() {
                    const canvas = document.createElement('canvas');
                    canvas.width = image.width;
                    canvas.height = image.height;

                    const context = canvas.getContext('2d');
                    // Draw the SVG image onto the canvas
                    context.drawImage(image, 0, 0);

                    // Convert the canvas to a PNG data URL
                    const pngDataUrl = canvas.toDataURL('image/png');

                    // Create a temporary anchor element to trigger download
                    const downloadLink = document.createElement('a');
                    downloadLink.href = pngDataUrl;
                    downloadLink.download = 'pda_graph.png'; // Set the desired file name

                    // Append the anchor to the body
                    document.body.appendChild(downloadLink);

                    // Trigger the download
                    downloadLink.click();

                    // Remove the anchor and revoke the object URL
                    document.body.removeChild(downloadLink);
                    URL.revokeObjectURL(blobURL);
                };

                // Set the source of the image to the blob URL
                image.src = blobURL;
            } else {
                alert('Graph not found.');
            }
        });

    }

    _getNPdaDataFromTransitions(transitions) {
        const nPdaData = {
            nodes: [],
            links: []
        };

        // Collect all unique states from transitions
        const statesSet = new Set();
        transitions.forEach(transition => {
            statesSet.add(transition.source);
            statesSet.add(transition.target);
        });

        // Create nodes for each unique state
        statesSet.forEach(state => {
            nPdaData.nodes.push({ id: state, label: `<Q<SUB>${state.replace('Q', '')}</SUB>>` });
        });

        // Create links from transitions
        transitions.forEach((transition) => {
            const { source, target, label } = transition;
            if (Array.isArray(label)) {
                nPdaData.links.push(
                    { source: source, target: target, label: label.join('\n') }
                );
            } else {
                nPdaData.links.push(
                    { source: source, target: target, label: label }
                );
            }
        });

        return nPdaData;
    }

    getTransitions() {
        const transitionsArray = [];
        this.nPdaData.links.forEach((link, index) => {
            // Split the label to get individual transitions if there are multiple labels
            const labels = link.label.split('\n');
            labels.forEach(label => {
                // Each label is in the format "input, pop → push"
                const [inputPop, push] = label.split(window.ARROW).map(s => s.trim());
                const [input, pop] = inputPop.split(',').map(s => s.trim());
                const transition = {
                    fromState: link.source,
                    toState: link.target,
                    input: input,
                    stackTop: pop,
                    stackPush: push,
                    transitionId: `edge${index}` // Ensure this matches the id in the renderDot method
                };
                transitionsArray.push(transition);
            });
        });
        return transitionsArray;
    }
}
