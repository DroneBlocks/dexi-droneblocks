// Phone sends scanned blocks to this endpoint
const sessions = new Map<string, { blocks: any; timestamp: number }>();

// Clean up old sessions periodically (keep for 1 hour)
setInterval(() => {
  const now = Date.now();
  for (const [id, data] of sessions) {
    if (now - data.timestamp > 60 * 60 * 1000) {
      sessions.delete(id);
    }
  }
}, 60 * 1000);

// Export for use by stream endpoint
export { sessions };

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, message: "Session ID required" });
  }

  const body = await readBody(event);
  if (!body.blocks) {
    throw createError({ statusCode: 400, message: "Blocks data required" });
  }

  sessions.set(id, {
    blocks: body.blocks,
    timestamp: Date.now(),
  });

  // Notify any SSE listeners
  const listeners = (globalThis as any).__sessionListeners?.get(id);
  if (listeners) {
    for (const send of listeners) {
      send(body);
    }
  }

  return { success: true, session: id };
});
