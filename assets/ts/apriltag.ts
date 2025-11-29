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
  }
}
