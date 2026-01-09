<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import ROSLIB from 'roslib';

interface ChallengeResult {
  challenge_id: string;
  success: boolean;
  flag: string;
  message: string;
  completion_time: number;
}

const props = defineProps<{
  ros: ROSLIB.Ros | null;
}>();

const isVisible = ref(false);
const result = ref<ChallengeResult | null>(null);
const resultTopic = ref<ROSLIB.Topic | null>(null);
const flagCopied = ref(false);

const subscribeToResults = () => {
  if (!props.ros) return;

  resultTopic.value = new ROSLIB.Topic({
    ros: props.ros,
    name: '/dexi/ctf/challenge/result',
    messageType: 'dexi_interfaces/msg/ChallengeResult'
  });

  resultTopic.value.subscribe((message: any) => {
    result.value = {
      challenge_id: message.challenge_id,
      success: message.success,
      flag: message.flag || '',
      message: message.message || '',
      completion_time: message.completion_time || 0
    };
    isVisible.value = true;
    flagCopied.value = false;
  });

  console.log('CTF Result Popup: Subscribed to /dexi/ctf/challenge/result');
};

const unsubscribe = () => {
  if (resultTopic.value) {
    resultTopic.value.unsubscribe();
    resultTopic.value = null;
  }
};

const dismiss = () => {
  isVisible.value = false;
};

const copyFlag = async () => {
  if (result.value?.flag) {
    try {
      await navigator.clipboard.writeText(result.value.flag);
      flagCopied.value = true;
      setTimeout(() => {
        flagCopied.value = false;
      }, 2000);
    } catch (err) {
      console.error('Failed to copy flag:', err);
    }
  }
};

const formatTime = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(1);
  return `${mins}m ${secs}s`;
};

watch(() => props.ros, (newRos) => {
  unsubscribe();
  if (newRos) {
    subscribeToResults();
  }
});

onMounted(() => {
  if (props.ros) {
    subscribeToResults();
  }
});

onBeforeUnmount(() => {
  unsubscribe();
});
</script>

<template>
  <Transition name="ctf-fade">
    <div v-if="isVisible && result" class="ctf-overlay" @click.self="dismiss">
      <div class="ctf-popup" :class="{ success: result.success, failure: !result.success }">
        <div class="ctf-header">
          <div class="ctf-icon">
            {{ result.success ? '🏆' : '❌' }}
          </div>
          <h2 class="ctf-title">
            {{ result.success ? 'Challenge Complete!' : 'Challenge Failed' }}
          </h2>
        </div>

        <div class="ctf-body">
          <div class="ctf-challenge-name">
            {{ result.challenge_id }}
          </div>

          <p class="ctf-message">
            {{ result.message }}
          </p>

          <div v-if="result.success && result.flag" class="ctf-flag-container">
            <div class="ctf-flag-label">Your Flag</div>
            <div class="ctf-flag-row">
              <code class="ctf-flag">{{ result.flag }}</code>
              <button @click="copyFlag" class="ctf-copy-btn" :class="{ copied: flagCopied }">
                {{ flagCopied ? 'Copied!' : 'Copy' }}
              </button>
            </div>
          </div>

          <div class="ctf-stats">
            <div class="ctf-stat">
              <div class="ctf-stat-value">{{ formatTime(result.completion_time) }}</div>
              <div class="ctf-stat-label">Time</div>
            </div>
            <div class="ctf-stat">
              <div class="ctf-stat-value" :class="{ 'text-success': result.success, 'text-failure': !result.success }">
                {{ result.success ? 'PASSED' : 'FAILED' }}
              </div>
              <div class="ctf-stat-label">Status</div>
            </div>
          </div>
        </div>

        <div class="ctf-footer">
          <button @click="dismiss" class="ctf-dismiss-btn">
            Continue
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.ctf-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
}

.ctf-popup {
  background: linear-gradient(145deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 16px;
  max-width: 480px;
  width: 90%;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5), 0 0 100px rgba(79, 172, 254, 0.15);
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.ctf-popup.success {
  border: 2px solid #4caf50;
}

.ctf-popup.failure {
  border: 2px solid #f44336;
}

.ctf-header {
  padding: 24px 24px 16px;
  text-align: center;
}

.ctf-popup.success .ctf-header {
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(76, 175, 80, 0.05));
}

.ctf-popup.failure .ctf-header {
  background: linear-gradient(135deg, rgba(244, 67, 54, 0.2), rgba(244, 67, 54, 0.05));
}

.ctf-icon {
  font-size: 64px;
  margin-bottom: 12px;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.ctf-title {
  font-size: 28px;
  font-weight: 700;
  color: #fff;
  margin: 0;
}

.ctf-body {
  padding: 20px 24px;
}

.ctf-challenge-name {
  font-size: 14px;
  color: #8892b0;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 12px;
  text-align: center;
}

.ctf-message {
  font-size: 16px;
  color: #ccd6f6;
  margin-bottom: 20px;
  line-height: 1.5;
  text-align: center;
}

.ctf-flag-container {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
  border: 1px solid rgba(79, 172, 254, 0.3);
}

.ctf-flag-label {
  font-size: 12px;
  color: #4facfe;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 8px;
}

.ctf-flag-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ctf-flag {
  flex: 1;
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 16px;
  color: #64ffda;
  word-break: break-all;
  user-select: all;
  cursor: text;
  background: none;
  padding: 0;
}

.ctf-copy-btn {
  background: rgba(79, 172, 254, 0.2);
  border: 1px solid rgba(79, 172, 254, 0.4);
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #4facfe;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.ctf-copy-btn:hover {
  background: rgba(79, 172, 254, 0.3);
  border-color: rgba(79, 172, 254, 0.6);
}

.ctf-copy-btn.copied {
  background: rgba(100, 255, 218, 0.2);
  border-color: rgba(100, 255, 218, 0.4);
  color: #64ffda;
}

.ctf-stats {
  display: flex;
  justify-content: center;
  gap: 48px;
  padding: 16px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.ctf-stat {
  text-align: center;
}

.ctf-stat-value {
  font-size: 20px;
  font-weight: 600;
  color: #fff;
}

.ctf-stat-value.text-success {
  color: #4caf50;
}

.ctf-stat-value.text-failure {
  color: #f44336;
}

.ctf-stat-label {
  font-size: 11px;
  color: #8892b0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 4px;
}

.ctf-footer {
  padding: 16px 24px 24px;
  text-align: center;
}

.ctf-dismiss-btn {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  border: none;
  border-radius: 8px;
  padding: 12px 32px;
  font-size: 16px;
  font-weight: 600;
  color: #0a0a0a;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.ctf-dismiss-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(79, 172, 254, 0.4);
}

.ctf-dismiss-btn:active {
  transform: translateY(0);
}

/* Transition animations */
.ctf-fade-enter-active {
  animation: fadeIn 0.3s ease;
}

.ctf-fade-leave-active {
  animation: fadeIn 0.3s ease reverse;
}

.ctf-fade-enter-active .ctf-popup {
  animation: slideIn 0.4s ease;
}

.ctf-fade-leave-active .ctf-popup {
  animation: slideIn 0.3s ease reverse;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from {
    transform: translateY(-30px) scale(0.95);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}
</style>
