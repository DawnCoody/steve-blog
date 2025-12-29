<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useI18n } from 'vue-i18n'

type TocItem = {
  id: string
  text: string
  level: number
}

const props = defineProps<{
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
// 记录文章区域的初始顶部位置（页面滚动位置 + 元素相对于视口的位置）
let initialArticleTop = 0
// 当前激活的标题 ID
const activeId = ref<string>('')
// IntersectionObserver 实例（用于监听标题进入视口）
let intersectionObserver: IntersectionObserver | null = null

/**
 * 处理目录项点击，滚动到对应位置并添加偏移量避免被导航栏遮挡
 */
const handleTocClick = (e: Event, itemId: string) => {
  e.preventDefault()
  const targetElement = document.getElementById(itemId)
  if (targetElement) {
    // 计算偏移量（导航栏高度 + 一些额外间距）
    const offset = 10
    const elementPosition = targetElement.getBoundingClientRect().top
    const offsetPosition = elementPosition + window.pageYOffset - offset

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    })
    
    // 更新 URL hash（不触发滚动），保留现有的 history state
    history.replaceState(history.state, '', `#${itemId}`)
  }
}

/**
 * 计算并更新 TOC 的固定定位位置
 */
const updateFixedPosition = () => {
  if (!tocRef.value || !tocWrapperRef.value) return

  const wrapperRect = tocWrapperRef.value.getBoundingClientRect()
  const tocElement = tocRef.value
  const minTopOffset = 0 // 最小距离顶部的偏移量（导航栏高度）

  // 计算右侧位置：从窗口右边缘到 TOC 右边缘的距离
  const extraLeftSpacing = 12 // 额外的左侧间距（px）
  fixedRight.value = window.innerWidth - wrapperRect.right - extraLeftSpacing

  // 获取文章内容区域的顶部位置（用于对齐）
  const articleArea = document.querySelector('.article-area')
  if (!articleArea) return

  const articleRect = articleArea.getBoundingClientRect()
  
  // 记录文章区域的初始绝对位置（相对于文档顶部）
  // 仅在第一次或页面大小变化导致位置变化时更新
  const currentArticleTop = window.scrollY + articleRect.top
  if (initialArticleTop === 0) {
    initialArticleTop = currentArticleTop
  } else if (Math.abs(initialArticleTop - currentArticleTop) > 50) {
    // 如果位置变化超过50px，可能是页面大小变化，重新记录
    initialArticleTop = currentArticleTop
  }

  // 计算TOC的目标位置
  // 当页面滚动超过文章区域初始位置时，TOC固定在顶部
  // 否则，TOC对齐到文章区域的当前顶部位置（相对于视口）
  if (window.scrollY >= initialArticleTop) {
    fixedTop.value = minTopOffset
  } else {
    fixedTop.value = articleRect.top
  }

  // 应用固定定位
  tocElement.style.position = 'fixed'
  tocElement.style.top = `${fixedTop.value}px`
  tocElement.style.right = `${fixedRight.value}px`
  tocElement.style.width = '240px'
  tocElement.style.opacity = '1'
}

/**
 * 更新当前激活的标题（根据滚动位置）
 */
const updateActiveHeading = () => {
  if (!props.toc.length) return

  // 获取所有标题元素
  const headings = props.toc
    .map(item => {
      const element = document.getElementById(item.id)
      return element ? { id: item.id, element, top: element.getBoundingClientRect().top } : null
    })
    .filter(Boolean) as Array<{ id: string; element: HTMLElement; top: number }>

  if (headings.length === 0) return

  // 计算偏移量（导航栏高度 + 一些间距）
  const offset = 120

  // 找到当前视口中距离顶部最近的标题
  // 优先选择已经滚动过顶部的标题（top < offset）
  let activeHeading = headings.find(h => h.top <= offset && h.top > 0)
  
  // 如果没有找到已滚动过顶部的标题，选择第一个可见的标题
  if (!activeHeading) {
    activeHeading = headings.find(h => h.top > offset)
  }

  // 如果还是没有找到，选择最后一个标题（说明已经滚动到底部）
  if (!activeHeading && headings.length > 0) {
    activeHeading = headings[headings.length - 1]
  }

  if (activeHeading) {
    activeId.value = activeHeading.id
  }
}

/**
 * 初始化标题滚动监听
 */
const initHeadingObserver = () => {
  if (!props.toc.length) return

  // 先断开之前的观察器
  if (intersectionObserver) {
    intersectionObserver.disconnect()
  }

  // 使用 IntersectionObserver 监听标题进入视口
  intersectionObserver = new IntersectionObserver(
    (entries) => {
      // 找到所有进入视口的标题
      const visibleHeadings = entries
        .filter(entry => entry.isIntersecting)
        .map(entry => ({
          id: entry.target.id,
          top: entry.boundingClientRect.top
        }))
        .sort((a, b) => a.top - b.top)

      if (visibleHeadings.length > 0) {
        // 选择最接近顶部的标题
        const offset = 120
        const activeHeading = visibleHeadings.find(h => h.top <= offset) || visibleHeadings[0]
        if (activeHeading) {
          activeId.value = activeHeading.id
        }
      }
    },
    {
      root: null,
      rootMargin: '-120px 0px -80% 0px', // 当标题进入顶部120px区域时触发
      threshold: [0, 0.1, 0.5, 1]
    }
  )

  // 观察所有标题元素
  props.toc.forEach(item => {
    const element = document.getElementById(item.id)
    if (element) {
      intersectionObserver?.observe(element)
    }
  })
}

/**
 * 滚动事件处理函数
 */
const handleScroll = () => {
  updateFixedPosition()
  updateActiveHeading()
}

/**
 * 滚动 TOC 使激活的项可见
 */
const scrollToActiveItem = () => {
  if (!tocRef.value || !activeId.value) return

  // 找到激活的 TOC 项元素
  const activeItem = tocRef.value.querySelector(`a[href="#${activeId.value}"]`) as HTMLElement
  if (!activeItem) return

  const tocContainer = tocRef.value

  // 计算容器和项的滚动位置
  const containerTop = tocContainer.scrollTop
  const containerHeight = tocContainer.clientHeight
  const itemOffsetTop = activeItem.offsetTop
  const itemHeight = activeItem.offsetHeight

  // 检查项是否在可视区域内
  const isAboveViewport = itemOffsetTop < containerTop
  const isBelowViewport = itemOffsetTop + itemHeight > containerTop + containerHeight

  // 如果项不在可视区域内，滚动到使其可见
  if (isAboveViewport) {
    // 项在视口上方，滚动到项的位置
    tocContainer.scrollTo({
      top: itemOffsetTop - 8, // 添加一些顶部间距
      behavior: 'smooth'
    })
  } else if (isBelowViewport) {
    // 项在视口下方，滚动使项可见
    tocContainer.scrollTo({
      top: itemOffsetTop - containerHeight + itemHeight + 8, // 添加一些底部间距
      behavior: 'smooth'
    })
  }
}

// 组件挂载时计算位置并添加监听
onMounted(async () => {
  await nextTick()
  
  // 初始化TOC位置
  if (tocRef.value) {
    tocRef.value.style.opacity = '0'
  }
  
  // 等待DOM渲染完成后计算位置
  const initPosition = () => {
    const articleArea = document.querySelector('.article-area')
    if (articleArea) {
      updateFixedPosition()
      // 初始化标题滚动监听
      initHeadingObserver()
      // 初始化激活的标题
      updateActiveHeading()
    } else {
      setTimeout(initPosition, 50)
    }
  }
  
  initPosition()
  
  // 使用 requestAnimationFrame 确保布局稳定后再计算
  requestAnimationFrame(() => {
    updateFixedPosition()
    initHeadingObserver()
    updateActiveHeading()
  })
  
  // 使用 ResizeObserver 监听文章区域大小变化
  const articleArea = document.querySelector('.article-area')
  if (articleArea) {
    resizeObserver = new ResizeObserver(() => {
      updateFixedPosition()
    })
    resizeObserver.observe(articleArea)
  }
  
  // 监听滚动和窗口大小变化
  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('resize', updateFixedPosition, { passive: true })
})

// 监听 activeId 变化，自动滚动 TOC 使激活项可见
watch(activeId, () => {
  nextTick(() => {
    scrollToActiveItem()
  })
})

// 组件卸载时移除监听
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', updateFixedPosition)
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  if (intersectionObserver) {
    intersectionObserver.disconnect()
    intersectionObserver = null
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
          :class="{ active: activeId === item.id }"
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
  position: relative;
}

.toc-item:hover {
  background: var(--surface-2);
  color: var(--text-primary);
}

.toc-item.active {
  color: var(--brand);
  font-weight: 600;
  background: var(--surface-2);
}

.toc-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 60%;
  background: var(--brand);
  border-radius: 0 2px 2px 0;
}

@media (max-width: 1024px) {
  .toc {
    display: none;
  }
}
</style>

