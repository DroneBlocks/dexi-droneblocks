import * as Blockly from 'blockly/core';
import {JavascriptGenerator, javascriptGenerator} from 'blockly/javascript';

export class AprilTag {
  constructor() {
    Blockly.defineBlocksWithJsonArray([
      {
        "type": "apriltag_start_monitoring",
        "message0": "start monitoring apriltags",
        "colour": "#FF9800",
        "previousStatement": null,
        "nextStatement": null,
        "tooltip": "Start monitoring AprilTag detections in background",
        "helpUrl": ""
      },
      {
        "type": "apriltag_stop_monitoring",
        "message0": "stop monitoring apriltags",
        "colour": "#FF9800",
        "previousStatement": null,
        "nextStatement": null,
        "tooltip": "Stop monitoring AprilTag detections",
        "helpUrl": ""
      },
      {
        "type": "apriltag_get_last_id",
        "message0": "last detected tag ID",
        "output": "Number",
        "colour": "#FF9800",
        "tooltip": "Get the ID of the last detected AprilTag",
        "helpUrl": ""
      },
      {
        "type": "apriltag_get_tag_count",
        "message0": "number of detected tags",
        "output": "Number",
        "colour": "#FF9800",
        "tooltip": "Get the count of currently detected AprilTags",
        "helpUrl": ""
      },
      {
        "type": "apriltag_wait_for_tag",
        "message0": "wait until tag %1 is seen",
        "args0": [{ "type": "input_value", "name": "TAG_ID", "check": "Number" }],
        "inputsInline": true,
        "colour": "#FF9800",
        "previousStatement": null,
        "nextStatement": null,
        "tooltip": "Pause the mission until the camera sees this tag (30 s timeout)",
        "helpUrl": ""
      },
      {
        "type": "apriltag_fly_until_tag",
        "message0": "fly %1 at %2 m/s until tag %3 is seen",
        "args0": [
          { "type": "field_dropdown", "name": "DIRECTION", "options": [["forward","forward"],["backward","backward"],["left","left"],["right","right"],["up","up"],["down","down"]] },
          { "type": "input_value", "name": "SPEED", "check": "Number" },
          { "type": "input_value", "name": "TAG_ID", "check": "Number" }
        ],
        "inputsInline": true,
        "colour": "#FF9800",
        "previousStatement": null,
        "nextStatement": null,
        "tooltip": "Fly at a steady speed and stop as soon as the camera sees this tag (20 s timeout)",
        "helpUrl": ""
      },
      {
        "type": "apriltag_center_on_tag",
        "message0": "center on tag %1",
        "args0": [{ "type": "input_value", "name": "TAG_ID", "check": "Number" }],
        "inputsInline": true,
        "colour": "#FF9800",
        "previousStatement": null,
        "nextStatement": null,
        "tooltip": "Move until the tag is directly below the drone, then hold",
        "helpUrl": ""
      },
      {
        "type": "apriltag_land_on_tag",
        "message0": "land on tag %1",
        "args0": [{ "type": "input_value", "name": "TAG_ID", "check": "Number" }],
        "inputsInline": true,
        "colour": "#FF9800",
        "previousStatement": null,
        "nextStatement": null,
        "tooltip": "Center on the tag, descend while keeping it centered, then land",
        "helpUrl": ""
      },
      {
        "type": "apriltag_wait_for_handoff",
        "message0": "wait for pilot hand-off (up to %1 s)",
        "args0": [{ "type": "input_value", "name": "TIMEOUT", "check": "Number" }],
        "inputsInline": true,
        "colour": "#FF9800",
        "previousStatement": null,
        "nextStatement": null,
        "tooltip": "Fly to a tag by hand, then switch to Offboard on the RC. The mission continues from there.",
        "helpUrl": ""
      },
      {
        "type": "apriltag_tag_visible",
        "message0": "tag %1 is visible",
        "args0": [{ "type": "input_value", "name": "TAG_ID", "check": "Number" }],
        "inputsInline": true,
        "output": "Boolean",
        "colour": "#FF9800",
        "tooltip": "True while the camera sees this tag",
        "helpUrl": ""
      }
    ]);

    javascriptGenerator.forBlock['apriltag_start_monitoring'] = function(block: Blockly.Block, generator: JavascriptGenerator) {
      return `
// Start monitoring AprilTags
if (!apriltagSubscription) {
  apriltagSubscription = new ROSLIB.Topic({
    ros: ros,
    name: '/apriltag_detections',
    messageType: 'apriltag_msgs/AprilTagDetectionArray'
  });

  apriltagSubscription.subscribe((message) => {
    if (message.detections && message.detections.length > 0) {
      lastDetectedTagId = message.detections[0].id;
      detectedTagCount = message.detections.length;
      console.log(\`📷 Detected \${detectedTagCount} AprilTag(s), ID: \${lastDetectedTagId}\`);
    }
  });
  console.log('✅ Started AprilTag monitoring');
}
`;
    }

    javascriptGenerator.forBlock['apriltag_stop_monitoring'] = function(block: Blockly.Block, generator: JavascriptGenerator) {
      return `
// Stop monitoring AprilTags
if (apriltagSubscription) {
  apriltagSubscription.unsubscribe();
  apriltagSubscription = null;
  console.log('⏹️ Stopped AprilTag monitoring');
}
`;
    }

    javascriptGenerator.forBlock['apriltag_get_last_id'] = function(block: Blockly.Block, generator: JavascriptGenerator) {
      return ['lastDetectedTagId', javascriptGenerator.ORDER_ATOMIC];
    }

    javascriptGenerator.forBlock['apriltag_get_tag_count'] = function(block: Blockly.Block, generator: JavascriptGenerator) {
      return ['detectedTagCount', javascriptGenerator.ORDER_ATOMIC];
    }

    // Navigation blocks run through the runner's AprilTag handler; the
    // generated JavaScript mirrors the calls for the code view.
    const num = (block: Blockly.Block, name: string, fallback: string) =>
      javascriptGenerator.valueToCode(block, name, javascriptGenerator.ORDER_ATOMIC) || fallback;
    javascriptGenerator.forBlock['apriltag_wait_for_tag'] = function(block: Blockly.Block) {
      return `await tagNav.waitForTag(${num(block, 'TAG_ID', '0')});\n`;
    }
    javascriptGenerator.forBlock['apriltag_fly_until_tag'] = function(block: Blockly.Block) {
      return `await tagNav.flyUntilTag('${block.getFieldValue('DIRECTION')}', ${num(block, 'SPEED', '0.5')}, ${num(block, 'TAG_ID', '1')});\n`;
    }
    javascriptGenerator.forBlock['apriltag_center_on_tag'] = function(block: Blockly.Block) {
      return `await tagNav.centerOnTag(${num(block, 'TAG_ID', '0')});\n`;
    }
    javascriptGenerator.forBlock['apriltag_land_on_tag'] = function(block: Blockly.Block) {
      return `await tagNav.landOnTag(${num(block, 'TAG_ID', '0')});\n`;
    }
    javascriptGenerator.forBlock['apriltag_wait_for_handoff'] = function(block: Blockly.Block) {
      return `await tagNav.waitForHandoff(${num(block, 'TIMEOUT', '120')});\n`;
    }
    javascriptGenerator.forBlock['apriltag_tag_visible'] = function(block: Blockly.Block) {
      return [`tagNav.tagVisible(${num(block, 'TAG_ID', '0')})`, javascriptGenerator.ORDER_FUNCTION_CALL];
    }
  }
}
