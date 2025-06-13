import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const srcPath = path.resolve(__dirname, './src')
const assetsPath = path.resolve(__dirname, '../attached_assets')

export default defineConfig(({ mode }) => {
  // Carrega apenas variáveis com prefixo VITE_ do .env
  const env = loadEnv(mode, process.cwd(), '')

  return {
    // '/' garante que funcione corretamente no Nginx (evita erro 404 em SPA)
    plugins: [react()],
    base: '/',

    

    resolve: {
      alias: {
        '@': srcPath,
        '@assets': assetsPath
      }
    },

    build: {
      target: 'esnext',
      minify: 'esbuild',
      sourcemap: true, // útil para debug em produção
      cssCodeSplit: true,
      chunkSizeWarningLimit: 1000,

      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('node_modules')) {
              if (id.includes('react')) return 'vendor-react'
              return 'vendor'
            }
          }
        }
      }
    },

    define: {
      // Expõe apenas variáveis seguras do .env para o frontend
      'process.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL),
      'process.env.VITE_STRIPE_PUBLIC_KEY': JSON.stringify(env.VITE_STRIPE_PUBLIC_KEY)
    }
  }
})
