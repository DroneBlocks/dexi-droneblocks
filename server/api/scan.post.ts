import Anthropic from "@anthropic-ai/sdk";

const SCAN_SYSTEM_PROMPT = `You are an image analyzer for DroneBlocks, a visual programming system for drones.

Your task is to analyze photos of physical laser-cut wooden Blockly blocks and identify the programming sequence.

## Available Block Types
- takeoff (may have altitude value)
- land
- fly_forward, fly_backward, fly_left, fly_right (with distance value, units: m, meters, in, inches, ft, feet)
- fly_up, fly_down (with distance value)
- yaw_left, yaw_right (with degrees value)
- wait (with seconds value)
- arm, disarm
- start_offboard_heartbeat, switch_offboard_mode

## Your Response Format
Return a JSON object with:
1. "blocks": An array of detected blocks in order from top to bottom, each with:
   - "type": The block type (e.g., "takeoff", "fly_forward", "land")
   - "value": The numeric value if visible (optional)
   - "unit": The unit if visible (optional, e.g., "m", "degrees")
2. "description": A brief description of what the mission does

## Example Response
{
  "blocks": [
    {"type": "takeoff", "value": 2, "unit": "m"},
    {"type": "fly_forward", "value": 1, "unit": "m"},
    {"type": "yaw_right", "value": 90, "unit": "degrees"},
    {"type": "land"}
  ],
  "description": "Take off to 2 meters, fly forward 1 meter, turn right 90 degrees, then land"
}

IMPORTANT:
- Read the blocks from TOP to BOTTOM as they appear in the image
- Only include blocks you can clearly identify
- If you can't see a value, omit that field
- Return ONLY valid JSON, no other text`;

interface ScanRequest {
  image: string; // base64 data URL
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const apiKey = config.anthropicApiKey || process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw createError({
      statusCode: 500,
      message: "ANTHROPIC_API_KEY not configured",
    });
  }

  const body = await readBody<ScanRequest>(event);

  if (!body.image) {
    throw createError({
      statusCode: 400,
      message: "Invalid request: image data required",
    });
  }

  // Extract base64 data and media type from data URL
  const matches = body.image.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) {
    throw createError({
      statusCode: 400,
      message: "Invalid image format: expected base64 data URL",
    });
  }

  const mediaType = matches[1] as "image/jpeg" | "image/png" | "image/gif" | "image/webp";
  const imageData = matches[2];

  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SCAN_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: imageData,
              },
            },
            {
              type: "text",
              text: "Analyze this image of physical Blockly blocks and identify the programming sequence. Return the result as JSON.",
            },
          ],
        },
      ],
    });

    // Extract text response
    const textContent = response.content.find(
      (c): c is Anthropic.TextBlock => c.type === "text"
    );
    const text = textContent?.text || "{}";

    // Parse JSON from response
    try {
      // Try to extract JSON from the response (in case there's extra text)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return result;
      }
      throw new Error("No JSON found in response");
    } catch (parseError) {
      console.error("Failed to parse scan response:", text);
      throw createError({
        statusCode: 500,
        message: "Failed to parse block analysis",
      });
    }
  } catch (error: unknown) {
    const err = error as Error & { status?: number };
    console.error("Scan API error:", err);
    throw createError({
      statusCode: err.status || 500,
      message: err.message || "Failed to analyze image",
    });
  }
});
