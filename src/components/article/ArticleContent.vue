<script setup lang="ts">
import { onMounted, watch, ref, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Article } from '@/data/types'
import { useAppStore } from '@/store/modules/app'
// 导入样式
import 'highlight.js/styles/github.css'
import 'katex/dist/katex.min.css'
import '@/styles/markdown-content.css'
// 导入 composables
import { useCodeCopy } from '@/composables/useCodeCopy'
import { useMermaidRenderer } from '@/composables/useMermaidRenderer'
import { useFlowchartRenderer } from '@/composables/useFlowchartRenderer'
// 导入工具函数
import { getCoverStyle } from '@/utils/coverStyle'

const { t } = useI18n()
const appStore = useAppStore()

const props = defineProps<{
  article: Article
  htmlContent: string
}>()

// 内容容器引用
const contentBlockRef = ref<HTMLElement>()

// 使用 composables
const { addCopyButtons } = useCodeCopy(contentBlockRef, (key: string) => {
  const translations: Record<string, string> = {
    'copy': t('code.copy'),
    'copied': t('code.copied'),
    'copyFailed': t('code.copyFailed'),
    'copyCode': t('code.copyCode')
  }
  return translations[key] || key
})
const { initMermaid, rerenderMermaid } = useMermaidRenderer(contentBlockRef)
const { initFlowchart, rerenderFlowchart } = useFlowchartRenderer(contentBlockRef)

/**
 * 初始化所有内容渲染功能
 */
const initializeContent = () => {
  // 初始化其他功能
  addCopyButtons()
  initMermaid()
  initFlowchart()
  // 设置表格边框样式
  updateTableBorders()
}

/**
 * 更新表格边框样式（根据主题）
 */
const updateTableBorders = () => {
  nextTick(() => {
    if (!contentBlockRef.value) return
    
    const tables = contentBlockRef.value.querySelectorAll('table')
    const isDark = appStore.isDark || document.documentElement.classList.contains('dark')
    
    // 获取实际的边框颜色值
    const computedStyle = getComputedStyle(document.documentElement)
    const lightBorderColor = computedStyle.getPropertyValue('--border').trim() || '#e5e7eb'
    const darkBorderColor = '#d1d5db' // 更亮的灰色，在暗色主题下更明显
    const borderColor = isDark ? darkBorderColor : lightBorderColor
    
    tables.forEach((table) => {
      const tableEl = table as HTMLElement
      // 设置表格外边框
      tableEl.style.setProperty('border', `2px solid ${borderColor}`, 'important')
      
      // 设置单元格边框
      const cells = table.querySelectorAll('th, td')
      cells.forEach((cell) => {
        const cellEl = cell as HTMLElement
        cellEl.style.setProperty('border', `1px solid ${borderColor}`, 'important')
      })
    })
  })
}

// 组件挂载时初始化
onMounted(() => {
  initializeContent()
  
  // 监听主题变化（DOM class 变化）
  const observer = new MutationObserver(() => {
    updateTableBorders()
    // 延迟重新渲染 Mermaid 和 Flowchart 图表，确保主题类已应用
    setTimeout(() => {
      rerenderMermaid()
      rerenderFlowchart()
    }, 100)
  })
  
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  })
  
  // 延迟执行一次，确保 DOM 已渲染
  setTimeout(() => {
    updateTableBorders()
  }, 100)
})

// 内容变化时重新初始化
watch(() => props.htmlContent, () => {
  initializeContent()
  // 延迟执行，确保内容已渲染
  setTimeout(() => {
    updateTableBorders()
  }, 100)
})

// 监听主题变化
watch(() => appStore.isDark, () => {
  // 延迟执行，确保主题已切换
  setTimeout(() => {
    updateTableBorders()
    // 重新渲染 Mermaid 和 Flowchart 图表
    rerenderMermaid()
    rerenderFlowchart()
  }, 100)
})
</script>

<template>
  <article class="article-card detail-card">
    <div class="card-cover" :style="getCoverStyle(article.cover)">
      <span v-if="article.badge" class="badge">{{ article.badge }}</span>
    </div>
    <div class="card-body">
      <div class="tag-row">
        <span class="tag">{{ article.tag }}</span>
      </div>
      <h2 class="title">{{ article.title }}</h2>
      <p class="description">{{ article.description }}</p>
      <div class="meta">
        <span>{{ t('article.created') }}: {{ article.date }}</span>
        <template v-if="article.updatedDate">
          <span class="dot">·</span>
          <span>{{ t('article.updated') }}: {{ article.updatedDate }}</span>
        </template>
        <span class="dot">·</span>
        <span>{{ article.platform }}</span>
        <span class="dot">·</span>
        <span>{{ article.tag }}</span>
      </div>
      <div ref="contentBlockRef" class="content-block" v-html="htmlContent"></div>
    </div>
  </article>
</template>

<style scoped>
.detail-card {
  display: grid;
  grid-template-columns: 1fr;
  gap: 18px;
  border: 1px solid var(--border);
  border-radius: 16px;
  overflow: hidden;
  background: var(--surface);
  box-shadow: var(--shadow);
  position: relative;
  /* 确保不超出父容器宽度 */
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.detail-card .card-body {
  padding: 20px;
  /* 确保不超出父容器宽度 */
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  /* 防止内容溢出 */
  overflow-x: hidden;
  overflow-y: visible;
}

.detail-card .card-cover {
  position: relative;
  min-height: 150px;
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  overflow: hidden;
  z-index: 1;
}

.detail-card .badge {
  margin: 12px;
  padding: 4px 10px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--surface), #ffffff 40%);
  color: var(--text-primary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.3px;
  z-index: 2;
  position: relative;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.detail-card .tag-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-card .tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  background: var(--tag-bg);
  color: var(--tag-text);
  font-weight: 600;
}

.detail-card .title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.3;
}

.detail-card .description {
  margin: 0;
  color: var(--text-muted);
  font-size: 14px;
}

.detail-card .meta {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-subtle);
  font-size: 13px;
}

.detail-card .dot {
  color: var(--text-subtle);
}

/* Markdown 内容样式已移至 @/styles/markdown-content.css */
</style>

