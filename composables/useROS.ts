export const useROS = () => {
  const getROSURL = (): string => {
    const hostname = process.client ? window.location.hostname : '192.168.4.1'
    return `ws://${hostname}:9090`
  }

  return {
    getROSURL
  }
} 