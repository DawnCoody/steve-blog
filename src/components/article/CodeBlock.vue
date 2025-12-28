<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

/**
 * 代码块组件
 * 封装 pre+code 横向滚动条功能
 * 标准方案：pre + overflow-x: auto + white-space: pre
 * 使用 slot 实现内容插槽
 */

interface Props {
  language?: string
  showCopyButton?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  language: '',
  showCopyButton: true
})

const { t } = useI18n()
const copied = ref(false)

const codeClass = computed(() => {
  return props.language ? `language-${props.language}` : ''
})

const codeRef = ref<HTMLElement>()

const handleCopy = async () => {
  if (!navigator.clipboard || !navigator.clipboard.writeText) {
    console.error('Clipboard API 不可用')
    return
  }

  // 从 code 元素中获取文本
  const text = codeRef.value?.textContent || codeRef.value?.innerText || ''
  
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('复制失败:', err)
  }
}
</script>

<template>
  <pre class="code-block">
    <button
      v-if="showCopyButton"
      class="copy-code-btn"
      type="button"
      :class="{ copied: copied }"
      @click="handleCopy"
      :aria-label="t('code.copyCode')"
    >
      {{ copied ? t('code.copied') : t('code.copy') }}
    </button>
    <code ref="codeRef" :class="codeClass">
      <slot></slot>
    </code>
  </pre>
</template>

<style scoped>
/* 标准方案：pre + overflow-x: auto + white-space: pre */
.code-block {
  margin: 12px 0;
  padding: 16px;
  padding-top: 40px; /* 为复制按钮留出空间 */
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.6;
  position: relative;
  background: #f6f8fa;
  /* 标准方案：pre 元素设置 overflow-x: auto 实现横向滚动 */
  overflow-x: auto;
  overflow-y: hidden;
  /* 确保宽度限制 */
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  /* 滚动条样式 */
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.3) transparent;
}

/* Webkit 浏览器滚动条样式 */
.code-block::-webkit-scrollbar {
  height: 8px;
}

.code-block::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 4px;
}

.code-block::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
}

.code-block::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.5);
}

/* code 元素 - 代码内容 */
/* 标准方案：code + white-space: pre 保持代码原始格式，不换行 */
.code-block code {
  padding: 0;
  background: transparent;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  display: block;
  /* 标准方案：white-space: pre 保持代码原始格式，不换行 */
  white-space: pre;
  word-wrap: normal;
  word-break: normal;
  overflow-wrap: normal;
  color: inherit;
  /* 确保代码内容可以超出 pre 容器的宽度 */
  width: auto;
  max-width: none;
  min-width: max-content;
  flex-shrink: 0;
  /* code 元素不设置 overflow，让 pre 元素处理滚动 */
  overflow: visible;
  overflow-x: visible;
  overflow-y: visible;
  /* 确保内容可以自然扩展 */
  box-sizing: content-box;
}

/* 确保 code 元素内的所有子元素（highlight.js 生成的 span）也不会换行 */
.code-block code *,
.code-block code span {
  white-space: pre;
  word-wrap: normal;
  word-break: normal;
  overflow-wrap: normal;
  display: inline;
}

/* 复制按钮样式 */
.copy-code-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 6px 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 10;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.copy-code-btn:hover {
  background: var(--surface-2);
  border-color: var(--brand);
  color: var(--brand);
}

.copy-code-btn.copied {
  background: var(--brand);
  border-color: var(--brand);
  color: var(--bg);
}

.copy-code-btn:active {
  transform: scale(0.95);
}

/* 暗色主题样式 */
.dark .code-block {
  background: #1e1e1e;
  border-color: #333;
  scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
}

.dark .code-block::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
}

.dark .code-block::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}
</style>

