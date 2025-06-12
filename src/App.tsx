import React, { useEffect, Suspense } from 'react'
import { Route, Switch, useLocation } from 'wouter'
import { AuthProvider, useAuth } from '@/hooks/useAuth.tsx'
import { Toaster } from '@/components/ui/toaster'

// Implementação do LoadingSpinner diretamente no arquivo
const LoadingSpinner = ({ fullScreen = false }: { fullScreen?: boolean }) => (
  <div className={`flex items-center justify-center ${fullScreen ? 'h-screen' : ''}`}>
    <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
    <p className="ml-4 text-lg text-primary font-medium">Carregando...</p>
  </div>
)

// Lazy loading para melhor performance
const Login = React.lazy(() => import('@/pages/Login'))
const NotFound = React.lazy(() => import('@/pages/NotFound'))
const Dashboard = React.lazy(() => import('@/pages/Dashboard'))
const Networks = React.lazy(() => import('@/pages/Networks'))
const Units = React.lazy(() => import('@/pages/Units'))
const UnitsList = React.lazy(() => import('@/pages/UnitsList'))
const Readings = React.lazy(() => import('@/pages/Readings'))
const Calculator = React.lazy(() => import('@/pages/Calculator'))
const Billing = React.lazy(() => import('@/pages/Billing'))
const Plans = React.lazy(() => import('@/pages/Plans'))
const Checkout = React.lazy(() => import('@/pages/Checkout'))
const PaymentSuccess = React.lazy(() => import('@/pages/Checkout').then(module => ({ default: module.PaymentSuccess })))
const Subscribe = React.lazy(() => import('@/pages/Subscribe'))
const Distribuidoras = React.lazy(() => import('@/pages/Distribuidoras'))
const Tarifas = React.lazy(() => import('@/pages/Tarifas'))
const Profile = React.lazy(() => import('@/pages/Profile'))
const Settings = React.lazy(() => import('@/pages/Settings'))
const NetworkBalance = React.lazy(() => import('@/pages/NetworkBalance'))
const EnergyBalance = React.lazy(() => import('@/pages/EnergyBalance'))
const EnergyProjection = React.lazy(() => import('@/pages/EnergyProjection'))
const LandingPage = React.lazy(() => import('@/pages/LandingPage'))

// Componente protetor de rota
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  const [, setLocation] = useLocation()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // Armazena a rota atual para redirecionar após login
      sessionStorage.setItem('redirectPath', window.location.pathname)
      setLocation('/login')
    }
  }, [isAuthenticated, loading, setLocation])

  if (loading) {
    return <LoadingSpinner fullScreen />
  }

  return isAuthenticated ? <>{children}</> : null
}

// Componente auxiliar para rotas protegidas
function ProtectedRoute({ path, component: Component }: { path: string, component: React.ComponentType }) {
  return (
    <Route path={path}>
      <RequireAuth>
        <Component />
      </RequireAuth>
    </Route>
  )
}

function Router() {
  const { isAuthenticated, loading } = useAuth()
  
  // Evita flash de conteúdo não autenticado
  if (loading) {
    return <LoadingSpinner fullScreen />
  }

  return (
    <Suspense fallback={<LoadingSpinner fullScreen />}>
      <Switch>
        {/* Rota da Landing Page */}
        <Route path="/">
          <LandingPage />
        </Route>

        {/* Rota de Login com redirecionamento pós-login */}
        <Route path="/login">
          {isAuthenticated ? (
            <Dashboard />
          ) : (
            <Login onSuccess={() => {
              const redirectPath = sessionStorage.getItem('redirectPath') || '/dashboard'
              sessionStorage.removeItem('redirectPath')
              window.location.href = redirectPath
            }} />
          )}
        </Route>

        {/* Rotas protegidas */}
        <ProtectedRoute path="/dashboard" component={Dashboard} />
        <ProtectedRoute path="/networks" component={Networks} />
        <ProtectedRoute path="/units" component={Units} />
        <ProtectedRoute path="/units-list" component={UnitsList} />
        <ProtectedRoute path="/networks/:networkId/units" component={Units} />
        <ProtectedRoute path="/networks/:networkId/balance" component={NetworkBalance} />
        <ProtectedRoute path="/readings/:unitId" component={Readings} />
        <ProtectedRoute path="/units/:unitId/readings" component={Readings} />
        <ProtectedRoute path="/calculator" component={Calculator} />
        <ProtectedRoute path="/billing" component={Billing} />
        <ProtectedRoute path="/plans" component={Plans} />
        <ProtectedRoute path="/checkout/:planId" component={Checkout} />
        <ProtectedRoute path="/pagamento-sucesso" component={PaymentSuccess} />
        <ProtectedRoute path="/subscribe" component={Subscribe} />
        <ProtectedRoute path="/distribuidoras" component={Distribuidoras} />
        <ProtectedRoute path="/tarifas" component={Tarifas} />
        <ProtectedRoute path="/profile" component={Profile} />
        <ProtectedRoute path="/settings" component={Settings} />
        <ProtectedRoute path="/energy-balance" component={EnergyBalance} />
        <ProtectedRoute path="/energy-projection" component={EnergyProjection} />

        {/* Rota 404 */}
        <Route path="*">
          <NotFound />
        </Route>
      </Switch>
    </Suspense>
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