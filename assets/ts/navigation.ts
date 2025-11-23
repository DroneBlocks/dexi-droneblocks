import * as Blockly from 'blockly/core';
import {JavascriptGenerator, javascriptGenerator} from 'blockly/javascript';

export class Navigation {
  constructor() {
    Blockly.defineBlocksWithJsonArray([
      {
        "type": "nav_arm",
        "message0": "arm",
        "colour": "#2A9D8F",
        "previousStatement": null,
        "nextStatement": null,
        "tooltip": "Arm the vehicle",
        "helpUrl": ""
      },
      {
        "type": "nav_start_offboard_heartbeat",
        "message0": "start offboard heartbeat",
        "colour": "#2A9D8F",
        "previousStatement": null,
        "nextStatement": null,
        "tooltip": "Start sending offboard control signals",
        "helpUrl": ""
      },
      {
        "type": "nav_stop_offboard_heartbeat",
        "message0": "stop offboard heartbeat",
        "colour": "#2A9D8F",
        "previousStatement": null,
        "nextStatement": null,
        "tooltip": "Stop sending offboard control signals",
        "helpUrl": ""
      },
      {
        "type": "nav_switch_offboard_mode",
        "message0": "switch to offboard mode",
        "colour": "#2A9D8F",
        "previousStatement": null,
        "nextStatement": null,
        "tooltip": "Switch flight mode to offboard",
        "helpUrl": ""
      },
      {
        "type": "nav_switch_hold_mode",
        "message0": "switch to hold mode",
        "colour": "#2A9D8F",
        "previousStatement": null,
        "nextStatement": null,
        "tooltip": "Switch to automatic position hold (loiter)",
        "helpUrl": ""
      },
      {
        "type": "nav_takeoff",
        "message0": "takeoff to %1 meters",
        "args0": [
          {
            "type": "field_number",
            "name": "ALTITUDE",
            "value": 2.0,
            "min": 0.5,
            "max": 10,
            "precision": 0.1
          }
        ],
        "colour": "#264653",
        "previousStatement": null,
        "nextStatement": null,
        "tooltip": "Takeoff to specified altitude using offboard mode",
        "helpUrl": ""
      },
      {
        "type": "nav_land",
        "message0": "land",
        "colour": "#E76F51",
        "previousStatement": null,
        "nextStatement": null,
        "tooltip": "Land at current position",
        "helpUrl": ""
      },
      {
        "type": "nav_fly_forward",
        "message0": "fly forward %1 meters",
        "args0": [
          {
            "type": "field_number",
            "name": "DISTANCE",
            "value": 1.0,
            "min": 0.1,
            "max": 10,
            "precision": 0.1
          }
        ],
        "colour": "#2A9D8F",
        "previousStatement": null,
        "nextStatement": null,
        "tooltip": "Fly forward by specified distance",
        "helpUrl": ""
      },
      {
        "type": "nav_fly_backward",
        "message0": "fly backward %1 meters",
        "args0": [
          {
            "type": "field_number",
            "name": "DISTANCE",
            "value": 1.0,
            "min": 0.1,
            "max": 10,
            "precision": 0.1
          }
        ],
        "colour": "#2A9D8F",
        "previousStatement": null,
        "nextStatement": null,
        "tooltip": "Fly backward by specified distance",
        "helpUrl": ""
      },
      {
        "type": "nav_fly_left",
        "message0": "fly left %1 meters",
        "args0": [
          {
            "type": "field_number",
            "name": "DISTANCE",
            "value": 1.0,
            "min": 0.1,
            "max": 10,
            "precision": 0.1
          }
        ],
        "colour": "#2A9D8F",
        "previousStatement": null,
        "nextStatement": null,
        "tooltip": "Fly left by specified distance",
        "helpUrl": ""
      },
      {
        "type": "nav_fly_right",
        "message0": "fly right %1 meters",
        "args0": [
          {
            "type": "field_number",
            "name": "DISTANCE",
            "value": 1.0,
            "min": 0.1,
            "max": 10,
            "precision": 0.1
          }
        ],
        "colour": "#2A9D8F",
        "previousStatement": null,
        "nextStatement": null,
        "tooltip": "Fly right by specified distance",
        "helpUrl": ""
      },
      {
        "type": "nav_fly_up",
        "message0": "fly up %1 meters",
        "args0": [
          {
            "type": "field_number",
            "name": "DISTANCE",
            "value": 1.0,
            "min": 0.1,
            "max": 5,
            "precision": 0.1
          }
        ],
        "colour": "#2A9D8F",
        "previousStatement": null,
        "nextStatement": null,
        "tooltip": "Fly up by specified distance",
        "helpUrl": ""
      },
      {
        "type": "nav_fly_down",
        "message0": "fly down %1 meters",
        "args0": [
          {
            "type": "field_number",
            "name": "DISTANCE",
            "value": 1.0,
            "min": 0.1,
            "max": 5,
            "precision": 0.1
          }
        ],
        "colour": "#2A9D8F",
        "previousStatement": null,
        "nextStatement": null,
        "tooltip": "Fly down by specified distance",
        "helpUrl": ""
      }
    ]);

    javascriptGenerator.forBlock['nav_arm'] = function(block: Blockly.Block, generator: JavascriptGenerator) {
      return `
// Arm vehicle
offboardCommand.publish({
  command: 'arm',
  distance_or_degrees: 0.0
});
await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for arming
`;
    }

    javascriptGenerator.forBlock['nav_start_offboard_heartbeat'] = function(block: Blockly.Block, generator: JavascriptGenerator) {
      return `
// Start offboard heartbeat
offboardCommand.publish({
  command: 'start_offboard_heartbeat',
  distance_or_degrees: 0.0
});
await new Promise(resolve => setTimeout(resolve, 500)); // Wait for heartbeat to start
`;
    }

    javascriptGenerator.forBlock['nav_stop_offboard_heartbeat'] = function(block: Blockly.Block, generator: JavascriptGenerator) {
      return `
// Stop offboard heartbeat
offboardCommand.publish({
  command: 'stop_offboard_heartbeat',
  distance_or_degrees: 0.0
});
await new Promise(resolve => setTimeout(resolve, 500)); // Wait for heartbeat to stop
`;
    }

    javascriptGenerator.forBlock['nav_switch_offboard_mode'] = function(block: Blockly.Block, generator: JavascriptGenerator) {
      return `
// Switch to offboard mode
offboardCommand.publish({
  command: 'switch_offboard_mode',
  distance_or_degrees: 0.0
});
await new Promise(resolve => setTimeout(resolve, 500)); // Wait for mode switch
`;
    }

    javascriptGenerator.forBlock['nav_switch_hold_mode'] = function(block: Blockly.Block, generator: JavascriptGenerator) {
      return `
// Switch to hold/loiter mode
offboardCommand.publish({
  command: 'switch_hold_mode',
  distance_or_degrees: 0.0
});
await new Promise(resolve => setTimeout(resolve, 500)); // Wait for mode switch
`;
    }

    javascriptGenerator.forBlock['nav_takeoff'] = function(block: Blockly.Block, generator: JavascriptGenerator) {
      const altitude = block.getFieldValue('ALTITUDE');
      return `
// Takeoff to ${altitude} meters
offboardCommand.publish({
  command: 'offboard_takeoff',
  distance_or_degrees: ${altitude}
});
await new Promise(resolve => setTimeout(resolve, ${altitude * 2000})); // Wait for takeoff
`;
    }

    javascriptGenerator.forBlock['nav_land'] = function(block: Blockly.Block, generator: JavascriptGenerator) {
      return `
// Land
offboardCommand.publish({
  command: 'land',
  distance_or_degrees: 0.0
});
await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for landing
`;
    }

    javascriptGenerator.forBlock['nav_fly_forward'] = function(block: Blockly.Block, generator: JavascriptGenerator) {
      const distance = block.getFieldValue('DISTANCE');
      return `
// Fly forward ${distance} meters
offboardCommand.publish({
  command: 'fly_forward',
  distance_or_degrees: ${distance}
});
await new Promise(resolve => setTimeout(resolve, ${distance * 1000})); // Wait for movement
`;
    }

    javascriptGenerator.forBlock['nav_fly_backward'] = function(block: Blockly.Block, generator: JavascriptGenerator) {
      const distance = block.getFieldValue('DISTANCE');
      return `
// Fly backward ${distance} meters
offboardCommand.publish({
  command: 'fly_backward',
  distance_or_degrees: ${distance}
});
await new Promise(resolve => setTimeout(resolve, ${distance * 1000})); // Wait for movement
`;
    }

    javascriptGenerator.forBlock['nav_fly_left'] = function(block: Blockly.Block, generator: JavascriptGenerator) {
      const distance = block.getFieldValue('DISTANCE');
      return `
// Fly left ${distance} meters
offboardCommand.publish({
  command: 'fly_left',
  distance_or_degrees: ${distance}
});
await new Promise(resolve => setTimeout(resolve, ${distance * 1000})); // Wait for movement
`;
    }

    javascriptGenerator.forBlock['nav_fly_right'] = function(block: Blockly.Block, generator: JavascriptGenerator) {
      const distance = block.getFieldValue('DISTANCE');
      return `
// Fly right ${distance} meters
offboardCommand.publish({
  command: 'fly_right',
  distance_or_degrees: ${distance}
});
await new Promise(resolve => setTimeout(resolve, ${distance * 1000})); // Wait for movement
`;
    }

    javascriptGenerator.forBlock['nav_fly_up'] = function(block: Blockly.Block, generator: JavascriptGenerator) {
      const distance = block.getFieldValue('DISTANCE');
      return `
// Fly up ${distance} meters
offboardCommand.publish({
  command: 'fly_up',
  distance_or_degrees: ${distance}
});
await new Promise(resolve => setTimeout(resolve, ${distance * 1000})); // Wait for movement
`;
    }

    javascriptGenerator.forBlock['nav_fly_down'] = function(block: Blockly.Block, generator: JavascriptGenerator) {
      const distance = block.getFieldValue('DISTANCE');
      return `
// Fly down ${distance} meters
offboardCommand.publish({
  command: 'fly_down',
  distance_or_degrees: ${distance}
});
await new Promise(resolve => setTimeout(resolve, ${distance * 1000})); // Wait for movement
`;
    }
  }
}
