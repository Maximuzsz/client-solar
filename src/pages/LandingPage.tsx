import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Se o usuário já estiver autenticado, redireciona para o dashboard
  useEffect(() => {
    if (isAuthenticated) {
      setLocation('/dashboard');
    }
  }, [isAuthenticated, setLocation]);

  const handleGetStarted = () => {
    setLocation('/login');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-50 to-blue-50">
      {/* Navegação */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-md py-2' : 'bg-transparent py-4'}`}>
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-600 to-green-400 flex items-center justify-center mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-green-500 text-transparent bg-clip-text">SolarShare</h1>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-600 hover:text-blue-600 transition">Recursos</a>
            <a href="#how-it-works" className="text-gray-600 hover:text-blue-600 transition">Como Funciona</a>
            <Button variant="outline" onClick={handleGetStarted}>Entrar</Button>
            <Button onClick={handleGetStarted}>Começar Agora</Button>
          </div>
          <div className="md:hidden relative">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-gray-700"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>
            
            {mobileMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 animate-fadeIn">
                <a href="#features" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">Recursos</a>
                <a href="#how-it-works" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">Como Funciona</a>
                <div className="border-t border-gray-200 my-1"></div>
                <a href="/login" onClick={(e) => { e.preventDefault(); setLocation('/login'); }} className="block px-4 py-2 text-gray-700 hover:bg-gray-100">Entrar</a>
                <a href="/register" onClick={(e) => { e.preventDefault(); handleGetStarted(); }} className="block px-4 py-2 text-blue-600 font-medium hover:bg-blue-50">Começar Agora</a>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 md:py-40 bg-gradient-to-br from-blue-50 via-white to-green-50 hero-pattern">
        <div className="container mx-auto flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 md:pr-10">
            <div className="space-y-4 animate-staggered-fadeIn">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Gerenciamento inteligente de energia solar
                <span className="block bg-gradient-to-r from-blue-600 to-green-500 text-transparent bg-clip-text">para um futuro sustentável</span>
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                SolarShare é uma plataforma completa que permite monitorar, otimizar e compartilhar energia renovável através de uma solução inteligente e interativa.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  onClick={handleGetStarted} 
                  className="bg-gradient-to-r from-blue-600 to-green-500 hover:from-blue-700 hover:to-green-600 transition-all duration-300 transform hover:scale-105"
                >
                  Começar Gratuitamente
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={() => setLocation('/login')}
                  className="transition-all duration-300 transform hover:scale-105"
                >
                  Fazer Login
                </Button>
              </div>
              <div className="space-y-3 pt-4">
                <div className="flex items-center space-x-2 text-gray-500 transition-transform duration-300 hover:translate-x-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Monitoramento em tempo real</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-500 transition-transform duration-300 hover:translate-x-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Gerenciamento de redes de energia</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-500 transition-transform duration-300 hover:translate-x-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Previsões com inteligência artificial</span>
                </div>
              </div>
            </div>
          </div>
          <div className="md:w-1/2 mt-10 md:mt-0">
            <div className="relative transition-all duration-500 transform hover:-translate-y-2 hover:shadow-xl">
              <div className="w-full h-[400px] rounded-xl overflow-hidden shadow-2xl">
                <div className="bg-gradient-to-br from-blue-600 to-green-400 w-full h-full opacity-80 flex items-center justify-center">
                  <img 
                    src="/dashboard-preview.svg" 
                    alt="Dashboard Preview" 
                    className="w-11/12 h-auto rounded-lg shadow-lg transform translate-y-4"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-opacity-30 text-white text-center p-4">
                    <div>
                      <h3 className="text-2xl font-bold mb-2">Dashboard Interativo</h3>
                      <p className="text-white/90">Monitore sua produção e consumo de energia em tempo real</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg animate-pulse">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">100%</div>
                  <div className="text-xs text-gray-500">Renovável</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold mb-4">RECURSOS</span>
            <h2 className="text-3xl font-bold mb-4">Recursos Principais</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Nossa plataforma oferece tudo o que você precisa para gerenciar energia solar de forma eficiente
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-md hover-card-rise">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6 transform transition-all duration-300 group-hover:scale-110">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Análise Avançada</h3>
              <p className="text-gray-600">Obtenha insights detalhados sobre seu consumo e geração de energia com visualizações intuitivas e métricas personalizáveis.</p>
              <div className="mt-4 text-blue-600 font-medium flex items-center">
                <span className="mr-2">Saiba mais</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-md hover-card-rise">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6 transform transition-all duration-300 group-hover:scale-110">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Agendamento Inteligente</h3>
              <p className="text-gray-600">Otimize seu consumo com base em previsões climáticas e variações de tarifas energéticas, maximizando sua economia.</p>
              <div className="mt-4 text-green-600 font-medium flex items-center">
                <span className="mr-2">Saiba mais</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-md hover-card-rise">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-6 transform transition-all duration-300 group-hover:scale-110">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Compartilhamento de Energia</h3>
              <p className="text-gray-600">Compartilhe o excesso de energia gerada em suas unidades com outras pessoas da sua rede, criando um ecossistema mais sustentável.</p>
              <div className="mt-4 text-purple-600 font-medium flex items-center">
                <span className="mr-2">Saiba mais</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Benefícios em números */}
          <div className="mt-20 bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-10 shadow-md">
            <h3 className="text-2xl font-bold mb-8 text-center">Benefícios Reais</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="p-6">
                <div className="text-4xl font-bold text-blue-600 mb-2">30%</div>
                <p className="text-gray-700">Economia média nas contas de energia</p>
              </div>
              <div className="p-6">
                <div className="text-4xl font-bold text-green-600 mb-2">100%</div>
                <p className="text-gray-700">Investimento em energia limpa e renovável</p>
              </div>
              <div className="p-6">
                <div className="text-4xl font-bold text-purple-600 mb-2">24/7</div>
                <p className="text-gray-700">Monitoramento inteligente e contínuo</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm font-semibold mb-4">PROCESSO</span>
            <h2 className="text-3xl font-bold mb-4">Como Funciona</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Em apenas 3 passos simples você pode começar a otimizar sua energia solar
            </p>
          </div>
          
          <div className="relative">
            {/* Linha de conexão em desktop */}
            <div className="hidden md:block absolute top-24 left-1/2 h-1 w-[calc(66.6%-100px)] bg-gradient-to-r from-blue-500 via-green-500 to-green-400 -translate-x-1/2"></div>
            
            <div className="flex flex-col md:flex-row gap-8">
              {/* Card 1: Cadastro */}
              <div className="md:w-1/3 relative hover-card-rise">
                {/* Indicador de etapa - Desktop e Mobile têm estilos diferentes */}
                <div className="absolute top-0 left-0 -mt-4 -ml-4 w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 text-white flex items-center justify-center text-2xl font-bold z-10 shadow-md">1</div>
                <div className="bg-white rounded-xl shadow-md p-6 md:p-8 h-full">
                  <h3 className="text-xl font-bold mb-2 md:mb-4 mt-2">Cadastre-se na Plataforma</h3>
                  <p className="text-gray-600 mb-4 md:mb-6">Crie sua conta gratuita e configure seu perfil com informações básicas sobre seu sistema de energia solar.</p>
                  <img 
                    src="/images/signup-illustration.svg" 
                    alt="Cadastro" 
                    className="w-3/4 h-auto mx-auto mt-4 opacity-80"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              </div>
              
              {/* Card 2: Unidades - Desktop tem margin-top, mobile não */}
              <div className="mt-8 md:mt-12 md:w-1/3 relative hover-card-rise">
                <div className="absolute top-0 left-0 -mt-4 -ml-4 w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-green-500 text-white flex items-center justify-center text-2xl font-bold z-10 shadow-md">2</div>
                <div className="bg-white rounded-xl shadow-md p-6 md:p-8 h-full">
                  <h3 className="text-xl font-bold mb-2 md:mb-4 mt-2">Adicione suas Unidades</h3>
                  <p className="text-gray-600 mb-4 md:mb-6">Cadastre suas unidades geradoras e consumidoras para começar a monitorar a produção e o consumo de energia.</p>
                  <img 
                    src="/images/units-illustration.svg" 
                    alt="Unidades" 
                    className="w-3/4 h-auto mx-auto mt-4 opacity-80"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              </div>
              
              {/* Card 3: Monitor */}
              <div className="mt-8 md:mt-0 md:w-1/3 relative hover-card-rise">
                <div className="absolute top-0 left-0 -mt-4 -ml-4 w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-green-400 text-white flex items-center justify-center text-2xl font-bold z-10 shadow-md">3</div>
                <div className="bg-white rounded-xl shadow-md p-6 md:p-8 h-full">
                  <h3 className="text-xl font-bold mb-2 md:mb-4 mt-2">Monitore e Otimize</h3>
                  <p className="text-gray-600 mb-4 md:mb-6">Utilize o dashboard interativo para analisar seus dados, receber sugestões personalizadas e maximizar sua economia.</p>
                  <img 
                    src="/images/dashboard-illustration.svg" 
                    alt="Dashboard" 
                    className="w-3/4 h-auto mx-auto mt-4 opacity-80"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-20 text-center">
            <Button 
              size="lg" 
              onClick={handleGetStarted} 
              className="bg-gradient-to-r from-blue-600 to-green-500 hover:from-blue-700 hover:to-green-600 transform transition-all duration-300 hover:scale-105 px-10"
            >
              Comece Agora
            </Button>
            <p className="text-gray-500 mt-4">Sem complicações. Sem compromisso. Comece gratuitamente.</p>
          </div>
        </div>
      </section>

      {/* CTA - Atualizado com animações e efeitos visuais */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-blue-600 to-green-500 relative overflow-hidden">
        {/* Background Elements - Visíveis apenas em telas maiores */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-15">
          <div className="absolute top-10 left-10 w-20 md:w-40 h-20 md:h-40 rounded-full bg-white animate-float hidden md:block"></div>
          <div className="absolute bottom-10 right-10 w-40 md:w-60 h-40 md:h-60 rounded-full bg-white animate-float-delay hidden md:block"></div>
          <div className="absolute top-1/2 right-1/3 w-10 md:w-20 h-10 md:h-20 rounded-full bg-white animate-float-slow hidden md:block"></div>
        </div>
        
        {/* Círculos simplificados para mobile */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-15 md:hidden">
          <div className="absolute top-10 left-5 w-20 h-20 rounded-full bg-white animate-float-slow"></div>
          <div className="absolute bottom-10 right-5 w-32 h-32 rounded-full bg-white animate-float"></div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <span className="inline-block px-3 md:px-4 py-1 bg-white/20 text-white rounded-full text-xs md:text-sm font-semibold mb-4 md:mb-6 backdrop-blur-sm">ENERGIA LIMPA PARA TODOS</span>
            <h2 className="text-2xl md:text-4xl font-bold text-white mb-4 md:mb-6 [text-shadow:_0_1px_3px_rgb(0_0_0_/_20%)]">
              Pronto para revolucionar seu gerenciamento de energia solar?
            </h2>
            <p className="text-base md:text-xl text-white/90 mb-6 md:mb-10 max-w-2xl mx-auto [text-shadow:_0_1px_2px_rgb(0_0_0_/_10%)]">
              Junte-se a milhares de usuários que já estão economizando e contribuindo para um futuro mais sustentável.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 md:gap-5">
              <Button 
                size="lg" 
                onClick={handleGetStarted}
                className="bg-white text-blue-600 hover:bg-blue-50 transition-transform duration-300 hover:scale-105 shadow-lg px-6 md:px-8 py-5 md:py-6 text-base md:text-lg font-semibold"
              >
                Começar Gratuitamente
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => setLocation('/login')}
                className="text-white border-white hover:bg-white/20 font-semibold transition-transform duration-300 hover:scale-105 px-6 md:px-8 py-5 md:py-6 text-base md:text-lg mt-3 sm:mt-0"
                style={{ textShadow: '0px 0px 2px rgba(255,255,255,0.5)' }}
              >
                Fazer Login
              </Button>
            </div>
            <div className="mt-6 md:mt-10 flex flex-col sm:flex-row justify-center sm:space-x-8 space-y-2 sm:space-y-0">
              <div className="flex items-center text-white/90 justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Comece gratuitamente</span>
              </div>
              <div className="flex items-center text-white/90 justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Sem necessidade de cartão</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-600 to-green-400 flex items-center justify-center mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h1 className="text-xl font-bold text-white">SolarShare</h1>
              </div>
              <p className="text-gray-400 mb-4">
                Plataforma completa para gerenciamento de energia solar que permite monitorar, otimizar e compartilhar energia renovável.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-4">Recursos</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition">Dashboard</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Análises</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Previsões</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Gestão de Redes</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition">Termos de Uso</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Privacidade</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Cookies</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Licenças</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">
              &copy; {new Date().getFullYear()} SolarShare. Todos os direitos reservados.
            </p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white transition">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}