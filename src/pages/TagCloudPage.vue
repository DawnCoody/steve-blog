<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { articles, initializeArticles } from '@/data'
import { useCategories } from '@/composables/useCategories'

const { t } = useI18n()
const router = useRouter()

// 文章加载状态
const articlesLoaded = ref(false)

// 确保文章已加载
onMounted(async () => {
  await initializeArticles()
  articlesLoaded.value = true
})

// 获取分类列表（不包含"全部"）
const { categories } = useCategories(false)

// 计算每个分类的文章数量
const categoryStats = computed(() => {
  if (!articlesLoaded.value) return []
  
  return categories.value.map((category) => {
    const count = articles.filter(
      (article) => article.categoryKey === category.key
    ).length
    return {
      ...category,
      count
    }
  }).filter((item) => item.count > 0) // 只显示有文章的分类
})

// 计算最大和最小数量，用于归一化
const maxCount = computed(() => {
  if (categoryStats.value.length === 0) return 1
  return Math.max(...categoryStats.value.map((item) => item.count))
})

const minCount = computed(() => {
  if (categoryStats.value.length === 0) return 1
  return Math.min(...categoryStats.value.map((item) => item.count))
})

// 计算标签大小（基于文章数量）
const getTagSize = (count: number) => {
  if (maxCount.value === minCount.value) return 1
  // 归一化到 0.6 - 2.0 的范围
  const normalized = (count - minCount.value) / (maxCount.value - minCount.value)
  return 0.6 + normalized * 1.4
}

// 计算标签颜色（基于文章数量，渐变色）
const getTagColor = (count: number) => {
  const normalized = maxCount.value === minCount.value 
    ? 0.5 
    : (count - minCount.value) / (maxCount.value - minCount.value)
  
  // 从蓝色到紫色的渐变
  const hue = 240 + normalized * 60 // 240 (blue) to 300 (purple)
  const saturation = 60 + normalized * 20 // 60% to 80%
  const lightness = 50 + normalized * 10 // 50% to 60%
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

// 点击标签跳转到文章列表页
const handleTagClick = (categoryKey: string) => {
  router.push({
    name: 'articles',
    query: { category: categoryKey }
  })
}

// 动画状态
const isVisible = ref(false)

onMounted(() => {
  setTimeout(() => {
    isVisible.value = true
  }, 100)
})
</script>

<template>
  <main class="tag-cloud-page">
    <div class="container" :class="{ visible: isVisible }">
      <header class="page-header">
        <h1 class="page-title">{{ t('tagCloud.title') }}</h1>
        <p class="page-subtitle">{{ t('tagCloud.subtitle') }}</p>
      </header>

      <div v-if="categoryStats.length === 0" class="empty-state">
        <div class="empty-icon">🏷️</div>
        <p class="empty-text">{{ t('tagCloud.empty') }}</p>
      </div>

      <div v-else class="tag-cloud-container">
        <div
          v-for="(item, index) in categoryStats"
          :key="item.key"
          class="tag-item"
          :style="{
            fontSize: `${getTagSize(item.count)}em`,
            color: getTagColor(item.count),
            animationDelay: `${index * 0.1}s`
          }"
          @click="handleTagClick(item.key)"
        >
          <span class="tag-text">{{ item.label }}</span>
          <span class="tag-count">({{ item.count }})</span>
        </div>
      </div>
    </div>

    <!-- 背景装饰 -->
    <div class="background-decoration">
      <div class="gradient-orb orb-1"></div>
      <div class="gradient-orb orb-2"></div>
      <div class="gradient-orb orb-3"></div>
    </div>
  </main>
</template>

<style scoped>
.tag-cloud-page {
  min-height: 100vh;
  position: relative;
  padding: 80px 28px;
  overflow: hidden;
  background: var(--bg);
}

.container {
  position: relative;
  z-index: 2;
  max-width: 1200px;
  margin: 0 auto;
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.8s ease, transform 0.8s ease;
}

.container.visible {
  opacity: 1;
  transform: translateY(0);
}

.page-header {
  text-align: center;
  margin-bottom: 60px;
}

.page-title {
  font-size: clamp(36px, 6vw, 64px);
  font-weight: 800;
  margin: 0 0 16px;
  background: linear-gradient(135deg, var(--brand) 0%, #a855f7 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-subtitle {
  font-size: 18px;
  color: var(--text-muted);
  margin: 0;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  font-size: 16px;
  color: var(--text-muted);
}

.tag-cloud-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 24px 32px;
  padding: 40px 20px;
  min-height: 400px;
}

.tag-item {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 30px;
  background: var(--surface);
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 600;
  user-select: none;
  position: relative;
  overflow: hidden;
  animation: tagFadeIn 0.6s ease-out backwards;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.tag-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  transition: left 0.5s ease;
}

.tag-item:hover {
  transform: translateY(-4px) scale(1.05);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  border-color: currentColor;
}

.tag-item:hover::before {
  left: 100%;
}

.tag-item:active {
  transform: translateY(-2px) scale(1.02);
}

.tag-text {
  position: relative;
  z-index: 1;
}

.tag-count {
  font-size: 0.7em;
  opacity: 0.8;
  font-weight: 500;
  position: relative;
  z-index: 1;
}

@keyframes tagFadeIn {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 背景装饰 */
.background-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  pointer-events: none;
  overflow: hidden;
}

.gradient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.2;
  animation: float 25s ease-in-out infinite;
  will-change: transform;
}

.orb-1 {
  width: 400px;
  height: 400px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.orb-2 {
  width: 350px;
  height: 350px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  top: 60%;
  right: 15%;
  animation-delay: 8s;
}

.orb-3 {
  width: 300px;
  height: 300px;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  bottom: 20%;
  left: 50%;
  animation-delay: 16s;
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) scale(1) rotate(0deg);
  }
  33% {
    transform: translate(40px, -40px) scale(1.1) rotate(120deg);
  }
  66% {
    transform: translate(-30px, 30px) scale(0.9) rotate(240deg);
  }
}

/* 响应式 */
@media (max-width: 768px) {
  .tag-cloud-page {
    padding: 60px 20px;
  }

  .page-header {
    margin-bottom: 40px;
  }

  .tag-cloud-container {
    gap: 16px 20px;
    padding: 30px 10px;
  }

  .tag-item {
    padding: 10px 20px;
    font-size: 0.9em;
  }
}
</style>

