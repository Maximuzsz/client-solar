import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth.tsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Login() {
  const [, setLocationWouter] = useLocation();
  const { login, register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [activeTab, setActiveTab] = useState("login");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  
  // Verifica a conexão com a API ao carregar a página
  useEffect(() => {
    const checkApiConnection = async () => {
      try {
        console.log('Verificando conexão com a API...');
        
        // Usamos URL relativa para aproveitar o proxy do Vite
        const apiBaseUrl = '/api/v1/auth';
          
        // Tentando usar uma requisição OPTIONS para verificar se o servidor está online
        // Não importa se dá 404, o importante é que o servidor responda
        await fetch(apiBaseUrl, { method: 'OPTIONS' })
          .then(() => {
            console.log('Conexão com a API estabelecida com sucesso!');
            setApiStatus('ok');
          })
          .catch((err) => {
            throw err;
          });
      } catch (err) {
        console.error('Erro ao conectar com a API:', err);
        setApiStatus('error');
      }
    };
    
    checkApiConnection();
    
    // Verificar a conexão a cada 5 segundos se estiver com erro
    const interval = setInterval(() => {
      if (apiStatus === 'error') {
        checkApiConnection();
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [apiStatus]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await login(email, password);
      // Login bem-sucedido
      
      // Após login bem-sucedido, redirecionamos o usuário
      window.location.href = "/dashboard"; // Use navegação direta para forçar uma recarga completa
    } catch (err: any) {
      console.error("Login error:", err);
      // Usa a mensagem de erro específica da API se disponível
      setError(err.message || "Credenciais inválidas. Por favor, tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Usando o método register do hook useAuth
      await register(name, email, username, password);
      
      // Após registrar, faça login automaticamente
      await login(email, password);
      
      // Usar navegação direta para a página principal, forçando reload completo
      window.location.href = "/dashboard";
      
    } catch (err: any) {
      console.error("Register error:", err);
      // Usa a mensagem de erro específica da API se disponível
      setError(err.message || "Falha no registro. Verifique os dados e tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLanding = () => {
    setLocationWouter('/');
  };

  return (
    <div className="flex min-h-screen">
      {/* Seção Esquerda - Gradiente com informações */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-600 to-green-500 flex-col justify-center px-12">
        <div className="text-white">
          <div className="flex items-center mb-8">
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold">SolarShare</h1>
          </div>
          
          <h2 className="text-2xl font-bold mb-4">Uma plataforma completa para gerenciar e compartilhar energia renovável de forma inteligente.</h2>
          
          <ul className="space-y-6 mt-10">
            <li className="flex items-start">
              <div className="bg-white/20 rounded-full h-8 w-8 flex items-center justify-center mr-4 flex-shrink-0">
                <span className="text-white font-bold">1</span>
              </div>
              <p>Monitore seu consumo e geração em tempo real</p>
            </li>
            <li className="flex items-start">
              <div className="bg-white/20 rounded-full h-8 w-8 flex items-center justify-center mr-4 flex-shrink-0">
                <span className="text-white font-bold">2</span>
              </div>
              <p>Gerencie redes de energia e compartilhe excedentes</p>
            </li>
            <li className="flex items-start">
              <div className="bg-white/20 rounded-full h-8 w-8 flex items-center justify-center mr-4 flex-shrink-0">
                <span className="text-white font-bold">3</span>
              </div>
              <p>Obtenha previsões inteligentes e economize nos custos</p>
            </li>
          </ul>

          <button 
            onClick={handleBackToLanding}
            className="mt-12 flex items-center text-white/80 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Voltar para a página inicial
          </button>
        </div>
      </div>
      
      {/* Seção Direita - Formulário de Login */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-8 bg-gray-50">
        {/* Botão de voltar em dispositivos móveis */}
        <div className="md:hidden w-full mb-8">
          <button 
            onClick={handleBackToLanding}
            className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Voltar
          </button>
        </div>

        <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-sm">
          <div className="text-center mb-6 md:hidden">
            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-600 to-green-500 mx-auto flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold mt-2 bg-gradient-to-r from-blue-600 to-green-500 text-transparent bg-clip-text">SolarShare</h1>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="register">Cadastrar</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold">Entre na sua conta</h2>
                <p className="text-muted-foreground mt-2">Digite suas credenciais para acessar o seu painel</p>
              </div>
              
              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}
                
                {apiStatus === 'error' && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center">
                    <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    Erro de conexão com o servidor. Tentando reconectar automaticamente...
                  </div>
                )}
                
                {apiStatus === 'checking' && (
                  <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-yellow-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verificando conexão com o servidor...
                  </div>
                )}
                
                {apiStatus === 'ok' && !error && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded flex items-center">
                    <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Servidor conectado! Faça login para continuar.
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Digite seu e-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="password">Senha</Label>
                    <a href="#" className="text-sm text-blue-600 hover:text-blue-800">Esqueceu a senha?</a>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-green-500 hover:from-blue-700 hover:to-green-600"
                  disabled={isLoading}
                >
                  {isLoading ? "Entrando..." : "Entrar"}
                </Button>
              </form>
              
              <div className="text-center mt-6">
                <p className="text-sm text-muted-foreground">
                  Não tem uma conta?{" "}
                  <button 
                    onClick={() => setActiveTab("register")}
                    className="text-blue-600 font-medium hover:underline"
                  >
                    Cadastrar
                  </button>
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="register">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold">Crie sua conta</h2>
                <p className="text-muted-foreground mt-2">Preencha os dados para se cadastrar</p>
              </div>
              
              <form onSubmit={handleRegister} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}
                
                {apiStatus === 'error' && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center">
                    <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    Erro de conexão com o servidor. Tentando reconectar automaticamente...
                  </div>
                )}
                
                {apiStatus === 'checking' && (
                  <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-yellow-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verificando conexão com o servidor...
                  </div>
                )}
                
                {apiStatus === 'ok' && !error && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded flex items-center">
                    <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Servidor conectado! Complete o cadastro para continuar.
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input 
                    id="name" 
                    placeholder="Digite seu nome completo" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email-register">E-mail</Label>
                  <Input 
                    id="email-register" 
                    type="email" 
                    placeholder="Digite seu e-mail" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="username">Nome de usuário</Label>
                  <Input 
                    id="username" 
                    placeholder="Escolha um nome de usuário" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password-register">Senha</Label>
                  <Input 
                    id="password-register" 
                    type="password" 
                    placeholder="Crie uma senha segura" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-600 to-green-500 hover:from-blue-700 hover:to-green-600"
                  disabled={isLoading}
                >
                  {isLoading ? "Cadastrando..." : "Cadastrar"}
                </Button>
              </form>
              
              <div className="text-center mt-6">
                <p className="text-sm text-muted-foreground">
                  Já tem uma conta?{" "}
                  <button 
                    onClick={() => setActiveTab("login")}
                    className="text-blue-600 font-medium hover:underline"
                  >
                    Entrar
                  </button>
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}