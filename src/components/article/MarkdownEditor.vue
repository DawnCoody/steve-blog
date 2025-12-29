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
const initializePreview = () => {
  nextTick(() => {
    if (previewContainerRef.value) {
      addPreviewCopyButtons()
      initMermaid()
      initFlowchart()
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

// 监听预览内容变化，重新初始化渲染功能
watch(() => previewContent.value.html, () => {
  if (previewMode.value !== 'edit' && previewContainerRef.value) {
    nextTick(() => {
      rerenderMermaid()
      rerenderFlowchart()
    })
  }
})

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
          class="markdown-preview"
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
}

.preview-panel {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
  padding: 20px;
  overflow-y: auto;
  max-height: 600px;
  min-height: 400px;
}

.content-container.mode-split .preview-panel {
  max-height: none;
  min-height: 500px;
}

.markdown-preview {
  width: 100%;
  color: var(--text-primary);
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
  resize: vertical;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-primary);
  font-size: 16px;
  transition: border-color 0.2s ease;
  box-sizing: border-box;
}

.content-textarea:focus {
  outline: none;
  border-color: var(--brand);
}

.content-textarea.form-error {
  border-color: #c53030;
  background: #fff5f5;
}

.dark .content-textarea.form-error {
  border-color: #c53030;
  background: #4a1a1a;
}

.content-container.mode-split .content-textarea {
  height: 500px;
  resize: none;
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

