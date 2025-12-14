<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import ROSLIB from 'roslib';
import { useROS } from '~/composables/useROS';

const { getROSURL } = useROS();

const ros = ref<ROSLIB.Ros | null>(null);
const connected = ref(false);
const challengeStartTopic = ref<ROSLIB.Topic | null>(null);
const activeChallenge = ref<string | null>(null);

const challenges = [
  { id: 'arm_basic', name: 'Challenge 1: Arm the Drone', points: 50 },
  { id: 'takeoff_basic', name: 'Challenge 2: Takeoff to 5m', points: 100 },
];

const connectToROS = () => {
  try {
    ros.value = new ROSLIB.Ros({
      url: getROSURL()
    });

    ros.value.on('connection', () => {
      console.log('CTF: Connected to ROS');
      connected.value = true;

      challengeStartTopic.value = new ROSLIB.Topic({
        ros: ros.value as ROSLIB.Ros,
        name: '/dexi/ctf/challenge/start',
        messageType: 'dexi_interfaces/msg/ChallengeStart'
      });
    });

    ros.value.on('error', (error: any) => {
      console.error('CTF: ROS connection error:', error);
      connected.value = false;
    });

    ros.value.on('close', () => {
      console.log('CTF: ROS connection closed');
      connected.value = false;
    });
  } catch (error) {
    console.error('CTF: Failed to connect to ROS:', error);
  }
};

const disconnectFromROS = () => {
  if (ros.value) {
    ros.value.close();
    ros.value = null;
    connected.value = false;
  }
};

const activateChallenge = (challengeId: string) => {
  if (!challengeStartTopic.value) return;

  const challenge = challenges.find(c => c.id === challengeId);
  if (!challenge) return;

  const msg = {
    challenge_id: challengeId,
    challenge_name: challenge.name,
    timeout_seconds: 300
  };

  challengeStartTopic.value.publish(msg);
  activeChallenge.value = challengeId;
  console.log('CTF: Activated challenge:', msg);
};

onMounted(() => {
  connectToROS();
});

onBeforeUnmount(() => {
  disconnectFromROS();
});
</script>

<template>
  <div class="ctf-page">
    <header class="ctf-header">
      <h1>CTF Challenge Select</h1>
      <div class="connection-status" :class="{ connected, disconnected: !connected }">
        <span class="status-dot"></span>
        <span>{{ connected ? 'Connected' : 'Disconnected' }}</span>
      </div>
      <a href="/" class="back-link">Back to Dashboard</a>
    </header>

    <main class="ctf-content">
      <p class="instructions">Select a challenge to activate:</p>

      <div class="challenge-list">
        <button
          v-for="challenge in challenges"
          :key="challenge.id"
          @click="activateChallenge(challenge.id)"
          :disabled="!connected"
          class="challenge-btn"
          :class="{ active: activeChallenge === challenge.id }"
        >
          <span class="challenge-name">{{ challenge.name }}</span>
          <span class="challenge-points">{{ challenge.points }} pts</span>
        </button>
      </div>

      <div v-if="activeChallenge" class="active-indicator">
        Active: {{ challenges.find(c => c.id === activeChallenge)?.name }}
      </div>
    </main>
  </div>
</template>

<style scoped>
.ctf-page {
  min-height: 100vh;
  background: #0f0f1a;
  color: #e0e0e0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.ctf-header {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  border-bottom: 1px solid rgba(42, 157, 143, 0.3);
}

.ctf-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #fff;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  padding: 0.375rem 0.75rem;
  border-radius: 20px;
  background: rgba(0, 0, 0, 0.3);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.connection-status.connected .status-dot {
  background: #4ade80;
  box-shadow: 0 0 8px rgba(74, 222, 128, 0.6);
}

.connection-status.disconnected .status-dot {
  background: #ef4444;
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.6);
}

.back-link {
  margin-left: auto;
  color: #4facfe;
  text-decoration: none;
  font-size: 0.875rem;
  transition: color 0.2s;
}

.back-link:hover {
  color: #00f2fe;
}

.ctf-content {
  padding: 2rem;
  max-width: 600px;
  margin: 0 auto;
}

.instructions {
  color: #8892b0;
  font-size: 1rem;
  margin-bottom: 1.5rem;
}

.challenge-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.challenge-btn {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #fff;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.challenge-btn:hover:not(:disabled) {
  background: rgba(79, 172, 254, 0.1);
  border-color: rgba(79, 172, 254, 0.5);
  transform: translateY(-2px);
}

.challenge-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.challenge-btn.active {
  background: rgba(74, 222, 128, 0.15);
  border-color: #4ade80;
}

.challenge-name {
  font-weight: 600;
}

.challenge-points {
  background: rgba(255, 255, 255, 0.1);
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  color: #4facfe;
}

.active-indicator {
  margin-top: 2rem;
  padding: 1rem;
  background: rgba(74, 222, 128, 0.1);
  border: 1px solid rgba(74, 222, 128, 0.3);
  border-radius: 8px;
  color: #4ade80;
  text-align: center;
  font-weight: 500;
}
</style>
