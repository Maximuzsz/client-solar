import { useState, ReactNode, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { Menu, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth.tsx'
import { Button } from '@/components/ui/button'
import { Link } from 'wouter'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { user, logout } = useAuth()

  // Recuperar o estado da barra lateral do localStorage ao carregar
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed')
    if (savedState !== null) {
      setSidebarCollapsed(savedState === 'true')
    }
  }, [])

  // Salvar o estado no localStorage quando mudar
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', sidebarCollapsed.toString())
  }, [sidebarCollapsed])

  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu)
  }
  
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar fixa para desktop */}
      <div className="hidden lg:block fixed h-full z-30">
        <Sidebar collapsed={sidebarCollapsed} />
      </div>
      
      {/* Espaço para compensar a sidebar fixa no desktop */}
      <div className={`hidden lg:block transition-all duration-200 ${sidebarCollapsed ? 'w-16' : 'w-56'}`}></div>

      {/* Sidebar para mobile */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm lg:hidden">
          <div className="fixed inset-y-0 left-0 z-50 w-4/5 max-w-xs bg-background shadow-lg">
            <div className="flex h-16 items-center justify-between border-b px-6">
              <Link href="/" className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-lg font-bold">SolarShare</span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMobileMenu}
                className="lg:hidden"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
            <Sidebar isMobile={true} />
          </div>
        </div>
      )}

      {/* Conteúdo principal */}
      <div className="flex flex-1 flex-col">
        {/* Cabeçalho fixo */}
        <header className={`fixed top-0 right-0 left-0 lg:${sidebarCollapsed ? 'left-16' : 'left-56'} z-20 flex h-16 items-center justify-between border-b px-6 bg-background transition-all duration-200`}>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMobileMenu}
              className="lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleSidebar}
              className="hidden lg:flex items-center justify-center hover:bg-primary/10"
            >
              {sidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </Button>
          </div>
          
          <div className="ml-auto flex items-center space-x-4">
            {user ? (
              <Button
                variant="ghost"
                onClick={logout}
                className="text-sm font-medium"
              >
                Sair
              </Button>
            ) : (
              <Link href="/login">
                <Button variant="outline" className="text-sm font-medium">
                  Entrar
                </Button>
              </Link>
            )}
          </div>
        </header>

        {/* Espaço para compensar o cabeçalho fixo */}
        <div className="h-16"></div>

        {/* Conteúdo da página */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}