<script setup lang="ts">
import { ref, nextTick, watch } from "vue";
import { useClaudeChat, type DroneContext } from "~/composables/useClaudeChat";

const props = defineProps<{
  droneContext?: DroneContext;
}>();

const { messages, isLoading, error, hasMessages, sendMessage, clearMessages } =
  useClaudeChat();

const inputMessage = ref("");
const chatContainer = ref<HTMLElement | null>(null);

const scrollToBottom = () => {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
  });
};

watch(messages, scrollToBottom, { deep: true });

const handleSend = async () => {
  const message = inputMessage.value.trim();
  if (!message || isLoading.value) return;

  inputMessage.value = "";
  await sendMessage(message, props.droneContext);
};

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
};

const formatTime = (date: Date) => {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};
</script>

<template>
  <div class="flex flex-col h-full bg-base-200 rounded-lg overflow-hidden">
    <!-- Header -->
    <div
      class="flex items-center justify-between px-4 py-3 bg-base-300 border-b border-base-content/10"
    >
      <div class="flex items-center gap-2">
        <span class="text-2xl">🚁</span>
        <span class="font-semibold text-base-content">DEXI Chat</span>
      </div>
      <button
        v-if="hasMessages"
        @click="clearMessages"
        class="btn btn-ghost btn-sm text-base-content/60 hover:text-base-content"
      >
        Clear
      </button>
    </div>

    <!-- Messages -->
    <div ref="chatContainer" class="flex-1 overflow-y-auto p-4 space-y-4">
      <!-- Empty state -->
      <div
        v-if="!hasMessages"
        class="flex flex-col items-center justify-center h-full text-base-content/50"
      >
        <span class="text-4xl mb-4">💬</span>
        <p class="text-center">
          Ask me anything about your drone!
          <br />
          <span class="text-sm"
            >Try: "Set LED to blue" or "How do I takeoff?"</span
          >
        </p>
      </div>

      <!-- Message list -->
      <div v-for="msg in messages" :key="msg.id" class="flex flex-col">
        <!-- Tool results badge for assistant messages -->
        <div
          v-if="msg.role === 'assistant' && msg.toolResults?.length"
          class="self-start mb-1"
        >
          <details class="collapse collapse-arrow bg-success/10 rounded-lg">
            <summary class="collapse-title text-xs text-success py-1 min-h-0 px-3">
              {{ msg.toolResults.length }} tool{{ msg.toolResults.length > 1 ? 's' : '' }} executed
            </summary>
            <div class="collapse-content text-xs font-mono text-base-content/70 pt-0">
              <div v-for="(result, idx) in msg.toolResults" :key="idx" class="mb-1 whitespace-pre-wrap">
                {{ result }}
              </div>
            </div>
          </details>
        </div>
        <div
          :class="[
            'max-w-[85%] rounded-2xl px-4 py-2',
            msg.role === 'user'
              ? 'self-end bg-primary text-primary-content'
              : 'self-start bg-base-300 text-base-content',
          ]"
        >
          <p class="whitespace-pre-wrap">{{ msg.content }}</p>
        </div>
        <span
          :class="[
            'text-xs text-base-content/40 mt-1',
            msg.role === 'user' ? 'self-end' : 'self-start',
          ]"
        >
          {{ formatTime(msg.timestamp) }}
        </span>
      </div>

      <!-- Loading indicator -->
      <div v-if="isLoading" class="flex items-center gap-2 text-base-content/60">
        <span class="loading loading-dots loading-sm"></span>
        <span>DEXI is working...</span>
      </div>

      <!-- Error message -->
      <div v-if="error" class="alert alert-error">
        <span>{{ error }}</span>
      </div>
    </div>

    <!-- Input -->
    <div class="p-4 bg-base-300 border-t border-base-content/10">
      <div class="flex gap-2">
        <input
          v-model="inputMessage"
          @keydown="handleKeydown"
          type="text"
          placeholder="Talk to your drone..."
          class="input input-bordered flex-1 bg-base-100"
          :disabled="isLoading"
        />
        <button
          @click="handleSend"
          class="btn btn-primary"
          :disabled="!inputMessage.trim() || isLoading"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            class="w-5 h-5"
          >
            <path
              d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>
