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

// 计算每个分类的文章数量，并生成随机位置和移动参数
const categoryStats = computed(() => {
  if (!articlesLoaded.value) return []
  
  return categories.value.map((category, index) => {
    const count = articles.filter(
      (article) => article.categoryKey === category.key
    ).length
    
    // 使用多个质数组合生成更随机的初始位置
    const seed1 = index * 73 + category.key.charCodeAt(0)
    const seed2 = index * 97 + (category.key.length * 17)
    const seed3 = index * 137 + (count * 23)
    
    // 生成随机初始位置（10% - 90%）
    const startX = 10 + (seed1 * 83 + seed2 * 47) % 80
    const startY = 10 + (seed2 * 61 + seed3 * 53) % 80
    
    // 计算移动范围（百分比），确保不超出屏幕
    const moveRangeX = Math.min(20, (90 - startX) * 0.4, (startX - 10) * 0.4)
    const moveRangeY = Math.min(20, (90 - startY) * 0.4, (startY - 10) * 0.4)
    
    // 生成随机移动参数
    const moveX = ((seed1 * 31 + seed3 * 19) % (moveRangeX * 2)) - moveRangeX
    const moveY = ((seed2 * 41 + seed1 * 29) % (moveRangeY * 2)) - moveRangeY
    
    return {
      ...category,
      count,
      // 随机初始位置（百分比）
      startX: Math.max(10, Math.min(90, startX)),
      startY: Math.max(10, Math.min(90, startY)),
      // 随机移动参数（百分比，限制在安全范围内）
      moveX,
      moveY,
      // 动画持续时间（8-12秒，更快的移动）
      duration: 8 + (seed1 * 7) % 4,
      // 动画延迟
      delay: (seed2 * 0.1) % 1
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

// 计算圆球大小（基于文章数量，返回像素值）
const getBallSize = (count: number) => {
  if (maxCount.value === minCount.value) return 80
  // 归一化到 60px - 150px 的范围
  const normalized = (count - minCount.value) / (maxCount.value - minCount.value)
  return 60 + normalized * 90
}

// 计算字体大小（基于圆球大小）
const getFontSize = (ballSize: number) => {
  return Math.max(12, Math.min(24, ballSize * 0.2))
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
      <div v-if="categoryStats.length === 0" class="empty-state">
        <div class="empty-icon">🏷️</div>
        <p class="empty-text">{{ t('tagCloud.empty') }}</p>
      </div>

      <div v-else class="tag-cloud-container">
        <div
          v-for="item in categoryStats"
          :key="item.key"
          class="tag-ball"
          :style="{
            width: `${getBallSize(item.count)}px`,
            height: `${getBallSize(item.count)}px`,
            fontSize: `${getFontSize(getBallSize(item.count))}px`,
            color: getTagColor(item.count),
            left: `${item.startX}%`,
            top: `${item.startY}%`,
            '--move-x': `${item.moveX}%`,
            '--move-y': `${item.moveY}%`,
            '--duration': `${item.duration}s`,
            '--delay': `${item.delay}s`
          }"
          @click="handleTagClick(item.key)"
        >
          <div class="ball-content">
            <span class="ball-text">{{ item.label }}</span>
            <span class="ball-count">{{ item.count }}</span>
          </div>
          <div class="ball-glow"></div>
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
  padding: 0px 0px;
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
  position: relative;
  width: 100%;
  height: calc(100vh - 160px);
  min-height: 500px;
  overflow: hidden;
}

.tag-ball {
  position: absolute;
  border-radius: 50%;
  background: var(--surface);
  border: 3px solid currentColor;
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translate(-50%, -50%);
  animation: ballFadeIn 0.8s ease-out backwards, ballFloat var(--duration, 20s) ease-in-out infinite;
  animation-delay: var(--delay, 0s);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15), 0 0 30px currentColor;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 2;
}

.tag-ball::before {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  background: linear-gradient(135deg, currentColor, transparent, currentColor);
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: -1;
}

.tag-ball:hover {
  transform: translate(-50%, -50%) scale(1.15);
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.25), 0 0 50px currentColor;
  z-index: 10;
}

.tag-ball:hover::before {
  opacity: 0.3;
}

.tag-ball:active {
  transform: translate(-50%, -50%) scale(1.1);
}

.ball-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 8px;
  width: 100%;
  height: 100%;
}

.ball-text {
  font-weight: 700;
  line-height: 1.2;
  word-break: break-word;
  hyphens: auto;
  max-width: 90%;
}

.ball-count {
  font-size: 0.6em;
  opacity: 0.9;
  font-weight: 600;
  margin-top: 2px;
}

.ball-glow {
  position: absolute;
  inset: -10px;
  border-radius: 50%;
  background: radial-gradient(circle, currentColor 0%, transparent 70%);
  opacity: 0.2;
  filter: blur(10px);
  z-index: 0;
  animation: glowPulse 3s ease-in-out infinite;
}

@keyframes ballFadeIn {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes ballFloat {
  0% {
    transform: translate(-50%, -50%) translate(0, 0);
  }
  20% {
    transform: translate(-50%, -50%) translate(calc(var(--move-x, 0%) * 0.6), calc(var(--move-y, 0%) * 0.8));
  }
  40% {
    transform: translate(-50%, -50%) translate(var(--move-x, 0%), calc(var(--move-y, 0%) * 0.5));
  }
  60% {
    transform: translate(-50%, -50%) translate(calc(var(--move-x, 0%) * 0.8), calc(var(--move-y, 0%) * -0.3));
  }
  80% {
    transform: translate(-50%, -50%) translate(calc(var(--move-x, 0%) * 0.3), calc(var(--move-y, 0%) * -0.6));
  }
  100% {
    transform: translate(-50%, -50%) translate(0, 0);
  }
}

@keyframes glowPulse {
  0%, 100% {
    opacity: 0.2;
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    transform: scale(1.1);
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

  .tag-cloud-container {
    height: calc(100vh - 120px);
    min-height: 400px;
  }

  .tag-ball {
    border-width: 2px;
  }
}
</style>

