import { useEffect } from 'react'
import { Route, Switch, useLocation } from 'wouter'
import { AuthProvider, useAuth } from '@/hooks/useAuth.tsx'
import { Toaster } from '@/components/ui/toaster'

// Páginas da aplicação
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

/**
 * Componente para proteger rotas que requerem autenticação
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  const [location, setLocation] = useLocation()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // Redireciona para login mantendo a rota original como state
      setLocation(`/login?redirect=${encodeURIComponent(location)}`)
    }
  }, [isAuthenticated, loading, location, setLocation])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <span className="sr-only">Carregando...</span>
      </div>
    )
  }

  return isAuthenticated ? <>{children}</> : null
}

/**
 * Componente para rotas públicas que não devem ser acessadas quando autenticado
 */
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  const [, setLocation] = useLocation()

  useEffect(() => {
    if (!loading && isAuthenticated) {
      setLocation('/dashboard')
    }
  }, [isAuthenticated, loading, setLocation])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return !isAuthenticated ? <>{children}</> : null
}

/**
 * Componente principal de roteamento
 */
function AppRouter() {
  return (
    <Switch>
      {/* Rotas públicas */}
      <PublicRoute path="/login">
        <Login />
      </PublicRoute>

      <Route path="/">
        <LandingPage />
      </Route>

      {/* Rotas protegidas */}
      <ProtectedRoute path="/dashboard">
        <Dashboard />
      </ProtectedRoute>

      <ProtectedRoute path="/networks">
        <Networks />
      </ProtectedRoute>

      <ProtectedRoute path="/units">
        <Units />
      </ProtectedRoute>

      <ProtectedRoute path="/units-list">
        <UnitsList />
      </ProtectedRoute>

      <ProtectedRoute path="/networks/:networkId/units">
        <Units />
      </ProtectedRoute>

      <ProtectedRoute path="/networks/:networkId/balance">
        <NetworkBalance />
      </ProtectedRoute>

      <ProtectedRoute path="/readings/:unitId">
        <Readings />
      </ProtectedRoute>

      <ProtectedRoute path="/units/:unitId/readings">
        <Readings />
      </ProtectedRoute>

      <ProtectedRoute path="/calculator">
        <Calculator />
      </ProtectedRoute>

      <ProtectedRoute path="/billing">
        <Billing />
      </ProtectedRoute>

      <ProtectedRoute path="/plans">
        <Plans />
      </ProtectedRoute>

      <ProtectedRoute path="/checkout/:planId">
        <Checkout />
      </ProtectedRoute>

      <ProtectedRoute path="/pagamento-sucesso">
        <PaymentSuccess />
      </ProtectedRoute>

      <ProtectedRoute path="/subscribe">
        <Subscribe />
      </ProtectedRoute>

      <ProtectedRoute path="/distribuidoras">
        <Distribuidoras />
      </ProtectedRoute>

      <ProtectedRoute path="/tarifas">
        <Tarifas />
      </ProtectedRoute>

      <ProtectedRoute path="/profile">
        <Profile />
      </ProtectedRoute>

      <ProtectedRoute path="/settings">
        <Settings />
      </ProtectedRoute>

      <ProtectedRoute path="/energy-balance">
        <EnergyBalance />
      </ProtectedRoute>

      <ProtectedRoute path="/energy-projection">
        <EnergyProjection />
      </ProtectedRoute>

      {/* Rota de fallback */}
      <Route>
        <NotFound />
      </Route>
    </Switch>
  )
}

/**
 * Componente principal da aplicação
 */
export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
      <Toaster />
    </AuthProvider>
  )
}