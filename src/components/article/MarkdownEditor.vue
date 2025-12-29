<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useArticleMarkdown } from '@/composables/useArticleMarkdown'
import { useMermaidRenderer } from '@/composables/useMermaidRenderer'
import { useFlowchartRenderer } from '@/composables/useFlowchartRenderer'
import { useCodeCopy } from '@/composables/useCodeCopy'
// 导入样式
import 'highlight.js/styles/github.css'
import 'katex/dist/katex.min.css'
import '@/styles/markdown-content.css'

const props = defineProps<{
  modelValue: string
  placeholder?: string
  hasError?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { t } = useI18n()

// 预览模式：'edit' | 'preview' | 'split'
const previewMode = ref<'edit' | 'preview' | 'split'>('edit')

// Markdown 实时预览
const previewContent = useArticleMarkdown(computed(() => props.modelValue))
const previewContainerRef = ref<HTMLElement>()
const editorRef = ref<HTMLTextAreaElement>()

// 使用 composables 处理预览内容
const { addCopyButtons: addPreviewCopyButtons } = useCodeCopy(previewContainerRef, (key: string) => {
  const translations: Record<string, string> = {
    'copy': t('code.copy'),
    'copied': t('code.copied'),
    'copyFailed': t('code.copyFailed'),
    'copyCode': t('code.copyCode')
  }
  return translations[key] || key
})
const { initMermaid, rerenderMermaid } = useMermaidRenderer(previewContainerRef)
const { initFlowchart, rerenderFlowchart } = useFlowchartRenderer(previewContainerRef)

/**
 * 初始化预览内容渲染
 */
const initializePreview = (forceRerender = false) => {
  nextTick(() => {
    if (previewContainerRef.value) {
      // 先添加复制按钮
      addPreviewCopyButtons()
      // 然后初始化图表（如果需要强制重新渲染，传递参数）
      if (forceRerender) {
        rerenderMermaid()
        rerenderFlowchart()
      } else {
        initMermaid()
        initFlowchart()
      }
    }
  })
}

// 监听预览模式变化
watch(previewMode, (newMode) => {
  if (newMode !== 'edit') {
    // 延迟初始化，确保 DOM 已更新
    nextTick(() => {
      initializePreview()
    })
  }
})

// 防抖定时器
let updateTimer: ReturnType<typeof setTimeout> | null = null

/**
 * 更新预览内容（带防抖）
 */
const updatePreview = () => {
  // 清除之前的定时器
  if (updateTimer) {
    clearTimeout(updateTimer)
  }
  
  // 防抖延迟，避免频繁更新
  updateTimer = setTimeout(() => {
    nextTick(() => {
      // 再次等待，确保 v-html 已经更新了 DOM
      setTimeout(() => {
        if (previewContainerRef.value && previewMode.value !== 'edit') {
          initializePreview(true)
        }
      }, 50)
    })
  }, 200) // 防抖延迟 200ms
}

// 监听内容变化，重新初始化所有渲染功能
watch(() => props.modelValue, () => {
  if (previewMode.value !== 'edit') {
    updatePreview()
  }
}, { flush: 'post' })

// 监听预览 HTML 变化（确保渲染）
watch(() => previewContent.value.html, () => {
  if (previewMode.value !== 'edit' && previewContainerRef.value) {
    updatePreview()
  }
}, { flush: 'post' })

// 处理内容更新
const handleInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
}

// 初始化预览（如果初始模式不是编辑模式）
if (previewMode.value !== 'edit') {
  nextTick(() => {
    initializePreview()
  })
}
</script>

<template>
  <div class="markdown-editor">
    <div class="content-header">
      <div class="preview-mode-toggle">
        <button
          type="button"
          class="mode-btn"
          :class="{ active: previewMode === 'edit' }"
          @click="previewMode = 'edit'"
        >
          {{ t('article.editMode') }}
        </button>
        <button
          type="button"
          class="mode-btn"
          :class="{ active: previewMode === 'split' }"
          @click="previewMode = 'split'"
        >
          {{ t('article.splitMode') }}
        </button>
        <button
          type="button"
          class="mode-btn"
          :class="{ active: previewMode === 'preview' }"
          @click="previewMode = 'preview'"
        >
          {{ t('article.previewMode') }}
        </button>
      </div>
    </div>
    
    <div class="content-container" :class="`mode-${previewMode}`">
      <!-- 编辑区域 -->
      <div v-show="previewMode === 'edit' || previewMode === 'split'" class="editor-panel">
        <textarea
          ref="editorRef"
          :value="modelValue"
          @input="handleInput"
          rows="20"
          :placeholder="placeholder || t('article.contentPlaceholder')"
          class="content-textarea"
          :class="{ 'form-error': hasError }"
        ></textarea>
      </div>
      
      <!-- 预览区域 -->
      <div v-show="previewMode === 'preview' || previewMode === 'split'" class="preview-panel">
        <div
          ref="previewContainerRef"
          class="markdown-preview content-block"
          v-html="previewContent.html"
        ></div>
        <div v-if="!modelValue.trim()" class="preview-empty">
          {{ t('article.previewEmpty') }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.markdown-editor {
  width: 100%;
}

.content-header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 8px;
  flex-wrap: wrap;
  gap: 12px;
}

.preview-mode-toggle {
  display: flex;
  gap: 4px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 4px;
}

.mode-btn {
  padding: 6px 12px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.mode-btn:hover {
  color: var(--text-primary);
  background: var(--surface);
}

.mode-btn.active {
  background: var(--brand);
  color: var(--bg);
}

.content-container {
  position: relative;
  min-height: 400px;
}

.content-container.mode-edit .editor-panel,
.content-container.mode-preview .preview-panel {
  width: 100%;
}

.content-container.mode-preview .preview-panel {
  max-height: none;
  min-height: 400px;
}

.content-container.mode-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  min-height: 500px;
}

.content-container.mode-split .editor-panel,
.content-container.mode-split .preview-panel {
  width: 100%;
}

.editor-panel {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 600px;
  min-height: 400px;
}

.preview-panel {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  padding: 20px;
  max-height: 600px;
  min-height: 400px;
}

.content-container.mode-split .editor-panel,
.content-container.mode-split .preview-panel {
  max-height: 600px;
  min-height: 500px;
  height: 600px;
}

.content-container.mode-split .editor-panel {
  padding: 0;
}

.markdown-preview {
  width: 100%;
  color: var(--text-primary);
}

/* 覆盖 content-block 的 padding 和 border，因为 preview-panel 已经提供了 */
.markdown-preview.content-block {
  padding: 0;
  border: none;
  background: transparent;
}

.markdown-preview :deep(h1),
.markdown-preview :deep(h2),
.markdown-preview :deep(h3),
.markdown-preview :deep(h4),
.markdown-preview :deep(h5),
.markdown-preview :deep(h6) {
  margin: 12px 0 8px;
  line-height: 1.4;
}

.markdown-preview :deep(h1) {
  font-size: 2em;
  margin-block: 0.67em;
}

.markdown-preview :deep(h2) {
  font-size: 1.5em;
  margin-block: 0.75em;
}

.markdown-preview :deep(h3) {
  font-size: 1.17em;
  margin-block: 0.83em;
}

.markdown-preview :deep(p) {
  margin: 8px 0;
  line-height: 1.7;
}

.markdown-preview :deep(ul),
.markdown-preview :deep(ol) {
  padding-left: 18px;
  margin: 8px 0 12px;
}

.markdown-preview :deep(blockquote) {
  margin: 10px 0;
  padding: 10px 12px;
  border-left: 3px solid var(--border);
  background: var(--surface-2);
  color: var(--text-primary);
}

.markdown-preview :deep(pre.hljs) {
  margin: 12px 0;
  padding: 16px;
  padding-top: 40px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.6;
  position: relative;
  background: #f6f8fa;
  overflow-x: auto;
  overflow-y: auto;
  max-height: 500px;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.dark .markdown-preview :deep(pre.hljs) {
  background: #1e1e1e;
  border-color: #333;
}

.markdown-preview :deep(code:not(pre code)) {
  background: #fff5f5;
  color: #c7254e;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  font-size: 0.9em;
}

.dark .markdown-preview :deep(code:not(pre code)) {
  background: #4a1a1a;
  color: #ff6b6b;
}

.markdown-preview :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 12px 0;
  border: 2px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  background: var(--surface);
  max-width: 100%;
}

.markdown-preview :deep(table th),
.markdown-preview :deep(table td) {
  padding: 12px;
  border: 1px solid var(--border);
  text-align: left;
}

.markdown-preview :deep(table th) {
  background: var(--surface);
  font-weight: 600;
}

.markdown-preview :deep(table td) {
  background: var(--surface-2);
}

.markdown-preview :deep(img) {
  max-width: 100%;
  border-radius: 12px;
  display: block;
  margin: 12px 0;
}

.markdown-preview :deep(.mermaid-container),
.markdown-preview :deep(.flowchart-container) {
  margin: 16px 0;
  padding: 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: auto;
  max-height: 600px;
  text-align: center;
}

.preview-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: var(--text-muted);
  font-style: italic;
}

.content-textarea {
  font-family: ui-monospace, 'Courier New', monospace;
  line-height: 1.6;
  width: 100%;
  resize: none;
  padding: 20px;
  border: none;
  border-radius: 0;
  background: transparent;
  color: var(--text-primary);
  font-size: 16px;
  transition: none;
  box-sizing: border-box;
  outline: none;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.content-textarea:focus {
  outline: none;
  border: none;
}

.content-textarea.form-error {
  border: none;
  background: transparent;
}

.content-container.mode-split .content-textarea {
  height: 100%;
  resize: none;
  min-height: 500px;
}

.content-container.mode-edit .content-textarea {
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
  padding: 12px;
}

.content-container.mode-edit .content-textarea:focus {
  border-color: var(--brand);
}

/* 响应式 */
@media (max-width: 768px) {
  .content-container.mode-split {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .content-container.mode-split .editor-panel,
  .content-container.mode-split .preview-panel {
    min-height: 300px;
  }

  .content-container.mode-split .content-textarea {
    height: 300px;
  }

  .preview-mode-toggle {
    width: 100%;
    justify-content: stretch;
  }

  .mode-btn {
    flex: 1;
  }
}
</style>

