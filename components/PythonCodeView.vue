<script setup lang="ts">
import { ref, computed, watch } from 'vue';

const props = defineProps<{
  code: string;
  isExpanded: boolean;
}>();

const emit = defineEmits<{
  (e: 'toggle'): void;
}>();

const copySuccess = ref(false);

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(props.code);
    copySuccess.value = true;
    setTimeout(() => {
      copySuccess.value = false;
    }, 2000);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
};

// Simple syntax highlighting for Python - processes each line to avoid regex conflicts
const highlightedCode = computed(() => {
  const lines = props.code.split('\n');
  return lines.map(line => highlightLine(line)).join('\n');
});

function highlightLine(line: string): string {
  // Check if line is a comment first
  const commentMatch = line.match(/^(\s*)(#.*)$/);
  if (commentMatch) {
    return escapeHtml(commentMatch[1]) + '<span class="hl-comment">' + escapeHtml(commentMatch[2]) + '</span>';
  }

  // For other lines, tokenize and highlight
  let result = '';
  let i = 0;

  while (i < line.length) {
    // Check for strings
    if (line[i] === '"' || line[i] === "'") {
      const quote = line[i];
      let end = i + 1;
      while (end < line.length && line[end] !== quote) {
        if (line[end] === '\\') end++; // skip escaped chars
        end++;
      }
      end++; // include closing quote
      const str = line.slice(i, end);
      result += '<span class="hl-string">' + escapeHtml(str) + '</span>';
      i = end;
      continue;
    }

    // Check for comments mid-line
    if (line[i] === '#') {
      result += '<span class="hl-comment">' + escapeHtml(line.slice(i)) + '</span>';
      break;
    }

    // Check for words (keywords, identifiers, etc.)
    const wordMatch = line.slice(i).match(/^[a-zA-Z_][a-zA-Z0-9_]*/);
    if (wordMatch) {
      const word = wordMatch[0];
      const keywords = ['import', 'from', 'class', 'def', 'return', 'if', 'elif', 'else', 'for', 'while', 'in', 'not', 'and', 'or', 'True', 'False', 'None', 'pass', 'break', 'continue', 'try', 'except', 'finally', 'with', 'as', 'async', 'await', 'self', 'lambda', 'yield', 'raise', 'global', 'nonlocal', 'assert', 'del', 'is'];
      const builtins = ['print', 'len', 'str', 'int', 'float', 'list', 'dict', 'set', 'tuple', 'range', 'type', 'isinstance', 'round', 'abs', 'min', 'max', 'sum', 'sorted', 'reversed', 'enumerate', 'zip', 'map', 'filter', 'open', 'input', 'super', 'object', 'staticmethod', 'classmethod', 'property'];

      if (keywords.includes(word)) {
        result += '<span class="hl-keyword">' + escapeHtml(word) + '</span>';
      } else if (builtins.includes(word)) {
        result += '<span class="hl-builtin">' + escapeHtml(word) + '</span>';
      } else {
        result += escapeHtml(word);
      }
      i += word.length;
      continue;
    }

    // Check for numbers
    const numMatch = line.slice(i).match(/^\d+\.?\d*/);
    if (numMatch) {
      result += '<span class="hl-number">' + escapeHtml(numMatch[0]) + '</span>';
      i += numMatch[0].length;
      continue;
    }

    // Check for decorators
    if (line[i] === '@') {
      const decoratorMatch = line.slice(i).match(/^@[a-zA-Z_][a-zA-Z0-9_]*/);
      if (decoratorMatch) {
        result += '<span class="hl-decorator">' + escapeHtml(decoratorMatch[0]) + '</span>';
        i += decoratorMatch[0].length;
        continue;
      }
    }

    // Default: just escape and add the character
    result += escapeHtml(line[i]);
    i++;
  }

  return result;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
</script>

<template>
  <div class="python-code-view" :class="{ expanded: isExpanded }">
    <div class="python-header" @click="emit('toggle')">
      <div class="header-left">
        <span class="toggle-icon">{{ isExpanded ? '&#9660;' : '&#9654;' }}</span>
        <span class="header-title">Python</span>
      </div>
      <div class="header-actions" @click.stop>
        <button
          @click="copyToClipboard"
          class="copy-btn"
          :class="{ success: copySuccess }"
          :title="copySuccess ? 'Copied!' : 'Copy to clipboard'"
        >
          <span v-if="copySuccess">Copied</span>
          <span v-else>Copy</span>
        </button>
      </div>
    </div>
    <div v-if="isExpanded" class="python-content">
      <pre class="code-block"><code v-html="highlightedCode"></code></pre>
    </div>
  </div>
</template>

<style scoped>
.python-code-view {
  background: #1e1e1e;
  border-top: 1px solid #333;
  display: flex;
  flex-direction: column;
  min-height: 40px;
  max-height: 40px;
  transition: max-height 0.3s ease;
  overflow: hidden;
}

.python-code-view.expanded {
  max-height: 300px;
}

.python-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #252526;
  cursor: pointer;
  user-select: none;
  min-height: 40px;
  box-sizing: border-box;
}

.python-header:hover {
  background: #2d2d30;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toggle-icon {
  color: #858585;
  font-size: 10px;
  width: 12px;
}

.header-title {
  color: #cccccc;
  font-size: 13px;
  font-weight: 500;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.copy-btn {
  background: #0e639c;
  color: white;
  border: none;
  padding: 4px 12px;
  border-radius: 3px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.copy-btn:hover {
  background: #1177bb;
}

.copy-btn.success {
  background: #4caf50;
}

.python-content {
  flex: 1;
  overflow: auto;
  padding: 0;
}

.code-block {
  margin: 0;
  padding: 12px 16px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.5;
  color: #d4d4d4;
  overflow-x: auto;
  white-space: pre;
}

.code-block code {
  font-family: inherit;
}

/* Syntax highlighting colors (VS Code dark theme) */
:deep(.hl-keyword) {
  color: #569cd6;
}

:deep(.hl-string) {
  color: #ce9178;
}

:deep(.hl-comment) {
  color: #6a9955;
}

:deep(.hl-number) {
  color: #b5cea8;
}

:deep(.hl-function) {
  color: #dcdcaa;
}

:deep(.hl-class) {
  color: #4ec9b0;
}

:deep(.hl-builtin) {
  color: #dcdcaa;
}

:deep(.hl-decorator) {
  color: #dcdcaa;
}

/* Scrollbar styling */
.python-content::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.python-content::-webkit-scrollbar-track {
  background: #1e1e1e;
}

.python-content::-webkit-scrollbar-thumb {
  background: #424242;
  border-radius: 5px;
}

.python-content::-webkit-scrollbar-thumb:hover {
  background: #4f4f4f;
}

.code-block::-webkit-scrollbar {
  height: 8px;
}

.code-block::-webkit-scrollbar-track {
  background: #1e1e1e;
}

.code-block::-webkit-scrollbar-thumb {
  background: #424242;
  border-radius: 4px;
}
</style>
