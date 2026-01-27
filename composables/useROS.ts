export const useROS = () => {
  const getROSURL = (): string => {
    // Use the current hostname with WebSocket protocol and port 9090
    // Use secure WebSocket (wss://) when page is served over HTTPS
    const hostname = window.location.hostname
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${protocol}//${hostname}:9090`
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