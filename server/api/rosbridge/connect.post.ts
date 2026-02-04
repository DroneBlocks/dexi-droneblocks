import { switchRosbridgeUrl, getCurrentRosbridgeUrl, getRosbridgeClient } from "~/server/utils/rosbridge";

interface ConnectBody {
  url: string;
}

export default defineEventHandler(async (event) => {
  const body = await readBody<ConnectBody>(event);

  if (!body.url) {
    throw createError({
      statusCode: 400,
      message: "Missing 'url' in request body",
    });
  }

  // Validate URL format
  if (!body.url.startsWith("ws://") && !body.url.startsWith("wss://")) {
    throw createError({
      statusCode: 400,
      message: "URL must start with ws:// or wss://",
    });
  }

  try {
    await switchRosbridgeUrl(body.url);
    const client = getRosbridgeClient();

    return {
      success: true,
      url: getCurrentRosbridgeUrl(),
      connected: client.isConnected(),
    };
  } catch (error: any) {
    return {
      success: false,
      url: getCurrentRosbridgeUrl(),
      connected: false,
      error: error.message || "Failed to connect",
    };
  }
});
