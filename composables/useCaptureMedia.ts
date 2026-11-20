// useCaptureMedia — photo/video capture on the drone (dexi_capture_media).
//
// Control goes over rosbridge (Trigger services + a JSON status topic).
// Files are too large for rosbridge, so listing, download and delete talk to
// the node's own HTTP server on :8090, the same way useMavlinkCommand talks to
// mavlink2rest on :8088.

import ROSLIB from 'roslib'
import { ref, onBeforeUnmount } from 'vue'
import { useROS } from './useROS'

export interface MediaStatus {
  recording: boolean
  file: string | null
  elapsed_s: number
  photos: number
  videos: number
  free_mb: number
  last_event: string
}

export interface MediaFile {
  name: string
  type: 'photo' | 'video'
  size: number
  mtime: number
}

const NS = '/dexi/capture_media'
const STALE_MS = 3000   // status is published at 1 Hz; no message for 3 s means the node is down

export function mediaBase(): string {
  if (typeof window === 'undefined') return ''
  const params = new URLSearchParams(window.location.search)
  const host = params.get('mediaHost') || params.get('rosHost') || window.location.hostname
  return `http://${host}:8090`
}

export function mediaUrl(name: string, download = false): string {
  return `${mediaBase()}/media/${encodeURIComponent(name)}${download ? '?download=1' : ''}`
}

export async function listMedia(): Promise<{ files: MediaFile[]; free_mb: number }> {
  const res = await fetch(`${mediaBase()}/media`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function deleteMedia(name: string): Promise<void> {
  const res = await fetch(mediaUrl(name), { method: 'DELETE' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}

export function useCaptureMedia() {
  const { getROSURL } = useROS()
  const status = ref<MediaStatus | null>(null)
  const available = ref(false)
  const busy = ref(false)
  let lastStatusAt = 0

  const ros = new ROSLIB.Ros({ url: getROSURL() })
  const statusTopic = new ROSLIB.Topic({
    ros,
    name: `${NS}/status`,
    messageType: 'std_msgs/msg/String',
  })
  statusTopic.subscribe((msg: any) => {
    try {
      status.value = JSON.parse(msg.data)
      lastStatusAt = Date.now()
      available.value = true
    } catch { /* ignore a malformed message */ }
  })
  const staleTimer = setInterval(() => {
    available.value = Date.now() - lastStatusAt < STALE_MS
  }, 1000)

  // Resolves to the node's message (the file name on success); rejects with it on failure.
  function call(service: 'capture_photo' | 'start_recording' | 'stop_recording'): Promise<string> {
    busy.value = true
    const client = new ROSLIB.Service({ ros, name: `${NS}/${service}`, serviceType: 'std_srvs/srv/Trigger' })
    return new Promise<string>((resolve, reject) => {
      client.callService(
        new ROSLIB.ServiceRequest({}),
        (res: any) => (res.success ? resolve(res.message) : reject(new Error(res.message))),
        (err: string) => reject(new Error(err)),
      )
    }).finally(() => { busy.value = false })
  }

  onBeforeUnmount(() => {
    clearInterval(staleTimer)
    statusTopic.unsubscribe()
    ros.close()
  })

  return {
    status,
    available,
    busy,
    capturePhoto: () => call('capture_photo'),
    startRecording: () => call('start_recording'),
    stopRecording: () => call('stop_recording'),
  }
}
