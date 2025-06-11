import { useQuery } from '@tanstack/react-query'
import { Layout } from '@/components/layout/Layout'
import { Card } from '@/components/ui/card'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts'
import { Zap, Users, Building2, TrendingUp, Info } from 'lucide-react'
import { apiRequest } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { useState } from 'react'
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'

// Tipo para o período do dashboard
type DashboardPeriod = 'week' | 'month' | 'quarter' | 'year' | 'all'

// Interface para os dados do dashboard correspondente ao que a API retorna
interface DashboardData {
  totalConsumption: number;
  consumptionChange: number;
  totalGeneration: number;
  generationChange: number;
  energyBalance: number;
  estimatedSavings: number;
  co2Saved: number;
  treesEquivalent: number;
  recentReadings: {
    unit: string;
    value: number;
    date: string;
    type: 'Consumer' | 'Generator';
  }[];
  monthlyProgress: {
    month: string;
    consumption: number;
    generation: number;
  }[];
}

export default function Dashboard() {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [period, setPeriod] = useState<DashboardPeriod>('month');
  
  // Carregamento de dados do dashboard a partir da API
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['dashboard', period],
    queryFn: async () => {
      try {
        // Chamada real à API com o período selecionado
        const data = await apiRequest<DashboardData>('GET', `/api/v1/dashboard?period=${period}`);
        return data || {
          totalConsumption: 0,
          consumptionChange: 0,
          totalGeneration: 0,
          generationChange: 0,
          energyBalance: 0,
          estimatedSavings: 0,
          co2Saved: 0,
          treesEquivalent: 0,
          recentReadings: [],
          monthlyProgress: []
        };
      } catch (error) {
        // Erro tratado silenciosamente para não falhar o aplicativo
        // Retorna objeto vazio que será usado como fallback
        // Retorna um objeto vazio para evitar erros
        return {
          totalConsumption: 0,
          consumptionChange: 0,
          totalGeneration: 0,
          generationChange: 0,
          energyBalance: 0,
          estimatedSavings: 0,
          co2Saved: 0,
          treesEquivalent: 0,
          recentReadings: [],
          monthlyProgress: []
        };
      }
    },
    // Configurações adicionais para evitar erros
    retry: 1,
    staleTime: 60 * 1000, // 1 minuto até considerar obsoleto
    refetchOnWindowFocus: false
  })

  if (isLoading) {
    return (
      <Layout>
        <div className="flex h-full w-full items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </Layout>
    )
  }
  
  if (error) {
    return (
      <Layout>
        <div className="flex h-full w-full flex-col items-center justify-center gap-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-destructive">Erro ao carregar dados</h2>
            <p className="text-muted-foreground">Ocorreu um erro ao buscar dados do dashboard. Por favor, tente novamente.</p>
          </div>
          <button 
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
            onClick={() => window.location.reload()}
          >
            Tentar novamente
          </button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Visão geral da sua geração e consumo de energia
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <label htmlFor="period-select" className="text-sm font-medium">
                Período:
              </label>
              <Select
                value={period}
                onValueChange={(value: DashboardPeriod) => setPeriod(value)}
              >
                <SelectTrigger className="h-9 w-[140px]">
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="week">Esta Semana</SelectItem>
                    <SelectItem value="month">Este Mês</SelectItem>
                    <SelectItem value="quarter">Este Trimestre</SelectItem>
                    <SelectItem value="year">Este Ano</SelectItem>
                    <SelectItem value="all">Todo o Período</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            
            <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Info className="h-4 w-4 mr-2" />
                  Ajuda
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Sobre o Dashboard</DialogTitle>
                  <DialogDescription>
                    O dashboard principal do SolarShare
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-1">Métricas Principais</h3>
                    <p className="text-sm text-muted-foreground">
                      O dashboard mostra informações sobre geração e consumo de energia, economia 
                      estimada e balanço energético.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-1">Visualização de Dados</h3>
                    <p className="text-sm text-muted-foreground">
                      O gráfico mostra a comparação entre geração e consumo de energia ao longo do tempo.
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => setIsHelpOpen(false)}>Entendi</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <div className="space-y-6">
          {/* Cards de estatísticas principais */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="p-6 transition-all hover:shadow-md">
              <div className="flex items-center space-x-4">
                <div className="rounded-full bg-green-100 p-3">
                  <Zap className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Gerado
                  </p>
                  <h3 className="text-2xl font-bold">
                    {dashboardData?.totalGeneration ? dashboardData.totalGeneration.toLocaleString() : '0'} kWh
                  </h3>
                  {dashboardData?.generationChange !== undefined && dashboardData.generationChange !== 0 && (
                    <p className={`text-xs ${(dashboardData.generationChange || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(dashboardData.generationChange || 0) > 0 ? '↑' : '↓'} {Math.abs(Math.round(dashboardData.generationChange || 0))}% em relação ao mês anterior
                    </p>
                  )}
                </div>
              </div>
            </Card>
            
            <Card className="p-6 transition-all hover:shadow-md">
              <div className="flex items-center space-x-4">
                <div className="rounded-full bg-blue-100 p-3">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Economia Estimada
                  </p>
                  <h3 className="text-2xl font-bold">
                    R$ {dashboardData?.estimatedSavings ? dashboardData.estimatedSavings.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
                  </h3>
                </div>
              </div>
            </Card>
            
            <Card className="p-6 transition-all hover:shadow-md">
              <div className="flex items-center space-x-4">
                <div className="rounded-full bg-orange-100 p-3">
                  <Building2 className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Consumo Total
                  </p>
                  <h3 className="text-2xl font-bold">
                    {dashboardData?.totalConsumption ? dashboardData.totalConsumption.toLocaleString() : '0'} kWh
                  </h3>
                  {dashboardData?.consumptionChange !== undefined && dashboardData.consumptionChange !== 0 && (
                    <p className={`text-xs ${(dashboardData.consumptionChange || 0) < 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(dashboardData.consumptionChange || 0) > 0 ? '↑' : '↓'} {Math.abs(Math.round(dashboardData.consumptionChange || 0))}% em relação ao mês anterior
                    </p>
                  )}
                </div>
              </div>
            </Card>
            
            <Card className="p-6 transition-all hover:shadow-md">
              <div className="flex items-center space-x-4">
                <div className="rounded-full bg-purple-100 p-3">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Balanço Energético
                  </p>
                  <h3 className="text-2xl font-bold">
                    {dashboardData?.energyBalance ? dashboardData.energyBalance.toLocaleString() : '0'} kWh
                  </h3>
                </div>
              </div>
            </Card>
          </div>
          
          {/* Cards de estatísticas ambientais */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-100 p-6 transition-all hover:shadow-md">
              <h3 className="text-lg font-semibold text-green-800 mb-4">Impacto Ambiental</h3>
              <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-200 rounded-full mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-green-800 font-medium">CO₂ Evitado</p>
                      <p className="text-sm text-green-600">Graças à sua energia limpa</p>
                    </div>
                  </div>
                  <p className="text-xl font-bold text-green-800">{dashboardData?.co2Saved ? dashboardData.co2Saved.toLocaleString() : '0'} kg</p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-200 rounded-full mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-green-800 font-medium">Equivalente em Árvores</p>
                      <p className="text-sm text-green-600">Árvores necessárias para o mesmo efeito</p>
                    </div>
                  </div>
                  <p className="text-xl font-bold text-green-800">{dashboardData?.treesEquivalent ? dashboardData.treesEquivalent.toLocaleString() : '0'}</p>
                </div>
              </div>
            </Card>
            
            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-100 p-6 transition-all hover:shadow-md">
              <h3 className="text-lg font-semibold text-blue-800 mb-4">Resumo Financeiro</h3>
              <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-200 rounded-full mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-blue-800 font-medium">Economia Total Estimada</p>
                      <p className="text-sm text-blue-600">Valor economizado com energia solar</p>
                    </div>
                  </div>
                  <p className="text-xl font-bold text-blue-800">
                    R$ {dashboardData?.estimatedSavings ? dashboardData.estimatedSavings.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
                  </p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-200 rounded-full mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-blue-800 font-medium">Balanço Energético</p>
                      <p className="text-sm text-blue-600">Diferença entre geração e consumo</p>
                    </div>
                  </div>
                  <p className={`text-xl font-bold ${dashboardData?.energyBalance && dashboardData.energyBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {dashboardData?.energyBalance ? dashboardData.energyBalance.toLocaleString() : '0'} kWh
                    <span className="text-sm ml-1">
                      {dashboardData?.energyBalance && dashboardData.energyBalance >= 0 ? '(excedente)' : '(déficit)'}
                    </span>
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Gráfico de consumo vs geração */}
          <Card className="p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Consumo vs Geração (kWh)</h2>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
                  <span className="text-sm text-gray-600">Consumo</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-sm text-gray-600">Geração</span>
                </div>
              </div>
            </div>
            
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {dashboardData?.monthlyProgress && dashboardData.monthlyProgress.length > 0 ? (
                  <BarChart
                    data={dashboardData.monthlyProgress}
                    margin={{ top: 20, right: 30, left: 20, bottom: 15 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                      tickFormatter={(value) => `${value} kWh`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '8px',
                        border: '1px solid #E5E7EB',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      }}
                      formatter={(value) => [`${value.toLocaleString()} kWh`, '']}
                      labelStyle={{ color: '#111827', fontWeight: 'bold' }}
                    />
                    <Legend />
                    <Bar 
                      dataKey="consumption" 
                      fill="#FF9500" 
                      name="Consumo" 
                      radius={[4, 4, 0, 0]}
                      maxBarSize={50}
                    />
                    <Bar 
                      dataKey="generation" 
                      fill="#10B981" 
                      name="Geração" 
                      radius={[4, 4, 0, 0]}
                      maxBarSize={50}
                    />
                  </BarChart>
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-50 rounded-lg border border-gray-100">
                    <div className="text-center p-6">
                      <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <p className="text-gray-500 font-medium">Sem dados disponíveis</p>
                      <p className="text-gray-400 text-sm mt-1">
                        Adicione unidades e registre leituras para visualizar o gráfico
                      </p>
                    </div>
                  </div>
                )}
              </ResponsiveContainer>
            </div>
            
            {dashboardData?.monthlyProgress && dashboardData.monthlyProgress.length > 0 && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                  <p className="text-sm text-orange-800 font-medium">Média de Consumo</p>
                  <p className="text-lg font-bold text-orange-700">
                    {dashboardData.monthlyProgress.length > 0 
                      ? (dashboardData.monthlyProgress.reduce((sum, item) => sum + item.consumption, 0) / dashboardData.monthlyProgress.length).toFixed(0) 
                      : '0'} kWh/mês
                  </p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                  <p className="text-sm text-green-800 font-medium">Média de Geração</p>
                  <p className="text-lg font-bold text-green-700">
                    {dashboardData.monthlyProgress.length > 0 
                      ? (dashboardData.monthlyProgress.reduce((sum, item) => sum + item.generation, 0) / dashboardData.monthlyProgress.length).toFixed(0) 
                      : '0'} kWh/mês
                  </p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <p className="text-sm text-blue-800 font-medium">Eficiência Energética</p>
                  <p className="text-lg font-bold text-blue-700">
                    {dashboardData.totalConsumption > 0 
                      ? `${((dashboardData.totalGeneration / dashboardData.totalConsumption) * 100).toFixed(0)}%` 
                      : 'N/A'}
                  </p>
                </div>
              </div>
            )}
          </Card>
          
          {/* Seção de Últimas Leituras */}
          {dashboardData?.recentReadings && dashboardData.recentReadings.length > 0 && (
            <Card className="p-6 shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Últimas Leituras</h2>
                <Button variant="outline" size="sm" onClick={() => window.location.href = '/readings'}>
                  Ver Todas
                </Button>
              </div>
              
              <div className="overflow-auto">
                <table className="w-full min-w-[500px]">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="py-3 px-4 text-left font-medium text-gray-600">Unidade</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-600">Tipo</th>
                      <th className="py-3 px-4 text-right font-medium text-gray-600">Valor (kWh)</th>
                      <th className="py-3 px-4 text-right font-medium text-gray-600">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.recentReadings.map((reading, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-800">{reading.unit}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            reading.type === 'Consumer' 
                              ? 'bg-orange-100 text-orange-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {reading.type === 'Consumer' ? 'Consumo' : 'Geração'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-medium">{reading.value.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right text-gray-600">
                          {new Date(reading.date).toLocaleDateString('pt-BR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  )
}