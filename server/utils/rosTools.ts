/**
 * ROS Tools for Claude
 *
 * Dynamic tools that allow Claude to discover and interact with
 * any ROS2 system without hardcoded knowledge.
 */

import { getConnectedClient } from "./rosbridge";

// Tool definitions for Claude API
export const ROS_TOOLS = [
  {
    name: "get_topics",
    description: "List all available ROS topics. Use this to discover what data is available in the system.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "get_services",
    description: "List all available ROS services. Use this to discover what actions/commands are available.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "get_topic_type",
    description: "Get the message type for a specific topic. Use this before subscribing to understand the data format.",
    input_schema: {
      type: "object" as const,
      properties: {
        topic: {
          type: "string",
          description: "The full topic path (e.g., /fmu/out/vehicle_status)",
        },
      },
      required: ["topic"],
    },
  },
  {
    name: "get_service_type",
    description: "Get the service type for a specific service. Use this to understand what arguments a service needs.",
    input_schema: {
      type: "object" as const,
      properties: {
        service: {
          type: "string",
          description: "The full service path (e.g., /dexi/execute_blockly_command)",
        },
      },
      required: ["service"],
    },
  },
  {
    name: "get_message_details",
    description: "Get the full structure/fields of a message or service type. Use this to understand what data to send or expect.",
    input_schema: {
      type: "object" as const,
      properties: {
        type: {
          type: "string",
          description: "The message type (e.g., dexi_interfaces/srv/ExecuteBlocklyCommand)",
        },
      },
      required: ["type"],
    },
  },
  {
    name: "call_service",
    description: "Call a ROS service with the given arguments. Use get_service_type and get_message_details first if unsure of the format.",
    input_schema: {
      type: "object" as const,
      properties: {
        service: {
          type: "string",
          description: "The full service path",
        },
        args: {
          type: "object",
          description: "Arguments to pass to the service as a JSON object",
        },
        timeout: {
          type: "number",
          description: "Timeout in milliseconds (default: 30000)",
        },
      },
      required: ["service"],
    },
  },
  {
    name: "subscribe_once",
    description: "Subscribe to a topic and receive a single message. Useful for reading current sensor data or status.",
    input_schema: {
      type: "object" as const,
      properties: {
        topic: {
          type: "string",
          description: "The full topic path",
        },
        msg_type: {
          type: "string",
          description: "The message type (use get_topic_type to find this)",
        },
        timeout: {
          type: "number",
          description: "Timeout in milliseconds (default: 5000)",
        },
      },
      required: ["topic", "msg_type"],
    },
  },
  {
    name: "publish_message",
    description: "Publish a message to a topic. Use get_topic_type and get_message_details to understand the format.",
    input_schema: {
      type: "object" as const,
      properties: {
        topic: {
          type: "string",
          description: "The full topic path",
        },
        msg_type: {
          type: "string",
          description: "The message type",
        },
        message: {
          type: "object",
          description: "The message content as a JSON object",
        },
      },
      required: ["topic", "msg_type", "message"],
    },
  },
  {
    name: "get_nodes",
    description: "List all active ROS nodes in the system.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
];

/**
 * Execute a ROS tool by name
 */
export async function executeRosTool(
  toolName: string,
  args: Record<string, any>
): Promise<string> {
  try {
    const client = await getConnectedClient();

    switch (toolName) {
      case "get_topics": {
        const topics = await client.getTopics();
        // Group by namespace for readability
        const grouped = groupByNamespace(topics);
        return formatGroupedList("Topics", grouped, topics.length);
      }

      case "get_services": {
        const services = await client.getServices();
        const grouped = groupByNamespace(services);
        return formatGroupedList("Services", grouped, services.length);
      }

      case "get_topic_type": {
        const type = await client.getTopicType(args.topic);
        return type
          ? `Topic ${args.topic} has type: ${type}`
          : `Could not find type for topic ${args.topic}`;
      }

      case "get_service_type": {
        const type = await client.getServiceType(args.service);
        return type
          ? `Service ${args.service} has type: ${type}`
          : `Could not find type for service ${args.service}`;
      }

      case "get_message_details": {
        const details = await client.getMessageDetails(args.type);
        if (details?.typedefs && details.typedefs.length > 0) {
          return formatMessageDetails(args.type, details.typedefs);
        }
        // Try service request details
        const reqDetails = await client.getServiceRequestDetails(args.type);
        if (reqDetails?.typedefs && reqDetails.typedefs.length > 0) {
          return formatMessageDetails(args.type + " (Request)", reqDetails.typedefs);
        }
        return `Could not find details for type ${args.type}`;
      }

      case "call_service": {
        const timeout = args.timeout || 30000;
        const result = await client.callService(args.service, args.args || {}, timeout);
        return `Service ${args.service} returned:\n${JSON.stringify(result, null, 2)}`;
      }

      case "subscribe_once": {
        const timeout = args.timeout || 5000;
        const msg = await client.subscribeOnce(args.topic, args.msg_type, timeout);
        return `Message from ${args.topic}:\n${JSON.stringify(msg, null, 2)}`;
      }

      case "publish_message": {
        await client.publish(args.topic, args.msg_type, args.message);
        return `Published message to ${args.topic}`;
      }

      case "get_nodes": {
        const nodes = await client.getNodes();
        return `Active nodes (${nodes.length}):\n${nodes.join("\n")}`;
      }

      default:
        return `Unknown tool: ${toolName}`;
    }
  } catch (error: any) {
    return `Error executing ${toolName}: ${error.message}`;
  }
}

/**
 * Group items by their namespace prefix
 */
function groupByNamespace(items: string[]): Map<string, string[]> {
  const grouped = new Map<string, string[]>();

  for (const item of items) {
    // Extract top-level namespace
    const parts = item.split("/").filter(Boolean);
    const namespace = parts.length > 1 ? `/${parts[0]}` : "/";

    if (!grouped.has(namespace)) {
      grouped.set(namespace, []);
    }
    grouped.get(namespace)!.push(item);
  }

  return grouped;
}

/**
 * Format a grouped list for readable output
 */
function formatGroupedList(
  title: string,
  grouped: Map<string, string[]>,
  total: number
): string {
  const lines: string[] = [`${title} (${total} total):`];

  // Sort namespaces, prioritizing /dexi and /fmu
  const sortedNamespaces = Array.from(grouped.keys()).sort((a, b) => {
    if (a.startsWith("/dexi")) return -1;
    if (b.startsWith("/dexi")) return 1;
    if (a.startsWith("/fmu")) return -1;
    if (b.startsWith("/fmu")) return 1;
    return a.localeCompare(b);
  });

  for (const ns of sortedNamespaces) {
    const items = grouped.get(ns)!;
    lines.push(`\n${ns}/ (${items.length}):`);
    for (const item of items.slice(0, 20)) {
      lines.push(`  ${item}`);
    }
    if (items.length > 20) {
      lines.push(`  ... and ${items.length - 20} more`);
    }
  }

  return lines.join("\n");
}

/**
 * Format message type details
 */
function formatMessageDetails(typeName: string, typedefs: any[]): string {
  const lines: string[] = [`Message structure for ${typeName}:`];

  for (const typedef of typedefs) {
    lines.push(`\nType: ${typedef.type}`);
    if (typedef.fieldnames && typedef.fieldtypes) {
      lines.push("Fields:");
      for (let i = 0; i < typedef.fieldnames.length; i++) {
        const name = typedef.fieldnames[i];
        const type = typedef.fieldtypes[i];
        lines.push(`  - ${name}: ${type}`);
      }
    }
  }

  return lines.join("\n");
}
