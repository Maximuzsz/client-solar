import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authAPI } from '@/services/api'

// Definição do tipo de usuário
export interface User {
  id: number
  username: string
  email: string
  role: string
  name?: string
  firstName?: string
  lastName?: string
  token?: string
}

// Interface para o contexto de autenticação
interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  register: (name: string, email: string, username: string, password: string) => Promise<void>
}

// Valor padrão para o contexto de autenticação
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  loading: true,
  login: async () => {},
  logout: () => {},
  register: async () => {},
})

interface AuthProviderProps {
  children: ReactNode
}

// Provider do contexto de autenticação
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verifica se há um token salvo no localStorage
    const token = localStorage.getItem('token')
    
    if (token) {
      // Busca os dados do usuário (o token é adicionado automaticamente pelo interceptor)
      fetchUserData()
    } else {
      setLoading(false)
    }
  }, [])

  // Função para buscar os dados do usuário
  const fetchUserData = async () => {
    try {
      // Log de autenticação removido por segurança
      
      // Tenta primeiro com /me
      try {
        const userData = await authAPI.getProfile();
        // Log de dados do usuário removido por segurança
        
        // Verifica se temos um objeto de usuário válido
        if (userData && userData.id) {
          setUser(userData);
          // Log de autenticação bem-sucedida removido por segurança
          setLoading(false);
          return;
        }
      } catch (error) {
        console.warn('Erro ao buscar perfil com /me, tentando endpoint alternativo:', error);
      }
      
      // Se falhou com /me, tenta com /profile
      try {
        const userData = await authAPI.getProfileAlt();
        // Log de dados do usuário (endpoint alt) removido por segurança
        
        // Verifica se temos um objeto de usuário válido
        if (userData && userData.id) {
          setUser(userData);
          // Log de autenticação bem-sucedida (endpoint alt) removido por segurança
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('Também falhou com /profile:', error);
        throw error; // Propaga o erro para o catch externo
      }
      
      // Se chegou aqui, nenhum dos endpoints retornou dados válidos
      console.error('Nenhum endpoint retornou dados de usuário válidos');
      localStorage.removeItem('token');
      setUser(null);
      
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      // Finalizamos o carregamento em qualquer cenário
      setLoading(false);
    }
  }

  // Função de login com tratamento de erros melhorado
  const login = async (email: string, password: string) => {
    try {
      // Log de tentativa de login removido por segurança
      
      const userData = await authAPI.login({ email, password })
      // Log de resposta de login removido por segurança
      
      // Nossa API pode retornar diferentes formatos
      // Podemos receber { user: {...}, token: '...' } ou { accessToken: '...', user: {...} }
      let token, userObject;
      
      if (userData.token) {
        token = userData.token;
        userObject = userData.user;
      } else if (userData.accessToken) {
        token = userData.accessToken;
        userObject = userData.user || userData;
      } else {
        console.error('Formato de resposta desconhecido:', userData);
        throw new Error('Formato de resposta do servidor não reconhecido');
      }
      
      // Verifica se temos um token válido
      if (!token) {
        throw new Error('Token de autenticação não recebido');
      }
      
      // Log de login bem-sucedido removido por segurança
      
      // Salva o token no localStorage
      localStorage.setItem('token', token);
      
      // Atualiza o estado com os dados do usuário
      setUser({ 
        ...userObject, 
        token // Incluímos o token nos dados do usuário para referência
      });
    } catch (error: any) {
      console.error('Erro no login:', error);
      
      // Formata mensagem de erro amigável
      let errorMessage = 'Falha no login. Tente novamente.';
      
      if (error.response) {
        // Erro do servidor com detalhes
        const serverError = error.response.data;
        errorMessage = serverError.message || serverError.error || 'Erro no servidor. Tente novamente.';
        console.error('Detalhes do erro do servidor:', serverError);
      } else if (error.request) {
        // Erro de rede - sem resposta
        errorMessage = 'Erro de conexão com o servidor. Verifique sua internet.';
      } else if (error.message) {
        // Erro específico da aplicação
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  }

  // Função de logout
  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  // Função de registro com melhor tratamento de erros
  const register = async (name: string, email: string, username: string, password: string) => {
    try {
      // Extrair primeiro e último nome
      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
      
      // Log de registro de usuário removido por segurança
      
      const result = await authAPI.register({
        email,
        username,
        password,
        firstName,
        lastName
      });
      
      // Log de registro bem-sucedido removido por segurança
      return result;
    } catch (error: any) {
      console.error('Erro no cadastro:', error);
      
      // Formata mensagem de erro amigável
      let errorMessage = 'Falha no cadastro. Tente novamente.';
      
      if (error.response) {
        // Erros comuns de validação
        const serverError = error.response.data;
        
        if (serverError.message && typeof serverError.message === 'string') {
          errorMessage = serverError.message;
        } else if (serverError.error) {
          errorMessage = serverError.error;
        } else if (error.response.status === 409) {
          errorMessage = 'Email ou nome de usuário já cadastrado. Tente outro.';
        } else if (error.response.status === 400) {
          errorMessage = 'Dados inválidos. Verifique as informações e tente novamente.';
        }
        
        console.error('Detalhes do erro de registro:', serverError);
      } else if (error.request) {
        // Erro de rede - sem resposta
        errorMessage = 'Erro de conexão com o servidor. Verifique sua internet.';
      } else if (error.message) {
        // Erro específico da aplicação
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  }

  const authContextValue = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
    register,
  }

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook personalizado para acessar o contexto de autenticação
export const useAuth = () => useContext(AuthContext)