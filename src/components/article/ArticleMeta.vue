<script setup lang="ts">
import { computed, ref, watch, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Article } from '@/data/types'
import { useAppStore } from '@/store/modules/app'
import { calculateWordCount, calculateReadingTime, getArticleViews } from '@/utils/articleStats'

const props = defineProps<{
  article: Article | null
}>()

const { t } = useI18n()
const appStore = useAppStore()

// 计算字数
const wordCount = computed(() => {
  if (!props.article) return 0
  return calculateWordCount(props.article.content)
})

// 计算阅读时长
const readingTime = computed(() => {
  return calculateReadingTime(wordCount.value)
})

// 阅读量（使用 ref 以便响应式更新）
const views = ref(0)

// 更新阅读量
const updateViews = () => {
  if (props.article?.id) {
    views.value = getArticleViews(props.article.id)
  } else {
    views.value = 0
  }
}

// 监听文章变化，更新阅读量
watch(() => props.article?.id, () => {
  updateViews()
  // 使用 requestAnimationFrame 确保在下一帧更新
  requestAnimationFrame(() => {
    updateViews()
  })
}, { immediate: true })

// 监听 storage 事件（用于跨标签页同步）
if (typeof window !== 'undefined') {
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key && e.key.startsWith('article_views_') && props.article?.id) {
      const articleId = e.key.replace('article_views_', '')
      if (articleId === props.article.id) {
        updateViews()
      }
    }
  }
  window.addEventListener('storage', handleStorageChange)
  onUnmounted(() => {
    window.removeEventListener('storage', handleStorageChange)
  })
}
</script>

<template>
  <div v-if="article" class="article-meta" :class="{ 'reading-mode': appStore.readingMode }">
    <!-- 第一行：发布日期、更新日期、分类 -->
    <div class="meta-row">
      <div class="meta-item">
        <span class="meta-icon">📅</span>
        <span>{{ t('article.published') }} {{ article.date }}</span>
      </div>
      <span class="meta-separator">|</span>
      <div class="meta-item" v-if="article.updatedDate">
        <span class="meta-icon">🔄</span>
        <span>{{ t('article.updated') }} {{ article.updatedDate }}</span>
      </div>
      <span class="meta-separator" v-if="article.updatedDate">|</span>
      <div class="meta-item">
        <span class="meta-icon">💻</span>
        <span>{{ article.tag }}</span>
      </div>
    </div>
    
    <!-- 第二行：字数、阅读时长、阅读量 -->
    <div class="meta-row">
      <div class="meta-item">
        <span class="meta-icon">📄</span>
        <span>{{ t('article.wordCount') }}: {{ wordCount }}</span>
      </div>
      <span class="meta-separator">|</span>
      <div class="meta-item">
        <span class="meta-icon">⏱️</span>
        <span>{{ t('article.readingTime') }}: {{ readingTime }}{{ t('article.minute') }}</span>
      </div>
      <span class="meta-separator">|</span>
      <div class="meta-item">
        <span class="meta-icon">👁️</span>
        <span>{{ t('article.views') }}: {{ views }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.article-meta {
  margin: 8px 0;
}

.meta-row {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  margin: 8px 0;
  flex-wrap: wrap;
  color: var(--text-subtle);
  font-size: 14px;
}

/* 阅读模式下居中显示 */
.article-meta.reading-mode .meta-row {
  justify-content: center;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.meta-icon {
  font-size: 16px;
  line-height: 1;
}

.meta-separator {
  color: var(--text-subtle);
  opacity: 0.5;
  font-size: 12px;
}
</style>

