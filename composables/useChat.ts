import { ref, computed } from "vue";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  toolResults?: string[];
}

export interface DroneContext {
  armed?: boolean;
  altitude?: number;
  battery?: number;
  mode?: string;
}

export type ChatBackend = "claude" | "local";

const messages = ref<ChatMessage[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);
const backend = ref<ChatBackend>("claude");

export function useChat() {
  const hasMessages = computed(() => messages.value.length > 0);

  const setBackend = (b: ChatBackend) => {
    backend.value = b;
  };

  const addMessage = (role: "user" | "assistant", content: string, toolResults?: string[]) => {
    messages.value.push({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role,
      content,
      timestamp: new Date(),
      toolResults,
    });
  };

  const sendMessage = async (
    userMessage: string,
    context?: DroneContext
  ): Promise<void> => {
    if (!userMessage.trim()) return;

    error.value = null;
    addMessage("user", userMessage);
    isLoading.value = true;

    try {
      // Build message history for API (last 20 messages for context)
      const history = messages.value.slice(-20).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await $fetch<{ message: string; toolResults?: string[] }>("/api/chat", {
        method: "POST",
        body: {
          messages: history,
          context,
          backend: backend.value,
        },
      });

      if (response.message) {
        addMessage("assistant", response.message, response.toolResults);
      }
    } catch (err: unknown) {
      const e = err as Error & { data?: { message?: string } };
      error.value = e.data?.message || e.message || "Failed to send message";
      console.error("Chat error:", e);
    } finally {
      isLoading.value = false;
    }
  };

  const clearMessages = () => {
    messages.value = [];
    error.value = null;
  };

  return {
    messages: computed(() => messages.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    hasMessages,
    backend: computed(() => backend.value),
    setBackend,
    sendMessage,
    clearMessages,
  };
}
