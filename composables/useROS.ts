export const useROS = () => {
  const getROSURL = (): string => {
    // Use the current hostname with WebSocket protocol and port 9090
    const hostname = window.location.hostname
    return `wss://${hostname}/rosbridge`
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