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
        d3.select('#graph')
            .graphviz()
            .renderDot(
                `digraph {
                    rankdir=LR;
                    ${this.nPdaData.nodes.map(node => `${node.id} [id="state-${node.id}", label=${node.label}];`).join('\n')}
                    ${this.nPdaData.links.map(link => `${link.source} -> "${link.target}" [label="${link.label}"];`).join('\n')}
                }`
            )
            .on("end", () => {
                const pdaArea = document.getElementById('pdaArea');
                pdaArea.scrollIntoView({ behavior: 'smooth', block: 'start' });  // start, center, end, nearest
                this.addDownloadButtonListener();
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