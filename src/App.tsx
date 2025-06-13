import { useEffect } from 'react'
import { Route, Switch, useLocation } from 'wouter'
import { AuthProvider, useAuth } from '@/hooks/useAuth.tsx'
import { Toaster } from '@/components/ui/toaster'
import Login from '@/pages/Login'
import NotFound from '@/pages/NotFound'
import Dashboard from '@/pages/Dashboard'
import Networks from '@/pages/Networks'
import Units from '@/pages/Units'
import UnitsList from '@/pages/UnitsList'
import Readings from '@/pages/Readings'
import Calculator from '@/pages/Calculator'
import Billing from '@/pages/Billing'
import Plans from '@/pages/Plans'
import Checkout, { PaymentSuccess } from '@/pages/Checkout'
import Subscribe from '@/pages/Subscribe'
import Distribuidoras from '@/pages/Distribuidoras'
import Tarifas from '@/pages/Tarifas'
import Profile from '@/pages/Profile'
import Settings from '@/pages/Settings'
import NetworkBalance from '@/pages/NetworkBalance'
import EnergyBalance from '@/pages/EnergyBalance'
import EnergyProjection from '@/pages/EnergyProjection'
import LandingPage from '@/pages/LandingPage'

// Componente protetor de rota
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  const [, setLocation] = useLocation()

  // Log de estado de autenticação removido por segurança

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // Log de redirecionamento removido
      setLocation('/login')
    } else if (!loading && isAuthenticated) {
      // Usuário autenticado, continuando para o conteúdo protegido
    }
  }, [isAuthenticated, loading, setLocation])

  if (loading) {
    // Estado de carregamento da autenticação
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="ml-4 text-lg text-primary font-medium">Carregando...</p>
      </div>
    )
  }

  // Se não está carregando e está autenticado, mostra o conteúdo
  if (isAuthenticated) {
    // Mostrando conteúdo protegido
    return <>{children}</>
  }
  
  // Se não está carregando e não está autenticado, não mostra nada (será redirecionado)
  // Não mostrando conteúdo (redirecionamento pendente)
  return null;
}

function Router() {
  const { isAuthenticated } = useAuth();
  
  return (
    <Switch>
      {/* Rota da Landing Page */}
      <Route path="/">
        <LandingPage />
      </Route>

      {/* Rota de Login */}
      <Route path="/login">
        {isAuthenticated ? <Dashboard /> : <Login />}
      </Route>

      {/* Rota do Dashboard (protegida) */}
      <Route path="/dashboard">
        <RequireAuth>
          <Dashboard />
        </RequireAuth>
      </Route>

      {/* Demais rotas protegidas */}
      <Route path="/networks">
        <RequireAuth>
          <Networks />
        </RequireAuth>
      </Route>
      <Route path="/units">
        <RequireAuth>
          <Units />
        </RequireAuth>
      </Route>
      <Route path="/units-list">
        <RequireAuth>
          <UnitsList />
        </RequireAuth>
      </Route>
      <Route path="/networks/:networkId/units">
        <RequireAuth>
          <Units />
        </RequireAuth>
      </Route>
      <Route path="/networks/:networkId/balance">
        <RequireAuth>
          <NetworkBalance />
        </RequireAuth>
      </Route>
      <Route path="/readings/:unitId">
        <RequireAuth>
          <Readings />
        </RequireAuth>
      </Route>
      <Route path="/units/:unitId/readings">
        <RequireAuth>
          <Readings />
        </RequireAuth>
      </Route>
      <Route path="/calculator">
        <RequireAuth>
          <Calculator />
        </RequireAuth>
      </Route>

      <Route path="/billing">
        <RequireAuth>
          <Billing />
        </RequireAuth>
      </Route>
      <Route path="/plans">
        <RequireAuth>
          <Plans />
        </RequireAuth>
      </Route>
      <Route path="/checkout/:planId">
        <RequireAuth>
          <Checkout />
        </RequireAuth>
      </Route>
      <Route path="/pagamento-sucesso">
        <RequireAuth>
          <PaymentSuccess />
        </RequireAuth>
      </Route>
      <Route path="/subscribe">
        <RequireAuth>
          <Subscribe />
        </RequireAuth>
      </Route>

      <Route path="/distribuidoras">
        <RequireAuth>
          <Distribuidoras />
        </RequireAuth>
      </Route>
      <Route path="/tarifas">
        <RequireAuth>
          <Tarifas />
        </RequireAuth>
      </Route>
      <Route path="/profile">
        <RequireAuth>
          <Profile />
        </RequireAuth>
      </Route>
      <Route path="/settings">
        <RequireAuth>
          <Settings />
        </RequireAuth>
      </Route>
      <Route path="/energy-balance">
        <RequireAuth>
          <EnergyBalance />
        </RequireAuth>
      </Route>
      <Route path="/energy-projection">
        <RequireAuth>
          <EnergyProjection />
        </RequireAuth>
      </Route>
      <Route path="*">
        <NotFound />
      </Route>
    </Switch>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router />
      <Toaster />
    </AuthProvider>
  )
}

export default App