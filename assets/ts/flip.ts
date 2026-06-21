import * as Blockly from 'blockly/core';
import {JavascriptGenerator, javascriptGenerator} from 'blockly/javascript';

export class Flip {
  constructor() {
    Blockly.defineBlocksWithJsonArray([
      {
        "type": "flip_forward",
        "message0": "flip forward",
        "colour": "#FF6B6B",
        "previousStatement": null,
        "nextStatement": null,
        "tooltip": "Perform a forward flip",
        "helpUrl": ""
      },
      {
        "type": "flip_backward",
        "message0": "flip backward",
        "colour": "#FF6B6B",
        "previousStatement": null,
        "nextStatement": null,
        "tooltip": "Perform a backward flip",
        "helpUrl": ""
      },
      {
        "type": "flip_left",
        "message0": "flip left",
        "colour": "#FF6B6B",
        "previousStatement": null,
        "nextStatement": null,
        "tooltip": "Perform a left flip",
        "helpUrl": ""
      },
      {
        "type": "flip_right",
        "message0": "flip right",
        "colour": "#FF6B6B",
        "previousStatement": null,
        "nextStatement": null,
        "tooltip": "Perform a right flip",
        "helpUrl": ""
      }
    ]);

    javascriptGenerator.forBlock['flip_forward'] = function(block: Blockly.Block, generator: JavascriptGenerator) {
      return `
// Flip forward
offboardCommand.publish({
  command: 'flip_forward',
  distance_or_degrees: 0.0
});
await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for flip to complete
`;
    }

    javascriptGenerator.forBlock['flip_backward'] = function(block: Blockly.Block, generator: JavascriptGenerator) {
      return `
// Flip backward
offboardCommand.publish({
  command: 'flip_backward',
  distance_or_degrees: 0.0
});
await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for flip to complete
`;
    }

    javascriptGenerator.forBlock['flip_left'] = function(block: Blockly.Block, generator: JavascriptGenerator) {
      return `
// Flip left
offboardCommand.publish({
  command: 'flip_left',
  distance_or_degrees: 0.0
});
await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for flip to complete
`;
    }

    javascriptGenerator.forBlock['flip_right'] = function(block: Blockly.Block, generator: JavascriptGenerator) {
      return `
// Flip right
offboardCommand.publish({
  command: 'flip_right',
  distance_or_degrees: 0.0
});
await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for flip to complete
`;
    }
  }
}
