import Anthropic from "@anthropic-ai/sdk";
import { ROS_TOOLS, executeRosTool } from "../utils/rosTools";

const SYSTEM_PROMPT = `You are DEXI, an AI drone pilot assistant. You have direct access to ROS2 tools to discover and control the drone system.

## Your Capabilities
You can dynamically discover and interact with the ROS2 system:
- get_topics: See all available data streams
- get_services: See all available commands/actions
- get_topic_type / get_service_type: Understand data formats
- get_message_details: See the full structure of messages
- call_service: Execute commands
- subscribe_once: Read sensor data
- publish_message: Send commands

## How to Control the Drone
For drone commands, use the DEXI execute_blockly_command service:
- Service: /dexi/execute_blockly_command
- Type: dexi_interfaces/srv/ExecuteBlocklyCommand
- Fields: command (string), parameter (float), timeout (float)

Available commands:
- arm, disarm
- takeoff (parameter = altitude in meters)
- land
- fly_forward, fly_backward, fly_left, fly_right (parameter = distance in meters)
- fly_up, fly_down (parameter = distance in meters)
- yaw_left, yaw_right (parameter = degrees)
- circle (parameter = radius in meters)

Example for takeoff to 3 meters:
call_service("/dexi/execute_blockly_command", {command: "takeoff", parameter: 3.0, timeout: 30.0})

## LED Control
- Service: /dexi/led_service/set_led_ring_color
- Fields: color (string) - red, green, blue, yellow, purple, cyan, white, etc.

- Service: /dexi/led_service/set_led_effect
- Fields: effect_name (string) - rainbow, blink, breathe, solid, off

## Important Guidelines
1. When asked to do something, USE YOUR TOOLS to actually do it
2. If unsure about a service's format, use get_service_type and get_message_details first
3. For drone operations, always use /dexi/execute_blockly_command (not raw PX4 commands)
4. Be concise - execute first, then briefly confirm what you did
5. If something fails, check get_services to see what's available`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  context?: {
    armed?: boolean;
    altitude?: number;
    battery?: number;
    mode?: string;
  };
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

  const body = await readBody<ChatRequest>(event);

  if (!body.messages || !Array.isArray(body.messages)) {
    throw createError({
      statusCode: 400,
      message: "Invalid request: messages array required",
    });
  }

  // Build system prompt with optional drone context
  let systemPrompt = SYSTEM_PROMPT;
  if (body.context) {
    const ctx = body.context;
    systemPrompt += `\n\n## Current Drone State`;
    if (ctx.armed !== undefined) systemPrompt += `\n- Armed: ${ctx.armed}`;
    if (ctx.altitude !== undefined)
      systemPrompt += `\n- Altitude: ${ctx.altitude.toFixed(1)}m`;
    if (ctx.battery !== undefined)
      systemPrompt += `\n- Battery: ${ctx.battery}%`;
    if (ctx.mode) systemPrompt += `\n- Mode: ${ctx.mode}`;
  }

  const client = new Anthropic({ apiKey });

  // Build messages for API
  const apiMessages: Anthropic.MessageParam[] = body.messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  try {
    // Initial request with tools
    let response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      tools: ROS_TOOLS as Anthropic.Tool[],
      messages: apiMessages,
    });

    const toolResults: string[] = [];
    let iterations = 0;
    const maxIterations = 15; // Allow multiple tool calls for discovery

    // Tool execution loop
    while (response.stop_reason === "tool_use" && iterations < maxIterations) {
      iterations++;

      // Find tool use blocks
      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
      );

      // Execute each tool
      const toolResultContents: Anthropic.ToolResultBlockParam[] = [];
      for (const toolUse of toolUseBlocks) {
        console.log(`[ROS Tool] ${toolUse.name}:`, JSON.stringify(toolUse.input));

        const result = await executeRosTool(
          toolUse.name,
          toolUse.input as Record<string, any>
        );

        // Log truncated result
        const logResult = result.length > 300 ? result.substring(0, 300) + "..." : result;
        console.log(`[ROS Tool] Result: ${logResult}`);

        toolResults.push(`[${toolUse.name}]: ${result}`);

        toolResultContents.push({
          type: "tool_result",
          tool_use_id: toolUse.id,
          content: result,
        });
      }

      // Continue conversation with tool results
      apiMessages.push({
        role: "assistant",
        content: response.content,
      });
      apiMessages.push({
        role: "user",
        content: toolResultContents,
      });

      // Get next response
      response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: systemPrompt,
        tools: ROS_TOOLS as Anthropic.Tool[],
        messages: apiMessages,
      });
    }

    // Extract final text response
    const textContent = response.content.find(
      (c): c is Anthropic.TextBlock => c.type === "text"
    );
    const text = textContent?.text || "";

    return {
      message: text,
      toolResults,
      usage: response.usage,
    };
  } catch (error: unknown) {
    const err = error as Error & { status?: number };
    console.error("Chat API error:", err);
    throw createError({
      statusCode: err.status || 500,
      message: err.message || "Failed to get response from Claude",
    });
  }
});
