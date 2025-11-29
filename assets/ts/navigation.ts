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
            "type": "input_value",
            "name": "ALTITUDE",
            "check": "Number"
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
            "type": "input_value",
            "name": "DISTANCE",
            "check": "Number"
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
            "type": "input_value",
            "name": "DISTANCE",
            "check": "Number"
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
            "type": "input_value",
            "name": "DISTANCE",
            "check": "Number"
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
            "type": "input_value",
            "name": "DISTANCE",
            "check": "Number"
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
            "type": "input_value",
            "name": "DISTANCE",
            "check": "Number"
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
            "type": "input_value",
            "name": "DISTANCE",
            "check": "Number"
          }
        ],
        "colour": "#2A9D8F",
        "previousStatement": null,
        "nextStatement": null,
        "tooltip": "Fly down by specified distance",
        "helpUrl": ""
      },
      {
        "type": "nav_yaw_left",
        "message0": "yaw left %1 degrees",
        "args0": [
          {
            "type": "input_value",
            "name": "DEGREES",
            "check": "Number"
          }
        ],
        "colour": "#2A9D8F",
        "previousStatement": null,
        "nextStatement": null,
        "tooltip": "Rotate left by specified degrees",
        "helpUrl": ""
      },
      {
        "type": "nav_yaw_right",
        "message0": "yaw right %1 degrees",
        "args0": [
          {
            "type": "input_value",
            "name": "DEGREES",
            "check": "Number"
          }
        ],
        "colour": "#2A9D8F",
        "previousStatement": null,
        "nextStatement": null,
        "tooltip": "Rotate right by specified degrees",
        "helpUrl": ""
      },
      {
        "type": "nav_wait",
        "message0": "wait %1 seconds",
        "args0": [
          {
            "type": "input_value",
            "name": "DURATION",
            "check": "Number"
          }
        ],
        "colour": "#2A9D8F",
        "previousStatement": null,
        "nextStatement": null,
        "tooltip": "Wait for specified number of seconds",
        "helpUrl": ""
      },
      {
        "type": "nav_takeoff_after",
        "message0": "takeoff after %1 seconds",
        "args0": [
          {
            "type": "input_value",
            "name": "DELAY",
            "check": "Number"
          }
        ],
        "colour": "#4CAF50",
        "previousStatement": null,
        "nextStatement": null,
        "tooltip": "Wait specified seconds then takeoff",
        "helpUrl": ""
      },
      {
        "type": "nav_takeoff_and_wait",
        "message0": "takeoff and wait %1 seconds",
        "args0": [
          {
            "type": "input_value",
            "name": "WAIT_TIME",
            "check": "Number"
          }
        ],
        "colour": "#4CAF50",
        "previousStatement": null,
        "nextStatement": null,
        "tooltip": "Takeoff then wait specified seconds",
        "helpUrl": ""
      },
      {
        "type": "nav_land_after",
        "message0": "land after %1 seconds",
        "args0": [
          {
            "type": "input_value",
            "name": "DELAY",
            "check": "Number"
          }
        ],
        "colour": "#FF6B6B",
        "previousStatement": null,
        "nextStatement": null,
        "tooltip": "Wait specified seconds then land",
        "helpUrl": ""
      },
      {
        "type": "nav_land_wait_takeoff",
        "message0": "land for %1 seconds then takeoff",
        "args0": [
          {
            "type": "input_value",
            "name": "DURATION",
            "check": "Number"
          }
        ],
        "colour": "#FF6B6B",
        "previousStatement": null,
        "nextStatement": null,
        "tooltip": "Land, wait specified seconds, then takeoff again",
        "helpUrl": ""
      },
      {
        "type": "nav_goto_ned",
        "message0": "go to NED position %1 N: %2 E: %3 D: %4",
        "args0": [
          {
            "type": "input_dummy"
          },
          {
            "type": "input_value",
            "name": "NORTH",
            "check": "Number",
            "align": "RIGHT"
          },
          {
            "type": "input_value",
            "name": "EAST",
            "check": "Number",
            "align": "RIGHT"
          },
          {
            "type": "input_value",
            "name": "DOWN",
            "check": "Number",
            "align": "RIGHT"
          }
        ],
        "colour": "#E76F51",
        "previousStatement": null,
        "nextStatement": null,
        "tooltip": "Fly to absolute NED position (North, East, Down in meters)",
        "helpUrl": ""
      },
      {
        "type": "nav_goto_ned_with_yaw",
        "message0": "go to NED position %1 N: %2 E: %3 D: %4 Yaw: %5°",
        "args0": [
          {
            "type": "input_dummy"
          },
          {
            "type": "input_value",
            "name": "NORTH",
            "check": "Number",
            "align": "RIGHT"
          },
          {
            "type": "input_value",
            "name": "EAST",
            "check": "Number",
            "align": "RIGHT"
          },
          {
            "type": "input_value",
            "name": "DOWN",
            "check": "Number",
            "align": "RIGHT"
          },
          {
            "type": "input_value",
            "name": "YAW",
            "check": "Number",
            "align": "RIGHT"
          }
        ],
        "colour": "#E76F51",
        "previousStatement": null,
        "nextStatement": null,
        "tooltip": "Fly to absolute NED position with specified yaw angle",
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
      const altitude = generator.valueToCode(block, 'ALTITUDE', javascriptGenerator.ORDER_ATOMIC) || '2.0';
      return `
// Takeoff to ${altitude} meters
offboardCommand.publish({
  command: 'offboard_takeoff',
  distance_or_degrees: ${altitude}
});
await new Promise(resolve => setTimeout(resolve, ${altitude} * 2000)); // Wait for takeoff
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
      const distance = generator.valueToCode(block, 'DISTANCE', javascriptGenerator.ORDER_ATOMIC) || '1.0';
      return `
// Fly forward ${distance} meters
offboardCommand.publish({
  command: 'fly_forward',
  distance_or_degrees: ${distance}
});
await new Promise(resolve => setTimeout(resolve, ${distance} * 1000)); // Wait for movement
`;
    }

    javascriptGenerator.forBlock['nav_fly_backward'] = function(block: Blockly.Block, generator: JavascriptGenerator) {
      const distance = generator.valueToCode(block, 'DISTANCE', javascriptGenerator.ORDER_ATOMIC) || '1.0';
      return `
// Fly backward ${distance} meters
offboardCommand.publish({
  command: 'fly_backward',
  distance_or_degrees: ${distance}
});
await new Promise(resolve => setTimeout(resolve, ${distance} * 1000)); // Wait for movement
`;
    }

    javascriptGenerator.forBlock['nav_fly_left'] = function(block: Blockly.Block, generator: JavascriptGenerator) {
      const distance = generator.valueToCode(block, 'DISTANCE', javascriptGenerator.ORDER_ATOMIC) || '1.0';
      return `
// Fly left ${distance} meters
offboardCommand.publish({
  command: 'fly_left',
  distance_or_degrees: ${distance}
});
await new Promise(resolve => setTimeout(resolve, ${distance} * 1000)); // Wait for movement
`;
    }

    javascriptGenerator.forBlock['nav_fly_right'] = function(block: Blockly.Block, generator: JavascriptGenerator) {
      const distance = generator.valueToCode(block, 'DISTANCE', javascriptGenerator.ORDER_ATOMIC) || '1.0';
      return `
// Fly right ${distance} meters
offboardCommand.publish({
  command: 'fly_right',
  distance_or_degrees: ${distance}
});
await new Promise(resolve => setTimeout(resolve, ${distance} * 1000)); // Wait for movement
`;
    }

    javascriptGenerator.forBlock['nav_fly_up'] = function(block: Blockly.Block, generator: JavascriptGenerator) {
      const distance = generator.valueToCode(block, 'DISTANCE', javascriptGenerator.ORDER_ATOMIC) || '1.0';
      return `
// Fly up ${distance} meters
offboardCommand.publish({
  command: 'fly_up',
  distance_or_degrees: ${distance}
});
await new Promise(resolve => setTimeout(resolve, ${distance} * 1000)); // Wait for movement
`;
    }

    javascriptGenerator.forBlock['nav_fly_down'] = function(block: Blockly.Block, generator: JavascriptGenerator) {
      const distance = generator.valueToCode(block, 'DISTANCE', javascriptGenerator.ORDER_ATOMIC) || '1.0';
      return `
// Fly down ${distance} meters
offboardCommand.publish({
  command: 'fly_down',
  distance_or_degrees: ${distance}
});
await new Promise(resolve => setTimeout(resolve, ${distance} * 1000)); // Wait for movement
`;
    }

    javascriptGenerator.forBlock['nav_yaw_left'] = function(block: Blockly.Block, generator: JavascriptGenerator) {
      const degrees = generator.valueToCode(block, 'DEGREES', javascriptGenerator.ORDER_ATOMIC) || '90';
      return `
// Yaw left ${degrees} degrees
offboardCommand.publish({
  command: 'yaw_left',
  distance_or_degrees: ${degrees}
});
await new Promise(resolve => setTimeout(resolve, ${degrees} * 10)); // Wait for rotation
`;
    }

    javascriptGenerator.forBlock['nav_yaw_right'] = function(block: Blockly.Block, generator: JavascriptGenerator) {
      const degrees = generator.valueToCode(block, 'DEGREES', javascriptGenerator.ORDER_ATOMIC) || '90';
      return `
// Yaw right ${degrees} degrees
offboardCommand.publish({
  command: 'yaw_right',
  distance_or_degrees: ${degrees}
});
await new Promise(resolve => setTimeout(resolve, ${degrees} * 10)); // Wait for rotation
`;
    }

    javascriptGenerator.forBlock['nav_wait'] = function(block: Blockly.Block, generator: JavascriptGenerator) {
      const duration = generator.valueToCode(block, 'DURATION', javascriptGenerator.ORDER_ATOMIC) || '1';
      return `
// Wait ${duration} seconds
await new Promise(resolve => setTimeout(resolve, ${duration} * 1000));
`;
    }

    javascriptGenerator.forBlock['nav_takeoff_after'] = function(block: Blockly.Block, generator: JavascriptGenerator) {
      const delay = generator.valueToCode(block, 'DELAY', javascriptGenerator.ORDER_ATOMIC) || '5';
      return `
// Wait ${delay} seconds then takeoff
await new Promise(resolve => setTimeout(resolve, ${delay} * 1000));
offboardCommand.publish({
  command: 'offboard_takeoff',
  distance_or_degrees: 2.0
});
await new Promise(resolve => setTimeout(resolve, 4000)); // Wait for takeoff
`;
    }

    javascriptGenerator.forBlock['nav_takeoff_and_wait'] = function(block: Blockly.Block, generator: JavascriptGenerator) {
      const waitTime = generator.valueToCode(block, 'WAIT_TIME', javascriptGenerator.ORDER_ATOMIC) || '5';
      return `
// Takeoff and wait ${waitTime} seconds
offboardCommand.publish({
  command: 'offboard_takeoff',
  distance_or_degrees: 2.0
});
await new Promise(resolve => setTimeout(resolve, 4000)); // Wait for takeoff
await new Promise(resolve => setTimeout(resolve, ${waitTime} * 1000)); // Additional wait
`;
    }

    javascriptGenerator.forBlock['nav_land_after'] = function(block: Blockly.Block, generator: JavascriptGenerator) {
      const delay = generator.valueToCode(block, 'DELAY', javascriptGenerator.ORDER_ATOMIC) || '5';
      return `
// Wait ${delay} seconds then land
await new Promise(resolve => setTimeout(resolve, ${delay} * 1000));
offboardCommand.publish({
  command: 'land',
  distance_or_degrees: 0.0
});
await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for landing
`;
    }

    javascriptGenerator.forBlock['nav_land_wait_takeoff'] = function(block: Blockly.Block, generator: JavascriptGenerator) {
      const duration = generator.valueToCode(block, 'DURATION', javascriptGenerator.ORDER_ATOMIC) || '5';
      return `
// Land for ${duration} seconds then takeoff
offboardCommand.publish({
  command: 'land',
  distance_or_degrees: 0.0
});
await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for landing
await new Promise(resolve => setTimeout(resolve, ${duration} * 1000)); // Wait on ground
offboardCommand.publish({
  command: 'offboard_takeoff',
  distance_or_degrees: 2.0
});
await new Promise(resolve => setTimeout(resolve, 4000)); // Wait for takeoff
`;
    }

    javascriptGenerator.forBlock['nav_goto_ned'] = function(block: Blockly.Block, generator: JavascriptGenerator) {
      const north = generator.valueToCode(block, 'NORTH', javascriptGenerator.ORDER_ATOMIC) || '0';
      const east = generator.valueToCode(block, 'EAST', javascriptGenerator.ORDER_ATOMIC) || '0';
      const down = generator.valueToCode(block, 'DOWN', javascriptGenerator.ORDER_ATOMIC) || '-2';
      return `
// Go to NED position: N=${north}, E=${east}, D=${down}
offboardCommand.publish({
  command: 'goto_ned',
  distance_or_degrees: 0.0,
  north: ${north},
  east: ${east},
  down: ${down},
  yaw: 0.0
});
await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for position change
`;
    }

    javascriptGenerator.forBlock['nav_goto_ned_with_yaw'] = function(block: Blockly.Block, generator: JavascriptGenerator) {
      const north = generator.valueToCode(block, 'NORTH', javascriptGenerator.ORDER_ATOMIC) || '0';
      const east = generator.valueToCode(block, 'EAST', javascriptGenerator.ORDER_ATOMIC) || '0';
      const down = generator.valueToCode(block, 'DOWN', javascriptGenerator.ORDER_ATOMIC) || '-2';
      const yaw = generator.valueToCode(block, 'YAW', javascriptGenerator.ORDER_ATOMIC) || '0';
      return `
// Go to NED position: N=${north}, E=${east}, D=${down}, Yaw=${yaw}°
offboardCommand.publish({
  command: 'goto_ned',
  distance_or_degrees: 0.0,
  north: ${north},
  east: ${east},
  down: ${down},
  yaw: ${yaw}
});
await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for position change
`;
    }
  }
}
