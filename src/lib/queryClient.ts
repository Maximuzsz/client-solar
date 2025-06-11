import { QueryClient } from '@tanstack/react-query'
import { apiRequest } from './api'

// Instância do QueryClient que será usada em toda a aplicação
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutos
    },
  },
})

// Função helper para fazer requisições com métodos HTTP diferentes
export { apiRequest }