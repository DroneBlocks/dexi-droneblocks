<script setup lang="ts">
import { ref } from 'vue';

const fileInput = ref<HTMLInputElement | null>(null);
const imagePreview = ref<string | null>(null);
const isAnalyzing = ref(false);
const analysisResult = ref<any>(null);
const error = ref<string | null>(null);
const copied = ref(false);

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview.value = e.target?.result as string;
      analysisResult.value = null;
      error.value = null;
    };
    reader.readAsDataURL(file);
  }
};

const triggerFileInput = () => {
  fileInput.value?.click();
};

const analyzeImage = async () => {
  if (!imagePreview.value) return;

  isAnalyzing.value = true;
  error.value = null;

  try {
    const response = await fetch('/api/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imagePreview.value,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to analyze image');
    }

    const data = await response.json();
    analysisResult.value = data;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An error occurred';
  } finally {
    isAnalyzing.value = false;
  }
};

const loadInDroneBlocks = () => {
  if (analysisResult.value?.blocks) {
    // Store blocks in localStorage for the droneblocks page to pick up
    localStorage.setItem('scanned_blocks', JSON.stringify(analysisResult.value.blocks));
    // Navigate to droneblocks page
    window.location.href = '/droneblocks?load=scanned';
  }
};

const copyBlocks = async () => {
  if (analysisResult.value?.blocks) {
    await navigator.clipboard.writeText(JSON.stringify(analysisResult.value.blocks, null, 2));
    copied.value = true;
    setTimeout(() => copied.value = false, 2000);
  }
};
</script>

<template>
  <div class="scan-container">
    <header class="scan-header">
      <a href="/droneblocks" class="back-link">&larr; Back</a>
      <h1>Scan Blocks</h1>
    </header>

    <main class="scan-content">
      <div v-if="!imagePreview" class="upload-area" @click="triggerFileInput">
        <div class="upload-icon">📷</div>
        <p class="upload-text">Tap to take a photo or upload an image</p>
        <p class="upload-hint">Position your physical Blockly blocks clearly in frame</p>
      </div>

      <div v-else class="preview-area">
        <img :src="imagePreview" alt="Preview" class="preview-image" />
        <button @click="triggerFileInput" class="retake-btn">Retake Photo</button>
      </div>

      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        capture="environment"
        @change="handleFileSelect"
        class="hidden-input"
      />

      <div v-if="imagePreview && !analysisResult" class="action-area">
        <button
          @click="analyzeImage"
          :disabled="isAnalyzing"
          class="analyze-btn"
        >
          <span v-if="isAnalyzing">Analyzing...</span>
          <span v-else>Identify Blocks</span>
        </button>
      </div>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <div v-if="analysisResult" class="results-area">
        <h2>Detected Blocks</h2>

        <div class="blocks-list">
          <div v-for="(block, index) in analysisResult.blocks" :key="index" class="block-item">
            <span class="block-number">{{ index + 1 }}.</span>
            <span class="block-name">{{ block.type }}</span>
            <span v-if="block.value" class="block-value">({{ block.value }}{{ block.unit || '' }})</span>
          </div>
        </div>

        <div v-if="analysisResult.description" class="mission-description">
          <strong>Mission:</strong> {{ analysisResult.description }}
        </div>

        <div class="results-actions">
          <button @click="loadInDroneBlocks" class="load-btn">
            Load in DroneBlocks
          </button>
          <button @click="copyBlocks" class="copy-btn">
            {{ copied ? 'Copied!' : 'Copy Blocks' }}
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.scan-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: white;
  font-family: system-ui, -apple-system, sans-serif;
}

.scan-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.2);
}

.back-link {
  color: #64b5f6;
  text-decoration: none;
  font-size: 1rem;
}

.scan-header h1 {
  font-size: 1.25rem;
  margin: 0;
  flex: 1;
}

.scan-content {
  padding: 1rem;
  max-width: 500px;
  margin: 0 auto;
}

.upload-area {
  background: rgba(255, 255, 255, 0.1);
  border: 2px dashed rgba(255, 255, 255, 0.3);
  border-radius: 16px;
  padding: 3rem 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.upload-area:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.5);
}

.upload-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.upload-text {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}

.upload-hint {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
}

.hidden-input {
  display: none;
}

.preview-area {
  text-align: center;
}

.preview-image {
  max-width: 100%;
  max-height: 400px;
  border-radius: 12px;
  margin-bottom: 1rem;
}

.retake-btn {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
}

.action-area {
  margin-top: 1.5rem;
  text-align: center;
}

.analyze-btn {
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  transition: transform 0.2s;
}

.analyze-btn:hover:not(:disabled) {
  transform: scale(1.02);
}

.analyze-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.error-message {
  background: rgba(244, 67, 54, 0.2);
  border: 1px solid #f44336;
  color: #ff8a80;
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
  text-align: center;
}

.results-area {
  margin-top: 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
}

.results-area h2 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
}

.blocks-list {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.block-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.block-item:last-child {
  border-bottom: none;
}

.block-number {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.875rem;
}

.block-name {
  color: #64b5f6;
  font-weight: 500;
}

.block-value {
  color: #81c784;
  font-size: 0.875rem;
}

.mission-description {
  background: rgba(0, 0, 0, 0.2);
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  line-height: 1.5;
}

.results-actions {
  display: flex;
  gap: 0.75rem;
}

.load-btn {
  flex: 1;
  background: linear-gradient(135deg, #2196F3, #1976D2);
  color: white;
  border: none;
  padding: 0.875rem 1rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
}

.copy-btn {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 0.875rem 1rem;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
}

.copy-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
