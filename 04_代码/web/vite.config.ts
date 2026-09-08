import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiBase = env.VITE_API_BASE || '/ruilai-api'

  return {
    base: '/ruilai/',
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5176,
      proxy: {
        [apiBase]: {
          target: env.VITE_PROXY_TARGET || 'http://127.0.0.1:8610',
          changeOrigin: true,
          rewrite: (path) => path.replace(new RegExp(`^${apiBase}`), ''),
        },
      },
    },
  }
})
