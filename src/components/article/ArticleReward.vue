<script setup lang="ts">
import { ref } from 'vue'
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

// 控制模态框显示
const showRewardModal = ref(false)

// 二维码图片路径
// 在开发环境使用 /content/，在生产环境使用 /steve-blog/content/
const basePath = import.meta.env.BASE_URL || '/'
const weixinQR = `${basePath}content/weixin.jpg`
const zhifubaoQR = `${basePath}content/zhifubao.jpg`

const handleReward = () => {
  showRewardModal.value = true
}

const closeModal = () => {
  showRewardModal.value = false
}

// 点击遮罩层关闭
const handleOverlayClick = (e: MouseEvent) => {
  if (e.target === e.currentTarget) {
    closeModal()
  }
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
    
    <!-- 打赏模态框 -->
    <Teleport to="body">
      <div 
        v-if="showRewardModal" 
        class="reward-modal-overlay"
        @click="handleOverlayClick"
      >
        <div class="reward-modal">
          <button class="modal-close" @click="closeModal">×</button>
          <h3 class="modal-title">{{ t('article.reward') }}</h3>
          <div class="qr-codes">
            <div class="qr-item">
              <div class="qr-label">微信</div>
              <div class="qr-image-wrapper">
                <img :src="weixinQR" alt="微信二维码" class="qr-image" />
              </div>
            </div>
            <div class="qr-item">
              <div class="qr-label">支付宝</div>
              <div class="qr-image-wrapper">
                <img :src="zhifubaoQR" alt="支付宝二维码" class="qr-image" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
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
    line-clamp: 2;
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

/* 打赏模态框样式 */
.reward-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.reward-modal {
  background: var(--surface);
  border-radius: 16px;
  padding: 24px;
  max-width: 600px;
  width: 100%;
  position: relative;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
  max-height: 90vh;
  overflow-y: auto;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  border: none;
  background: var(--surface-2);
  border-radius: 50%;
  font-size: 24px;
  line-height: 1;
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: var(--surface-3);
  transform: rotate(90deg);
}

.modal-title {
  margin: 0 0 24px;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  text-align: center;
}

.qr-codes {
  display: flex;
  gap: 24px;
  justify-content: center;
  flex-wrap: wrap;
}

.qr-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.qr-label {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.qr-image-wrapper {
  width: 200px;
  height: 200px;
  padding: 12px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 4px;
}

@media (max-width: 768px) {
  .reward-modal {
    padding: 20px;
    max-width: 90%;
  }
  
  .qr-codes {
    flex-direction: column;
    gap: 20px;
  }
  
  .qr-image-wrapper {
    width: 180px;
    height: 180px;
  }
  
  .modal-title {
    font-size: 18px;
  }
}
</style>

