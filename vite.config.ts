import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@assets': path.resolve(__dirname, '../attached_assets')
    }
  },

  server: {
    host: '0.0.0.0',
    port: 5000,
    strictPort: true,
    cors: true,

    hmr: {
      host: '0.0.0.0',
      clientPort: 443,
      protocol: 'wss'
    },

    watch: {
      usePolling: true // melhora compatibilidade com sistemas de arquivos como Docker, WSL
    },

    fs: {
      strict: false,
      allow: [
        path.resolve(__dirname, './'),              // projeto atual
        path.resolve(__dirname, '../attached_assets') // assets externos
      ]
    },

    proxy: {
      '/api': {
        target: 'http://api.solarshare.com.br/api/v1',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path 
      }
    },

    allowedHosts: [
      'ea5246d2-fd09-4c9d-af34-df81c45d0405-00-fd4f6gp7phcr.riker.replit.dev'
    ]
  },

  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
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

  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext'
    }
  }
})
