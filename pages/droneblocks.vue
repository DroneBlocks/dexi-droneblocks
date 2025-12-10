<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import * as Blockly from 'blockly/core';
import { Navigation } from '~/assets/ts/navigation';
import { LED } from '~/assets/ts/led';
import { AprilTag } from '~/assets/ts/apriltag';
import { javascriptGenerator } from 'blockly/javascript';
import ROSLIB from 'roslib';
import { useROS } from '~/composables/useROS';
import { useTutorial } from '~/tutorial';
import TutorialWelcome from '~/tutorial/components/TutorialWelcome.vue';
import TutorialModal from '~/tutorial/components/TutorialModal.vue';
import TutorialHighlight from '~/tutorial/components/TutorialHighlight.vue';
import TutorialLessonPicker from '~/tutorial/components/TutorialLessonPicker.vue';
import KeyboardControl from '~/components/KeyboardControl.vue';
import CameraFeed from '~/components/CameraFeed.vue';

const navigation = new Navigation();
const led = new LED();
const apriltag = new AprilTag();

// Tutorial system
const tutorial = useTutorial();
const showLessonPicker = ref(false);

// Menu and keyboard control
const showMenu = ref(false);
const showKeyboardControl = ref(false);

// View mode: 'simulator' or 'drone'
const viewMode = ref<'simulator' | 'drone'>('simulator');

// Camera overlay state
const cameraPosition = ref({ x: 0, y: 0 });
const cameraEnlarged = ref(false);
const isDraggingCamera = ref(false);
const cameraDragStart = ref({ x: 0, y: 0 });

// Load tabs from localStorage or use default
const loadTabsFromStorage = () => {
  const savedTabs = localStorage.getItem('droneblocks_tabs');
  const savedActiveTab = localStorage.getItem('droneblocks_active_tab');
  const savedNextId = localStorage.getItem('droneblocks_next_tab_id');

  if (savedTabs) {
    try {
      return {
        tabs: JSON.parse(savedTabs),
        activeTabId: savedActiveTab ? parseInt(savedActiveTab) : 1,
        nextTabId: savedNextId ? parseInt(savedNextId) : 2
      };
    } catch (error) {
      console.error('Failed to load tabs from localStorage:', error);
    }
  }

  return {
    tabs: [{ id: 1, name: 'Mission 1', workspace: null }],
    activeTabId: 1,
    nextTabId: 2
  };
};

const tabsData = loadTabsFromStorage();

// Tabs for multiple canvases
const tabs = ref(tabsData.tabs);
const activeTabId = ref(tabsData.activeTabId);
const nextTabId = ref(tabsData.nextTabId);

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
const currentAprilTagId = ref<number>(-1);
let apriltagTimeoutId: NodeJS.Timeout | null = null;

// Mission state tracking
const isMissionRunning = ref(false);

// NED position tracking
const nedNorth = ref<number>(0);
const nedEast = ref<number>(0);
const nedDown = ref<number>(0);

// Unity simulator URL - use current hostname
const unityUrl = ref('');
if (process.client) {
  const hostname = window.location.hostname;
  unityUrl.value = `http://${hostname}:1337`;
}

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
    <category name="Setup" colour="#6366F1">
        <block type="nav_arm"></block>
        <block type="nav_disarm"></block>
        <block type="nav_start_offboard_heartbeat"></block>
        <block type="nav_stop_offboard_heartbeat"></block>
        <block type="nav_switch_offboard_mode"></block>
        <block type="nav_switch_hold_mode"></block>
      </category>
      <category name="Takeoff" colour="#4CAF50">
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
      <category name="Navigation" colour="#3B82F6">
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
      <category name="Land" colour="#E74C3C">
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

const { getROSURL } = useROS();

const connectToROS = () => {
  try {
    ros.value = new ROSLIB.Ros({
      url: getROSURL()
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

      // Subscribe to AprilTag detections for debugging
      const apriltagDebugTopic = new ROSLIB.Topic({
        ros: ros.value as ROSLIB.Ros,
        name: '/apriltag_detections',
        messageType: 'apriltag_msgs/AprilTagDetectionArray'
      });

      apriltagDebugTopic.subscribe((message: any) => {
        if (message.detections && message.detections.length > 0) {
          currentAprilTagId.value = message.detections[0].id;

          // Clear any existing timeout
          if (apriltagTimeoutId) {
            clearTimeout(apriltagTimeoutId);
          }

          // Set a timeout to reset the tag ID if no new detections come in
          apriltagTimeoutId = setTimeout(() => {
            currentAprilTagId.value = -1;
          }, 500); // Reset after 500ms of no detections
        } else {
          currentAprilTagId.value = -1;
        }
      });

      // Subscribe to vehicle local position for NED coordinates
      const localPositionTopic = new ROSLIB.Topic({
        ros: ros.value as ROSLIB.Ros,
        name: '/fmu/out/vehicle_local_position',
        messageType: 'px4_msgs/msg/VehicleLocalPosition'
      });

      localPositionTopic.subscribe((message: any) => {
        nedNorth.value = message.x;
        nedEast.value = message.y;
        nedDown.value = message.z;
      });

      console.log('✅ Connected to ROS and services initialized');
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
    isMissionRunning.value = true;

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
        } else if (blockType === 'nav_disarm') {
          await executeCommandWithService('disarm', 0, 10);
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
          console.log(`🔍 Starting AprilTag monitoring. Current lastDetectedTagId: ${lastDetectedTagId.value}`);
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
                console.log(`📷 AprilTag detected - ID: ${lastDetectedTagId.value}, Count: ${detectedTagCount.value}`);
              } else {
                detectedTagCount.value = 0;
                // Note: We keep lastDetectedTagId at its last value
              }
            });
            console.log('✅ Started AprilTag monitoring');

            // Wait a bit for first message to arrive
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        } else if (blockType === 'apriltag_stop_monitoring') {
          // Stop monitoring AprilTags
          if (apriltagSubscription.value) {
            apriltagSubscription.value.unsubscribe();
            apriltagSubscription.value = null;
            console.log('⏹️ Stopped AprilTag monitoring');
          }
        } else if (blockType === 'controls_repeat_ext') {
          // Handle repeat loop
          const timesBlock = block.getInputTargetBlock('TIMES');
          let repeatCount = 10; // Default

          if (timesBlock && timesBlock.type === 'math_number') {
            repeatCount = parseInt(timesBlock.getFieldValue('NUM'));
          }

          console.log(`🔁 Starting loop (${repeatCount} iterations)`);

          // Execute the blocks inside the loop
          const doBlock = block.getInputTargetBlock('DO');
          if (doBlock) {
            for (let i = 0; i < repeatCount; i++) {
              console.log(`🔁 Loop iteration ${i + 1}/${repeatCount}`);

              let currentBlock = doBlock;
              while (currentBlock) {
                const innerBlockType = currentBlock.type;

                // Execute blocks inside the loop (similar to if statement handling)
                if (innerBlockType === 'text_print') {
                  const textBlock = currentBlock.getInputTargetBlock('TEXT');
                  let message = '';
                  if (textBlock && textBlock.type === 'text') {
                    message = textBlock.getFieldValue('TEXT');
                  }
                  console.log(`📝 ${message}`);
                } else if (innerBlockType === 'led_effect') {
                  const effect = currentBlock.getFieldValue('effect');
                  if (ledEffectService.value) {
                    const request = new ROSLIB.ServiceRequest({ effect_name: effect });
                    await new Promise((resolve, reject) => {
                      ledEffectService.value!.callService(request, (response: any) => {
                        console.log(`✅ LED effect set to ${effect}`);
                        resolve(response);
                      }, (error: any) => {
                        console.error(`❌ LED effect failed:`, error);
                        reject(error);
                      });
                    });
                  }
                } else if (innerBlockType === 'led_ring') {
                  const color = currentBlock.getFieldValue('color');
                  if (ledRingColorService.value) {
                    const request = new ROSLIB.ServiceRequest({ color: color });
                    await new Promise((resolve, reject) => {
                      ledRingColorService.value!.callService(request, (response: any) => {
                        console.log(`✅ LED ring set to ${color}`);
                        resolve(response);
                      }, (error: any) => {
                        console.error(`❌ LED ring color failed:`, error);
                        reject(error);
                      });
                    });
                  }
                } else if (innerBlockType === 'controls_if') {
                  // Handle if/else blocks inside loops
                  console.log('🔍 Processing if statement inside loop');
                  const conditionBlock = currentBlock.getInputTargetBlock('IF0');
                  let shouldExecute = false;

                  if (conditionBlock && conditionBlock.type === 'logic_compare') {
                    const operator = conditionBlock.getFieldValue('OP');
                    const leftBlock = conditionBlock.getInputTargetBlock('A');
                    const rightBlock = conditionBlock.getInputTargetBlock('B');

                    let leftValue: any = undefined;
                    let rightValue: any = undefined;

                    // Evaluate left side
                    if (leftBlock) {
                      console.log(`🔍 Left block type: ${leftBlock.type}`);
                      if (leftBlock.type === 'apriltag_get_last_id') {
                        leftValue = lastDetectedTagId.value;
                        console.log(`📷 Reading lastDetectedTagId: ${leftValue}`);
                      } else if (leftBlock.type === 'apriltag_get_tag_count') {
                        leftValue = detectedTagCount.value;
                        console.log(`📷 Reading detectedTagCount: ${leftValue}`);
                      } else if (leftBlock.type === 'math_number') {
                        leftValue = parseFloat(leftBlock.getFieldValue('NUM'));
                        console.log(`🔢 Reading number: ${leftValue}`);
                      }
                    }

                    // Evaluate right side
                    if (rightBlock) {
                      console.log(`🔍 Right block type: ${rightBlock.type}`);
                      if (rightBlock.type === 'math_number') {
                        rightValue = parseFloat(rightBlock.getFieldValue('NUM'));
                        console.log(`🔢 Reading number: ${rightValue}`);
                      } else if (rightBlock.type === 'apriltag_get_last_id') {
                        rightValue = lastDetectedTagId.value;
                        console.log(`📷 Reading lastDetectedTagId: ${rightValue}`);
                      } else if (rightBlock.type === 'apriltag_get_tag_count') {
                        rightValue = detectedTagCount.value;
                        console.log(`📷 Reading detectedTagCount: ${rightValue}`);
                      }
                    }

                    // Evaluate condition
                    switch (operator) {
                      case 'EQ':
                        shouldExecute = leftValue === rightValue;
                        break;
                      case 'NEQ':
                        shouldExecute = leftValue !== rightValue;
                        break;
                      case 'LT':
                        shouldExecute = leftValue < rightValue;
                        break;
                      case 'LTE':
                        shouldExecute = leftValue <= rightValue;
                        break;
                      case 'GT':
                        shouldExecute = leftValue > rightValue;
                        break;
                      case 'GTE':
                        shouldExecute = leftValue >= rightValue;
                        break;
                    }
                    console.log(`✔️ Condition: ${leftValue} ${operator} ${rightValue} = ${shouldExecute}`);
                  }

                  // Execute blocks inside if statement if condition is true
                  if (shouldExecute) {
                    const doBlock = currentBlock.getInputTargetBlock('DO0');
                    if (doBlock) {
                      let ifCurrentBlock = doBlock;
                      while (ifCurrentBlock) {
                        const ifBlockType = ifCurrentBlock.type;

                        // Handle blocks inside if (reuse existing handlers)
                        if (ifBlockType === 'led_ring') {
                          const color = ifCurrentBlock.getFieldValue('color');
                          if (ledRingColorService.value) {
                            const request = new ROSLIB.ServiceRequest({ color: color });
                            await new Promise((resolve, reject) => {
                              ledRingColorService.value!.callService(request, (response: any) => {
                                console.log(`✅ LED ring set to ${color}`);
                                resolve(response);
                              }, (error: any) => {
                                console.error(`❌ LED ring color failed:`, error);
                                reject(error);
                              });
                            });
                          }
                        } else if (ifBlockType === 'led_effect') {
                          const effect = ifCurrentBlock.getFieldValue('effect');
                          if (ledEffectService.value) {
                            const request = new ROSLIB.ServiceRequest({ effect_name: effect });
                            await new Promise((resolve, reject) => {
                              ledEffectService.value!.callService(request, (response: any) => {
                                console.log(`✅ LED effect set to ${effect}`);
                                resolve(response);
                              }, (error: any) => {
                                console.error(`❌ LED effect failed:`, error);
                                reject(error);
                              });
                            });
                          }
                        } else if (ifBlockType === 'nav_wait') {
                          const durationInput = ifCurrentBlock.getInput('DURATION');
                          let duration = 1;
                          if (durationInput && durationInput.connection && durationInput.connection.targetBlock()) {
                            const targetBlock = durationInput.connection.targetBlock();
                            if (targetBlock.type === 'math_number') {
                              duration = parseFloat(targetBlock.getFieldValue('NUM'));
                            }
                          }
                          console.log(`⏱️ Waiting ${duration} seconds...`);
                          await new Promise(resolve => setTimeout(resolve, duration * 1000));
                        }

                        ifCurrentBlock = ifCurrentBlock.getNextBlock();
                      }
                    }
                  }
                } else if (innerBlockType === 'nav_wait') {
                  const durationInput = currentBlock.getInput('DURATION');
                  let duration = 1; // default
                  if (durationInput && durationInput.connection && durationInput.connection.targetBlock()) {
                    const targetBlock = durationInput.connection.targetBlock();
                    if (targetBlock.type === 'math_number') {
                      duration = parseFloat(targetBlock.getFieldValue('NUM'));
                    }
                  }
                  console.log(`⏱️ Waiting ${duration} seconds...`);
                  await new Promise(resolve => setTimeout(resolve, duration * 1000));
                } else if (innerBlockType === 'nav_fly_forward') {
                  const distance = getInputValue(currentBlock, 'DISTANCE', 1.0);
                  await executeCommandWithService('fly_forward', distance, 30);
                } else if (innerBlockType === 'nav_fly_backward') {
                  const distance = getInputValue(currentBlock, 'DISTANCE', 1.0);
                  await executeCommandWithService('fly_backward', distance, 30);
                } else if (innerBlockType === 'nav_fly_left') {
                  const distance = getInputValue(currentBlock, 'DISTANCE', 1.0);
                  await executeCommandWithService('fly_left', distance, 30);
                } else if (innerBlockType === 'nav_fly_right') {
                  const distance = getInputValue(currentBlock, 'DISTANCE', 1.0);
                  await executeCommandWithService('fly_right', distance, 30);
                } else if (innerBlockType === 'nav_fly_up') {
                  const distance = getInputValue(currentBlock, 'DISTANCE', 1.0);
                  await executeCommandWithService('fly_up', distance, 30);
                } else if (innerBlockType === 'nav_fly_down') {
                  const distance = getInputValue(currentBlock, 'DISTANCE', 1.0);
                  await executeCommandWithService('fly_down', distance, 30);
                } else if (innerBlockType === 'nav_yaw_left') {
                  const degrees = getInputValue(currentBlock, 'DEGREES', 90);
                  await executeCommandWithService('yaw_left', degrees, 10);
                } else if (innerBlockType === 'nav_yaw_right') {
                  const degrees = getInputValue(currentBlock, 'DEGREES', 90);
                  await executeCommandWithService('yaw_right', degrees, 10);
                } else if (innerBlockType === 'nav_takeoff') {
                  const altitude = getInputValue(currentBlock, 'ALTITUDE', 2.0);
                  await executeCommandWithService('takeoff', altitude, 30);
                } else if (innerBlockType === 'nav_land') {
                  await executeCommandWithService('land', 0, 30);
                } else if (innerBlockType === 'nav_arm') {
                  await executeCommandWithService('arm', 0, 10);
                } else if (innerBlockType === 'nav_disarm') {
                  await executeCommandWithService('disarm', 0, 10);
                }

                currentBlock = currentBlock.getNextBlock();
              }
            }
          }
        } else if (blockType === 'controls_if') {
          // Handle if/else conditional blocks
          const conditionValue = block.getInputTargetBlock('IF0');
          let shouldExecute = false;

          if (conditionValue) {
            const conditionType = conditionValue.type;

            if (conditionType === 'logic_compare') {
              const operator = conditionValue.getFieldValue('OP');
              const leftBlock = conditionValue.getInputTargetBlock('A');
              const rightBlock = conditionValue.getInputTargetBlock('B');

              let leftValue: any;
              let rightValue: any;

              // Evaluate left side
              if (leftBlock) {
                console.log(`🔍 Left block type: ${leftBlock.type}`);
                if (leftBlock.type === 'apriltag_get_last_id') {
                  leftValue = lastDetectedTagId.value;
                  console.log(`📷 Reading lastDetectedTagId: ${leftValue}`);
                } else if (leftBlock.type === 'apriltag_get_tag_count') {
                  leftValue = detectedTagCount.value;
                  console.log(`📷 Reading detectedTagCount: ${leftValue}`);
                } else if (leftBlock.type === 'math_number') {
                  leftValue = parseFloat(leftBlock.getFieldValue('NUM'));
                  console.log(`🔢 Reading number: ${leftValue}`);
                }
              } else {
                console.log('⚠️ No left block found');
              }

              // Evaluate right side
              if (rightBlock) {
                console.log(`🔍 Right block type: ${rightBlock.type}`);
                if (rightBlock.type === 'math_number') {
                  rightValue = parseFloat(rightBlock.getFieldValue('NUM'));
                  console.log(`🔢 Reading number: ${rightValue}`);
                } else if (rightBlock.type === 'apriltag_get_last_id') {
                  rightValue = lastDetectedTagId.value;
                  console.log(`📷 Reading lastDetectedTagId: ${rightValue}`);
                } else if (rightBlock.type === 'apriltag_get_tag_count') {
                  rightValue = detectedTagCount.value;
                  console.log(`📷 Reading detectedTagCount: ${rightValue}`);
                }
              } else {
                console.log('⚠️ No right block found');
              }

              // Evaluate condition
              switch (operator) {
                case 'EQ':
                  shouldExecute = leftValue === rightValue;
                  break;
                case 'NEQ':
                  shouldExecute = leftValue !== rightValue;
                  break;
                case 'LT':
                  shouldExecute = leftValue < rightValue;
                  break;
                case 'LTE':
                  shouldExecute = leftValue <= rightValue;
                  break;
                case 'GT':
                  shouldExecute = leftValue > rightValue;
                  break;
                case 'GTE':
                  shouldExecute = leftValue >= rightValue;
                  break;
              }

              console.log(`🔍 Condition evaluated: ${leftValue} ${operator} ${rightValue} = ${shouldExecute}`);
            }
          }

          // Execute blocks inside the if statement if condition is true
          if (shouldExecute) {
            const doBlock = block.getInputTargetBlock('DO0');
            if (doBlock) {
              console.log('✅ Condition true, executing blocks inside if statement');
              let currentBlock = doBlock;
              while (currentBlock) {
                const innerBlockType = currentBlock.type;

                // Recursively handle blocks inside the if
                if (innerBlockType === 'text_print') {
                  const textBlock = currentBlock.getInputTargetBlock('TEXT');
                  let message = '';

                  if (textBlock) {
                    if (textBlock.type === 'text') {
                      message = textBlock.getFieldValue('TEXT');
                    }
                  }

                  console.log(`📝 ${message}`);
                } else if (innerBlockType === 'led_effect') {
                  const effect = currentBlock.getFieldValue('effect');
                  if (ledEffectService.value) {
                    const request = new ROSLIB.ServiceRequest({ effect_name: effect });
                    await new Promise((resolve, reject) => {
                      ledEffectService.value!.callService(request, (response: any) => {
                        console.log(`✅ LED effect set to ${effect}`);
                        resolve(response);
                      }, (error: any) => {
                        console.error(`❌ LED effect failed:`, error);
                        reject(error);
                      });
                    });
                  }
                } else if (innerBlockType === 'led_ring') {
                  const color = currentBlock.getFieldValue('color');
                  if (ledRingColorService.value) {
                    const request = new ROSLIB.ServiceRequest({ color: color });
                    await new Promise((resolve, reject) => {
                      ledRingColorService.value!.callService(request, (response: any) => {
                        console.log(`✅ LED ring set to ${color}`);
                        resolve(response);
                      }, (error: any) => {
                        console.error(`❌ LED ring color failed:`, error);
                        reject(error);
                      });
                    });
                  }
                }

                currentBlock = currentBlock.getNextBlock();
              }
            }
          } else {
            console.log('❌ Condition false, skipping if statement blocks');
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
  } finally {
    isMissionRunning.value = false;
  }
};

const stopMission = () => {
  if (!connected.value || !offboardCommandTopic.value) {
    return;
  }

  isMissionRunning.value = false;

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

// Save tabs to localStorage
const saveTabs = () => {
  localStorage.setItem('droneblocks_tabs', JSON.stringify(tabs.value));
  localStorage.setItem('droneblocks_active_tab', activeTabId.value.toString());
  localStorage.setItem('droneblocks_next_tab_id', nextTabId.value.toString());
};

// Tab management
const addTab = () => {
  const newTab = {
    id: nextTabId.value,
    name: `Mission ${nextTabId.value}`,
    workspace: null
  };
  tabs.value.push(newTab);
  nextTabId.value++;
  activeTabId.value = newTab.id;

  saveTabs();

  // Load workspace for new tab
  setTimeout(() => {
    loadWorkspaceForTab(newTab.id);
  }, 100);
};

const removeTab = (tabId: number) => {
  if (tabs.value.length === 1) return; // Don't remove last tab

  const index = tabs.value.findIndex(t => t.id === tabId);
  if (index !== -1) {
    // Remove workspace from localStorage
    localStorage.removeItem(`droneblocks_mission_${tabId}`);

    tabs.value.splice(index, 1);

    // Switch to another tab
    if (activeTabId.value === tabId) {
      activeTabId.value = tabs.value[Math.max(0, index - 1)].id;
      loadWorkspaceForTab(activeTabId.value);
    }

    saveTabs();
  }
};

const switchTab = (tabId: number) => {
  if (activeTabId.value === tabId) return;

  // Save current workspace
  saveWorkspace();

  // Switch to new tab
  activeTabId.value = tabId;
  saveTabs();
  loadWorkspaceForTab(tabId);

  // Resize Blockly after tab switch
  setTimeout(() => {
    if (foo.value && foo.value.workspace) {
      Blockly.svgResize(foo.value.workspace);
    }
  }, 100);
};

const renameTab = (tabId: number, newName: string) => {
  const tab = tabs.value.find(t => t.id === tabId);
  if (tab) {
    tab.name = newName;
  }
};

// Save workspace to localStorage
const saveWorkspace = () => {
  if (foo.value && foo.value.workspace) {
    const xml = Blockly.Xml.workspaceToDom(foo.value.workspace);
    const xmlText = Blockly.Xml.domToText(xml);
    localStorage.setItem(`droneblocks_mission_${activeTabId.value}`, xmlText);
    console.log(`💾 Mission saved to localStorage (Tab ${activeTabId.value})`);
  }
};

// Load workspace from localStorage
const loadWorkspace = () => {
  loadWorkspaceForTab(activeTabId.value);
};

const loadWorkspaceForTab = (tabId: number) => {
  if (foo.value && foo.value.workspace) {
    // First, clear the workspace completely
    foo.value.workspace.clear();

    const xmlText = localStorage.getItem(`droneblocks_mission_${tabId}`);
    if (xmlText) {
      try {
        const xml = Blockly.utils.xml.textToDom(xmlText);
        Blockly.Xml.domToWorkspace(xml, foo.value.workspace);
        console.log(`📂 Mission loaded from localStorage (Tab ${tabId})`);
      } catch (error) {
        console.error('Failed to load mission from localStorage:', error);
        foo.value.workspace.clear();
      }
    }

    // Force a resize after loading
    setTimeout(() => {
      if (foo.value && foo.value.workspace) {
        Blockly.svgResize(foo.value.workspace);
      }
    }, 50);
  }
};

// Open keyboard control
const openKeyboardControl = () => {
  showMenu.value = false;
  showKeyboardControl.value = true;
};

// Toggle view mode
const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'simulator' ? 'drone' : 'simulator';
  localStorage.setItem('droneblocks_view_mode', viewMode.value);
};

// Camera overlay functions
const toggleCameraSize = () => {
  cameraEnlarged.value = !cameraEnlarged.value;
};

const startCameraDrag = (e: MouseEvent) => {
  isDraggingCamera.value = true;
  cameraDragStart.value = {
    x: e.clientX - cameraPosition.value.x,
    y: e.clientY - cameraPosition.value.y
  };
};

const onCameraDrag = (e: MouseEvent) => {
  if (!isDraggingCamera.value) return;
  cameraPosition.value = {
    x: e.clientX - cameraDragStart.value.x,
    y: e.clientY - cameraDragStart.value.y
  };
};

const stopCameraDrag = () => {
  isDraggingCamera.value = false;
};

// Clear workspace
const clearWorkspace = () => {
  if (foo.value && foo.value.workspace) {
    foo.value.workspace.clear();
    localStorage.removeItem(`droneblocks_mission_${activeTabId.value}`);
    console.log('🗑️ Workspace cleared');
  }
};

onMounted(() => {
  // Load saved view mode
  const savedViewMode = localStorage.getItem('droneblocks_view_mode');
  if (savedViewMode === 'drone' || savedViewMode === 'simulator') {
    viewMode.value = savedViewMode;
  }

  connectToROS();
  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', stopDragging);

  // Camera drag listeners
  document.addEventListener('mousemove', onCameraDrag);
  document.addEventListener('mouseup', stopCameraDrag);

  // Load saved mission after a short delay to ensure workspace is ready
  setTimeout(() => {
    loadWorkspace();

    // Resize Blockly to account for tabs - do it multiple times to ensure it takes
    if (foo.value && foo.value.workspace) {
      Blockly.svgResize(foo.value.workspace);
      setTimeout(() => {
        Blockly.svgResize(foo.value.workspace);
      }, 100);
      setTimeout(() => {
        Blockly.svgResize(foo.value.workspace);
      }, 300);
    }

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
        <div v-if="connected" class="telemetry-item apriltag-indicator">
          <span class="apriltag-label">🏷️ Tag:</span>
          <span class="apriltag-value" :class="{ 'tag-detected': currentAprilTagId >= 0 }">
            {{ currentAprilTagId >= 0 ? currentAprilTagId : 'None' }}
          </span>
        </div>
        <div v-if="connected" class="telemetry-item ned-position">
          <span>N: {{ nedNorth.toFixed(1) }}</span>
          <span>E: {{ nedEast.toFixed(1) }}</span>
          <span>D: {{ nedDown.toFixed(1) }}</span>
        </div>
      </div>

      <div class="header-right">
        <button
          @click="toggleViewMode"
          class="secondary-btn view-mode-btn"
          :title="viewMode === 'simulator' ? 'Switch to DEXI' : 'Switch to Simulator'"
        >
          {{ viewMode === 'simulator' ? 'Connect to DEXI' : 'Connect to Sim' }}
        </button>
        <button @click="showLessonPicker = true" class="secondary-btn tutorial-btn" title="Tutorials">
          📚 Tutorials
        </button>
        <button
          @click="isMissionRunning ? stopMission() : runMission()"
          :disabled="!connected"
          :class="isMissionRunning ? 'danger-btn' : 'primary-btn'"
        >
          {{ isMissionRunning ? '⏹ Stop' : '🚀 Launch' }}
        </button>
        <div class="menu-container">
          <button @click="showMenu = !showMenu" class="icon-btn menu-btn" title="Menu">
            ☰
          </button>
          <Transition name="menu-fade">
            <div v-if="showMenu" class="dropdown-menu">
              <a href="/" class="menu-item">
                <span>🏠</span>
                <span>Dashboard</span>
              </a>
              <button @click="openKeyboardControl" class="menu-item">
                <span>⌨️</span>
                <span>Keyboard Control</span>
              </button>
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <!-- Notification Modal -->
    <Transition name="fade">
      <div v-if="showNotification" class="notification-modal" :class="notificationType">
        {{ notificationMessage }}
      </div>
    </Transition>

    <!-- Tabs - spans full width across both panels in simulator mode -->
    <div class="tabs-container">
      <div class="tabs-list">
        <div
          v-for="tab in tabs"
          :key="tab.id"
          class="tab"
          :class="{ active: tab.id === activeTabId }"
          @click="switchTab(tab.id)"
        >
          <span class="tab-name">{{ tab.name }}</span>
          <button
            v-if="tabs.length > 1"
            @click.stop="removeTab(tab.id)"
            class="tab-close"
            title="Close tab"
          >
            ×
          </button>
        </div>
        <button @click="addTab" class="tab-add" title="New tab">
          +
        </button>
      </div>
    </div>

    <div class="split-container">
      <div class="blockly-panel" :style="{ width: viewMode === 'simulator' ? leftPanelWidth + '%' : '100%' }">
        <!-- Blockly Workspace Container -->
        <div class="blockly-workspace-container">
          <blockly-component
            id="blockly2"
            :options="options"
            ref="foo"
          ></blockly-component>

          <!-- Camera Feed Overlay in Drone Mode -->
          <div
            v-if="viewMode === 'drone'"
            class="camera-overlay"
            :class="{ enlarged: cameraEnlarged, dragging: isDraggingCamera }"
            :style="{
              transform: `translate(${cameraPosition.x}px, ${cameraPosition.y}px)`
            }"
          >
            <div class="camera-header" @mousedown="startCameraDrag">
              <span class="camera-title">DEXI Camera</span>
              <button @click="toggleCameraSize" class="camera-toggle-btn" :title="cameraEnlarged ? 'Minimize' : 'Maximize'">
                {{ cameraEnlarged ? '⤓' : '⤢' }}
              </button>
            </div>
            <CameraFeed :should-invert="false" />
          </div>
        </div>
      </div>

      <div v-if="viewMode === 'simulator'" class="divider" @mousedown="startDragging" :class="{ dragging: isDragging }">
        <div class="divider-handle"></div>
      </div>

      <div v-if="viewMode === 'simulator'" class="unity-panel" :style="{ width: (100 - leftPanelWidth) + '%' }">
        <iframe
          :src="unityUrl"
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

    <!-- Keyboard Control -->
    <KeyboardControl
      v-if="ros && connected"
      :ros="ros"
      :isOpen="showKeyboardControl"
      @close="showKeyboardControl = false"
    />
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

/* Make toolbox categories taller and vertically centered */
.blocklyTreeRow {
  height: 38px !important;
  min-height: 38px !important;
  padding: 0 8px !important;
}

.blocklyTreeLabel {
  font-size: 15px !important;
  font-weight: 500 !important;
  line-height: 38px !important;
  vertical-align: middle !important;
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

.apriltag-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.apriltag-label {
  opacity: 0.8;
}

.apriltag-value {
  font-weight: bold;
  color: rgba(255, 255, 255, 0.5);
  transition: color 0.3s ease;
}

.apriltag-value.tag-detected {
  color: #4ade80;
  text-shadow: 0 0 8px rgba(74, 222, 128, 0.4);
}

.ned-position {
  display: flex;
  gap: 0.75rem;
  font-size: 0.9rem;
  font-family: 'Courier New', monospace;
}

.ned-position span {
  opacity: 0.9;
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

.secondary-btn {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.2s ease;
}

.secondary-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
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
  display: flex;
  flex-direction: column;
}

/* Tabs - now sits above split container */
.tabs-container {
  background: #f5f5f5;
  border-bottom: 1px solid #ddd;
  padding: 0;
  flex-shrink: 0;
  z-index: 100;
  position: relative;
  width: 100%;
}

.tabs-list {
  display: flex;
  align-items: center;
  overflow-x: auto;
  overflow-y: hidden;
}

.tab {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #e0e0e0;
  border-right: 1px solid #ccc;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
  user-select: none;
  min-height: 40px;
}

.tab:hover {
  background: #d5d5d5;
}

.tab.active {
  background: white;
  border-bottom: 2px solid #2a9d8f;
}

.tab-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: #333;
}

.tab-close {
  background: transparent;
  border: none;
  color: #666;
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  transition: all 0.2s;
}

.tab-close:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #e76f51;
}

.tab-add {
  background: transparent;
  border: none;
  color: #2a9d8f;
  font-size: 1.25rem;
  font-weight: bold;
  cursor: pointer;
  padding: 0.5rem 1rem;
  transition: background 0.2s;
}

.tab-add:hover {
  background: rgba(42, 157, 143, 0.1);
}

.blockly-workspace-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  min-height: 0;
}

.blockly-workspace-container > blockly-component {
  width: 100%;
  height: 100%;
  display: block;
}

.blockly-workspace-container > blockly-component > div {
  width: 100%;
  height: 100%;
}

#blockly2 {
  width: 100%;
  height: 100%;
}

.blocklyDiv {
  position: relative !important;
  width: 100% !important;
  height: 100% !important;
}

/* Camera Overlay */
.camera-overlay {
  position: fixed;
  top: 5rem;
  right: 1rem;
  width: 400px;
  height: 300px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  z-index: 1000;
  background: #1a1a1a;
  transition: width 0.3s ease, height 0.3s ease;
  display: flex;
  flex-direction: column;
}

.camera-overlay.enlarged {
  width: 800px;
  height: 600px;
}

.camera-overlay.dragging {
  cursor: grabbing;
  transition: none;
}

.camera-header {
  background: #2a2a2a;
  padding: 0.5rem 0.75rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: grab;
  user-select: none;
  border-bottom: 1px solid #3a3a3a;
}

.camera-header:active {
  cursor: grabbing;
}

.camera-title {
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
}

.camera-toggle-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: background 0.2s;
}

.camera-toggle-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.camera-overlay :deep(.camera-container) {
  width: 100%;
  flex: 1;
  min-height: 0;
}

.camera-overlay :deep(.camera-feed) {
  width: 100%;
  height: 100%;
  object-fit: cover;
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

/* Menu Container and Dropdown */
.menu-container {
  position: relative;
}

.menu-btn {
  font-size: 1.5rem;
  line-height: 1;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 200px;
  overflow: hidden;
  z-index: 10000;
}

.menu-item {
  width: 100%;
  padding: 0.75rem 1rem;
  background: white;
  color: #333;
  border: none;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
  text-align: left;
  transition: background 0.2s;
  text-decoration: none;
  cursor: pointer;
}

.menu-item:hover {
  background: #f3f4f6;
}

.menu-item span:first-child {
  font-size: 1.25rem;
}

.menu-fade-enter-active,
.menu-fade-leave-active {
  transition: all 0.2s ease;
}

.menu-fade-enter-from,
.menu-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
