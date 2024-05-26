import * as Blockly from 'blockly/core';
import {JavascriptGenerator, javascriptGenerator} from 'blockly/javascript';


export class Takeoff {
  constructor() {
    Blockly.defineBlocksWithJsonArray([
      {
        "type": "arm",
        "message0": "arm",
        "colour": 0,
        "previousStatement": null,
        "nextStatement": null,
      },
      {
        "type": "takeoff",
        "message0": "takeoff",
        "colour": 0,
        "previousStatement": null,
        "nextStatement": null,
      },
      {
        "type": "disarm",
        "message0": "disarm",
        "colour": 0,
        "previousStatement": null,
        "nextStatement": null,
      },
    ]);

    javascriptGenerator.forBlock['arm'] = function(block: Blockly.Block, generator:JavascriptGenerator) {
      return `arm`;
    }

    javascriptGenerator.forBlock['takeoff'] = function(block: Blockly.Block, generator:JavascriptGenerator) {
      return `
      let takeoffMessage = new ROSLIB.Message({
        param1: 1.0,
        param2: 0.0,
        param7: altitude,
        command: 22, // VEHICLE_CMD_NAV_TAKEOFF
        target_system: 1,
        target_component: 1,
        source_system: 1,
        source_component: 1,
        from_external: true,
        timestamp: Date.now(),
      });
      vehicleCommandTopic.publish(takeoffMessage);
      `;
      // // Collect argument strings.
      // const fieldValue = block.getFieldValue('MY_FIELD');
      // const innerCode = generator.statementToCode(block, 'MY_STATEMENT_INPUT');

    }

    javascriptGenerator.forBlock['disarm'] = function(block: Blockly.Block, generator:JavascriptGenerator) {
      return `disarm`;
    }
    

  }
}

