// AprilTag navigation primitives for the Blockly runner.
//
// Browser fallback used when the aircraft's tag_nav service is absent (the
// simulator). The loops run over rosbridge and mirror the on-board node in
// dexi_apriltag, so keep the two in step. Not for flying a real aircraft.
//
// Frames: image-up = body-forward, image-right = body-right. A different camera
// mount goes in CAMERA below. Body velocity goes to the offboard manager as
// set_velocity_body(vx forward, vy right, vz down).

export type Direction = 'forward' | 'backward' | 'left' | 'right' | 'up' | 'down';

export interface TagDetection {
  id: number;
  centre: { x: number; y: number };
  corners?: { x: number; y: number }[];
}

export interface CameraIntrinsics {
  width: number; height: number;
  fx: number; fy: number; cx: number; cy: number;
}

export interface OffboardCommand {
  command: string;
  distance_or_degrees?: number;
  north?: number; east?: number; down?: number; yaw?: number;
}

export interface NavContext {
  publish(cmd: OffboardCommand): void;
  callService(command: string, parameter: number, timeout: number): Promise<any>;
  detections(): { ms: number; list: TagDetection[] };
  camera(): CameraIntrinsics | null;
  altitude(): number;          // meters above the takeoff plane
  running(): boolean;          // false once the mission was stopped
  log(msg: string): void;
}

// One place for the camera mount. Sim: identity. A hardware mount that is
// rotated or offset gets expressed here, never inside the primitives.
export const CAMERA = {
  yawDeg: 0,                   // rotation of the image about the down axis
  forwardOffsetM: 0,           // lens ahead of the body center
  rightOffsetM: 0,
  fallback: { width: 640, height: 480, fx: 500, fy: 500, cx: 320, cy: 240 } as CameraIntrinsics,
};

export const NAV = {
  detectionMaxAgeMs: 400,      // a detection older than this is "not visible"
  loopHz: 10,
  waitTimeoutS: 30,
  transitTimeoutS: 20,
  confirmFrames: 2,            // consecutive polls that must see the tag
  // minSpeed: SITL does not track velocity setpoints much below ~0.1 m/s, so a pure
  // P command stalls just outside the gate. Outside the gate the command never
  // drops below minSpeed along the error direction.
  center: { kp: 0.5, minSpeed: 0.15, maxSpeed: 0.3, gateM: 0.10, settleS: 0.7, lossS: 3.0, timeoutS: 25 },
  altHold: { kz: 1.0, maxRate: 0.3 },   // the manager's velocity mode has no altitude hold of its own
  land:   { descentRate: 0.3, handoffAltM: 0.5, gateM: 0.15, timeoutS: 30 },
};

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// Altitude the horizontal primitives hold. Captured the first time one of them
// runs after a takeoff, kept across hops so sag cannot accumulate, cleared by
// land-on-tag and by any explicit up/down move.
let holdAlt: number | null = null;
export function resetHoldAltitude() { holdAlt = null; }
function altHoldVz(ctx: NavContext): number {
  if (holdAlt === null) holdAlt = ctx.altitude();
  return clamp(NAV.altHold.kz * (ctx.altitude() - holdAlt), NAV.altHold.maxRate);   // NED: down is positive
}
const clamp = (v: number, lim: number) => Math.max(-lim, Math.min(lim, v));

export class MissionStopped extends Error {
  constructor() { super('Mission stopped'); }
}

export function bodyVelocity(dir: Direction, speed: number): { vx: number; vy: number; vz: number } {
  const s = Math.abs(speed);
  switch (dir) {
    case 'forward':  return { vx: +s, vy: 0, vz: 0 };
    case 'backward': return { vx: -s, vy: 0, vz: 0 };
    case 'right':    return { vx: 0, vy: +s, vz: 0 };
    case 'left':     return { vx: 0, vy: -s, vz: 0 };
    case 'down':     return { vx: 0, vy: 0, vz: +s };
    case 'up':       return { vx: 0, vy: 0, vz: -s };
  }
}

function sendVelocity(ctx: NavContext, vx: number, vy: number, vz: number) {
  ctx.publish({ command: 'set_velocity_body', distance_or_degrees: 0, north: vx, east: vy, down: vz, yaw: 0 });
}

function stopVelocity(ctx: NavContext) {
  ctx.publish({ command: 'stop_velocity', distance_or_degrees: 0 });
}

function checkRunning(ctx: NavContext) {
  if (!ctx.running()) { stopVelocity(ctx); throw new MissionStopped(); }
}

/** The requested tag if it is in the latest fresh detection frame, else null. id < 0 means any tag. */
export function visibleTag(ctx: NavContext, id: number): TagDetection | null {
  const d = ctx.detections();
  if (Date.now() - d.ms > NAV.detectionMaxAgeMs) return null;
  if (id < 0) return d.list[0] ?? null;
  return d.list.find(t => t.id === id) ?? null;
}

/** Body-frame offset from the drone to the tag, meters: +forward, +right. */
export function tagOffset(ctx: NavContext, det: TagDetection): { forward: number; right: number } {
  const cam = ctx.camera() ?? CAMERA.fallback;
  const alt = Math.max(0.1, ctx.altitude());
  // Pinhole: pixel error / focal length = angle; times height above the floor = meters.
  let forward = ((cam.cy - det.centre.y) / cam.fy) * alt;
  let right   = ((det.centre.x - cam.cx) / cam.fx) * alt;
  if (CAMERA.yawDeg) {
    const a = CAMERA.yawDeg * Math.PI / 180;
    const f = forward * Math.cos(a) - right * Math.sin(a);
    const r = forward * Math.sin(a) + right * Math.cos(a);
    forward = f; right = r;
  }
  return { forward: forward + CAMERA.forwardOffsetM, right: right + CAMERA.rightOffsetM };
}

/** Block: wait until tag N is seen. */
export async function waitForTag(ctx: NavContext, id: number, timeoutS = NAV.waitTimeoutS): Promise<number> {
  const t0 = Date.now();
  let hits = 0;
  ctx.log(`waiting for tag ${id < 0 ? 'any' : id}`);
  while (Date.now() - t0 < timeoutS * 1000) {
    checkRunning(ctx);
    const det = visibleTag(ctx, id);
    hits = det ? hits + 1 : 0;
    if (det && hits >= NAV.confirmFrames) { ctx.log(`tag ${det.id} seen`); return det.id; }
    await sleep(50);
  }
  throw new Error(`tag ${id < 0 ? '' : id} not seen within ${timeoutS} s`);
}

/** Block: fly DIR at SPEED m/s until tag N is seen. */
export async function flyUntilTag(ctx: NavContext, dir: Direction, speed: number, id: number,
                                  timeoutS = NAV.transitTimeoutS): Promise<number> {
  const { vx, vy, vz } = bodyVelocity(dir, speed);
  const vertical = dir === 'up' || dir === 'down';
  if (vertical) holdAlt = null;
  ctx.log(`fly ${dir} at ${speed} m/s until tag ${id < 0 ? 'any' : id}`);
  const t0 = Date.now();
  let hits = 0, lastSend = 0;
  try {
    while (Date.now() - t0 < timeoutS * 1000) {
      checkRunning(ctx);
      if (Date.now() - lastSend > 200) { sendVelocity(ctx, vx, vy, vertical ? vz : altHoldVz(ctx)); lastSend = Date.now(); }
      const det = visibleTag(ctx, id);
      hits = det ? hits + 1 : 0;
      if (det && hits >= NAV.confirmFrames) {
        ctx.log(`tag ${det.id} seen after ${((Date.now() - t0) / 1000).toFixed(1)} s`);
        return det.id;
      }
      await sleep(50);
    }
  } finally {
    stopVelocity(ctx);
  }
  throw new Error(`tag ${id < 0 ? '' : id} not seen within ${timeoutS} s of transit`);
}

/** Block: center on tag N. Resolves with the final offset in meters. */
export async function centerOnTag(ctx: NavContext, id: number, opts: Partial<typeof NAV.center> = {})
  : Promise<{ forward: number; right: number }> {
  const p = { ...NAV.center, ...opts };
  ctx.log(`center on tag ${id}`);
  const t0 = Date.now();
  let lastSeen = Date.now(), settledSince = -1, lastLog = 0;
  let last = { forward: NaN, right: NaN };
  try {
    while (Date.now() - t0 < p.timeoutS * 1000) {
      checkRunning(ctx);
      const det = visibleTag(ctx, id);
      if (!det) {
        if (Date.now() - lastSeen > p.lossS * 1000) throw new Error(`lost tag ${id} for ${p.lossS} s while centering`);
        // Lost it, most often by overshooting on entry from transit: creep back
        // toward where it last was instead of holding and hoping.
        const errLast = Math.hypot(last.forward, last.right);
        if (Number.isFinite(errLast) && errLast > 1e-3) {
          sendVelocity(ctx, p.minSpeed * last.forward / errLast, p.minSpeed * last.right / errLast, altHoldVz(ctx));
        } else {
          sendVelocity(ctx, 0, 0, altHoldVz(ctx));
        }
        await sleep(1000 / NAV.loopHz);
        continue;
      }
      lastSeen = Date.now();
      last = tagOffset(ctx, det);
      const err = Math.hypot(last.forward, last.right);
      if (Date.now() - lastLog > 1000) {
        lastLog = Date.now();
        ctx.log(`centering on ${id}: px (${det.centre.x.toFixed(0)}, ${det.centre.y.toFixed(0)}) alt ${ctx.altitude().toFixed(2)} → fwd ${last.forward.toFixed(2)} right ${last.right.toFixed(2)} m`);
      }
      if (err < p.gateM) {
        if (settledSince < 0) settledSince = Date.now();
        if (Date.now() - settledSince >= p.settleS * 1000) {
          ctx.log(`centered on tag ${id}: ${(err * 100).toFixed(0)} cm`);
          return last;
        }
      } else {
        settledSince = -1;
      }
      const speed = Math.min(p.maxSpeed, Math.max(p.minSpeed, p.kp * err));
      sendVelocity(ctx, speed * last.forward / err, speed * last.right / err, altHoldVz(ctx));
      await sleep(1000 / NAV.loopHz);
    }
  } finally {
    stopVelocity(ctx);
  }
  throw new Error(`could not center on tag ${id} within ${p.timeoutS} s (last error ${Math.hypot(last.forward, last.right).toFixed(2)} m)`);
}

/** Block: land on tag N. Centers, descends while holding center, hands to the flight controller at handoff altitude. */
export async function landOnTag(ctx: NavContext, id: number, opts: Partial<typeof NAV.land> = {}): Promise<void> {
  const p = { ...NAV.land, ...opts };
  await centerOnTag(ctx, id);
  holdAlt = null;
  ctx.log(`descending on tag ${id} to ${p.handoffAltM} m`);
  const t0 = Date.now();
  let lastSeen = Date.now(), lastLog = 0;
  try {
    while (Date.now() - t0 < p.timeoutS * 1000) {
      checkRunning(ctx);
      if (ctx.altitude() <= p.handoffAltM) break;
      const det = visibleTag(ctx, id);
      if (!det) {
        if (Date.now() - lastSeen > NAV.center.lossS * 1000) { ctx.log(`lost tag ${id} during descent, handing off`); break; }
        sendVelocity(ctx, 0, 0, 0);
        await sleep(1000 / NAV.loopHz);
        continue;
      }
      lastSeen = Date.now();
      const o = tagOffset(ctx, det);
      const centered = Math.hypot(o.forward, o.right) < p.gateM;
      if (Date.now() - lastLog > 1000) {
        lastLog = Date.now();
        ctx.log(`descending on ${id}: alt ${ctx.altitude().toFixed(2)} err ${Math.hypot(o.forward, o.right).toFixed(2)} m ${centered ? 'descending' : 'holding'}`);
      }
      const err = Math.hypot(o.forward, o.right);
      const speed = centered ? NAV.center.kp * err : Math.min(NAV.center.maxSpeed, Math.max(NAV.center.minSpeed, NAV.center.kp * err));
      sendVelocity(ctx, err > 1e-3 ? speed * o.forward / err : 0, err > 1e-3 ? speed * o.right / err : 0, centered ? p.descentRate : 0);
      await sleep(1000 / NAV.loopHz);
    }
  } finally {
    stopVelocity(ctx);
  }
  ctx.log('handing off to land');
  await ctx.callService('land', 0, 30);
}
