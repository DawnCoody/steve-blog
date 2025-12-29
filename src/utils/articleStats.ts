/**
 * 文章统计工具函数
 */

/**
 * 计算文章字数（去除 Markdown 语法）
 * @param content Markdown 内容
 * @returns 字数
 */
export function calculateWordCount(content: string): number {
  if (!content) return 0
  
  // 移除 Markdown 语法
  let text = content
    // 移除代码块
    .replace(/```[\s\S]*?```/g, '')
    // 移除行内代码
    .replace(/`[^`]+`/g, '')
    // 移除链接
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    // 移除图片
    .replace(/!\[([^\]]*)\]\([^\)]+\)/g, '')
    // 移除标题标记
    .replace(/^#{1,6}\s+/gm, '')
    // 移除粗体和斜体标记
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // 移除删除线
    .replace(/~~([^~]+)~~/g, '$1')
    // 移除引用标记
    .replace(/^>\s+/gm, '')
    // 移除列表标记
    .replace(/^[\s]*[-*+]\s+/gm, '')
    .replace(/^[\s]*\d+\.\s+/gm, '')
    // 移除水平线
    .replace(/^---+$/gm, '')
    // 移除 HTML 标签
    .replace(/<[^>]+>/g, '')
    // 移除多余空白
    .replace(/\s+/g, ' ')
    .trim()
  
  // 中文字符按字计算，英文按单词计算
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
  const englishWords = text.replace(/[\u4e00-\u9fa5]/g, '').trim().split(/\s+/).filter(w => w.length > 0).length
  
  return chineseChars + englishWords
}

/**
 * 计算阅读时长（分钟）
 * @param wordCount 字数
 * @param wordsPerMinute 每分钟阅读字数（默认：中文 300 字/分钟，英文 200 词/分钟）
 * @returns 阅读时长（分钟）
 */
export function calculateReadingTime(wordCount: number, wordsPerMinute: number = 300): number {
  if (wordCount <= 0) return 1
  const minutes = Math.ceil(wordCount / wordsPerMinute)
  return Math.max(1, minutes) // 至少 1 分钟
}

/**
 * 获取或增加文章阅读量
 * @param articleId 文章 ID
 * @returns 阅读量
 */
export function getArticleViews(articleId: string): number {
  const key = `article_views_${articleId}`
  const views = localStorage.getItem(key)
  return views ? parseInt(views, 10) : 0
}

/**
 * 增加文章阅读量
 * @param articleId 文章 ID
 * @returns 新的阅读量
 */
export function incrementArticleViews(articleId: string): number {
  const key = `article_views_${articleId}`
  const currentViews = getArticleViews(articleId)
  const newViews = currentViews + 1
  localStorage.setItem(key, newViews.toString())
  return newViews
}

