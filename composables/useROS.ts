export const useROS = () => {
  const getROSURL = (): string => {
    // Allow override via ?rosHost=192.168.68.60 query param (for local dev pointing at remote drone)
    const params = new URLSearchParams(window.location.search)
    const rosHost = params.get('rosHost')
    if (rosHost) {
      return `ws://${rosHost}:9090`
    }
    // Branded tunnel deployments inject NUXT_PUBLIC_ROSBRIDGE_URL pointing at
    // a dedicated rosbridge subdomain. Use it when set; fall back to legacy
    // same-host logic for hardware (raw IP) and local dev.
    const configured = useRuntimeConfig().public.rosbridgeUrl
    if (configured) {
      return configured
    }
    const hostname = window.location.hostname
    const isSecure = window.location.protocol === 'https:'
    const protocol = isSecure ? 'wss:' : 'ws:'
    const target = isSecure ? '/rosbridge' : ':9090'
    return `${protocol}//${hostname}${target}`
  }

  const isDevMode = (): boolean => {
    // Check if we're in development mode
    return process.env.NODE_ENV === 'development'
  }

  return {
    getROSURL,
    isDevMode
  }
}