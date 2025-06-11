import { Link, useLocation } from 'wouter'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth.tsx'
import {
  LayoutDashboard,
  Zap,
  Building2,
  Settings,
  BarChart3,
  User,
  CreditCard,
  LampDesk,
  Landmark,
  TrendingUp,
  Package
} from 'lucide-react'

const navItems = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    roles: ['Admin', 'NetworkOwner', 'Consumer', 'Generator']
  },
  {
    id: 'networks',
    title: 'Redes',
    href: '/networks',
    icon: Zap,
    roles: ['Admin', 'NetworkOwner']
  },
  {
    id: 'units',
    title: 'Unidades',
    href: '/units',
    icon: Building2,
    roles: ['Admin', 'NetworkOwner', 'Consumer', 'Generator']
  },
  {
    id: 'concessionaires',
    title: 'Distribuidoras',
    href: '/distribuidoras',
    icon: Landmark,
    roles: ['Admin', 'NetworkOwner']
  },
  {
    id: 'tariffs',
    title: 'Tarifas',
    href: '/tarifas',
    icon: LampDesk,
    roles: ['Admin', 'NetworkOwner']
  },

  {
    id: 'energy-balance',
    title: 'Balanço Energético',
    href: '/energy-balance',
    icon: BarChart3,
    roles: ['Admin', 'NetworkOwner']
  },
  {
    id: 'energy-projection',
    title: 'Projeção de Energia',
    href: '/energy-projection',
    icon: TrendingUp,
    roles: ['Admin', 'NetworkOwner']
  },
  {
    id: 'calculator',
    title: 'Calculadora',
    href: '/calculator',
    icon: BarChart3,
    roles: ['Admin', 'NetworkOwner', 'Consumer', 'Generator']
  },
  {
    id: 'plans',
    title: 'Planos',
    href: '/plans',
    icon: Package,
    roles: ['Admin', 'NetworkOwner', 'Consumer', 'Generator']
  },
  {
    id: 'billing',
    title: 'Faturamento',
    href: '/billing',
    icon: CreditCard,
    roles: ['Admin', 'NetworkOwner']
  },
  {
    id: 'profile',
    title: 'Perfil',
    href: '/profile',
    icon: User,
    roles: ['Admin', 'NetworkOwner', 'Consumer', 'Generator']
  },
  {
    id: 'settings',
    title: 'Configurações',
    href: '/settings',
    icon: Settings,
    roles: ['Admin', 'NetworkOwner', 'Consumer', 'Generator']
  }
]

export function Sidebar({ isMobile = false, collapsed = false }: { isMobile?: boolean, collapsed?: boolean }) {
  const [location] = useLocation()
  const { user } = useAuth()
  
  // Filtra os itens de navegação com base no papel do usuário
  const filteredNavItems = navItems.filter(
    item => user && item.roles.includes(user.role)
  )

  // Classe base com modificações condicionais para mobile ou colapsada
  const asideClasses = isMobile
    ? "flex flex-col w-full h-[calc(100%-4rem)] bg-background"
    : collapsed 
      ? "h-screen w-16 flex-shrink-0 border-r bg-background flex flex-col transition-all duration-200"
      : "h-screen w-56 flex-shrink-0 border-r bg-background flex flex-col transition-all duration-200"

  return (
    <aside className={asideClasses}>
      {!isMobile && (
        <div className="flex h-16 items-center justify-center border-b px-2">
          <Link href="/" className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {!collapsed && <span className="text-lg font-bold">SolarShare</span>}
          </Link>
        </div>
      )}
      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-1">
          {filteredNavItems.map(item => (
            <li key={item.id}>
              <Link href={item.href}>
                <div
                  className={cn(
                    'flex items-center rounded-md transition-colors hover:bg-muted cursor-pointer',
                    collapsed 
                      ? 'justify-center px-2 py-2' 
                      : 'px-2.5 py-1.5',
                    location === item.href
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground'
                  )}
                  title={item.title}
                >
                  <item.icon className={cn("h-5 w-5", !collapsed && "mr-2 h-4 w-4")} />
                  {!collapsed && item.title}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="border-t p-3">
        <div className="flex items-center justify-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <span className="text-sm font-medium text-primary">
              {user?.username?.charAt(0).toUpperCase() || "U"}
            </span>
          </div>
          {!collapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium truncate">{user?.username || "Usuário"}</span>
              <span className="text-xs text-muted-foreground truncate">{user?.email || ""}</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}