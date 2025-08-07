export const useROS = () => {
  const getROSURL = (): string => {
    // Use the current hostname with WebSocket protocol and port 9090
    const hostname = window.location.hostname
    return `wss://${hostname}/rosbridge/`
  }

  return {
    getROSURL
  }
} 
