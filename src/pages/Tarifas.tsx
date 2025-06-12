import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import tariffsAPI, { Tariff, TariffData } from '@/services/tariffsAPI'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AlertTriangle, Download, Globe, RefreshCw, Search, Search as SearchIcon } from 'lucide-react'
import { useState } from 'react'

export default function Tarifas() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('atuais')
  const [isUpdating, setIsUpdating] = useState(false)
  const [isWebScraping, setIsWebScraping] = useState(false)
  const [webScrapingData, setWebScrapingData] = useState<TariffData[] | null>(null)

  // Buscar tarifas
  const { data: tarifas, isLoading } = useQuery({
    queryKey: ['/api/v1/concessionaires/tariffs/all'],
    queryFn: async () => {
      try {
        return await tariffsAPI.getAllTariffs();
      } catch (error) {
        console.error('Erro ao buscar tarifas:', error)
        return []
      }
    }
  })

  // Atualizar tarifas - método antigo
  const handleUpdateTariffs = async () => {
    if (!user || user.role !== 'Admin') {
      toast({
        title: 'Acesso negado',
        description: 'Você não tem permissão para atualizar tarifas.',
        variant: 'destructive'
      })
      return
    }

    try {
      setIsUpdating(true)
      const token = localStorage.getItem('token')
      const response = await fetch('/api/v1/concessionaires/update-tariffs', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Erro ao atualizar tarifas')
      }

      // Atualiza a lista de tarifas
      queryClient.invalidateQueries({ queryKey: ['/api/v1/concessionaires/tariffs/all'] })

      toast({
        title: 'Tarifas atualizadas com sucesso',
        description: 'As tarifas foram atualizadas com sucesso.'
      })
    } catch (error) {
      console.error('Erro ao atualizar tarifas:', error)
      toast({
        title: 'Erro ao atualizar tarifas',
        description: 'Não foi possível atualizar as tarifas. Tente novamente mais tarde.',
        variant: 'destructive'
      })
    } finally {
      setIsUpdating(false)
    }
  }
  
  // Buscar tarifas via webscraping
  const handleWebScraping = async () => {
    try {
      setIsWebScraping(true)
      setWebScrapingData(null)
      
      const data = await tariffsAPI.getWebScrapingTariffs();
      setWebScrapingData(data);
      
      toast({
        title: 'Dados obtidos com sucesso',
        description: `Foram encontrados ${data.length} registros de tarifas.`,
      })
    } catch (error) {
      console.error('Erro ao realizar webscraping:', error)
      toast({
        title: 'Erro ao buscar tarifas',
        description: 'Não foi possível obter os dados das tarifas. Tente novamente mais tarde.',
        variant: 'destructive'
      })
    } finally {
      setIsWebScraping(false)
    }
  }
  
  // Salvar tarifas obtidas por webscraping
  const saveWebScrapingMutation = useMutation({
    mutationFn: tariffsAPI.saveWebScrapingTariffs,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/v1/concessionaires/tariffs/all'] })
      toast({
        title: 'Tarifas salvas com sucesso',
        description: data.message || `Foram processadas ${data.processedCount} tarifas.`,
      })
      setWebScrapingData(null)
    },
    onError: (error) => {
      console.error('Erro ao salvar tarifas:', error)
      toast({
        title: 'Erro ao salvar tarifas',
        description: 'Não foi possível salvar os dados das tarifas. Tente novamente mais tarde.',
        variant: 'destructive'
      })
    }
  })
  
  const handleSaveWebScrapingData = () => {
    if (!user || user.role !== 'Admin') {
      toast({
        title: 'Acesso negado',
        description: 'Você não tem permissão para atualizar tarifas.',
        variant: 'destructive'
      })
      return
    }
    
    saveWebScrapingMutation.mutate()
  }

  // Filtrar tarifas
  const filteredTarifas = tarifas?.filter(
    (tariff: Tariff) =>
      tariff.concessionaire?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tariff.concessionaire?.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tariff.type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Separar tarifas atuais e históricas
  const currentTarifas = filteredTarifas?.filter((tariff: Tariff) => !tariff.endDate)
  const historicalTarifas = filteredTarifas?.filter((tariff: Tariff) => tariff.endDate)

  if (isLoading) {
    return (
      <Layout>
        <div className="flex h-full w-full items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold">Tarifas de Energia</h1>
            <p className="text-muted-foreground">
              Visualize e gerencie as tarifas de energia das distribuidoras
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button 
              className="shrink-0" 
              onClick={handleWebScraping} 
              disabled={isWebScraping || saveWebScrapingMutation.isPending}
            >
              <Globe className={`mr-2 h-4 w-4 ${isWebScraping ? 'animate-spin' : ''}`} />
              {isWebScraping ? 'Buscando...' : 'Buscar Tarifas Atuais'}
            </Button>
          
            {user?.role === 'Admin' && (
              <Button 
                className="shrink-0" 
                onClick={handleUpdateTariffs} 
                disabled={isUpdating}
                variant="outline"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isUpdating ? 'animate-spin' : ''}`} />
                {isUpdating ? 'Atualizando...' : 'Atualizar Tarifas'}
              </Button>
            )}
            
            {user?.role === 'Admin' && webScrapingData && (
              <Button 
                className="shrink-0" 
                onClick={handleSaveWebScrapingData} 
                disabled={saveWebScrapingMutation.isPending}
                variant="default"
              >
                <Download className={`mr-2 h-4 w-4 ${saveWebScrapingMutation.isPending ? 'animate-spin' : ''}`} />
                {saveWebScrapingMutation.isPending ? 'Salvando...' : 'Salvar Dados'}
              </Button>
            )}
          </div>
        </div>

        {/* Dados do webscraping */}
        {webScrapingData && (
          <div className="rounded-md border">
            <div className="p-4 bg-blue-50 border-b">
              <h3 className="font-semibold text-lg flex items-center">
                <Globe className="mr-2 h-5 w-5 text-blue-600" /> 
                Dados Obtidos via Webscraping
              </h3>
              <p className="text-sm text-muted-foreground">
                Foram encontrados {webScrapingData.length} registros. Você pode salvar esses dados no sistema.
              </p>
            </div>
            <div className="max-h-80 overflow-hidden">
              <DataTable
                data={webScrapingData || []}
                columns={[
                  {
                    header: "Distribuidora",
                    accessorKey: "Distribuidora",
                    cell: (item) => <span className="font-medium">{item.Distribuidora}</span>
                  },
                  {
                    header: "UF",
                    accessorKey: "UF",
                    cell: (item) => (
                      <div className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-sm font-medium text-blue-700 border border-blue-200">
                        {item.UF}
                      </div>
                    )
                  },
                  {
                    header: "Posição",
                    accessorKey: "Posição"
                  },
                  {
                    header: "Tarifa (R$)",
                    accessorKey: "Tarifa",
                    cell: (item) => (
                      <div className="text-right font-medium">
                        R$ {parseFloat(item.Tarifa).toFixed(2)}
                      </div>
                    ),
                    className: "text-right"
                  }
                ]}
                initialPageSize={5}
                className="max-h-full overflow-auto"
              />
            </div>
          </div>
        )}
        
        {/* Info cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-blue-50 p-4">
            <div className="flex items-center space-x-2">
              <SearchIcon className="h-5 w-5 text-blue-600" />
              <h3 className="text-sm font-medium text-blue-600">Coleta de Dados</h3>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              As tarifas são obtidas de portais oficiais. A última atualização acontece automaticamente a cada 30 dias.
            </p>
          </div>
          <div className="rounded-lg bg-green-50 p-4">
            <div className="flex items-center space-x-2">
              <Download className="h-5 w-5 text-green-600" />
              <h3 className="text-sm font-medium text-green-600">Uso nos Cálculos</h3>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              As tarifas são utilizadas para calcular o custo de energia em relatórios e na calculadora solar.
            </p>
          </div>
          <div className="rounded-lg bg-yellow-50 p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <h3 className="text-sm font-medium text-yellow-600">Observação</h3>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Os valores não incluem impostos e taxas adicionais que podem variar conforme a região.
            </p>
          </div>
        </div>

        {/* Search and tabs */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Pesquisar tarifas..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="atuais">Tarifas Atuais</TabsTrigger>
              <TabsTrigger value="historico">Histórico de Atualizações</TabsTrigger>
            </TabsList>
            
            <TabsContent value="atuais" className="pt-4">
              <DataTable
                data={currentTarifas || []}
                columns={[
                  {
                    header: "Data",
                    accessorKey: "startDate",
                    cell: (item) => (
                      <span>
                        {item.startDate ? format(new Date(item.startDate), 'dd/MM/yyyy', { locale: ptBR }) : '02/05/2025'}
                      </span>
                    )
                  },
                  {
                    header: "Distribuidora",
                    accessorKey: "concessionaire",
                    cell: (item) => <span className="font-medium">{item.concessionaire?.name || 'Light'}</span>
                  },
                  {
                    header: "Região",
                    accessorKey: "concessionaire",
                    cell: (item) => (
                      <div className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-sm font-medium text-blue-700 border border-blue-200">
                        {item.concessionaire?.region || 'RJ'}
                      </div>
                    )
                  },
                  {
                    header: "Tipo",
                    accessorKey: "type",
                    cell: (item) => (
                      <div className="inline-flex items-center rounded-md bg-blue-100 px-2.5 py-1 text-sm font-medium text-blue-600">
                        {item.type === 'Residential' ? 'Residencial' : 
                         item.type === 'Commercial' ? 'Comercial' : 'Industrial'}
                      </div>
                    )
                  },
                  {
                    header: "Valor (R$/kWh)",
                    accessorKey: "value",
                    cell: (item) => (
                      <div className="text-right font-medium">
                        R$ {item.value.toFixed(2)}
                      </div>
                    ),
                    className: "text-right"
                  }
                ]}
                initialPageSize={10}
                emptyMessage={searchTerm 
                  ? 'Nenhuma tarifa atual encontrada para esta pesquisa.' 
                  : 'Nenhuma tarifa atual cadastrada.'}
              />
            </TabsContent>
            
            <TabsContent value="historico" className="pt-4">
              <DataTable
                data={historicalTarifas || []}
                columns={[
                  {
                    header: "Período",
                    accessorKey: "startDate",
                    cell: (item) => (
                      <span>
                        {item.startDate && item.endDate 
                          ? `${format(new Date(item.startDate), 'dd/MM/yyyy', { locale: ptBR })} - ${format(new Date(item.endDate), 'dd/MM/yyyy', { locale: ptBR })}`
                          : '02/05/2025 - 02/05/2025'}
                      </span>
                    )
                  },
                  {
                    header: "Distribuidora",
                    accessorKey: "concessionaire",
                    cell: (item) => <span className="font-medium">{item.concessionaire?.name || 'Light'}</span>
                  },
                  {
                    header: "Região",
                    accessorKey: "concessionaire",
                    cell: (item) => (
                      <div className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-sm font-medium text-blue-700 border border-blue-200">
                        {item.concessionaire?.region || 'RJ'}
                      </div>
                    )
                  },
                  {
                    header: "Tipo",
                    accessorKey: "type",
                    cell: (item) => (
                      <div className="inline-flex items-center rounded-md bg-blue-100 px-2.5 py-1 text-sm font-medium text-blue-600">
                        {item.type === 'Residential' ? 'Residencial' : 
                         item.type === 'Commercial' ? 'Comercial' : 'Industrial'}
                      </div>
                    )
                  },
                  {
                    header: "Valor (R$/kWh)",
                    accessorKey: "value",
                    cell: (item) => (
                      <div className="text-right font-medium">
                        R$ {item.value.toFixed(2)}
                      </div>
                    ),
                    className: "text-right"
                  }
                ]}
                initialPageSize={10}
                emptyMessage={searchTerm 
                  ? 'Nenhuma tarifa histórica encontrada para esta pesquisa.' 
                  : 'Nenhuma tarifa histórica cadastrada.'}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}