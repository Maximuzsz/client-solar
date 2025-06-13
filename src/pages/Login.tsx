import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth.tsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface BackButtonProps {
  onClick: () => void;
  mobile?: boolean;
  className?: string;
}

// Componentes reutilizáveis
const StatusMessage = ({ status, error }: { status: 'checking' | 'ok' | 'error'; error: string | null }) => {
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  switch (status) {
    case 'error':
      return (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center">
          <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          Erro de conexão com o servidor. Tentando reconectar automaticamente...
        </div>
      );
    case 'checking':
      return (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded flex items-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-yellow-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Verificando conexão com o servidor...
        </div>
      );
    case 'ok':
      return (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded flex items-center">
          <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Servidor conectado! {status === 'ok' && 'Faça login para continuar.'}
        </div>
      );
    default:
      return null;
  }
};

const BackButton = ({ onClick, mobile = false, className = '' }: BackButtonProps) => (
  <button 
    onClick={onClick}
    className={`flex items-center ${mobile ? 'text-gray-600 hover:text-blue-600' : 'text-white/80 hover:text-white'} transition-colors ${className}`}
  >
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
    </svg>
    {mobile ? 'Voltar' : 'Voltar para a página inicial'}
  </button>
);

const BrandLogo = ({ mobile = false }: { mobile?: boolean }) => (
  <div className={`flex items-center ${mobile ? 'justify-center mb-8' : 'mb-8'}`}>
    <div className={`${mobile ? 'h-12 w-12 mx-auto' : 'h-10 w-10 mr-3'} rounded-full bg-gradient-to-r from-blue-600 to-green-500 flex items-center justify-center`}>
      <svg xmlns="http://www.w3.org/2000/svg" className={`${mobile ? 'h-7 w-7' : 'h-6 w-6'} text-white`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    </div>
    {!mobile && <h1 className="text-3xl font-bold">SolarShare</h1>}
    {mobile && <h1 className="text-xl font-bold mt-2 bg-gradient-to-r from-blue-600 to-green-500 text-transparent bg-clip-text">SolarShare</h1>}
  </div>
);

const FeatureList = () => (
  <ul className="space-y-6 mt-10">
    {[
      "Monitore seu consumo e geração em tempo real",
      "Gerencie redes de energia e compartilhe excedentes",
      "Obtenha previsões inteligentes e economize nos custos"
    ].map((feature, index) => (
      <li key={index} className="flex items-start">
        <div className="bg-white/20 rounded-full h-8 w-8 flex items-center justify-center mr-4 flex-shrink-0">
          <span className="text-white font-bold">{index + 1}</span>
        </div>
        <p>{feature}</p>
      </li>
    ))}
  </ul>
);

export default function Login() {
  const [, setLocationWouter] = useLocation();
  const { login, register } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    username: ""
  });
  const [activeTab, setActiveTab] = useState("login");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  }, []);

  // Verifica a conexão com a API
  const checkApiConnection = useCallback(async () => {
    try {
      const apiBaseUrl = '/api/v1/auth';
      await fetch(apiBaseUrl, { method: 'OPTIONS' });
      setApiStatus('ok');
    } catch (err) {
      console.error('Erro ao conectar com a API:', err);
      setApiStatus('error');
    }
  }, []);

  useEffect(() => {
    checkApiConnection();
    
    const interval = setInterval(() => {
      if (apiStatus === 'error') {
        checkApiConnection();
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [apiStatus, checkApiConnection]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await login(formData.email, formData.password);
      window.location.href = "/dashboard";
    } catch (err: any) {
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
      await register(formData.name, formData.email, formData.username, formData.password);
      await login(formData.email, formData.password);
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.message || "Falha no registro. Verifique os dados e tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLanding = useCallback(() => {
    setLocationWouter('/');
  }, [setLocationWouter]);

  return (
    <div className="flex min-h-screen">
      {/* Seção Esquerda - Gradiente com informações */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-600 to-green-500 flex-col justify-center px-12">
        <div className="text-white">
          <BrandLogo />
          <h2 className="text-2xl font-bold mb-4">Uma plataforma completa para gerenciar e compartilhar energia renovável de forma inteligente.</h2>
          <FeatureList />
          <BackButton onClick={handleBackToLanding} className="mt-12" />
        </div>
      </div>
      
      {/* Seção Direita - Formulário de Login */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-8 bg-gray-50">
        {/* Botão de voltar em dispositivos móveis */}
        <div className="md:hidden w-full mb-8">
          <BackButton onClick={handleBackToLanding} mobile />
        </div>

        <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-sm">
          <div className="text-center mb-6 md:hidden">
            <BrandLogo mobile />
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
                <StatusMessage status={apiStatus} error={error} />
                
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Digite seu e-mail"
                    value={formData.email}
                    onChange={handleInputChange}
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
                    value={formData.password}
                    onChange={handleInputChange}
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
                <StatusMessage status={apiStatus} error={error} />
                
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input 
                    id="name" 
                    placeholder="Digite seu nome completo" 
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="Digite seu e-mail" 
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="username">Nome de usuário</Label>
                  <Input 
                    id="username" 
                    placeholder="Escolha um nome de usuário" 
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="Crie uma senha segura" 
                    value={formData.password}
                    onChange={handleInputChange}
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