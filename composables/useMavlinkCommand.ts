// useMavlinkCommand — POST MAV_CMD_* to mavlink2rest. Uses the same transport
// as useTelemetry so we stay consistent with the readiness strip's data path.
//
// mavlink2rest accepts a POST to /mavlink with the same envelope it streams
// back, and forwards it into the mavlink-router fabric.

const SYSTEM_ID_GCS = 255
const COMPONENT_ID_GCS = 190
const TARGET_SYSTEM = 1
const TARGET_COMPONENT = 1

function getHttpBase(): string {
  if (typeof window === 'undefined') return ''
  const params = new URLSearchParams(window.location.search)
  const host = params.get('mavlinkHost') || window.location.hostname
  const proto = window.location.protocol === 'https:' ? 'https:' : 'http:'
  return `${proto}//${host}:8088`
}

async function postEnvelope(envelope: object): Promise<boolean> {
  try {
    const res = await fetch(`${getHttpBase()}/mavlink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(envelope),
    })
    return res.ok
  } catch (e) {
    console.error('mavlink command failed:', e)
    return false
  }
}

function commandLong(cmdName: string, params: number[] = []): object {
  return {
    header: { system_id: SYSTEM_ID_GCS, component_id: COMPONENT_ID_GCS, sequence: 0 },
    message: {
      type: 'COMMAND_LONG',
      target_system: TARGET_SYSTEM,
      target_component: TARGET_COMPONENT,
      confirmation: 0,
      command: { type: cmdName },
      param1: params[0] ?? 0,
      param2: params[1] ?? 0,
      param3: params[2] ?? 0,
      param4: params[3] ?? 0,
      param5: params[4] ?? 0,
      param6: params[5] ?? 0,
      param7: params[6] ?? 0,
    },
  }
}

export function useMavlinkCommand() {
  // Arm / disarm via MAV_CMD_COMPONENT_ARM_DISARM. param1=1 arm, 0 disarm.
  // param2=21196 is the magic force flag — we don't pass it; FC enforces preflight checks.
  function arm() {
    return postEnvelope(commandLong('MAV_CMD_COMPONENT_ARM_DISARM', [1]))
  }
  function disarm() {
    return postEnvelope(commandLong('MAV_CMD_COMPONENT_ARM_DISARM', [0]))
  }

  // Set PX4 flight mode via MAV_CMD_DO_SET_MODE.
  // param1: base_mode bitmask — MAV_MODE_FLAG_CUSTOM_MODE_ENABLED = 1
  // param2: PX4 main mode (1-7)
  // param3: PX4 sub mode (0-N, only meaningful in AUTO main mode)
  function setMode(main: number, sub: number) {
    return postEnvelope(commandLong('MAV_CMD_DO_SET_MODE', [1, main, sub]))
  }

  return { arm, disarm, setMode, postEnvelope, commandLong }
}
