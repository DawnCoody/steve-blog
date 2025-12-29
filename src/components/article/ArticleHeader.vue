<script setup lang="ts">
import { computed, ref, watch, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Article } from '@/data/types'
import { calculateWordCount, calculateReadingTime, getArticleViews } from '@/utils/articleStats'

const props = defineProps<{
  article: Article | null
  prevArticle?: Article | null
  nextArticle?: Article | null
}>()

const emit = defineEmits<{
  goBack: []
  edit: []
  goPrev: []
  goNext: []
}>()

const { t } = useI18n()

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
  <section class="hero detail-hero">
    <div class="header-actions">
      <button class="back-btn" type="button" @click="emit('goBack')">← {{ t('article.back') }}</button>
      <button v-if="article" class="edit-btn" type="button" @click="emit('edit')">✎ {{ t('article.edit') }}</button>
      <div class="nav-actions">
        <button 
          class="nav-btn" 
          type="button" 
          :disabled="!prevArticle" 
          @click="emit('goPrev')"
        >
          ← {{ t('article.prevArticle') }}
        </button>
        <button 
          class="nav-btn" 
          type="button" 
          :disabled="!nextArticle" 
          @click="emit('goNext')"
        >
          {{ t('article.nextArticle') }} →
        </button>
      </div>
    </div>
    <div class="title-area" v-if="article">
      <span class="badge" v-if="article.badge">{{ article.badge }}</span>
      <h1>{{ article.title }}</h1>
      
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
    <div v-else class="title-area">
      <h1>{{ t('article.notFound') }}</h1>
      <p class="meta">{{ t('article.notFoundDesc') }}</p>
    </div>
  </section>
</template>

<style scoped>
.detail-hero {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.nav-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.back-btn,
.edit-btn {
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
}

.back-btn:hover,
.edit-btn:hover {
  border-color: color-mix(in srgb, var(--border), transparent 20%);
  background: var(--surface-2);
  color: var(--text-primary);
}

.edit-btn {
  color: var(--brand);
}

.edit-btn:hover {
  border-color: var(--brand);
  background: color-mix(in srgb, var(--brand), transparent 90%);
}

.title-area h1 {
  margin: 4px 0 2px;
  font-size: clamp(32px, 4vw, 44px);
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

.meta {
  margin: 0;
  color: var(--text-subtle);
}

.dot {
  padding: 0 6px;
  opacity: 0.7;
}

.badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--tag-bg);
  color: var(--tag-text);
  font-size: 12px;
  font-weight: 700;
}

.nav-btn {
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  white-space: nowrap;
}

.nav-btn:hover:not(:disabled) {
  border-color: color-mix(in srgb, var(--border), transparent 20%);
  background: var(--surface-2);
  color: var(--text-primary);
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .header-actions {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .nav-actions {
    margin-left: 0;
    width: 100%;
    justify-content: space-between;
  }
  
  .nav-btn {
    flex: 1;
  }
}
</style>

