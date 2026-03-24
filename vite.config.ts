import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'
import { copyContentPlugin } from './vite-plugin-copy-content'

// https://vite.dev/config/
export default defineConfig(() => {
  const isGitHubPagesBuild = process.env.GITHUB_ACTIONS === 'true'

  return {
    plugins: [vue(), copyContentPlugin()],
    base: isGitHubPagesBuild ? '/steve-blog/' : '/',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // Vue 核心库
            'vue-vendor': ['vue', 'vue-router', 'pinia', 'vue-i18n'],
            // Markdown 相关库
            'markdown-vendor': [
              'markdown-it',
              'markdown-it-katex',
              'markdown-it-mark',
              'markdown-it-task-lists'
            ],
            // 代码高亮库
            'highlight-vendor': ['highlight.js'],
            // 数学公式和图表库
            'math-vendor': ['katex', 'mermaid', 'flowchart.js']
          }
        }
      },
      chunkSizeWarningLimit: 1000
    }
  }
})
