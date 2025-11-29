<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import * as Blockly from 'blockly/core';
import { Navigation } from '~/assets/ts/navigation';
import { LED } from '~/assets/ts/led';
import { AprilTag } from '~/assets/ts/apriltag';
import { javascriptGenerator } from 'blockly/javascript';
import ROSLIB from 'roslib';
import { useTutorial } from '~/tutorial';
import TutorialWelcome from '~/tutorial/components/TutorialWelcome.vue';
import TutorialModal from '~/tutorial/components/TutorialModal.vue';
import TutorialHighlight from '~/tutorial/components/TutorialHighlight.vue';
import TutorialLessonPicker from '~/tutorial/components/TutorialLessonPicker.vue';

const navigation = new Navigation();
const led = new LED();
const apriltag = new AprilTag();

// Tutorial system
const tutorial = useTutorial();
const showLessonPicker = ref(false);

const foo = ref();
const ros = ref<ROSLIB.Ros | null>(null);
const connected = ref(false);
const offboardCommandTopic = ref<ROSLIB.Topic | null>(null);
const blocklyCommandService = ref<ROSLIB.Service | null>(null);
const ledEffectService = ref<ROSLIB.Service | null>(null);
const ledRingColorService = ref<ROSLIB.Service | null>(null);
const ledPixelColorService = ref<ROSLIB.Service | null>(null);
const leftPanelWidth = ref(50); // percentage
const isDragging = ref(false);
const showNotification = ref(false);
const notificationMessage = ref('');
const notificationType = ref<'success' | 'error'>('success');
const apriltagSubscription = ref<ROSLIB.Topic | null>(null);
const lastDetectedTagId = ref<number>(-1);
const detectedTagCount = ref<number>(0);

const options = {
  media: 'https://unpkg.com/blockly@11.0.0/media/',
  grid: {
    spacing: 25,
    length: 3,
    colour: '#ccc',
    snap: true,
  },
  trashcan: true,
  zoom: {
    controls: true,
    wheel: true,
    startScale: 1.0,
    maxScale: 3,
    minScale: 0.3,
    scaleSpeed: 1.2
  },
  toolbox: `<xml>
    <category name="Flight Control" colour="#2A9D8F" expanded="true">
      <category name="Offboard" colour="#2A9D8F">
        <block type="nav_start_offboard_heartbeat"></block>
        <block type="nav_stop_offboard_heartbeat"></block>
        <block type="nav_switch_offboard_mode"></block>
        <block type="nav_switch_hold_mode"></block>
      </category>
      <category name="Takeoff" colour="#4CAF50">
        <block type="nav_arm"></block>
        <block type="nav_takeoff">
          <value name="ALTITUDE">
            <shadow type="math_number">
              <field name="NUM">2</field>
            </shadow>
          </value>
        </block>
        <block type="nav_takeoff_after">
          <value name="DELAY">
            <shadow type="math_number">
              <field name="NUM">5</field>
            </shadow>
          </value>
        </block>
        <block type="nav_takeoff_and_wait">
          <value name="WAIT_TIME">
            <shadow type="math_number">
              <field name="NUM">5</field>
            </shadow>
          </value>
        </block>
      </category>
      <category name="Navigation" colour="#E76F51">
      <block type="nav_fly_forward">
        <value name="DISTANCE">
          <shadow type="math_number">
            <field name="NUM">1</field>
          </shadow>
        </value>
      </block>
      <block type="nav_fly_backward">
        <value name="DISTANCE">
          <shadow type="math_number">
            <field name="NUM">1</field>
          </shadow>
        </value>
      </block>
      <block type="nav_fly_left">
        <value name="DISTANCE">
          <shadow type="math_number">
            <field name="NUM">1</field>
          </shadow>
        </value>
      </block>
      <block type="nav_fly_right">
        <value name="DISTANCE">
          <shadow type="math_number">
            <field name="NUM">1</field>
          </shadow>
        </value>
      </block>
      <block type="nav_fly_up">
        <value name="DISTANCE">
          <shadow type="math_number">
            <field name="NUM">1</field>
          </shadow>
        </value>
      </block>
      <block type="nav_fly_down">
        <value name="DISTANCE">
          <shadow type="math_number">
            <field name="NUM">1</field>
          </shadow>
        </value>
      </block>
      <block type="nav_yaw_left">
        <value name="DEGREES">
          <shadow type="math_number">
            <field name="NUM">90</field>
          </shadow>
        </value>
      </block>
      <block type="nav_yaw_right">
        <value name="DEGREES">
          <shadow type="math_number">
            <field name="NUM">90</field>
          </shadow>
        </value>
      </block>
      <block type="nav_wait">
        <value name="DURATION">
          <shadow type="math_number">
            <field name="NUM">1</field>
          </shadow>
        </value>
      </block>
      <block type="nav_goto_ned">
        <value name="NORTH">
          <shadow type="math_number">
            <field name="NUM">0</field>
          </shadow>
        </value>
        <value name="EAST">
          <shadow type="math_number">
            <field name="NUM">0</field>
          </shadow>
        </value>
        <value name="DOWN">
          <shadow type="math_number">
            <field name="NUM">-2</field>
          </shadow>
        </value>
      </block>
      <block type="nav_goto_ned_with_yaw">
        <value name="NORTH">
          <shadow type="math_number">
            <field name="NUM">0</field>
          </shadow>
        </value>
        <value name="EAST">
          <shadow type="math_number">
            <field name="NUM">0</field>
          </shadow>
        </value>
        <value name="DOWN">
          <shadow type="math_number">
            <field name="NUM">-2</field>
          </shadow>
        </value>
        <value name="YAW">
          <shadow type="math_number">
            <field name="NUM">0</field>
          </shadow>
        </value>
      </block>
      </category>
      <category name="Land" colour="#FF6B6B">
        <block type="nav_land"></block>
        <block type="nav_land_after">
          <value name="DELAY">
            <shadow type="math_number">
              <field name="NUM">5</field>
            </shadow>
          </value>
        </block>
        <block type="nav_land_wait_takeoff">
          <value name="DURATION">
            <shadow type="math_number">
              <field name="NUM">5</field>
            </shadow>
          </value>
        </block>
      </category>
    </category>
    <category name="LED" colour="#9C27B0">
      <block type="led_effect">
        <field name="effect">rainbow</field>
      </block>
      <block type="led_ring">
        <field name="color">white</field>
      </block>
      <block type="led_pixel">
        <field name="index">0</field>
        <field name="red">255</field>
        <field name="green">255</field>
        <field name="blue">255</field>
      </block>
    </category>
    <category name="April Tags" colour="#FF9800">
      <block type="apriltag_start_monitoring"></block>
      <block type="apriltag_stop_monitoring"></block>
      <block type="apriltag_get_last_id"></block>
      <block type="apriltag_get_tag_count"></block>
    </category>
    <category name="Logic" colour="%{BKY_LOGIC_HUE}">
      <block type="controls_if"></block>
      <block type="controls_ifelse"></block>
      <block type="logic_compare">
        <value name="A">
          <shadow type="math_number">
            <field name="NUM">1</field>
          </shadow>
        </value>
        <value name="B">
          <shadow type="math_number">
            <field name="NUM">1</field>
          </shadow>
        </value>
      </block>
      <block type="logic_operation"></block>
      <block type="logic_negate"></block>
      <block type="logic_boolean"></block>
      <block type="logic_null"></block>
      <block type="logic_ternary"></block>
    </category>
    <category name="Loops" colour="%{BKY_LOOPS_HUE}">
      <block type="controls_repeat_ext">
        <value name="TIMES">
          <shadow type="math_number">
            <field name="NUM">10</field>
          </shadow>
        </value>
      </block>
      <block type="controls_whileUntil"></block>
      <block type="controls_for">
        <value name="FROM">
          <shadow type="math_number">
            <field name="NUM">1</field>
          </shadow>
        </value>
        <value name="TO">
          <shadow type="math_number">
            <field name="NUM">10</field>
          </shadow>
        </value>
        <value name="BY">
          <shadow type="math_number">
            <field name="NUM">1</field>
          </shadow>
        </value>
      </block>
      <block type="controls_forEach"></block>
      <block type="controls_flow_statements"></block>
    </category>
    <category name="Math" colour="%{BKY_MATH_HUE}">
      <block type="math_number">
        <field name="NUM">123</field>
      </block>
      <block type="math_arithmetic">
        <value name="A">
          <shadow type="math_number">
            <field name="NUM">1</field>
          </shadow>
        </value>
        <value name="B">
          <shadow type="math_number">
            <field name="NUM">1</field>
          </shadow>
        </value>
      </block>
      <block type="math_single">
        <value name="NUM">
          <shadow type="math_number">
            <field name="NUM">9</field>
          </shadow>
        </value>
      </block>
      <block type="math_trig">
        <value name="NUM">
          <shadow type="math_number">
            <field name="NUM">45</field>
          </shadow>
        </value>
      </block>
      <block type="math_constant"></block>
      <block type="math_number_property">
        <value name="NUMBER_TO_CHECK">
          <shadow type="math_number">
            <field name="NUM">0</field>
          </shadow>
        </value>
      </block>
      <block type="math_round">
        <value name="NUM">
          <shadow type="math_number">
            <field name="NUM">3.1</field>
          </shadow>
        </value>
      </block>
      <block type="math_on_list"></block>
      <block type="math_modulo">
        <value name="DIVIDEND">
          <shadow type="math_number">
            <field name="NUM">64</field>
          </shadow>
        </value>
        <value name="DIVISOR">
          <shadow type="math_number">
            <field name="NUM">10</field>
          </shadow>
        </value>
      </block>
      <block type="math_constrain">
        <value name="VALUE">
          <shadow type="math_number">
            <field name="NUM">50</field>
          </shadow>
        </value>
        <value name="LOW">
          <shadow type="math_number">
            <field name="NUM">1</field>
          </shadow>
        </value>
        <value name="HIGH">
          <shadow type="math_number">
            <field name="NUM">100</field>
          </shadow>
        </value>
      </block>
      <block type="math_random_int">
        <value name="FROM">
          <shadow type="math_number">
            <field name="NUM">1</field>
          </shadow>
        </value>
        <value name="TO">
          <shadow type="math_number">
            <field name="NUM">100</field>
          </shadow>
        </value>
      </block>
      <block type="math_random_float"></block>
    </category>
    <category name="Text" colour="%{BKY_TEXTS_HUE}">
      <block type="text"></block>
      <block type="text_join"></block>
      <block type="text_append">
        <value name="TEXT">
          <shadow type="text"></shadow>
        </value>
      </block>
      <block type="text_length">
        <value name="VALUE">
          <shadow type="text">
            <field name="TEXT">abc</field>
          </shadow>
        </value>
      </block>
      <block type="text_isEmpty">
        <value name="VALUE">
          <shadow type="text">
            <field name="TEXT"></field>
          </shadow>
        </value>
      </block>
      <block type="text_indexOf">
        <value name="VALUE">
          <block type="variables_get">
            <field name="VAR">text</field>
          </block>
        </value>
        <value name="FIND">
          <shadow type="text">
            <field name="TEXT">abc</field>
          </shadow>
        </value>
      </block>
      <block type="text_charAt">
        <value name="VALUE">
          <block type="variables_get">
            <field name="VAR">text</field>
          </block>
        </value>
      </block>
      <block type="text_getSubstring">
        <value name="STRING">
          <block type="variables_get">
            <field name="VAR">text</field>
          </block>
        </value>
      </block>
      <block type="text_changeCase">
        <value name="TEXT">
          <shadow type="text">
            <field name="TEXT">abc</field>
          </shadow>
        </value>
      </block>
      <block type="text_trim">
        <value name="TEXT">
          <shadow type="text">
            <field name="TEXT">abc</field>
          </shadow>
        </value>
      </block>
      <block type="text_print">
        <value name="TEXT">
          <shadow type="text">
            <field name="TEXT">abc</field>
          </shadow>
        </value>
      </block>
      <block type="text_prompt_ext">
        <value name="TEXT">
          <shadow type="text">
            <field name="TEXT">abc</field>
          </shadow>
        </value>
      </block>
    </category>
    <category name="Lists" colour="%{BKY_LISTS_HUE}">
      <block type="lists_create_with">
        <mutation items="0"></mutation>
      </block>
      <block type="lists_create_with"></block>
      <block type="lists_repeat">
        <value name="NUM">
          <shadow type="math_number">
            <field name="NUM">5</field>
          </shadow>
        </value>
      </block>
      <block type="lists_length"></block>
      <block type="lists_isEmpty"></block>
      <block type="lists_indexOf">
        <value name="VALUE">
          <block type="variables_get">
            <field name="VAR">list</field>
          </block>
        </value>
      </block>
      <block type="lists_getIndex">
        <value name="VALUE">
          <block type="variables_get">
            <field name="VAR">list</field>
          </block>
        </value>
      </block>
      <block type="lists_setIndex">
        <value name="LIST">
          <block type="variables_get">
            <field name="VAR">list</field>
          </block>
        </value>
      </block>
      <block type="lists_getSublist">
        <value name="LIST">
          <block type="variables_get">
            <field name="VAR">list</field>
          </block>
        </value>
      </block>
      <block type="lists_split">
        <value name="DELIM">
          <shadow type="text">
            <field name="TEXT">,</field>
          </shadow>
        </value>
      </block>
      <block type="lists_sort"></block>
    </category>
    <category name="Variables" colour="%{BKY_VARIABLES_HUE}" custom="VARIABLE"></category>
    <category name="Functions" colour="%{BKY_PROCEDURES_HUE}" custom="PROCEDURE"></category>
  </xml>`,
};

const connectToROS = () => {
  try {
    ros.value = new ROSLIB.Ros({
      url: 'ws://localhost:9090'
    });

    ros.value.on('connection', () => {
      console.log('Connected to ROS websocket server.');
      connected.value = true;

      // Create topic for publishing offboard commands
      offboardCommandTopic.value = new ROSLIB.Topic({
        ros: ros.value as ROSLIB.Ros,
        name: '/dexi/offboard_manager',
        messageType: 'dexi_interfaces/msg/OffboardNavCommand'
      });

      // Create service client for blockly commands (with feedback)
      blocklyCommandService.value = new ROSLIB.Service({
        ros: ros.value as ROSLIB.Ros,
        name: '/dexi/execute_blockly_command',
        serviceType: 'dexi_interfaces/srv/ExecuteBlocklyCommand'
      });

      // Create LED service clients
      ledEffectService.value = new ROSLIB.Service({
        ros: ros.value as ROSLIB.Ros,
        name: '/dexi/led_service/set_led_effect',
        serviceType: 'dexi_interfaces/srv/LEDEffect'
      });

      ledRingColorService.value = new ROSLIB.Service({
        ros: ros.value as ROSLIB.Ros,
        name: '/dexi/led_service/set_led_ring_color',
        serviceType: 'dexi_interfaces/srv/LEDRingColor'
      });

      ledPixelColorService.value = new ROSLIB.Service({
        ros: ros.value as ROSLIB.Ros,
        name: '/dexi/led_service/set_led_pixel_color',
        serviceType: 'dexi_interfaces/srv/LEDPixelColor'
      });
    });

    ros.value.on('error', (error: any) => {
      console.log('Error connecting to ROS websocket server: ', error);
      connected.value = false;
    });

    ros.value.on('close', () => {
      console.log('Connection to ROS websocket server closed.');
      connected.value = false;
    });
  } catch (error) {
    console.error('Failed to connect to ROS:', error);
  }
};

const disconnectFromROS = () => {
  // Clean up AprilTag subscription
  if (apriltagSubscription.value) {
    apriltagSubscription.value.unsubscribe();
    apriltagSubscription.value = null;
  }

  if (ros.value) {
    ros.value.close();
    ros.value = null;
    connected.value = false;
  }
};

const displayNotification = (message: string, type: 'success' | 'error' = 'success', duration: number = 3000) => {
  notificationMessage.value = message;
  notificationType.value = type;
  showNotification.value = true;

  setTimeout(() => {
    showNotification.value = false;
  }, duration);
};

// Helper function to call ROS service and wait for completion
const executeCommandWithService = (command: string, parameter: number = 0.0, timeout: number = 30.0): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (!blocklyCommandService.value) {
      reject('Service not available');
      return;
    }

    const request = new ROSLIB.ServiceRequest({
      command: command,
      parameter: parameter,
      timeout: timeout
    });

    blocklyCommandService.value.callService(
      request,
      (response: any) => {
        if (response.success) {
          console.log(`✅ ${command} completed in ${response.execution_time}s: ${response.message}`);
          resolve(response);
        } else {
          console.error(`❌ ${command} failed: ${response.message}`);
          reject(response.message);
        }
      },
      (error: any) => {
        console.error(`❌ Service call failed for ${command}:`, error);
        reject(error);
      }
    );
  });
};

// Execute goto NED command - uses service with proper target detection
const executeGotoNEDWithService = (north: number, east: number, down: number, yaw: number, timeout: number = 30.0): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (!offboardCommandTopic.value || !blocklyCommandService.value) {
      reject('Service not available');
      return;
    }

    console.log(`🎯 Going to NED position: N=${north}, E=${east}, D=${down}, Yaw=${yaw}°`);

    // First, publish the NED parameters to the topic so the backend can store them
    offboardCommandTopic.value.publish({
      command: 'set_goto_ned_params',
      distance_or_degrees: 0.0,
      north: north,
      east: east,
      down: down,
      yaw: yaw
    });

    // Small delay to ensure the params are set before calling the service
    setTimeout(() => {
      // Now call the service with goto_ned command
      const request = new ROSLIB.ServiceRequest({
        command: 'goto_ned',
        parameter: 0.0,
        timeout: timeout
      });

      blocklyCommandService.value!.callService(
        request,
        (response: any) => {
          if (response.success) {
            console.log(`✅ goto_ned completed in ${response.execution_time}s: ${response.message}`);
            resolve(response);
          } else {
            console.error(`❌ goto_ned failed: ${response.message}`);
            reject(response.message);
          }
        },
        (error: any) => {
          console.error(`❌ Service call failed for goto_ned:`, error);
          reject(error);
        }
      );
    }, 50);
  });
};

// Helper function to get value from input_value blocks
const getInputValue = (block: any, inputName: string, defaultValue: number): number => {
  const input = block.getInput(inputName);
  if (input && input.connection && input.connection.targetBlock()) {
    const targetBlock = input.connection.targetBlock();
    if (targetBlock.type === 'math_number') {
      return parseFloat(targetBlock.getFieldValue('NUM'));
    } else if (targetBlock.type === 'variables_get') {
      // Handle variables - would need variable context
      return defaultValue;
    }
  }
  return defaultValue;
};

const runMission = async () => {
  if (!connected.value || !blocklyCommandService.value) {
    displayNotification('Please connect to ROS first!', 'error');
    return;
  }

  const workspace = foo.value.workspace;
  const topBlocks = workspace.getTopBlocks(true);

  if (topBlocks.length === 0) {
    displayNotification('No blocks to execute!', 'error');
    return;
  }

  try {
    // Get all blocks in execution order
    const mainBlock = topBlocks[0];
    const blocksToExecute = [];
    let currentBlock = mainBlock;

    while (currentBlock) {
      blocksToExecute.push(currentBlock);
      currentBlock = currentBlock.getNextBlock();
    }

    console.log(`🚀 Starting mission with ${blocksToExecute.length} blocks`);

    // Execute each block sequentially
    for (const block of blocksToExecute) {
      const blockType = block.type;

      // Highlight current block
      workspace.highlightBlock(block.id);

      try {
        // Parse block and execute command
        if (blockType === 'nav_arm') {
          await executeCommandWithService('arm', 0, 10);
        } else if (blockType === 'nav_start_offboard_heartbeat') {
          await executeCommandWithService('start_offboard_heartbeat', 0, 5);
        } else if (blockType === 'nav_stop_offboard_heartbeat') {
          await executeCommandWithService('stop_offboard_heartbeat', 0, 5);
        } else if (blockType === 'nav_takeoff') {
          const altitude = getInputValue(block, 'ALTITUDE', 2.0);
          await executeCommandWithService('offboard_takeoff', altitude, 30);
        } else if (blockType === 'nav_land') {
          await executeCommandWithService('land', 0, 30);
        } else if (blockType === 'nav_switch_offboard_mode') {
          await executeCommandWithService('switch_offboard_mode', 0, 5);
        } else if (blockType === 'nav_switch_hold_mode') {
          await executeCommandWithService('switch_hold_mode', 0, 5);
        } else if (blockType === 'nav_fly_forward') {
          const distance = getInputValue(block, 'DISTANCE', 1.0);
          await executeCommandWithService('fly_forward', distance, 30);
        } else if (blockType === 'nav_fly_backward') {
          const distance = getInputValue(block, 'DISTANCE', 1.0);
          await executeCommandWithService('fly_backward', distance, 30);
        } else if (blockType === 'nav_fly_left') {
          const distance = getInputValue(block, 'DISTANCE', 1.0);
          await executeCommandWithService('fly_left', distance, 30);
        } else if (blockType === 'nav_fly_right') {
          const distance = getInputValue(block, 'DISTANCE', 1.0);
          await executeCommandWithService('fly_right', distance, 30);
        } else if (blockType === 'nav_fly_up') {
          const distance = getInputValue(block, 'DISTANCE', 1.0);
          await executeCommandWithService('fly_up', distance, 30);
        } else if (blockType === 'nav_fly_down') {
          const distance = getInputValue(block, 'DISTANCE', 1.0);
          await executeCommandWithService('fly_down', distance, 30);
        } else if (blockType === 'nav_yaw_left') {
          const degrees = getInputValue(block, 'DEGREES', 90);
          await executeCommandWithService('yaw_left', degrees, 10);
        } else if (blockType === 'nav_yaw_right') {
          const degrees = getInputValue(block, 'DEGREES', 90);
          await executeCommandWithService('yaw_right', degrees, 10);
        } else if (blockType === 'nav_goto_ned') {
          const north = getInputValue(block, 'NORTH', 0);
          const east = getInputValue(block, 'EAST', 0);
          const down = getInputValue(block, 'DOWN', -2);
          await executeGotoNEDWithService(north, east, down, 0, 30);
        } else if (blockType === 'nav_goto_ned_with_yaw') {
          const north = getInputValue(block, 'NORTH', 0);
          const east = getInputValue(block, 'EAST', 0);
          const down = getInputValue(block, 'DOWN', -2);
          const yaw = getInputValue(block, 'YAW', 0);
          await executeGotoNEDWithService(north, east, down, yaw, 30);
        } else if (blockType === 'nav_wait') {
          // Get the duration value - could be a number or a variable
          const durationInput = block.getInput('DURATION');
          let duration = 1; // default
          if (durationInput && durationInput.connection && durationInput.connection.targetBlock()) {
            const targetBlock = durationInput.connection.targetBlock();
            if (targetBlock.type === 'math_number') {
              duration = parseFloat(targetBlock.getFieldValue('NUM'));
            }
          }
          console.log(`⏱️ Waiting ${duration} seconds...`);
          await new Promise(resolve => setTimeout(resolve, duration * 1000));
        } else if (blockType === 'nav_takeoff_after') {
          const delayInput = block.getInput('DELAY');
          let delay = 5;
          if (delayInput && delayInput.connection && delayInput.connection.targetBlock()) {
            const targetBlock = delayInput.connection.targetBlock();
            if (targetBlock.type === 'math_number') {
              delay = parseFloat(targetBlock.getFieldValue('NUM'));
            }
          }
          console.log(`⏱️ Waiting ${delay} seconds before takeoff...`);
          await new Promise(resolve => setTimeout(resolve, delay * 1000));
          await executeCommandWithService('offboard_takeoff', 2.0, 30);
        } else if (blockType === 'nav_takeoff_and_wait') {
          const waitInput = block.getInput('WAIT_TIME');
          let waitTime = 5;
          if (waitInput && waitInput.connection && waitInput.connection.targetBlock()) {
            const targetBlock = waitInput.connection.targetBlock();
            if (targetBlock.type === 'math_number') {
              waitTime = parseFloat(targetBlock.getFieldValue('NUM'));
            }
          }
          await executeCommandWithService('offboard_takeoff', 2.0, 30);
          console.log(`⏱️ Waiting ${waitTime} seconds after takeoff...`);
          await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
        } else if (blockType === 'nav_land_after') {
          const delayInput = block.getInput('DELAY');
          let delay = 5;
          if (delayInput && delayInput.connection && delayInput.connection.targetBlock()) {
            const targetBlock = delayInput.connection.targetBlock();
            if (targetBlock.type === 'math_number') {
              delay = parseFloat(targetBlock.getFieldValue('NUM'));
            }
          }
          console.log(`⏱️ Waiting ${delay} seconds before landing...`);
          await new Promise(resolve => setTimeout(resolve, delay * 1000));
          await executeCommandWithService('land', 0, 30);
        } else if (blockType === 'nav_land_wait_takeoff') {
          const durationInput = block.getInput('DURATION');
          let duration = 5;
          if (durationInput && durationInput.connection && durationInput.connection.targetBlock()) {
            const targetBlock = durationInput.connection.targetBlock();
            if (targetBlock.type === 'math_number') {
              duration = parseFloat(targetBlock.getFieldValue('NUM'));
            }
          }
          await executeCommandWithService('land', 0, 30);
          console.log(`⏱️ Waiting ${duration} seconds on ground before takeoff...`);
          await new Promise(resolve => setTimeout(resolve, duration * 1000));
          await executeCommandWithService('offboard_takeoff', 2.0, 30);
        } else if (blockType === 'led_effect') {
          const effect = block.getFieldValue('effect');
          if (ledEffectService.value) {
            const request = new ROSLIB.ServiceRequest({
              effect_name: effect
            });
            await new Promise((resolve, reject) => {
              ledEffectService.value!.callService(request, (response: any) => {
                console.log(`✅ LED effect set to: ${effect}`);
                resolve(response);
              }, (error: any) => {
                console.error(`❌ LED effect failed:`, error);
                reject(error);
              });
            });
          }
        } else if (blockType === 'led_ring') {
          const color = block.getFieldValue('color');
          if (ledRingColorService.value) {
            const request = new ROSLIB.ServiceRequest({
              color: color
            });
            await new Promise((resolve, reject) => {
              ledRingColorService.value!.callService(request, (response: any) => {
                console.log(`✅ LED ring color set to: ${color}`);
                resolve(response);
              }, (error: any) => {
                console.error(`❌ LED ring color failed:`, error);
                reject(error);
              });
            });
          }
        } else if (blockType === 'led_pixel') {
          const index = block.getFieldValue('index');
          const red = block.getFieldValue('red');
          const green = block.getFieldValue('green');
          const blue = block.getFieldValue('blue');
          if (ledPixelColorService.value) {
            const request = new ROSLIB.ServiceRequest({
              index: parseInt(index),
              r: parseInt(red),
              g: parseInt(green),
              b: parseInt(blue)
            });
            await new Promise((resolve, reject) => {
              ledPixelColorService.value!.callService(request, (response: any) => {
                console.log(`✅ LED pixel ${index} set to RGB(${red}, ${green}, ${blue})`);
                resolve(response);
              }, (error: any) => {
                console.error(`❌ LED pixel failed:`, error);
                reject(error);
              });
            });
          }
        } else if (blockType === 'apriltag_start_monitoring') {
          // Start monitoring AprilTags in background
          if (!apriltagSubscription.value && ros.value) {
            apriltagSubscription.value = new ROSLIB.Topic({
              ros: ros.value as ROSLIB.Ros,
              name: '/apriltag_detections',
              messageType: 'apriltag_msgs/AprilTagDetectionArray'
            });

            apriltagSubscription.value.subscribe((message: any) => {
              if (message.detections && message.detections.length > 0) {
                lastDetectedTagId.value = message.detections[0].id;
                detectedTagCount.value = message.detections.length;
                console.log(`📷 Detected ${detectedTagCount.value} AprilTag(s), ID: ${lastDetectedTagId.value}`);
              } else {
                detectedTagCount.value = 0;
              }
            });
            console.log('✅ Started AprilTag monitoring');
          }
        } else if (blockType === 'apriltag_stop_monitoring') {
          // Stop monitoring AprilTags
          if (apriltagSubscription.value) {
            apriltagSubscription.value.unsubscribe();
            apriltagSubscription.value = null;
            console.log('⏹️ Stopped AprilTag monitoring');
          }
        } else {
          console.log(`⚠️ Skipping unknown block type: ${blockType}`);
        }

        // Unhighlight after execution
        workspace.highlightBlock(null);

      } catch (error) {
        workspace.highlightBlock(null);
        throw error;
      }
    }

    console.log('✅ Mission completed successfully!');
    displayNotification('Mission completed successfully!', 'success');

  } catch (error) {
    console.error('❌ Mission failed:', error);
    displayNotification('Mission failed: ' + error, 'error');
    foo.value.workspace.highlightBlock(null);
  }
};

const stopMission = () => {
  if (!connected.value || !offboardCommandTopic.value) {
    return;
  }

  // Send disarm command
  offboardCommandTopic.value.publish({
    command: 'disarm',
    distance_or_degrees: 0.0
  });

  // Stop offboard heartbeat
  offboardCommandTopic.value.publish({
    command: 'stop_offboard_heartbeat',
    distance_or_degrees: 0.0
  });
};

const startDragging = () => {
  isDragging.value = true;
};

const stopDragging = () => {
  isDragging.value = false;
};

const onDrag = (e: MouseEvent) => {
  if (!isDragging.value) return;

  const containerWidth = window.innerWidth;
  const newWidth = (e.clientX / containerWidth) * 100;

  // Constrain between 20% and 80%
  if (newWidth >= 20 && newWidth <= 80) {
    leftPanelWidth.value = newWidth;
  }
};

// Save workspace to localStorage
const saveWorkspace = () => {
  if (foo.value && foo.value.workspace) {
    const xml = Blockly.Xml.workspaceToDom(foo.value.workspace);
    const xmlText = Blockly.Xml.domToText(xml);
    localStorage.setItem('droneblocks_mission', xmlText);
    console.log('💾 Mission saved to localStorage');
  }
};

// Load workspace from localStorage
const loadWorkspace = () => {
  if (foo.value && foo.value.workspace) {
    const xmlText = localStorage.getItem('droneblocks_mission');
    if (xmlText) {
      try {
        const xml = Blockly.utils.xml.textToDom(xmlText);
        Blockly.Xml.clearWorkspaceAndLoadFromXml(xml, foo.value.workspace);
        console.log('📂 Mission loaded from localStorage');
      } catch (error) {
        console.error('Failed to load mission from localStorage:', error);
      }
    }
  }
};

// Clear workspace
const clearWorkspace = () => {
  if (foo.value && foo.value.workspace) {
    foo.value.workspace.clear();
    localStorage.removeItem('droneblocks_mission');
    console.log('🗑️ Workspace cleared');
  }
};

onMounted(() => {
  connectToROS();
  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', stopDragging);

  // Load saved mission after a short delay to ensure workspace is ready
  setTimeout(() => {
    loadWorkspace();

    // Auto-save on workspace changes
    if (foo.value && foo.value.workspace) {
      foo.value.workspace.addChangeListener((event: any) => {
        // Save on any block movement, creation, deletion, or modification
        if (event.type === Blockly.Events.BLOCK_MOVE ||
            event.type === Blockly.Events.BLOCK_CREATE ||
            event.type === Blockly.Events.BLOCK_DELETE ||
            event.type === Blockly.Events.BLOCK_CHANGE) {
          saveWorkspace();
        }
      });
    }
  }, 500);

  // Show welcome modal for first-time visitors
  console.log('[DroneBlocks] Checking first visit:', tutorial.isFirstVisit.value);
  if (tutorial.isFirstVisit.value) {
    console.log('[DroneBlocks] Showing welcome modal');
    tutorial.showWelcome();
  } else {
    console.log('[DroneBlocks] Not first visit, skipping welcome');
  }
});

onUnmounted(() => {
  disconnectFromROS();
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDragging);
});
</script>

<template>
  <div class="droneblocks-container">
    <div class="header">
      <div class="header-left">
        <h1>DroneBlocks</h1>
        <div class="connection-indicator" :class="{ connected: connected, disconnected: !connected }">
          <span class="indicator-dot"></span>
          <span class="indicator-text">{{ connected ? 'Connected' : 'Disconnected' }}</span>
        </div>
      </div>

      <div class="header-center">
        <div class="telemetry-group">
          <FlightModeDisplay v-if="ros" :ros="ros" />
          <span v-else class="telemetry-item">Mode: Unknown</span>
        </div>
        <NEDPositionDisplay v-if="ros && connected" :ros="ros" />
      </div>

      <div class="header-right">
        <button @click="showLessonPicker = true" class="icon-btn tutorial-btn" title="Tutorials">
          🎓
        </button>
        <button @click="runMission" :disabled="!connected" class="primary-btn">
          ▶ Run
        </button>
        <button @click="stopMission" :disabled="!connected" class="danger-btn">
          ⏹ Stop
        </button>
      </div>
    </div>

    <!-- Notification Modal -->
    <Transition name="fade">
      <div v-if="showNotification" class="notification-modal" :class="notificationType">
        {{ notificationMessage }}
      </div>
    </Transition>

    <div class="split-container">
      <div class="blockly-panel" :style="{ width: leftPanelWidth + '%' }">
        <blockly-component
          id="blockly2"
          :options="options"
          ref="foo"
        ></blockly-component>
      </div>

      <div class="divider" @mousedown="startDragging" :class="{ dragging: isDragging }">
        <div class="divider-handle"></div>
      </div>

      <div class="unity-panel" :style="{ width: (100 - leftPanelWidth) + '%' }">
        <iframe
          src="http://localhost:1337"
          class="unity-iframe"
          frameborder="0"
          allowfullscreen
        ></iframe>
      </div>
    </div>

    <!-- Tutorial Components -->
    <TutorialWelcome />
    <TutorialModal />
    <TutorialHighlight />
    <TutorialLessonPicker :show="showLessonPicker" @close="showLessonPicker = false" />
  </div>
</template>

<style>
/* Fix Blockly flyout scrollbar */
.blocklyFlyout {
  overflow: visible !important;
}

.blocklyScrollbarVertical,
.blocklyScrollbarHorizontal {
  display: none !important;
}
</style>

<style scoped>
.droneblocks-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.header {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: white;
  padding: 0.75rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  border-bottom: 1px solid rgba(42, 157, 143, 0.2);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header h1 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.connection-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  padding: 0.375rem 0.75rem;
  border-radius: 20px;
  background: rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.connection-indicator.connected .indicator-dot {
  background-color: #4ade80;
  box-shadow: 0 0 8px rgba(74, 222, 128, 0.6);
}

.connection-indicator.disconnected .indicator-dot {
  background-color: #ef4444;
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.6);
}

.indicator-text {
  font-weight: 500;
  opacity: 0.9;
}

.header-center {
  display: flex;
  align-items: center;
  gap: 2rem;
  flex: 1;
  justify-content: center;
}

.telemetry-group {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.telemetry-item {
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  padding: 0.375rem 0.75rem;
  background: rgba(42, 157, 143, 0.15);
  border-radius: 6px;
  border: 1px solid rgba(42, 157, 143, 0.3);
}

.header-right {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

button {
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.2s ease;
  outline: none;
}

button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.icon-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  padding: 0;
}

.icon-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.primary-btn {
  padding: 0.5rem 1.25rem;
  border-radius: 8px;
  background: #2a9d8f;
  color: white;
  box-shadow: 0 2px 4px rgba(42, 157, 143, 0.3);
}

.primary-btn:hover:not(:disabled) {
  background: #21867a;
  box-shadow: 0 4px 8px rgba(42, 157, 143, 0.4);
  transform: translateY(-1px);
}

.danger-btn {
  padding: 0.5rem 1.25rem;
  border-radius: 8px;
  background: #e76f51;
  color: white;
  box-shadow: 0 2px 4px rgba(231, 111, 81, 0.3);
}

.danger-btn:hover:not(:disabled) {
  background: #d45f43;
  box-shadow: 0 4px 8px rgba(231, 111, 81, 0.4);
  transform: translateY(-1px);
}

.split-container {
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
}

.blockly-panel {
  height: 100%;
  position: relative;
}

#blockly2 {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.divider {
  width: 8px;
  height: 100%;
  background-color: #2a9d8f;
  cursor: col-resize;
  position: relative;
  flex-shrink: 0;
  transition: background-color 0.2s;
  z-index: 1000;
}

.divider:hover,
.divider.dragging {
  background-color: #21867a;
}

.divider-handle {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 4px;
  height: 40px;
  background-color: rgba(255, 255, 255, 0.5);
  border-radius: 2px;
}

.unity-panel {
  height: 100%;
  background-color: #1a1a1a;
  position: relative;
  overflow: hidden;
}

.unity-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.notification-modal {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  padding: 1rem 2rem;
  border-radius: 8px;
  font-weight: bold;
  font-size: 1.1rem;
  z-index: 10000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  min-width: 300px;
  text-align: center;
}

.notification-modal.success {
  background-color: #2a9d8f;
  color: white;
}

.notification-modal.error {
  background-color: #e76f51;
  color: white;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
