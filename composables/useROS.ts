export const useROS = () => {
  const getROSURL = (): string => {
    const hostname = process.client ? window.location.hostname : '192.168.4.1'
    return `ws://127.0.0.1:9090`
  }

  return {
    getROSURL
  }
} 