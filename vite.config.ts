import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const srcPath = path.resolve(__dirname, './src')
const assetsPath = path.resolve(__dirname, '../attached_assets')

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    base: '/', // importante para funcionar no nginx

    plugins: [react()],

    resolve: {
      alias: {
        '@': srcPath,
        '@assets': assetsPath
      }
    },

    build: {
      target: 'esnext',
      minify: 'esbuild',
      sourcemap: true,
      cssCodeSplit: true,
      chunkSizeWarningLimit: 1000,

      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react')) return 'vendor-react'
              return 'vendor'
            }
          }
        }
      }
    },

    define: {
      'process.env': env
    }
  }
})
