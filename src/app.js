import { InputHandler } from './components/InputHandler.js';


window.inputHandler = new InputHandler();
window.inputHandler.addRule();

const doneBtnEl = document.getElementById("btn-done");
doneBtnEl.addEventListener('click', window.inputHandler.showInputModal.bind(window.inputHandler));





// Define your NPDA data
// const npdaData = {
//     nodes: [
//       { id: 'Qstart', label: '<q<SUB>start</SUB>>' },
//       { id: 'Q0', label: '<q<SUB>0</SUB>>' },
//       { id: 'Qloop', label: '<q<SUB>loop</SUB>>' },
//       { id: 'Qaccept', label: '<q<SUB>accept</SUB>>' },
//     ],
//     links: [
//       { source: 'Qstart', target: 'Q0', label: 'ε, ε -> $' },
//       // Add more transitions as needed
//     ],
//   };
  
//   // Create a container for the graph
//   d3.select('#graph').graphviz().renderDot(`
//   digraph {
//     ${npdaData.nodes.map(node => `${node.id} [label=${node.label}];`).join('\n')}
//     ${npdaData.links.map(link => `${link.source} -> "${link.target}" [label="${link.label}"];`).join('\n')}
//   }
// `);
// d3.select("#graph")
//     .graphviz()
//     .renderDot('digraph { a [label=<q<SUB>start</SUB>>] }');