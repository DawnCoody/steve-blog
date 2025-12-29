<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Article } from '@/data/types'

const props = defineProps<{
  article: Article | null
  prevArticle?: Article | null
  nextArticle?: Article | null
}>()

const emit = defineEmits<{
  goPrev: []
  goNext: []
}>()

const { t } = useI18n()

const handleReward = () => {
  // 可以在这里添加打赏逻辑，比如打开支付二维码、跳转到打赏页面等
  console.log('打赏功能')
  // 示例：可以打开一个模态框显示支付二维码
  alert('打赏功能开发中...')
}
</script>

<template>
  <div class="article-reward">
    <!-- 打赏按钮 -->
    <button class="reward-btn" @click="handleReward">
      <span class="reward-icon">🎁</span>
      <span>{{ t('article.reward') }}</span>
    </button>
    
    <!-- 上一篇/下一篇导航横幅 -->
    <div class="article-nav-banner">
      <div v-if="prevArticle" class="nav-item prev" @click="emit('goPrev')">
        <div class="nav-label">{{ t('article.prevArticle') }}</div>
        <div class="nav-title">{{ prevArticle.title }}</div>
      </div>
      <div v-if="nextArticle" class="nav-item next" @click="emit('goNext')">
        <div class="nav-label">{{ t('article.nextArticle') }}</div>
        <div class="nav-title">{{ nextArticle.title }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.article-reward {
  margin: 32px 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.reward-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 12px;
  border: none;
  background: #40B0F0;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(64, 176, 240, 0.3);
  align-self: center;
  min-width: 120px;
}

.reward-btn:hover {
  background: #2a9cd8;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 176, 240, 0.4);
}

.reward-btn:active {
  transform: translateY(0);
}

.reward-icon {
  font-size: 20px;
  line-height: 1;
}

.article-nav-banner {
  display: flex;
  gap: 16px;
  min-height: 120px;
  border-radius: 12px;
  overflow: hidden;
  background: linear-gradient(135deg, #1a3a52 0%, #0f1e2e 100%);
  position: relative;
}

.article-nav-banner::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 50%, rgba(64, 176, 240, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 50%, rgba(64, 176, 240, 0.1) 0%, transparent 50%);
  pointer-events: none;
}

.nav-item {
  flex: 1;
  padding: 20px 24px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.nav-item.prev {
  border-right: 1px solid rgba(255, 255, 255, 0.1);
}

.nav-label {
  font-size: 14px;
  opacity: 0.8;
  font-weight: 500;
  margin-bottom: 4px;
}

.nav-title {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 768px) {
  .article-nav-banner {
    flex-direction: column;
    min-height: auto;
  }
  
  .nav-item.prev {
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .nav-item {
    padding: 16px 20px;
  }
  
  .nav-title {
    font-size: 14px;
  }
}
</style>

