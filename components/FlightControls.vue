<template>
  <div class="w-full bg-gray-900 text-white p-2 sm:p-4">
    <div class="flex flex-wrap items-center gap-2 sm:gap-3">
      <!-- Flight Mode Dropdown -->
      <div class="relative">
        <button
          @click="modeMenuOpen = !modeMenuOpen"
          class="px-3 py-1.5 text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2"
        >
          <span class="font-mono">{{ currentModeLabel }}</span>
          <svg class="w-3 h-3" viewBox="0 0 12 12" fill="currentColor"><path d="M2 4l4 4 4-4z" /></svg>
        </button>
        <div
          v-if="modeMenuOpen"
          v-click-outside="closeModeMenu"
          class="absolute z-50 mt-1 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden"
        >
          <button
            v-for="m in FLIGHT_MODES"
            :key="m.label"
            @click="selectMode(m)"
            class="w-full text-left px-3 py-2 text-xs sm:text-sm hover:bg-blue-600 flex items-center justify-between"
            :class="{ 'bg-blue-600/40': isCurrentMode(m) }"
          >
            <span>{{ m.label }}</span>
            <span v-if="m.hint" class="text-gray-400 text-xs">{{ m.hint }}</span>
          </button>
        </div>
      </div>

      <!-- Two-step Arm Button -->
      <button
        v-if="!isArmed"
        @click="onArmClick"
        class="px-3 py-1.5 text-xs sm:text-sm rounded-lg transition-colors"
        :class="armPhase === 'confirming'
          ? 'bg-amber-500 hover:bg-amber-600 text-black font-semibold animate-pulse'
          : 'bg-red-600 hover:bg-red-700'"
      >
        {{ armPhase === 'confirming' ? `Confirm Arm (${armCountdown}s)` : 'Arm' }}
      </button>
      <button
        v-else
        @click="disarmDrone"
        class="px-3 py-1.5 text-xs sm:text-sm bg-green-600 hover:bg-green-700 rounded-lg"
        title="Click to disarm"
      >
        Armed
      </button>

      <!-- Land Button -->
      <button
        @click="land"
        :disabled="!isFlying"
        class="px-3 py-1.5 text-xs sm:text-sm bg-yellow-600 rounded-lg hover:bg-yellow-700 disabled:opacity-50"
      >
        Land
      </button>

      <!-- Offboard toggle (kept hidden — wired for future use) -->
      <button
        @click="toggleOffboardMode"
        class="px-3 py-1.5 text-xs sm:text-sm rounded-lg"
        :class="isOffboardActive ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'"
        style="display: none"
      >
        {{ isOffboardActive ? 'Disable Offboard' : 'Offboard Mode' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, defineExpose } from 'vue'
import ROSLIB from 'roslib'
import { useROS } from '~/composables/useROS'
import { useTelemetry } from '~/composables/useTelemetry'

const { getROSURL } = useROS()
const { telemetry } = useTelemetry()

// ROS connection
const ros = ref<ROSLIB.Ros | null>(null)

// State driving the buttons
const isArmed = ref(false)
const isFlying = ref(false)
const isOffboardActive = ref(false)
const navState = ref<number | null>(null)

// Offboard target position (reactive so it can be updated by other components)
const offboardTargetPosition = ref({ x: 0, y: 0, z: -1.0, yaw: 0 })

// Flight-mode dropdown -------------------------------------------------------
// PX4 custom-mode mapping (main, sub). 0 sub = N/A. Drives MAV_CMD_DO_SET_MODE.
interface FlightMode {
  label: string
  main: number
  sub: number
  hint?: string
}
const FLIGHT_MODES: FlightMode[] = [
  { label: 'Manual',     main: 1, sub: 0 },
  { label: 'Altitude',   main: 2, sub: 0 },
  { label: 'Position',   main: 3, sub: 0, hint: 'POSCTL' },
  { label: 'Stabilized', main: 7, sub: 0 },
  { label: 'Hold',       main: 4, sub: 3, hint: 'LOITER' },
  { label: 'Takeoff',    main: 4, sub: 2 },
  { label: 'Land',       main: 4, sub: 6 },
  { label: 'Return',     main: 4, sub: 5, hint: 'RTL' },
  { label: 'Mission',    main: 4, sub: 4 },
  { label: 'Offboard',   main: 6, sub: 0 },
]

const modeMenuOpen = ref(false)
const closeModeMenu = () => { modeMenuOpen.value = false }

// Decode the current (main, sub) tuple from HEARTBEAT.custom_mode so we can
// both render a label and highlight the matching dropdown row.
const currentModeTuple = computed<{ main: number | null; sub: number | null }>(() => {
  const custom = telemetry.value.mode.custom
  if (custom == null) return { main: null, sub: null }
  return {
    main: (custom >> 16) & 0xff,
    sub: (custom >> 24) & 0xff,
  }
})
const currentModeLabel = computed(() => {
  const { main, sub } = currentModeTuple.value
  if (main == null) return 'MODE —'
  const m = FLIGHT_MODES.find((x) => x.main === main && x.sub === sub)
  if (m) return m.label.toUpperCase()
  // Fall back to the raw PX4 name (POSCTL / AUTO.LOITER / …)
  return (telemetry.value.mode.name || 'MODE ?').toUpperCase()
})
const isCurrentMode = (m: FlightMode) => {
  const { main, sub } = currentModeTuple.value
  return main === m.main && sub === m.sub
}

const selectMode = (m: FlightMode) => {
  modeMenuOpen.value = false
  // MAV_CMD_DO_SET_MODE (176): param1=MAV_MODE_FLAG_CUSTOM_MODE_ENABLED (1),
  // param2=PX4 main mode, param3=PX4 sub mode.
  sendCommand(176, 1, m.main, m.sub)
  console.log(`setMode → ${m.label} (main=${m.main} sub=${m.sub})`)
}

// Two-step Arm ---------------------------------------------------------------
// First click puts the button into 'confirming' for ARM_CONFIRM_MS;
// a second click within that window actually arms.
const ARM_CONFIRM_MS = 3000
const armPhase = ref<'idle' | 'confirming'>('idle')
const armCountdown = ref(0)
let armConfirmTimer: ReturnType<typeof setTimeout> | null = null
let armCountdownTimer: ReturnType<typeof setInterval> | null = null

const cancelArmConfirm = () => {
  if (armConfirmTimer) { clearTimeout(armConfirmTimer); armConfirmTimer = null }
  if (armCountdownTimer) { clearInterval(armCountdownTimer); armCountdownTimer = null }
  armPhase.value = 'idle'
  armCountdown.value = 0
}

const onArmClick = () => {
  if (armPhase.value === 'idle') {
    armPhase.value = 'confirming'
    armCountdown.value = Math.ceil(ARM_CONFIRM_MS / 1000)
    armCountdownTimer = setInterval(() => {
      armCountdown.value = Math.max(0, armCountdown.value - 1)
    }, 1000)
    armConfirmTimer = setTimeout(cancelArmConfirm, ARM_CONFIRM_MS)
  } else {
    // Confirm — actually arm
    cancelArmConfirm()
    sendCommand(400, 1) // MAV_CMD_COMPONENT_ARM_DISARM param1=1
  }
}

const disarmDrone = () => {
  // Single click to disarm (matches QGC behavior — disarming is the safer action).
  sendCommand(400, 0)
}

// Click-outside directive for closing the dropdown ---------------------------
const vClickOutside = {
  mounted(el: HTMLElement, binding: { value: () => void }) {
    const handler = (e: MouseEvent) => {
      if (!el.contains(e.target as Node)) binding.value()
    }
    ;(el as any).__clickOutsideHandler = handler
    document.addEventListener('click', handler)
  },
  unmounted(el: HTMLElement) {
    document.removeEventListener('click', (el as any).__clickOutsideHandler)
  },
}

// ROS plumbing for arming/land/offboard --------------------------------------
let vehicleStatusTopic: ROSLIB.Topic | null = null
let vehicleCommandTopic: ROSLIB.Topic | null = null
let offboardManagerTopic: ROSLIB.Topic | null = null

let vehicleStatusFallbackTimer: NodeJS.Timeout | null = null
let hasReceivedVehicleStatus = false
let usingFallbackTopic = false

interface VehicleCommand {
  timestamp: number
  param1: number
  param2: number
  param3: number
  param4: number
  param5: number
  param6: number
  param7: number
  command: number
  target_system: number
  target_component: number
  source_system: number
  source_component: number
  confirmation: number
  from_external: boolean
}

onMounted(() => {
  ros.value = new ROSLIB.Ros({ url: getROSURL() })

  ros.value.on('connection', () => console.log('FlightControls: Connected to ROS'))
  ros.value.on('error', (e: any) => console.error('FlightControls: ROS error:', e))
  ros.value.on('close', () => console.log('FlightControls: ROS connection closed'))

  subscribeToVehicleStatus('/fmu/out/vehicle_status')

  vehicleStatusFallbackTimer = setTimeout(() => {
    if (!hasReceivedVehicleStatus && !usingFallbackTopic) {
      console.log('No messages from /fmu/out/vehicle_status, trying /fmu/out/vehicle_status_v1')
      subscribeToVehicleStatus('/fmu/out/vehicle_status_v1', true)
    }
  }, 3000)

  vehicleCommandTopic = new ROSLIB.Topic({
    ros: ros.value as ROSLIB.Ros,
    name: '/fmu/in/vehicle_command',
    messageType: 'px4_msgs/msg/VehicleCommand',
  })

  offboardManagerTopic = new ROSLIB.Topic({
    ros: ros.value as ROSLIB.Ros,
    name: '/dexi/offboard_manager',
    messageType: 'dexi_interfaces/msg/OffboardNavCommand',
  })
})

onBeforeUnmount(() => {
  cancelArmConfirm()
  if (vehicleStatusTopic) vehicleStatusTopic.unsubscribe()
  if (vehicleStatusFallbackTimer) clearTimeout(vehicleStatusFallbackTimer)
  if (isOffboardActive.value) sendOffboardManagerCommand('stop_offboard_heartbeat')
  if (ros.value) ros.value.close()
})

const subscribeToVehicleStatus = (topicName: string, isFallback: boolean = false) => {
  if (vehicleStatusTopic) vehicleStatusTopic.unsubscribe()
  if (!ros.value) return

  vehicleStatusTopic = new ROSLIB.Topic({
    ros: ros.value as ROSLIB.Ros,
    name: topicName,
    messageType: 'px4_msgs/msg/VehicleStatus',
    throttle_rate: 500,
    queue_length: 1,
  })

  vehicleStatusTopic.subscribe((message: any) => {
    hasReceivedVehicleStatus = true
    if (isFallback) usingFallbackTopic = true
    if (vehicleStatusFallbackTimer) {
      clearTimeout(vehicleStatusFallbackTimer)
      vehicleStatusFallbackTimer = null
    }
    navState.value = message.nav_state
    isArmed.value = message.arming_state === 2
    isFlying.value = message.nav_state !== 18 && message.nav_state !== 13
  })
}

const sendCommand = (
  command: number,
  param1 = 0, param2 = 0, param3 = 0, param4 = 0,
  param5 = 0, param6 = 0, param7 = 0,
) => {
  if (!vehicleCommandTopic) return
  const cmd: VehicleCommand = {
    timestamp: Date.now() * 1000,
    param1, param2, param3, param4, param5, param6, param7,
    command,
    target_system: 1,
    target_component: 1,
    source_system: 1,
    source_component: 1,
    confirmation: 0,
    from_external: true,
  }
  vehicleCommandTopic.publish(cmd)
}

const sendOffboardManagerCommand = (command: string, distance_or_degrees = 0.0) => {
  if (!offboardManagerTopic) return
  const msg = new ROSLIB.Message({ command, distance_or_degrees })
  offboardManagerTopic.publish(msg)
}

const land = () => {
  sendOffboardManagerCommand('land')
  isOffboardActive.value = false
}

const publishLocalPosition = (x: number, y: number, z: number = -1.0, yaw: number = 0) => {
  offboardTargetPosition.value = { x, y, z, yaw }
}

const toggleOffboardMode = () => {
  if (isOffboardActive.value) stopOffboardMode()
  else startOffboardMode()
}
const startOffboardMode = () => {
  if (isOffboardActive.value) return
  isOffboardActive.value = true
  sendOffboardManagerCommand('start_offboard_heartbeat')
}
const stopOffboardMode = () => {
  if (!isOffboardActive.value) return
  sendOffboardManagerCommand('stop_offboard_heartbeat')
  isOffboardActive.value = false
}

defineExpose({
  publishLocalPosition,
  isOffboardActive,
  offboardTargetPosition,
})
</script>
