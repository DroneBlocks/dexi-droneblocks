// SSE endpoint - DroneBlocks subscribes here to receive blocks
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, message: "Session ID required" });
  }

  // Set up SSE headers
  setHeader(event, "Content-Type", "text/event-stream");
  setHeader(event, "Cache-Control", "no-cache");
  setHeader(event, "Connection", "keep-alive");

  // Initialize global listeners map if needed
  if (!(globalThis as any).__sessionListeners) {
    (globalThis as any).__sessionListeners = new Map<string, Set<(data: any) => void>>();
  }
  const listenersMap = (globalThis as any).__sessionListeners as Map<string, Set<(data: any) => void>>;

  if (!listenersMap.has(id)) {
    listenersMap.set(id, new Set());
  }

  const listeners = listenersMap.get(id)!;

  // Create a stream
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      controller.enqueue(`data: ${JSON.stringify({ type: "connected", session: id })}\n\n`);

      // Register listener for new blocks
      const send = (data: any) => {
        try {
          controller.enqueue(`data: ${JSON.stringify({ type: "blocks", ...data })}\n\n`);
        } catch (e) {
          // Stream closed
          listeners.delete(send);
        }
      };

      listeners.add(send);

      // Keep-alive ping every 30 seconds
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(`: ping\n\n`);
        } catch (e) {
          clearInterval(pingInterval);
          listeners.delete(send);
        }
      }, 30000);

      // Clean up on close
      event.node.req.on("close", () => {
        clearInterval(pingInterval);
        listeners.delete(send);
        if (listeners.size === 0) {
          listenersMap.delete(id);
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
});
