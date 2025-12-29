<script setup lang="ts">
/**
 * 文章列表页
 * 功能：文章列表展示、分类筛选、搜索、排序、新建文章
 */

import { computed, ref, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { articles } from '@/data'
import { useArticleSearch } from '@/composables/useArticleSearch'
import { useCategories } from '@/composables/useCategories'
import { useAppStore } from '@/store/modules/app'
import Pagination from '@/components/Pagination.vue'
import TimelineView from '@/components/TimelineView.vue'
import ArticleListView from '@/components/ArticleListView.vue'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const appStore = useAppStore()

// 分类列表（从国际化配置动态获取，包含"全部"选项）
const { categories } = useCategories(true)

// 当前选中的分类（默认为"全部"）
const selectedCategory = ref('all')

// 从路由参数中读取分类
onMounted(() => {
  const categoryParam = route.query.category as string
  if (categoryParam && categories.value.some(cat => cat.key === categoryParam)) {
    selectedCategory.value = categoryParam
  }
})

// 监听路由变化，更新分类
watch(() => route.query.category, (newCategory) => {
  if (newCategory && categories.value.some(cat => cat.key === newCategory)) {
    selectedCategory.value = newCategory as string
  }
})

/**
 * 计算每个分类下的文章数量
 */
const categoryCounts = computed(() => {
  const counts: Record<string, number> = {}
  
  // 计算"全部"分类的数量
  counts.all = articles.length
  
  // 计算每个分类的数量
  categories.value.forEach((category) => {
    if (category.key !== 'all') {
      counts[category.key] = articles.filter(
        (article) => article.categoryKey === category.key
      ).length
    }
  })
  
  return counts
})
// 排序方向（true: 降序，false: 升序）
const sortDesc = ref(true)

// 搜索功能
const { searchQuery, searchResults, highlightedResults } = useArticleSearch(articles)

// 分页功能
const itemsPerPage = ref(5) // 每页显示的文章数量，默认5个
const currentPage = ref(1) // 当前页码

// 视图模式：从 store 中读取
const viewMode = computed({
  get: () => appStore.articleViewMode,
  set: (value) => {
    if (value === 'list' || value === 'timeline') {
      appStore.articleViewMode = value
      try {
        localStorage.setItem('articleViewMode', value)
      } catch (error) {
        console.warn('Failed to save view mode to localStorage:', error)
      }
    }
  }
})


/**
 * 跳转到新建文章页
 */
const goNewArticle = () => {
  router.push({ name: 'articleNew' })
}

/**
 * 过滤后的文章列表（结合搜索和分类筛选）
 * 先应用搜索，再应用分类筛选，最后排序
 */
const filteredArticles = computed(() => {
  // 先应用搜索
  let matched = searchResults.value

  // 再应用分类筛选
  if (selectedCategory.value !== 'all') {
    matched = matched.filter((item) => item.categoryKey === selectedCategory.value)
  }

  // 排序
  // 与时间轴视图保持一致：参照时间轴的年份排序逻辑
  // 时间轴年份排序：sortDesc ? (b - a) : (a - b)
  //   降序（sortDesc = true）：b - a，最新年份在前（2025 → 2024 → 2023）
  //   升序（sortDesc = false）：a - b，最早年份在前（2023 → 2024 → 2025）
  // 列表视图文章排序：sortDesc ? (dateB - dateA) : (dateA - dateB)
  //   降序（sortDesc = true）：dateB - dateA，最新的在前（2025-12-27 → 2025-12-25 → 2025-12-22）
  //   升序（sortDesc = false）：dateA - dateB，最早的在前（2025-12-22 → 2025-12-25 → 2025-12-27）
  // 注意：升序时，时间小的（早的）应该在前，这是标准的升序逻辑
  return matched.slice().sort((a, b) => {
    const dateA = new Date(a.date).getTime()
    const dateB = new Date(b.date).getTime()
    // 降序（sortDesc = true）：dateB - dateA，最新的在前
    // 升序（sortDesc = false）：dateA - dateB，最早的在前
    return sortDesc.value ? dateB - dateA : dateA - dateB
  })
})

/**
 * 显示用的文章列表（带高亮）
 * 如果有关键词搜索，则使用高亮结果；否则使用普通结果
 */
const displayArticles = computed(() => {
  const query = searchQuery.value.trim()
  let articles = filteredArticles.value
  
  if (query) {
    articles = articles.map((article) => {
      const highlighted = highlightedResults.value.find((item) => item.id === article.id)
      return highlighted
        ? {
            ...article,
            highlightedTitle: highlighted.highlightedTitle,
            highlightedDescription: highlighted.highlightedDescription
          }
        : article
    })
  }
  
  return articles
})

/**
 * 分页后的文章列表
 */
const paginatedArticles = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return displayArticles.value.slice(start, end)
})

/**
 * 总页数
 */
const totalPages = computed(() => {
  return Math.ceil(displayArticles.value.length / itemsPerPage.value)
})


// 当筛选条件改变时，重置到第一页
const resetPage = () => {
  currentPage.value = 1
}

// 监听搜索条件变化，重置到第一页
watch([searchQuery, selectedCategory, sortDesc], () => {
  resetPage()
})

/**
 * 切换排序方向（升序/降序）
 */
const toggleSort = () => {
  sortDesc.value = !sortDesc.value
  resetPage()
}

/**
 * 切换视图模式
 */
const toggleViewMode = () => {
  appStore.toggleArticleViewMode()
  resetPage()
}

// 监听视图模式变化，重置到第一页
watch(() => appStore.articleViewMode, () => {
  resetPage()
})

</script>

<template>
  <main class="layout">
    <section class="content">
      <aside class="sidebar">
        <div class="filter-title">
          <span class="filter-icon">⌘</span>
          <span>{{ t('filter.category') }}</span>
        </div>

        <!-- 左侧分类列表按钮 -->
        <div class="category-list">
          <button
            v-for="category in categories"
            :key="category.key"
            class="category-item"
            :class="{ active: selectedCategory === category.key }"
            type="button"
            @click="selectedCategory = category.key; resetPage()"
          >
            <span class="category-label">{{ category.label }}</span>
            <span class="category-count">({{ categoryCounts[category.key] || 0 }})</span>
          </button>
        </div>
      </aside>

      <section class="article-area">
        <!-- 文章搜索框 -->
        <div class="search-section">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input
              v-model="searchQuery"
              type="text"
              class="search-input"
              :placeholder="t('search.placeholder')"
            />
            <button
              v-if="searchQuery"
              class="clear-btn"
              type="button"
              @click="searchQuery = ''"
            >
              ×
            </button>
          </div>
        </div>

        <div class="list-header">
          <div class="article-count">
            {{ t('articles.count', { count: filteredArticles.length }) }}
            <span v-if="searchQuery" class="search-hint">
              {{ t('search.results', { query: searchQuery }) }}
            </span>
          </div>
          <div class="header-actions">
            <button class="view-toggle-btn" type="button" @click="toggleViewMode" :title="viewMode === 'list' ? t('actions.timelineView') : t('actions.listView')">
              <span v-if="viewMode === 'list'">📅</span>
              <span v-else>📋</span>
            </button>
            <button class="new-article-btn" type="button" @click="goNewArticle">
              + {{ t('article.new') }}
            </button>
            <button class="sort-btn" type="button" @click="toggleSort">
              {{ t('actions.sortByTime') }}
              <span class="arrow" :class="{ rotated: !sortDesc }">⌄</span>
            </button>
          </div>
        </div>
        
        <!-- 文章列表视图 -->
        <ArticleListView
          v-if="viewMode === 'list'"
          :articles="paginatedArticles"
          :empty="filteredArticles.length === 0"
        />

        <!-- 时间轴视图 -->
        <TimelineView
          v-else
          :articles="displayArticles"
          :sort-desc="sortDesc"
          :current-page="currentPage"
          :items-per-page="itemsPerPage"
        />

        <!-- 分页控件（仅在存在文章时显示） -->
        <Pagination
          v-if="displayArticles.length > 0"
          v-model:current-page="currentPage"
          v-model:items-per-page="itemsPerPage"
          :total-pages="totalPages"
          :total-items="displayArticles.length"
          :items-per-page-options="[5, 10, 20, 50]"
        />
      </section>
    </section>
  </main>
</template>

<style scoped>
.search-section {
  margin-bottom: 16px;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 0 12px;
  transition: border-color 0.2s ease;
}

.search-box:focus-within {
  border-color: var(--brand);
}

.search-icon {
  font-size: 18px;
  margin-right: 8px;
  color: var(--text-muted);
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 14px;
  padding: 12px 0;
  outline: none;
}

.search-input::placeholder {
  color: var(--text-subtle);
}

.clear-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.clear-btn:hover {
  background: var(--surface-2);
  color: var(--text-primary);
}

.search-hint {
  margin-left: 8px;
  color: var(--text-subtle);
  font-size: 12px;
  font-weight: normal;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.view-toggle-btn {
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-primary);
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
}

.view-toggle-btn:hover {
  background: var(--surface-2);
  border-color: var(--brand);
  transform: scale(1.05);
}

.new-article-btn {
  padding: 8px 16px;
  border-radius: 10px;
  border: 1px solid var(--brand);
  background: var(--brand);
  color: var(--bg);
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s ease;
  font-size: 14px;
}

.new-article-btn:hover {
  opacity: 0.9;
}
</style>
