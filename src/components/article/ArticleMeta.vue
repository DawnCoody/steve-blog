<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Article } from '@/data/types'
import { useAppStore } from '@/store/modules/app'
import { calculateWordCount, calculateReadingTime, getArticleViews } from '@/utils/articleStats'
import { useArticleComments } from '@/composables/useArticleComments'

const props = defineProps<{
  article: Article | null
}>()

const { t } = useI18n()
const appStore = useAppStore()
const { getComments, loadComments } = useArticleComments()

// 计算字数
const wordCount = computed(() => {
  if (!props.article) return 0
  return calculateWordCount(props.article.content)
})

// 计算预估阅读时长
const readingTime = computed(() => {
  return calculateReadingTime(wordCount.value)
})

// 实际阅读时间（秒）
const actualReadingTime = ref(0)
let readingStartTime: number | null = null
let readingTimer: number | null = null
let isPageVisible = true

// 格式化阅读时间显示
const formatReadingTime = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}${t('article.seconds')}`
  }
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  if (remainingSeconds === 0) {
    return `${minutes}${t('article.minute')}`
  }
  return `${minutes}${t('article.minute')}${remainingSeconds}${t('article.seconds')}`
}

// 开始计时
const startReadingTimer = () => {
  if (readingTimer) return
  
  readingStartTime = Date.now()
  readingTimer = window.setInterval(() => {
    if (isPageVisible && readingStartTime) {
      const elapsed = Math.floor((Date.now() - readingStartTime) / 1000)
      actualReadingTime.value = elapsed
    }
  }, 1000)
}

// 停止计时
const stopReadingTimer = () => {
  if (readingTimer) {
    clearInterval(readingTimer)
    readingTimer = null
  }
}

// 重置计时
const resetReadingTimer = () => {
  stopReadingTimer()
  actualReadingTime.value = 0
  readingStartTime = null
}

// 处理页面可见性变化
const handleVisibilityChange = () => {
  isPageVisible = !document.hidden
  if (isPageVisible && props.article) {
    // 页面可见时，如果还没有开始计时，则开始计时
    if (!readingTimer && readingStartTime === null) {
      startReadingTimer()
    }
  }
}

// 评论数（使用 ref 以便响应式更新）
const commentCount = ref(0)

// 更新评论数
const updateCommentCount = () => {
  if (props.article?.id) {
    const comments = getComments(props.article.id)
    commentCount.value = comments.length
  } else {
    commentCount.value = 0
  }
}

// 监听文章变化，更新评论数
watch(() => props.article?.id, () => {
  updateCommentCount()
}, { immediate: true })


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

// 监听文章变化，更新阅读量和重置阅读时间
watch(() => props.article?.id, (newId, oldId) => {
  // 如果文章ID变化，重置阅读时间
  if (newId !== oldId) {
    resetReadingTimer()
    if (newId) {
      startReadingTimer()
    }
  }
  updateViews()
  // 使用 requestAnimationFrame 确保在下一帧更新
  requestAnimationFrame(() => {
    updateViews()
  })
}, { immediate: true })

// 监听 storage 事件（用于跨标签页同步）
let handleStorageChange: ((e: StorageEvent) => void) | null = null
let handleCommentStorageChange: ((e: StorageEvent) => void) | null = null

if (typeof window !== 'undefined') {
  handleStorageChange = (e: StorageEvent) => {
    if (e.key && e.key.startsWith('article_views_') && props.article?.id) {
      const articleId = e.key.replace('article_views_', '')
      if (articleId === props.article.id) {
        updateViews()
      }
    }
  }
  
  handleCommentStorageChange = (e: StorageEvent) => {
    if (e.key === 'article-comments' && props.article?.id) {
      updateCommentCount()
    }
  }
  
  window.addEventListener('storage', handleStorageChange)
  window.addEventListener('storage', handleCommentStorageChange)
  
  // 监听页面可见性
  document.addEventListener('visibilitychange', handleVisibilityChange)
}

// 定期更新评论数的定时器
let commentUpdateInterval: number | null = null

// 组件挂载时加载评论并开始计时
onMounted(() => {
  loadComments()
  updateCommentCount()
  if (props.article) {
    startReadingTimer()
  }
  
  // 定期更新评论数（用于响应同标签页内的评论变化）
  commentUpdateInterval = window.setInterval(() => {
    updateCommentCount()
  }, 1000)
})

// 组件卸载时清理所有定时器和事件监听
onUnmounted(() => {
  stopReadingTimer()
  if (commentUpdateInterval) {
    clearInterval(commentUpdateInterval)
    commentUpdateInterval = null
  }
  if (typeof window !== 'undefined') {
    if (handleStorageChange) {
      window.removeEventListener('storage', handleStorageChange)
    }
    if (handleCommentStorageChange) {
      window.removeEventListener('storage', handleCommentStorageChange)
    }
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  }
})
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
    
    <!-- 第二行：字数、预估阅读时长、实际阅读时长 -->
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
        <span class="meta-icon">⏰</span>
        <span>{{ t('article.actualReadingTime') }}: {{ formatReadingTime(actualReadingTime) }}</span>
      </div>
    </div>
    
    <!-- 第三行：阅读量、评论数 -->
    <div class="meta-row">
      <div class="meta-item">
        <span class="meta-icon">👁️</span>
        <span>{{ t('article.views') }}: {{ views }}</span>
      </div>
      <span class="meta-separator">|</span>
      <div class="meta-item">
        <span class="meta-icon">💬</span>
        <span>{{ t('article.comments') }}: {{ commentCount }}</span>
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

