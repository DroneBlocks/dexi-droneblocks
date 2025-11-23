<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { Navigation } from '~/assets/ts/navigation';
import { javascriptGenerator } from 'blockly/javascript';
import ROSLIB from 'roslib';

const navigation = new Navigation();

const foo = ref();
const ros = ref<ROSLIB.Ros | null>(null);
const connected = ref(false);
const offboardCommandTopic = ref<ROSLIB.Topic | null>(null);
const blocklyCommandService = ref<ROSLIB.Service | null>(null);
const leftPanelWidth = ref(50); // percentage
const isDragging = ref(false);
const showNotification = ref(false);
const notificationMessage = ref('');
const notificationType = ref<'success' | 'error'>('success');

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
    <category name="Logic" colour="%{BKY_LOGIC_HUE}">
      <block type="controls_if"></block>
      <block type="logic_compare"></block>
      <block type="logic_operation"></block>
      <block type="logic_negate"></block>
      <block type="logic_boolean"></block>
    </category>
    <category name="Loops" colour="%{BKY_LOOPS_HUE}">
      <block type="controls_repeat_ext">
        <value name="TIMES">
          <block type="math_number">
            <field name="NUM">10</field>
          </block>
        </value>
      </block>
      <block type="controls_whileUntil"></block>
    </category>
    <category name="Math" colour="%{BKY_MATH_HUE}">
      <block type="math_number">
        <field name="NUM">123</field>
      </block>
      <block type="math_arithmetic"></block>
      <block type="math_single"></block>
    </category>
    <category name="Navigation" colour="#2A9D8F">
      <block type="nav_arm"></block>
      <block type="nav_start_offboard_heartbeat"></block>
      <block type="nav_stop_offboard_heartbeat"></block>
      <block type="nav_switch_offboard_mode"></block>
      <block type="nav_switch_hold_mode"></block>
      <block type="nav_takeoff">
        <field name="ALTITUDE">2.0</field>
      </block>
      <block type="nav_fly_forward">
        <field name="DISTANCE">1.0</field>
      </block>
      <block type="nav_fly_backward">
        <field name="DISTANCE">1.0</field>
      </block>
      <block type="nav_fly_left">
        <field name="DISTANCE">1.0</field>
      </block>
      <block type="nav_fly_right">
        <field name="DISTANCE">1.0</field>
      </block>
      <block type="nav_fly_up">
        <field name="DISTANCE">1.0</field>
      </block>
      <block type="nav_fly_down">
        <field name="DISTANCE">1.0</field>
      </block>
      <block type="nav_land"></block>
    </category>
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
          const altitude = block.getFieldValue('ALTITUDE');
          await executeCommandWithService('offboard_takeoff', parseFloat(altitude), 30);
        } else if (blockType === 'nav_land') {
          await executeCommandWithService('land', 0, 30);
        } else if (blockType === 'nav_switch_offboard_mode') {
          await executeCommandWithService('switch_offboard_mode', 0, 5);
        } else if (blockType === 'nav_switch_hold_mode') {
          await executeCommandWithService('switch_hold_mode', 0, 5);
        } else if (blockType === 'nav_fly_forward') {
          const distance = block.getFieldValue('DISTANCE');
          await executeCommandWithService('fly_forward', parseFloat(distance), 30);
        } else if (blockType === 'nav_fly_backward') {
          const distance = block.getFieldValue('DISTANCE');
          await executeCommandWithService('fly_backward', parseFloat(distance), 30);
        } else if (blockType === 'nav_fly_left') {
          const distance = block.getFieldValue('DISTANCE');
          await executeCommandWithService('fly_left', parseFloat(distance), 30);
        } else if (blockType === 'nav_fly_right') {
          const distance = block.getFieldValue('DISTANCE');
          await executeCommandWithService('fly_right', parseFloat(distance), 30);
        } else if (blockType === 'nav_fly_up') {
          const distance = block.getFieldValue('DISTANCE');
          await executeCommandWithService('fly_up', parseFloat(distance), 30);
        } else if (blockType === 'nav_fly_down') {
          const distance = block.getFieldValue('DISTANCE');
          await executeCommandWithService('fly_down', parseFloat(distance), 30);
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

onMounted(() => {
  connectToROS();
  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', stopDragging);
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
      <h1>DroneBlocks</h1>
      <div class="controls">
        <div class="flight-mode">
          Flight Mode: <FlightModeDisplay v-if="ros" :ros="ros" class="inline" />
          <span v-else>Unknown</span>
        </div>
        <div class="status" :class="{ connected: connected, disconnected: !connected }">
          {{ connected ? '🟢 Connected to ROS' : '🔴 Disconnected' }}
        </div>
        <button @click="connectToROS" :disabled="connected">Connect to ROS</button>
        <button @click="disconnectFromROS" :disabled="!connected">Disconnect</button>
        <button @click="runMission" :disabled="!connected" class="run-btn">▶ Run Mission</button>
        <button @click="stopMission" :disabled="!connected" class="stop-btn">⏹ Stop</button>
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
  background-color: #264653;
  color: white;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.header h1 {
  margin: 0;
  font-size: 1.5rem;
}

.controls {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.flight-mode {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  background-color: #264653;
  border: 2px solid #2a9d8f;
  font-weight: bold;
  color: white;
}

.status {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: bold;
}

.status.connected {
  background-color: #2a9d8f;
}

.status.disconnected {
  background-color: #e76f51;
}

button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  background-color: #2a9d8f;
  color: white;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
}

button:hover:not(:disabled) {
  background-color: #21867a;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

button.run-btn {
  background-color: #2a9d8f;
}

button.run-btn:hover:not(:disabled) {
  background-color: #21867a;
}

button.stop-btn {
  background-color: #e76f51;
}

button.stop-btn:hover:not(:disabled) {
  background-color: #d45f43;
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
