import { getCurrentRosbridgeUrl, getRosbridgeClient } from "~/server/utils/rosbridge";

export default defineEventHandler(async () => {
  const url = getCurrentRosbridgeUrl();
  const client = getRosbridgeClient();
  const connected = client.isConnected();

  return {
    url,
    connected,
  };
});
