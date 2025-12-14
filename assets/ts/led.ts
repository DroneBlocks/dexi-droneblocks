import * as Blockly from 'blockly/core';
import {JavascriptGenerator, javascriptGenerator} from 'blockly/javascript';

export class LED {
  constructor() {
    Blockly.defineBlocksWithJsonArray([
      {
        "type": "led_effect",
        "message0": "led effect %1",
        "args0": [
          {
            "type": "field_dropdown",
            "name": "effect",
            "options": [
              ["comet", "comet"],
              ["festive", "festive"],
              ["galaxy", "galaxy"],
              ["gradient", "gradient"],
              ["loading", "loading"],
              ["rainbow", "rainbow"],
              ["snake", "snake"],
              ["wave", "wave"]
            ]
          }
        ],
        "colour": "#9C27B0",
        "previousStatement": null,
        "nextStatement": null,
        "tooltip": "Set LED ring animation effect",
        "helpUrl": ""
      },
      {
        "type": "led_ring",
        "message0": "led ring %1",
        "args0": [
          {
            "type": "field_dropdown",
            "name": "color",
            "options": [
              ["white", "white"],
              ["black", "black"],
              ["red", "red"],
              ["yellow", "yellow"],
              ["orange", "orange"],
              ["green", "green"],
              ["teal", "teal"],
              ["cyan", "cyan"],
              ["blue", "blue"],
              ["purple", "purple"],
              ["magenta", "magenta"],
              ["gold", "gold"],
              ["pink", "pink"],
              ["aqua", "aqua"],
              ["jade", "jade"],
              ["amber", "amber"]
            ]
          }
        ],
        "colour": "#9C27B0",
        "previousStatement": null,
        "nextStatement": null,
        "tooltip": "Set LED ring to a solid color",
        "helpUrl": ""
      },
      {
        "type": "led_pixel",
        "message0": "led pixel %1 red %2 green %3 blue %4",
        "args0": [
          {
            "type": "input_value",
            "name": "index",
            "check": "Number"
          },
          {
            "type": "input_value",
            "name": "red",
            "check": "Number"
          },
          {
            "type": "input_value",
            "name": "green",
            "check": "Number"
          },
          {
            "type": "input_value",
            "name": "blue",
            "check": "Number"
          }
        ],
        "inputsInline": true,
        "colour": "#9C27B0",
        "previousStatement": null,
        "nextStatement": null,
        "tooltip": "Set individual LED pixel color (index: 0-44, RGB: 0-255)",
        "helpUrl": ""
      }
    ]);

    // JavaScript generators (not currently used in this implementation, but included for completeness)
    javascriptGenerator.forBlock['led_effect'] = function(block: Blockly.Block, generator: JavascriptGenerator) {
      const effect = block.getFieldValue('effect');
      return `
// Set LED effect to ${effect}
ledService.callService({
  effect_name: '${effect}'
});
await new Promise(resolve => setTimeout(resolve, 100)); // Brief delay
`;
    }

    javascriptGenerator.forBlock['led_ring'] = function(block: Blockly.Block, generator: JavascriptGenerator) {
      const color = block.getFieldValue('color');
      return `
// Set LED ring color to ${color}
ledRingColorService.callService({
  color: '${color}'
});
await new Promise(resolve => setTimeout(resolve, 100)); // Brief delay
`;
    }

    javascriptGenerator.forBlock['led_pixel'] = function(block: Blockly.Block, generator: JavascriptGenerator) {
      const index = generator.valueToCode(block, 'index', 0) || '0';
      const red = generator.valueToCode(block, 'red', 0) || '255';
      const green = generator.valueToCode(block, 'green', 0) || '255';
      const blue = generator.valueToCode(block, 'blue', 0) || '255';
      return `
// Set LED pixel to RGB color
ledPixelColorService.callService({
  index: ${index},
  r: ${red},
  g: ${green},
  b: ${blue}
});
await new Promise(resolve => setTimeout(resolve, 100)); // Brief delay
`;
    }
  }
}
