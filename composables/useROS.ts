export const useROS = () => {
  const getROSURL = (): string => {
    const hostname = process.client ? window.location.hostname : '192.168.4.1'
    return `ws://localhost:9090`
  }

  return {
    getROSURL
  }
} 