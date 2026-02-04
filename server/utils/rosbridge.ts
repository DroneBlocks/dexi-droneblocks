/**
 * Rosbridge WebSocket Client
 *
 * Connects to rosbridge_server and provides methods for:
 * - Calling services
 * - Subscribing to topics
 * - Publishing messages
 * - Querying rosapi for discovery
 */

import WebSocket from "ws";

interface RosbridgeMessage {
  op: string;
  id?: string;
  topic?: string;
  type?: string;
  msg?: any;
  service?: string;
  serviceType?: string;
  args?: any;
  result?: boolean;
  values?: any;
}

export class RosbridgeClient {
  private ws: WebSocket | null = null;
  private url: string;
  private pendingRequests: Map<string, {
    resolve: (value: any) => void;
    reject: (reason: any) => void;
    timer: NodeJS.Timeout;
  }> = new Map();
  private subscriptionHandlers: Map<string, (msg: any) => void> = new Map();
  private messageId = 0;
  private connected = false;
  private reconnecting = false;

  constructor(url: string = "ws://localhost:9090") {
    this.url = url;
  }

  async connect(timeout: number = 5000): Promise<void> {
    if (this.connected && this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Connection timeout to ${this.url}`));
      }, timeout);

      this.ws = new WebSocket(this.url);

      this.ws.on("open", () => {
        clearTimeout(timer);
        this.connected = true;
        console.log(`Connected to rosbridge at ${this.url}`);
        resolve();
      });

      this.ws.on("error", (err) => {
        clearTimeout(timer);
        this.connected = false;
        reject(err);
      });

      this.ws.on("close", () => {
        this.connected = false;
        console.log("Rosbridge connection closed");
      });

      this.ws.on("message", (data: WebSocket.Data) => {
        this.handleMessage(data);
      });
    });
  }

  private handleMessage(data: WebSocket.Data): void {
    try {
      const msg: RosbridgeMessage = JSON.parse(data.toString());

      // Handle service response
      if (msg.op === "service_response" && msg.id) {
        const pending = this.pendingRequests.get(msg.id);
        if (pending) {
          clearTimeout(pending.timer);
          this.pendingRequests.delete(msg.id);
          pending.resolve(msg.values ?? msg.result);
        }
      }

      // Handle topic message (subscription)
      if (msg.op === "publish" && msg.topic) {
        const handler = this.subscriptionHandlers.get(msg.topic);
        if (handler) {
          handler(msg.msg);
        }
      }
    } catch (e) {
      console.error("Failed to parse rosbridge message:", e);
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.connected = false;
    }
  }

  isConnected(): boolean {
    return this.connected && this.ws?.readyState === WebSocket.OPEN;
  }

  private send(msg: RosbridgeMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket not connected");
    }
    this.ws.send(JSON.stringify(msg));
  }

  private generateId(): string {
    return `req_${++this.messageId}_${Date.now()}`;
  }

  /**
   * Call a ROS service
   */
  async callService(
    service: string,
    args: any = {},
    timeout: number = 30000
  ): Promise<any> {
    await this.connect();
    const id = this.generateId();

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Service call timeout: ${service}`));
      }, timeout);

      this.pendingRequests.set(id, { resolve, reject, timer });

      this.send({
        op: "call_service",
        id,
        service,
        args,
      });
    });
  }

  /**
   * Subscribe to a topic and get a single message
   */
  async subscribeOnce(
    topic: string,
    msgType: string,
    timeout: number = 5000
  ): Promise<any> {
    await this.connect();

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.unsubscribe(topic);
        this.subscriptionHandlers.delete(topic);
        reject(new Error(`Subscribe timeout: ${topic}`));
      }, timeout);

      this.subscriptionHandlers.set(topic, (msg) => {
        clearTimeout(timer);
        this.unsubscribe(topic);
        this.subscriptionHandlers.delete(topic);
        resolve(msg);
      });

      this.send({
        op: "subscribe",
        topic,
        type: msgType,
      });
    });
  }

  /**
   * Unsubscribe from a topic
   */
  unsubscribe(topic: string): void {
    if (this.isConnected()) {
      this.send({ op: "unsubscribe", topic });
    }
  }

  /**
   * Publish a message to a topic
   */
  async publish(topic: string, msgType: string, msg: any): Promise<void> {
    await this.connect();
    this.send({
      op: "publish",
      topic,
      type: msgType,
      msg,
    });
  }

  // ============ ROSAPI Convenience Methods ============

  async getTopics(): Promise<string[]> {
    const result = await this.callService("/rosapi/topics", {});
    return result?.topics || [];
  }

  async getServices(): Promise<string[]> {
    const result = await this.callService("/rosapi/services", {});
    return result?.services || [];
  }

  async getTopicType(topic: string): Promise<string> {
    const result = await this.callService("/rosapi/topic_type", { topic });
    return result?.type || "";
  }

  async getServiceType(service: string): Promise<string> {
    const result = await this.callService("/rosapi/service_type", { service });
    return result?.type || "";
  }

  async getMessageDetails(type: string): Promise<any> {
    const result = await this.callService("/rosapi/message_details", { type });
    return result;
  }

  async getServiceRequestDetails(type: string): Promise<any> {
    const result = await this.callService("/rosapi/service_request_details", { type });
    return result;
  }

  async getNodes(): Promise<string[]> {
    const result = await this.callService("/rosapi/nodes", {});
    return result?.nodes || [];
  }
}

// Singleton instance
let clientInstance: RosbridgeClient | null = null;
let currentUrl: string = process.env.ROSBRIDGE_URL || "ws://localhost:9090";

export function getRosbridgeClient(url?: string): RosbridgeClient {
  if (!clientInstance) {
    const rosbridgeUrl = url || currentUrl;
    clientInstance = new RosbridgeClient(rosbridgeUrl);
  }
  return clientInstance;
}

export async function getConnectedClient(url?: string): Promise<RosbridgeClient> {
  const client = getRosbridgeClient(url);
  if (!client.isConnected()) {
    await client.connect();
  }
  return client;
}

/**
 * Get the current rosbridge URL
 */
export function getCurrentRosbridgeUrl(): string {
  return currentUrl;
}

/**
 * Reset the client and optionally set a new URL.
 * This disconnects the existing client and clears the singleton,
 * so the next call to getRosbridgeClient will create a new connection.
 */
export function resetRosbridgeClient(newUrl?: string): void {
  if (clientInstance) {
    clientInstance.disconnect();
    clientInstance = null;
  }
  if (newUrl) {
    currentUrl = newUrl;
  }
}

/**
 * Switch to a new rosbridge URL and connect.
 * Returns the connected client.
 */
export async function switchRosbridgeUrl(newUrl: string): Promise<RosbridgeClient> {
  resetRosbridgeClient(newUrl);
  return getConnectedClient();
}
