import axios, { AxiosRequestConfig } from 'axios'

// Usar URL relativa para funcionar tanto em desenvolvimento quanto em produção
const API_URL = 'http://api.solarshare.com.br//api/v1'

interface ApiOptions extends AxiosRequestConfig {
  skipAuthHeader?: boolean
}

export async function apiRequest<T = any>(
  method: string,
  url: string,
  data?: any,
  options: ApiOptions = {}
): Promise<T> {
  const { skipAuthHeader, ...axiosOptions } = options
  
  // Pega o token JWT do localStorage
  const token = localStorage.getItem('token')
  
  // Configura os headers, incluindo o token de autenticação se disponível
  const headers: Record<string, any> = {}
  
  // Adiciona o Content-Type se não for uma requisição multipart/form-data
  if (!data || !(data instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  
  // Mescla com headers existentes se houver
  if (axiosOptions.headers) {
    Object.assign(headers, axiosOptions.headers);
  }
  
  // Adiciona o header de autenticação se o token existir e não for especificado para pular
  if (token && !skipAuthHeader) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  try {
    // Evitar duplicação de prefixo '/api/v1' na URL
    const finalUrl = url.startsWith('/api/v1') ? url : `${API_URL}${url}`;
    
    const response = await axios({
      method,
      url: finalUrl,
      data,
      headers,
      ...axiosOptions
    })
    
    return response.data
  } catch (error: any) {
    // Trata erros específicos
    if (error.response) {
      // O servidor respondeu com um status de erro
      console.error('API Error:', error.response.status, error.response.data)
      
      // Se for um erro de autenticação (401), limpa o token e redireciona para login
      if (error.response.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
      
      throw error.response.data
    } else if (error.request) {
      // A requisição foi feita mas não houve resposta
      console.error('API No Response:', error.request)
      throw new Error('Não foi possível conectar ao servidor. Por favor, verifique sua conexão.')
    } else {
      // Erro ao configurar a requisição
      console.error('API Request Error:', error.message)
      throw new Error('Erro ao fazer a requisição. Por favor, tente novamente.')
    }
  }
}