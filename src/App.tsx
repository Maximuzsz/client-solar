import React, { useEffect, Suspense, lazy } from 'react'
import { Route, Switch, useLocation } from 'wouter'
import { AuthProvider, useAuth } from '@/hooks/useAuth.tsx'
import { Toaster } from '@/components/ui/toaster'
import LoadingSpinner from './components/LoadingSpinner'

const LandingPage = lazy(() => import('@/pages/LandingPage'))
const Login = lazy(() => import('@/pages/Login'))
const NotFound = lazy(() => import('@/pages/NotFound'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Networks = lazy(() => import('@/pages/Networks'))
const Units = lazy(() => import('@/pages/Units'))
const UnitsList = lazy(() => import('@/pages/UnitsList'))
const Readings = lazy(() => import('@/pages/Readings'))
const Calculator = lazy(() => import('@/pages/Calculator'))
const Billing = lazy(() => import('@/pages/Billing'))
const Plans = lazy(() => import('@/pages/Plans'))
const Checkout = lazy(() => import('@/pages/Checkout'))
const PaymentSuccess = lazy(() => import('@/pages/Checkout').then(m => ({ default: m.PaymentSuccess })))
const Subscribe = lazy(() => import('@/pages/Subscribe'))
const Distribuidoras = lazy(() => import('@/pages/Distribuidoras'))
const Tarifas = lazy(() => import('@/pages/Tarifas'))
const Profile = lazy(() => import('@/pages/Profile'))
const Settings = lazy(() => import('@/pages/Settings'))
const NetworkBalance = lazy(() => import('@/pages/NetworkBalance'))
const EnergyBalance = lazy(() => import('@/pages/EnergyBalance'))
const EnergyProjection = lazy(() => import('@/pages/EnergyProjection'))

// Componente protetor de rota
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  const [, setLocation] = useLocation()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      setLocation('/login')
    }
  }, [isAuthenticated, loading, setLocation])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="ml-4 text-lg text-primary font-medium">Carregando...</p>
      </div>
    )
  }

  if (!loading && !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-700">
        <p>Redirecionando para login...</p>
      </div>
    )
  }

  return <>{children}</>
}

const protectedRoutes = [
  { path: '/dashboard', component: Dashboard },
  { path: '/networks', component: Networks },
  { path: '/units', component: Units },
  { path: '/units-list', component: UnitsList },
  { path: '/networks/:networkId/units', component: Units },
  { path: '/networks/:networkId/balance', component: NetworkBalance },
  { path: '/readings/:unitId', component: Readings },
  { path: '/units/:unitId/readings', component: Readings },
  { path: '/calculator', component: Calculator },
  { path: '/billing', component: Billing },
  { path: '/plans', component: Plans },
  { path: '/checkout/:planId', component: Checkout },
  { path: '/pagamento-sucesso', component: PaymentSuccess },
  { path: '/subscribe', component: Subscribe },
  { path: '/distribuidoras', component: Distribuidoras },
  { path: '/tarifas', component: Tarifas },
  { path: '/profile', component: Profile },
  { path: '/settings', component: Settings },
  { path: '/energy-balance', component: EnergyBalance },
  { path: '/energy-projection', component: EnergyProjection },
]

function Router() {
  const { isAuthenticated } = useAuth()

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Switch>
        {/* Rota pública Landing Page */}
        <Route path="/" component={LandingPage} />

        {/* Rota pública Login, redireciona se autenticado */}
        <Route path="/login">
          {isAuthenticated ? <Dashboard /> : <Login />}
        </Route>

        {/* Rotas protegidas */}
        {protectedRoutes.map(({ path, component: Component }) => (
          <Route key={path} path={path}>
            <RequireAuth>
              <Component />
            </RequireAuth>
          </Route>
        ))}

        {/* Rota 404 */}
        <Route path="*" component={NotFound} />
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
