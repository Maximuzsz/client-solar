import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const srcPath = path.resolve(__dirname, './src')
const assetsPath = path.resolve(__dirname, '../attached_assets')

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const isProduction = mode === 'production'

  return {
    base: '/app/',

    plugins: [react()],

    resolve: {
      alias: {
        '@': srcPath,
        '@assets': assetsPath
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
        usePolling: true
      },

      fs: {
        strict: false,
        allow: [path.resolve(__dirname, './'), assetsPath]
      },

      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:3000/api',
          changeOrigin: true,
          secure: false,
          rewrite: p => p
        }
      },

      allowedHosts: [
        'ea5246d2-fd09-4c9d-af34-df81c45d0405-00-fd4f6gp7phcr.riker.replit.dev'
      ]
    },

    build: {
      target: 'esnext',
      minify: isProduction ? 'esbuild' : false,
      sourcemap: isProduction, // só gera sourcemaps em produção
      cssCodeSplit: true,
      chunkSizeWarningLimit: 1000,

      rollupOptions: {
        output: {
          manualChunks(id: string): string | void {
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
    },

    define: Object.fromEntries(
      Object.entries(env)
        .filter(([key]) => key.startsWith('VITE_') || key === 'NODE_ENV')
        .map(([key, val]) => [`process.env.${key}`, JSON.stringify(val)])
    )
  }
})
