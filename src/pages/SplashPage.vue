<script setup lang="ts">
/**
 * 开机动画页面
 * 显示文艺文案，动态打字机效果，点击后进入主页
 */

import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const { t } = useI18n()

// 是否显示开机动画
const showSplash = ref(true)
// 当前显示的文本
const displayedText = ref('')
// 当前文本索引
const currentIndex = ref(0)
// 是否完成打字
const typingComplete = ref(false)

// 文艺文案（从国际化文件获取）
const splashTexts = computed(() => {
  try {
    const texts = t('splash.texts' as any)
    return Array.isArray(texts) ? texts as string[] : []
  } catch {
    return []
  }
})

// 打字机效果
const typeWriter = () => {
  if (currentIndex.value >= splashTexts.value.length) {
    typingComplete.value = true
    return
  }

  const currentText = splashTexts.value[currentIndex.value]
  if (!currentText) {
    typingComplete.value = true
    return
  }
  
  let charIndex = 0

  const typeChar = () => {
    if (charIndex < currentText.length) {
      displayedText.value = currentText.substring(0, charIndex + 1)
      charIndex++
      setTimeout(typeChar, 80) // 打字速度
    } else {
      // 当前文本完成，等待一段时间后清空并显示下一句
      setTimeout(() => {
        displayedText.value = ''
        currentIndex.value++
        setTimeout(() => {
          typeWriter()
        }, 300) // 句子之间的间隔
      }, 1500) // 每句话显示的时间
    }
  }

  typeChar()
}

// 处理点击事件
const handleClick = () => {
  showSplash.value = false
  
  // 延迟跳转，等待淡出动画完成
  setTimeout(() => {
    router.push('/home')
  }, 500)
}

onMounted(() => {
  // 延迟开始打字效果
  setTimeout(() => {
    typeWriter()
  }, 500)
})
</script>

<template>
  <Transition name="splash">
    <div
      v-if="showSplash"
      class="splash-page"
      @click="handleClick"
    >
      <div class="splash-content">
        <!-- Logo -->
        <div class="splash-logo">
          <div class="logo-circle">
            <span class="logo-text">B</span>
          </div>
        </div>

        <!-- 动态文本显示区域 -->
        <div class="text-container">
          <p class="splash-text" :class="{ 'cursor-blink': !typingComplete }">
            {{ displayedText }}
            <span v-if="!typingComplete" class="cursor">|</span>
          </p>
        </div>

        <!-- 点击提示 -->
        <div class="splash-hint visible">
          {{ t('splash.clickHint') }}
        </div>
      </div>
      
      <!-- 背景动画 -->
      <div class="splash-background">
        <div class="bg-circle bg-circle-1"></div>
        <div class="bg-circle bg-circle-2"></div>
        <div class="bg-circle bg-circle-3"></div>
        <div class="bg-circle bg-circle-4"></div>
      </div>

      <!-- 粒子效果 -->
      <div class="particles">
        <div
          v-for="i in 20"
          :key="i"
          class="particle"
          :style="{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${3 + Math.random() * 4}s`
          }"
        ></div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.splash-page {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--brand) 0%, color-mix(in srgb, var(--brand) 80%, transparent) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  cursor: pointer;
  overflow: hidden;
}

.splash-content {
  position: relative;
  z-index: 2;
  text-align: center;
  max-width: 800px;
  padding: 0 24px;
  animation: fadeInUp 0.8s ease-out;
}

.splash-logo {
  margin-bottom: 48px;
  animation: logoScale 1s ease-out;
}

.logo-circle {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  animation: logoRotate 3s ease-in-out infinite;
}

.logo-text {
  font-size: 64px;
  font-weight: 700;
  color: var(--brand);
  line-height: 1;
}

.text-container {
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 48px;
}

.splash-text {
  font-size: 28px;
  font-weight: 400;
  color: white;
  line-height: 1.8;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  margin: 0;
  letter-spacing: 1px;
}

.cursor {
  display: inline-block;
  margin-left: 4px;
  color: white;
  font-weight: 300;
  animation: blink 1s infinite;
}

.cursor-blink .cursor {
  animation: blink 1s infinite;
}

.splash-hint {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  opacity: 0;
  transition: opacity 0.5s ease-out;
  margin-top: 32px;
}

.splash-hint.visible {
  opacity: 1;
  animation: pulse 2s ease-in-out infinite;
}

/* 背景动画圆圈 */
.splash-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 1;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 8s ease-in-out infinite;
}

.bg-circle-1 {
  width: 400px;
  height: 400px;
  top: -200px;
  left: -200px;
  animation-delay: 0s;
}

.bg-circle-2 {
  width: 300px;
  height: 300px;
  bottom: -150px;
  right: -150px;
  animation-delay: 2s;
}

.bg-circle-3 {
  width: 200px;
  height: 200px;
  top: 20%;
  left: 10%;
  animation-delay: 4s;
}

.bg-circle-4 {
  width: 250px;
  height: 250px;
  bottom: 30%;
  right: 15%;
  animation-delay: 6s;
}

/* 粒子效果 */
.particles {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
}

.particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  animation: particleFloat linear infinite;
}

/* 动画定义 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes logoScale {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes logoRotate {
  0%, 100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-5deg);
  }
  75% {
    transform: rotate(5deg);
  }
}

@keyframes blink {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.7;
  }
  50% {
    opacity: 1;
  }
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) scale(1);
    opacity: 0.3;
  }
  33% {
    transform: translate(30px, -30px) scale(1.1);
    opacity: 0.5;
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
    opacity: 0.4;
  }
}

@keyframes particleFloat {
  0% {
    transform: translateY(100vh) translateX(0);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(-100px) translateX(50px);
    opacity: 0;
  }
}

/* 淡入淡出过渡 */
.splash-enter-active {
  transition: opacity 0.5s ease-out;
}

.splash-leave-active {
  transition: opacity 0.5s ease-out;
}

.splash-enter-from,
.splash-leave-to {
  opacity: 0;
}

/* 暗色主题适配 */
.dark .splash-page {
  background: linear-gradient(135deg, var(--brand) 0%, color-mix(in srgb, var(--brand) 60%, #000000) 100%);
}

.dark .logo-circle {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.dark .logo-text {
  color: white;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .logo-circle {
    width: 100px;
    height: 100px;
  }

  .logo-text {
    font-size: 52px;
  }

  .splash-text {
    font-size: 20px;
    line-height: 1.6;
  }

  .text-container {
    min-height: 100px;
    margin-bottom: 32px;
  }

  .bg-circle-1 {
    width: 250px;
    height: 250px;
    top: -125px;
    left: -125px;
  }

  .bg-circle-2 {
    width: 200px;
    height: 200px;
    bottom: -100px;
    right: -100px;
  }

  .bg-circle-3,
  .bg-circle-4 {
    width: 150px;
    height: 150px;
  }
}
</style>

