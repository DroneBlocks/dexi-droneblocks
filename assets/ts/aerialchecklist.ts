import * as Blockly from 'blockly/core';
import {JavascriptGenerator, javascriptGenerator} from 'blockly/javascript';

export class AerialChecklist {
  constructor() {
    Blockly.defineBlocksWithJsonArray([
      {
        "type": "checklist_ground_school",
        "message0": "Ground School (Kindergarten thru Life)",
        "colour": "#14B8A6",
        "previousStatement": null,
        "nextStatement": null,
        "tooltip": "Ground School - foundational drone education for all ages starting from Kindergarten",
        "helpUrl": ""
      },
      {
        "type": "checklist_hover_lab",
        "message0": "Hover Lab (Middle School thru Life)",
        "colour": "#67C6D7",
        "previousStatement": null,
        "nextStatement": null,
        "tooltip": "Hover Lab - intermediate drone skills for Middle School and beyond",
        "helpUrl": ""
      },
      {
        "type": "checklist_flight_deck",
        "message0": "Flight Deck (High School thru Life)",
        "colour": "#E8966C",
        "previousStatement": null,
        "nextStatement": null,
        "tooltip": "Flight Deck - advanced drone operations for High School and beyond",
        "helpUrl": ""
      },
      {
        "type": "checklist_vertical_integration",
        "message0": "Vertical Integration (College Prep, Higher Ed, Industry)",
        "colour": "#5B6BA3",
        "previousStatement": null,
        "nextStatement": null,
        "tooltip": "Vertical Integration - professional-level drone applications for College Prep, Higher Education, and Industry",
        "helpUrl": ""
      }
    ]);

    javascriptGenerator.forBlock['checklist_ground_school'] = function(block: Blockly.Block, generator: JavascriptGenerator) {
      return `
// Ground School - Foundational drone education (Kindergarten thru Life)
console.log('Ground School checkpoint reached');
`;
    }

    javascriptGenerator.forBlock['checklist_hover_lab'] = function(block: Blockly.Block, generator: JavascriptGenerator) {
      return `
// Hover Lab - Intermediate drone skills (Middle School thru Life)
console.log('Hover Lab checkpoint reached');
`;
    }

    javascriptGenerator.forBlock['checklist_flight_deck'] = function(block: Blockly.Block, generator: JavascriptGenerator) {
      return `
// Flight Deck - Advanced drone operations (High School thru Life)
console.log('Flight Deck checkpoint reached');
`;
    }

    javascriptGenerator.forBlock['checklist_vertical_integration'] = function(block: Blockly.Block, generator: JavascriptGenerator) {
      return `
// Vertical Integration - Professional-level applications (College Prep, Higher Ed, Industry)
console.log('Vertical Integration checkpoint reached');
`;
    }
  }
}
