export const useROS = () => {
  const getROSURL = (): string => {
    const hostname = window.location.hostname
    const isSecure = window.location.protocol === 'https:'
    const protocol = isSecure ? 'wss:' : 'ws:'
    // Over HTTPS (e.g. Cloudflare tunnel), route through nginx reverse proxy
    // Over HTTP (local network), connect directly to rosbridge port
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