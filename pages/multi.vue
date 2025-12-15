<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import * as Blockly from 'blockly/core';
import { Navigation } from '~/assets/ts/navigation';
import { LED } from '~/assets/ts/led';
import ROSLIB from 'roslib';

const navigation = new Navigation();
const led = new LED();

// Active drone selection
const activeDrone = ref<1 | 2>(1);

// Drone 1 state
const ros1 = ref<ROSLIB.Ros | null>(null);
const connected1 = ref(false);
const blocklyCommandService1 = ref<ROSLIB.Service | null>(null);
const ledEffectService1 = ref<ROSLIB.Service | null>(null);

// Drone 2 state
const ros2 = ref<ROSLIB.Ros | null>(null);
const connected2 = ref(false);
const blocklyCommandService2 = ref<ROSLIB.Service | null>(null);
const ledEffectService2 = ref<ROSLIB.Service | null>(null);

const foo = ref();
const leftPanelWidth = ref(50);
const isDragging = ref(false);
const showNotification = ref(false);
const notificationMessage = ref('');
const notificationType = ref<'success' | 'error'>('success');
const isMissionRunning = ref(false);

// Unity simulator URLs and ROS URL
const unity1Url = ref('');
const unity2Url = ref('');
const rosUrl = ref('');
if (process.client) {
  const hostname = window.location.hostname;
  const rosbridgeUrl = `ws://${hostname}:9091`;
  // Pass rosbridge URL and namespace to Unity instances
  unity1Url.value = `http://${hostname}:1338?rosbridge=${encodeURIComponent(rosbridgeUrl)}&namespace=dexi1`;
  unity2Url.value = `http://${hostname}:1339?rosbridge=${encodeURIComponent(rosbridgeUrl)}&namespace=dexi2`;
  rosUrl.value = rosbridgeUrl;  // Multi-drone stack rosbridge port
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
      </category>
      <category name="Land" colour="#E74C3C">
        <block type="nav_land"></block>
      </category>
    <category name="LED" colour="#9C27B0">
      <block type="led_effect">
        <field name="effect">rainbow</field>
      </block>
      <block type="led_ring">
        <field name="color">white</field>
      </block>
    </category>
    <category name="Logic" colour="%{BKY_LOGIC_HUE}">
      <block type="controls_if"></block>
      <block type="logic_compare"></block>
    </category>
    <category name="Loops" colour="%{BKY_LOOPS_HUE}">
      <block type="controls_repeat_ext">
        <value name="TIMES">
          <shadow type="math_number">
            <field name="NUM">10</field>
          </shadow>
        </value>
      </block>
    </category>
    <category name="Math" colour="%{BKY_MATH_HUE}">
      <block type="math_number">
        <field name="NUM">123</field>
      </block>
      <block type="math_arithmetic"></block>
    </category>
    <category name="Variables" colour="%{BKY_VARIABLES_HUE}" custom="VARIABLE"></category>
  </xml>`,
};

const connectToDrone1 = () => {
  try {
    ros1.value = new ROSLIB.Ros({
      url: rosUrl.value
    });

    ros1.value.on('connection', () => {
      console.log('Connected to Drone 1 ROS websocket.');
      connected1.value = true;

      blocklyCommandService1.value = new ROSLIB.Service({
        ros: ros1.value as ROSLIB.Ros,
        name: '/dexi1/execute_blockly_command',
        serviceType: 'dexi_interfaces/srv/ExecuteBlocklyCommand'
      });

      ledEffectService1.value = new ROSLIB.Service({
        ros: ros1.value as ROSLIB.Ros,
        name: '/dexi1/led_service/set_led_effect',
        serviceType: 'dexi_interfaces/srv/LEDEffect'
      });

      console.log('Drone 1 services initialized');
    });

    ros1.value.on('error', (error: any) => {
      console.log('Error connecting to Drone 1: ', error);
      connected1.value = false;
    });

    ros1.value.on('close', () => {
      console.log('Drone 1 connection closed.');
      connected1.value = false;
    });
  } catch (error) {
    console.error('Failed to connect to Drone 1:', error);
  }
};

const connectToDrone2 = () => {
  try {
    ros2.value = new ROSLIB.Ros({
      url: rosUrl.value
    });

    ros2.value.on('connection', () => {
      console.log('Connected to Drone 2 ROS websocket.');
      connected2.value = true;

      blocklyCommandService2.value = new ROSLIB.Service({
        ros: ros2.value as ROSLIB.Ros,
        name: '/dexi2/execute_blockly_command',
        serviceType: 'dexi_interfaces/srv/ExecuteBlocklyCommand'
      });

      ledEffectService2.value = new ROSLIB.Service({
        ros: ros2.value as ROSLIB.Ros,
        name: '/dexi2/led_service/set_led_effect',
        serviceType: 'dexi_interfaces/srv/LEDEffect'
      });

      console.log('Drone 2 services initialized');
    });

    ros2.value.on('error', (error: any) => {
      console.log('Error connecting to Drone 2: ', error);
      connected2.value = false;
    });

    ros2.value.on('close', () => {
      console.log('Drone 2 connection closed.');
      connected2.value = false;
    });
  } catch (error) {
    console.error('Failed to connect to Drone 2:', error);
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

// Helper function to get input values from blocks
const getInputValue = (block: any, inputName: string, defaultValue: number): number => {
  const input = block.getInput(inputName);
  if (input && input.connection && input.connection.targetBlock()) {
    const targetBlock = input.connection.targetBlock();
    if (targetBlock.type === 'math_number') {
      return parseFloat(targetBlock.getFieldValue('NUM'));
    }
  }
  return defaultValue;
};

// Execute command for selected drone
const executeCommandWithService = (command: string, parameter: number = 0.0, timeout: number = 30.0): Promise<any> => {
  return new Promise((resolve, reject) => {
    const service = activeDrone.value === 1 ? blocklyCommandService1.value : blocklyCommandService2.value;

    if (!service) {
      reject(`Drone ${activeDrone.value} service not available`);
      return;
    }

    const request = new ROSLIB.ServiceRequest({
      command: command,
      parameter: parameter,
      timeout: timeout
    });

    service.callService(
      request,
      (response: any) => {
        if (response.success) {
          console.log(`Drone ${activeDrone.value} - ${command} completed: ${response.message}`);
          resolve(response);
        } else {
          console.error(`Drone ${activeDrone.value} - ${command} failed: ${response.message}`);
          reject(response.message);
        }
      },
      (error: any) => {
        console.error(`Drone ${activeDrone.value} - Service call failed:`, error);
        reject(error);
      }
    );
  });
};

const runMission = async () => {
  const connected = activeDrone.value === 1 ? connected1.value : connected2.value;
  const service = activeDrone.value === 1 ? blocklyCommandService1.value : blocklyCommandService2.value;

  if (!connected || !service) {
    displayNotification(`Drone ${activeDrone.value} not connected!`, 'error');
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

    const mainBlock = topBlocks[0];
    const blocksToExecute = [];
    let currentBlock = mainBlock;

    while (currentBlock) {
      blocksToExecute.push(currentBlock);
      currentBlock = currentBlock.getNextBlock();
    }

    console.log(`Starting mission on Drone ${activeDrone.value} with ${blocksToExecute.length} blocks`);

    for (const block of blocksToExecute) {
      const blockType = block.type;
      workspace.highlightBlock(block.id);

      try {
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
        } else if (blockType === 'nav_wait') {
          const durationInput = block.getInput('DURATION');
          let duration = 1;
          if (durationInput && durationInput.connection && durationInput.connection.targetBlock()) {
            const targetBlock = durationInput.connection.targetBlock();
            if (targetBlock.type === 'math_number') {
              duration = parseFloat(targetBlock.getFieldValue('NUM'));
            }
          }
          console.log(`Waiting ${duration} seconds...`);
          await new Promise(resolve => setTimeout(resolve, duration * 1000));
        } else {
          console.log(`Skipping unknown block type: ${blockType}`);
        }

        workspace.highlightBlock(null);
      } catch (error) {
        workspace.highlightBlock(null);
        throw error;
      }
    }

    console.log('Mission completed successfully!');
    displayNotification(`Drone ${activeDrone.value} mission completed!`, 'success');

  } catch (error) {
    console.error('Mission failed:', error);
    displayNotification('Mission failed: ' + error, 'error');
    foo.value.workspace.highlightBlock(null);
  } finally {
    isMissionRunning.value = false;
  }
};

const stopMission = () => {
  isMissionRunning.value = false;
  displayNotification('Mission stopped', 'error');
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

  if (newWidth >= 20 && newWidth <= 80) {
    leftPanelWidth.value = newWidth;
  }
};

onMounted(() => {
  connectToDrone1();
  connectToDrone2();
  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', stopDragging);

  setTimeout(() => {
    if (foo.value && foo.value.workspace) {
      Blockly.svgResize(foo.value.workspace);
    }
  }, 500);
});

onUnmounted(() => {
  if (ros1.value) ros1.value.close();
  if (ros2.value) ros2.value.close();
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDragging);
});
</script>

<template>
  <div class="multi-container">
    <div class="header">
      <div class="header-left">
        <h1>Multi-Drone Control</h1>
        <div class="drone-connections">
          <div class="connection-indicator" :class="{ connected: connected1, disconnected: !connected1 }">
            <span class="indicator-dot"></span>
            <span class="indicator-text">Drone 1</span>
          </div>
          <div class="connection-indicator" :class="{ connected: connected2, disconnected: !connected2 }">
            <span class="indicator-dot"></span>
            <span class="indicator-text">Drone 2</span>
          </div>
        </div>
      </div>

      <div class="header-center">
        <div class="drone-selector">
          <span class="selector-label">Target Drone:</span>
          <button
            @click="activeDrone = 1"
            class="drone-btn"
            :class="{ active: activeDrone === 1 }"
          >
            Drone 1
          </button>
          <button
            @click="activeDrone = 2"
            class="drone-btn"
            :class="{ active: activeDrone === 2 }"
          >
            Drone 2
          </button>
        </div>
      </div>

      <div class="header-right">
        <a href="/droneblocks" class="secondary-btn">Single Drone</a>
        <button
          @click="isMissionRunning ? stopMission() : runMission()"
          :disabled="activeDrone === 1 ? !connected1 : !connected2"
          :class="isMissionRunning ? 'danger-btn' : 'primary-btn'"
        >
          {{ isMissionRunning ? 'Stop' : 'Launch Drone ' + activeDrone }}
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
        <div class="blockly-workspace-container">
          <blockly-component
            id="blockly-multi"
            :options="options"
            ref="foo"
          ></blockly-component>
        </div>
      </div>

      <div class="divider" @mousedown="startDragging" :class="{ dragging: isDragging }">
        <div class="divider-handle"></div>
      </div>

      <div class="unity-panel" :style="{ width: (100 - leftPanelWidth) + '%' }">
        <div class="unity-stack">
          <div class="unity-wrapper" :class="{ active: activeDrone === 1 }">
            <div class="unity-label">
              <span class="drone-number">1</span>
              <span>Drone 1</span>
            </div>
            <iframe
              :src="unity1Url"
              class="unity-iframe"
              frameborder="0"
              allowfullscreen
            ></iframe>
          </div>
          <div class="unity-wrapper" :class="{ active: activeDrone === 2 }">
            <div class="unity-label">
              <span class="drone-number">2</span>
              <span>Drone 2</span>
            </div>
            <iframe
              :src="unity2Url"
              class="unity-iframe"
              frameborder="0"
              allowfullscreen
            ></iframe>
          </div>
        </div>
      </div>
    </div>
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
.multi-container {
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
  gap: 1.5rem;
}

.header h1 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.drone-connections {
  display: flex;
  gap: 0.75rem;
}

.connection-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.3);
}

.indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.connection-indicator.connected .indicator-dot {
  background-color: #4ade80;
  box-shadow: 0 0 8px rgba(74, 222, 128, 0.6);
}

.connection-indicator.disconnected .indicator-dot {
  background-color: #ef4444;
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.6);
}

.header-center {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.drone-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(0, 0, 0, 0.3);
  padding: 0.25rem;
  border-radius: 8px;
}

.selector-label {
  font-size: 0.875rem;
  padding: 0 0.5rem;
  opacity: 0.8;
}

.drone-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: white;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
}

.drone-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.drone-btn.active {
  background: #2a9d8f;
  box-shadow: 0 2px 4px rgba(42, 157, 143, 0.3);
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

.primary-btn {
  padding: 0.5rem 1.25rem;
  border-radius: 8px;
  background: #2a9d8f;
  color: white;
  box-shadow: 0 2px 4px rgba(42, 157, 143, 0.3);
}

.primary-btn:hover:not(:disabled) {
  background: #21867a;
  transform: translateY(-1px);
}

.secondary-btn {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 600;
}

.secondary-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.danger-btn {
  padding: 0.5rem 1.25rem;
  border-radius: 8px;
  background: #e76f51;
  color: white;
}

.danger-btn:hover:not(:disabled) {
  background: #d45f43;
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

#blockly-multi {
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

.unity-stack {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 4px;
  padding: 4px;
  box-sizing: border-box;
}

.unity-wrapper {
  flex: 1;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  border: 3px solid transparent;
  transition: border-color 0.3s;
}

.unity-wrapper.active {
  border-color: #2a9d8f;
  box-shadow: 0 0 12px rgba(42, 157, 143, 0.4);
}

.unity-label {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.drone-number {
  background: #2a9d8f;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: bold;
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
