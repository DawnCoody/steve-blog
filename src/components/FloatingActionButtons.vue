<script setup lang="ts">
/**
 * 悬浮操作按钮组件
 * 提供快速访问常用功能的悬浮按钮组
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/store/modules/app'

const { locale, t } = useI18n()
const route = useRoute()
const appStore = useAppStore()

// 控制按钮组是否展开
const isExpanded = ref(false)

// 是否显示滚动到顶部按钮
const showScrollTop = ref(false)

// 按钮容器引用
const containerRef = ref<HTMLElement | null>(null)

// 当前显示的 tooltip 文本
const tooltipText = ref('')
// tooltip 位置
const tooltipPosition = ref({ x: 0, y: 0 })
// 是否显示 tooltip
const showTooltip = ref(false)

/**
 * 切换按钮组展开/收起状态
 */
const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}

/**
 * 切换主题
 */
const handleThemeToggle = () => {
  appStore.toggleTheme()
}

/**
 * 切换语言
 */
const handleLocaleToggle = () => {
  locale.value = locale.value === 'zh' ? 'en' : 'zh'
  localStorage.setItem('lang', locale.value)
}

/**
 * 滚动到顶部
 */
const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

/**
 * 切换文章视图模式（列表/时间轴）
 */
const handleViewModeToggle = () => {
  appStore.toggleArticleViewMode()
}

/**
 * 切换文章布局（单栏/双栏）
 */
const handleLayoutToggle = () => {
  appStore.toggleArticleLayout()
}

/**
 * 切换阅读模式
 */
const handleReadingModeToggle = () => {
  appStore.toggleReadingMode()
}

// 判断是否在文章列表页
const isArticlesPage = computed(() => route.name === 'articles')

// 判断是否在文章详情页
const isArticleDetailPage = computed(() => route.name === 'articleDetail')

/**
 * 监听滚动事件，控制滚动到顶部按钮的显示
 */
const handleScroll = () => {
  showScrollTop.value = window.scrollY > 300
}

/**
 * 点击外部区域关闭按钮组
 */
const handleClickOutside = (event: MouseEvent) => {
  if (isExpanded.value && containerRef.value && !containerRef.value.contains(event.target as Node)) {
    isExpanded.value = false
  }
}

/**
 * 显示 tooltip
 */
const showTooltipHandler = (event: MouseEvent, text: string) => {
  tooltipText.value = text
  const button = event.currentTarget as HTMLElement
  const rect = button.getBoundingClientRect()
  // tooltip 显示在按钮左侧
  tooltipPosition.value = {
    x: rect.left - 8,
    y: rect.top + rect.height / 2
  }
  showTooltip.value = true
}

/**
 * 隐藏 tooltip
 */
const hideTooltip = () => {
  showTooltip.value = false
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  document.addEventListener('click', handleClickOutside)
  handleScroll() // 初始化时检查一次
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div ref="containerRef" class="fab-container">
    <!-- 功能按钮组（展开时显示） -->
    <transition-group name="fab-button" tag="div" class="fab-buttons">
      <!-- 滚动到顶部按钮 -->
      <button
        v-if="isExpanded && showScrollTop"
        key="scroll-top"
        class="fab-button fab-button-scroll-top"
        type="button"
        :aria-label="t('fab.scrollToTop')"
        @click="scrollToTop"
        @mouseenter="showTooltipHandler($event, t('fab.scrollToTop'))"
        @mouseleave="hideTooltip"
      >
        <span class="fab-icon">↑</span>
      </button>

      <!-- 文章布局切换按钮（仅在文章详情页显示） -->
      <button
        v-if="isExpanded && isArticleDetailPage"
        key="layout"
        class="fab-button fab-button-layout"
        type="button"
        :aria-label="appStore.articleLayout === 'single' ? t('fab.switchToDoubleColumn') : t('fab.switchToSingleColumn')"
        @click="handleLayoutToggle"
        @mouseenter="showTooltipHandler($event, appStore.articleLayout === 'single' ? t('fab.switchToDoubleColumn') : t('fab.switchToSingleColumn'))"
        @mouseleave="hideTooltip"
      >
        <span class="fab-icon">{{ appStore.articleLayout === 'single' ? '⫸' : '⫷' }}</span>
      </button>

      <!-- 阅读模式按钮（仅在文章详情页显示） -->
      <button
        v-if="isExpanded && isArticleDetailPage"
        key="reading-mode"
        class="fab-button fab-button-reading"
        type="button"
        :aria-label="appStore.readingMode ? t('fab.exitReadingMode') : t('fab.enterReadingMode')"
        @click="handleReadingModeToggle"
        @mouseenter="showTooltipHandler($event, appStore.readingMode ? t('fab.exitReadingMode') : t('fab.enterReadingMode'))"
        @mouseleave="hideTooltip"
      >
        <span class="fab-icon">{{ appStore.readingMode ? '📄' : '📖' }}</span>
      </button>

      <!-- 视图模式切换按钮（仅在文章列表页显示） -->
      <button
        v-if="isExpanded && isArticlesPage"
        key="view-mode"
        class="fab-button fab-button-view-mode"
        type="button"
        :aria-label="appStore.articleViewMode === 'list' ? t('fab.switchToTimelineView') : t('fab.switchToListView')"
        @click="handleViewModeToggle"
        @mouseenter="showTooltipHandler($event, appStore.articleViewMode === 'list' ? t('fab.switchToTimelineView') : t('fab.switchToListView'))"
        @mouseleave="hideTooltip"
      >
        <span class="fab-icon">{{ appStore.articleViewMode === 'list' ? '📅' : '📋' }}</span>
      </button>

      <!-- 语言切换按钮 -->
      <button
        v-if="isExpanded"
        key="locale"
        class="fab-button fab-button-locale"
        type="button"
        :aria-label="locale === 'zh' ? t('fab.switchToEnglish') : t('fab.switchToChinese')"
        @click="handleLocaleToggle"
        @mouseenter="showTooltipHandler($event, locale === 'zh' ? t('fab.switchToEnglish') : t('fab.switchToChinese'))"
        @mouseleave="hideTooltip"
      >
        <span class="fab-icon">{{ locale.toUpperCase() }}</span>
      </button>

      <!-- 主题切换按钮 -->
      <button
        v-if="isExpanded"
        key="theme"
        class="fab-button fab-button-theme"
        type="button"
        :aria-label="appStore.isDark ? t('fab.switchToLightMode') : t('fab.switchToDarkMode')"
        @click="handleThemeToggle"
        @mouseenter="showTooltipHandler($event, appStore.isDark ? t('fab.switchToLightMode') : t('fab.switchToDarkMode'))"
        @mouseleave="hideTooltip"
      >
        <span class="fab-icon">{{ appStore.isDark ? '☀' : '☾' }}</span>
      </button>
    </transition-group>

    <!-- 设置按钮（主按钮） -->
    <button
      class="fab-button fab-button-main"
      :class="{ expanded: isExpanded }"
      type="button"
      :aria-label="t('fab.settings')"
      @click="toggleExpanded"
      @mouseenter="showTooltipHandler($event, t('fab.settings'))"
      @mouseleave="hideTooltip"
    >
      <span class="fab-icon" :class="{ rotated: isExpanded }">⚙</span>
    </button>

    <!-- Tooltip -->
    <Teleport to="body">
      <div
        v-if="showTooltip && tooltipText"
        class="fab-tooltip"
        :style="{
          left: `${tooltipPosition.x - 8}px`,
          top: `${tooltipPosition.y}px`,
          transform: 'translateX(-100%) translateY(-50%)'
        }"
      >
        {{ tooltipText }}
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.fab-container {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 10001;
  display: flex;
  flex-direction: column-reverse;
  align-items: center;
  gap: 12px;
}

.fab-buttons {
  display: flex;
  flex-direction: column-reverse;
  gap: 12px;
}

.fab-button {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background: var(--brand);
  color: var(--bg);
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.fab-button:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.fab-button:active {
  transform: scale(0.95);
}

.fab-button-main {
  background: var(--brand);
  color: var(--bg);
  width: 56px;
  height: 56px;
  font-size: 24px;
}

.fab-button-main.expanded {
  background: var(--brand);
  transform: rotate(45deg);
}

.fab-button-theme {
  background: var(--brand);
  color: var(--bg);
}

.fab-button-locale {
  background: var(--brand);
  color: var(--bg);
  font-size: 14px;
  font-weight: 600;
}

.fab-button-scroll-top {
  background: #f97316;
  color: white;
}

.fab-button-view-mode {
  background: #3b82f6;
  color: white;
}

.fab-button-layout {
  background: #10b981;
  color: white;
}

.fab-button-reading {
  background: #8b5cf6;
  color: white;
}

.fab-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease;
}

.fab-icon.rotated {
  transform: rotate(45deg);
}

/* 按钮出现/消失动画 */
.fab-button-enter-active,
.fab-button-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fab-button-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.8);
}

.fab-button-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.8);
}

.fab-button-move {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Tooltip 样式 */
.fab-tooltip {
  position: fixed;
  background: rgba(0, 0, 0, 0.85);
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  white-space: nowrap;
  pointer-events: none;
  z-index: 1001;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  animation: tooltipFadeIn 0.2s ease-out;
}

.fab-tooltip::after {
  content: '';
  position: absolute;
  right: -6px;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-top: 6px solid transparent;
  border-bottom: 6px solid transparent;
  border-left: 6px solid rgba(0, 0, 0, 0.85);
}

@keyframes tooltipFadeIn {
  from {
    opacity: 0;
    transform: translateX(-100%) translateY(-50%) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateX(-100%) translateY(-50%) scale(1);
  }
}

@media (max-width: 768px) {
  .fab-container {
    right: 16px;
    bottom: 16px;
  }

  .fab-button {
    width: 44px;
    height: 44px;
    font-size: 18px;
  }

  .fab-button-main {
    width: 52px;
    height: 52px;
    font-size: 22px;
  }
}
</style>

