<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'

type TocItem = {
  id: string
  text: string
  level: number
}

defineProps<{
  toc: TocItem[]
}>()

const { t } = useI18n()

// TOC 容器引用
const tocRef = ref<HTMLElement | null>(null)
// TOC 包装器引用（用于获取原始位置）
const tocWrapperRef = ref<HTMLElement | null>(null)
// 固定定位的右侧距离
const fixedRight = ref<number>(0)
// 固定定位的 top 值
const fixedTop = ref<number>(80)
// ResizeObserver 实例
let resizeObserver: ResizeObserver | null = null

/**
 * 处理目录项点击，滚动到对应位置并添加偏移量避免被导航栏遮挡
 */
const handleTocClick = (e: Event, itemId: string) => {
  e.preventDefault()
  const targetElement = document.getElementById(itemId)
  if (targetElement) {
    // 计算偏移量（导航栏高度 + 一些额外间距）
    const offset = 100
    const elementPosition = targetElement.getBoundingClientRect().top
    const offsetPosition = elementPosition + window.pageYOffset - offset

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    })
    
    // 更新 URL hash（不触发滚动）
    history.replaceState(null, '', `#${itemId}`)
  }
}

/**
 * 计算并更新 TOC 的固定定位位置
 */
const updateFixedPosition = () => {
  if (!tocRef.value || !tocWrapperRef.value) return

  const wrapperRect = tocWrapperRef.value.getBoundingClientRect()
  const tocElement = tocRef.value
  const viewportHeight = window.innerHeight
  const bottomOffset = 0 // 距离底部的偏移量
  const minTopOffset = 0 // 最小距离顶部的偏移量（导航栏高度）

  // 计算右侧位置：从窗口右边缘到 TOC 右边缘的距离
  fixedRight.value = window.innerWidth - wrapperRect.right

  // 获取文章内容区域的顶部位置（用于对齐）
  // 由于TOC和content-wrapper在同一个grid中，应该对齐到content-wrapper的顶部
  const contentWrapper = document.querySelector('.content-wrapper')
  let targetTop = wrapperRect.top // 默认使用包装器的顶部位置
  
  if (contentWrapper) {
    const contentRect = contentWrapper.getBoundingClientRect()
    // TOC 的顶部对齐到 content-wrapper 的顶部
    targetTop = contentRect.top
  } else {
    // 如果找不到 content-wrapper，尝试查找 detail-card
    const detailCard = document.querySelector('.detail-card')
    if (detailCard) {
      const cardRect = detailCard.getBoundingClientRect()
      targetTop = cardRect.top
    } else {
      // 最后尝试 detail-grid
      const detailGrid = document.querySelector('.detail-grid')
      if (detailGrid) {
        const gridRect = detailGrid.getBoundingClientRect()
        targetTop = gridRect.top
      }
    }
  }

  // TOC 的顶部对齐到文章内容区域的顶部
  // 如果目标位置小于最小偏移量，则使用最小偏移量（确保不被导航栏遮挡）
  const topOffset = targetTop < minTopOffset ? minTopOffset : targetTop

  // 计算 top 值，确保 TOC 不会超出视口底部
  const tocHeight = tocElement.offsetHeight
  const maxTop = viewportHeight - tocHeight - bottomOffset
  
  // 如果 TOC 高度超过视口，调整 top 值使其不超出底部
  if (topOffset + tocHeight > viewportHeight - bottomOffset) {
    fixedTop.value = Math.max(minTopOffset, maxTop)
  } else {
    fixedTop.value = topOffset
  }

  // 应用固定定位
  tocElement.style.position = 'fixed'
  tocElement.style.top = `${fixedTop.value}px`
  tocElement.style.right = `${fixedRight.value}px`
  tocElement.style.width = '240px'
  // 位置计算完成后显示TOC
  tocElement.style.opacity = '1'
}

// 组件挂载时计算位置并添加监听
onMounted(async () => {
  await nextTick()
  
  // 立即设置一个初始位置，避免TOC出现在错误的位置
  if (tocRef.value) {
    tocRef.value.style.top = '80px'
    tocRef.value.style.opacity = '0'
  }
  
  // 等待DOM完全渲染后再计算位置
  // 使用多个时机确保位置计算准确
  const calculatePosition = () => {
    // 检查目标元素是否存在（优先检查 content-wrapper）
    const contentWrapper = document.querySelector('.content-wrapper')
    const detailCard = document.querySelector('.detail-card')
    if (contentWrapper || detailCard) {
      updateFixedPosition()
      return true
    } else {
      // 如果元素还不存在，延迟重试
      setTimeout(calculatePosition, 50)
      return false
    }
  }
  
  // 立即尝试计算
  calculatePosition()
  
  // 使用 requestAnimationFrame 确保在下一帧渲染时更新位置
  requestAnimationFrame(() => {
    updateFixedPosition()
  })
  
  // 使用双重 requestAnimationFrame 确保布局稳定
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      updateFixedPosition()
    })
  })
  
  // 延迟一点时间再次计算，确保所有内容都已渲染
  setTimeout(() => {
    updateFixedPosition()
  }, 50)
  
  setTimeout(() => {
    updateFixedPosition()
  }, 150)
  
  // 再延迟一次，确保图片等资源加载完成
  setTimeout(() => {
    updateFixedPosition()
  }, 300)
  
  // 页面完全加载后再计算一次
  if (document.readyState === 'complete') {
    updateFixedPosition()
  } else {
    window.addEventListener('load', () => {
      updateFixedPosition()
    })
  }
  
  // 使用 ResizeObserver 监听内容区域大小变化
  const contentWrapper = document.querySelector('.content-wrapper')
  if (contentWrapper) {
    resizeObserver = new ResizeObserver(() => {
      updateFixedPosition()
    })
    resizeObserver.observe(contentWrapper)
  }
  
  // 监听滚动和窗口大小变化
  window.addEventListener('scroll', updateFixedPosition, { passive: true })
  window.addEventListener('resize', updateFixedPosition, { passive: true })
})

// 组件卸载时移除监听
onUnmounted(() => {
  window.removeEventListener('scroll', updateFixedPosition)
  window.removeEventListener('resize', updateFixedPosition)
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
})
</script>

<template>
  <div v-if="toc.length" ref="tocWrapperRef" class="toc-wrapper">
    <aside ref="tocRef" class="toc">
      <div class="toc-title">{{ t('toc.title') }}</div>
      <nav>
        <a
          v-for="item in toc"
          :key="item.id"
          class="toc-item"
          :style="{ paddingLeft: `${(item.level - 1) * 12}px` }"
          :href="`#${item.id}`"
          @click="handleTocClick($event, item.id)"
        >
          {{ item.text }}
        </a>
      </nav>
    </aside>
  </div>
</template>

<style scoped>
.toc-wrapper {
  align-self: start; /* 确保从顶部开始对齐 */
  width: 240px; /* 固定宽度，与 grid 布局中的列宽一致 */
}

.toc {
  position: fixed;
  /* top 值由 JavaScript 动态设置，不设置默认值 */
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: calc(100vh - 100px); /* 最大高度为视口高度减去顶部空间 */
  overflow-y: auto; /* 内容超出时显示滚动条 */
  overflow-x: hidden;
  z-index: 10; /* 确保在其他内容之上 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); /* 添加阴影效果 */
  width: 240px; /* 固定宽度 */
  transition: top 0.2s ease-out; /* 平滑过渡效果 */
  /* 初始隐藏，等待位置计算完成后再显示 */
  opacity: 0;
}

/* 滚动条样式 */
.toc::-webkit-scrollbar {
  width: 6px;
}

.toc::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 3px;
}

.toc::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.toc::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

/* Firefox 滚动条样式 */
.toc {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
}

.toc-title {
  font-weight: 700;
  color: var(--text-primary);
}

.toc-item {
  display: block;
  color: var(--text-muted);
  padding: 6px 4px;
  border-radius: 8px;
  transition: background 0.2s ease, color 0.2s ease;
  text-decoration: none;
}

.toc-item:hover {
  background: var(--surface-2);
  color: var(--text-primary);
}

@media (max-width: 1024px) {
  .toc {
    display: none;
  }
}
</style>

