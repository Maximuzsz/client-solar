import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ChevronRight, 
  Activity, 
  Zap, 
  BarChart3, 
  Info,
  Search
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/api';
import { Network } from '@/types';
import {
  EnergyGaugeChart,
  EnvironmentalImpact,
  SolarConditions,
  FinancialSummary,
  MonthlyComparisonChart
} from '@/components/energy-balance';

export default function EnergyBalance() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Estado para controle das abas
  const [activeTab, setActiveTab] = useState<string>('networks');
  
  // Consulta para obter as redes
  const { data: networks, isLoading: isNetworksLoading } = useQuery({
    queryKey: ['networks'],
    queryFn: async () => {
      try {
        const data = await apiRequest<Network[]>('GET', '/networks');
        console.log('Redes obtidas:', data);
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Erro ao buscar redes:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar as redes.',
          variant: 'destructive'
        });
        return [];
      }
    }
  });

  // Consulta para obter dados gerais de balanço energético
  const { data: overviewData, isLoading: isOverviewLoading } = useQuery({
    queryKey: ['/api/v1/dashboard/advanced/energy-balance'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/v1/dashboard/advanced/energy-balance');
        return response;
      } catch (error) {
        console.error('Erro ao buscar dados de balanço:', error);
        return null;
      }
    }
  });

  // Formatação de moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Indicador de tendência positiva/negativa
  const getTrend = (value: number) => {
    if (value > 0) return 'positive';
    if (value < 0) return 'negative';
    return 'neutral';
  };

  const isLoading = isNetworksLoading || isOverviewLoading;

  return (
    <Layout>
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Balanço Energético</h1>
            <p className="text-muted-foreground">
              Análise detalhada do consumo e geração de energia
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/networks/new')}
            >
              Nova Rede
            </Button>
            <Button 
              variant="default" 
              size="sm"
              onClick={() => setActiveTab('overview')}
            >
              <Activity className="mr-2 h-4 w-4" />
              Ver Panorama Geral
            </Button>
          </div>
        </div>

        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full md:w-[400px] grid-cols-2">
            <TabsTrigger value="networks">
              <Search className="h-4 w-4 mr-2" />
              Selecionar Rede
            </TabsTrigger>
            <TabsTrigger value="overview">
              <BarChart3 className="h-4 w-4 mr-2" />
              Panorama Geral
            </TabsTrigger>
          </TabsList>

          <TabsContent value="networks" className="mt-4">
            {isNetworksLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {networks && networks.length > 0 ? (
                  networks.map(network => (
                    <Card 
                      key={network.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => navigate(`/networks/${network.id}/balance`)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{network.name}</CardTitle>
                          <Badge variant="outline" className="px-2 py-1 text-xs">
                            {/*network.units?.length || */0} unidades
                          </Badge>
                        </div>
                        <CardDescription className="line-clamp-2">
                          {network.description || 'Sem descrição'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="mt-2 flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            Criada em {format(new Date(network.createdAt || Date.now()), 'dd/MM/yyyy')}
                          </span>
                          <Button size="sm" variant="ghost" className="gap-1">
                            Ver Balanço
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-3 text-center py-8">
                    <div className="bg-muted/40 rounded-xl p-6 max-w-md mx-auto">
                      <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Nenhuma rede encontrada</h3>
                      <p className="text-muted-foreground mb-4">
                        Você precisa criar uma rede para poder visualizar o balanço energético.
                      </p>
                      <Button 
                        onClick={() => navigate('/networks')}
                      >
                        Criar Nova Rede
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="overview" className="mt-4">
            {isOverviewLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : (
              <>
                {overviewData ? (
                  <div className="space-y-6">
                    {/* Cards principais */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Balanço Energético</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className={`text-3xl font-bold ${
                                overviewData.energyBalance >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {Math.abs(overviewData.energyBalance).toLocaleString()} kWh
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {overviewData.energyBalance >= 0 ? 'Excedente' : 'Déficit'} de energia
                              </div>
                            </div>
                            <div>
                              {overviewData.energyBalance >= 0 ? (
                                <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                                  <Zap className="h-6 w-6 text-green-600" />
                                </div>
                              ) : (
                                <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                                  <Zap className="h-6 w-6 text-red-600" />
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Consumo Total</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="text-3xl font-bold text-orange-600">
                            {overviewData.totalConsumption.toLocaleString()} kWh
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Consumo total de todas as unidades
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Geração Total</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="text-3xl font-bold text-green-600">
                            {overviewData.totalGeneration.toLocaleString()} kWh
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Geração de todas as unidades solares
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Gauge e Financial Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Proporção Geração/Consumo</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <EnergyGaugeChart 
                            consumption={overviewData.totalConsumption} 
                            generation={overviewData.totalGeneration} 
                          />
                        </CardContent>
                      </Card>
                      
                      <FinancialSummary 
                        energyBalance={overviewData.energyBalance}
                        estimatedSavings={overviewData.estimatedSavings}
                        estimatedCost={overviewData.estimatedCost}
                      />
                    </div>

                    {/* Environmental Impact e Solar Conditions */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <EnvironmentalImpact 
                        energyBalance={overviewData.energyBalance}
                        co2Saved={overviewData.co2Saved}
                      />
                      
                      <SolarConditions solarData={overviewData.solar} />
                    </div>

                    {/* Monthly Comparison Chart */}
                    <MonthlyComparisonChart title="Histórico de Consumo e Geração (6 meses)" />
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Não foi possível carregar os dados de balanço energético.</p>
                    <Button className="mt-4" onClick={() => window.location.reload()}>
                      Tentar Novamente
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}