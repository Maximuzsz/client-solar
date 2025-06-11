import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { WidgetConfig } from '@/services/dashboardCustomization/dashboardLayoutService';
import { 
  Card,
  CardContent,
} from '@/components/ui/card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip 
} from 'recharts';
import { Home, Factory, CheckCircle, XCircle } from 'lucide-react';

interface UnitsSummaryWidgetProps {
  widget: WidgetConfig;
}

const UnitsSummaryWidget: React.FC<UnitsSummaryWidgetProps> = ({ widget }) => {
  // Extrair configurações do widget
  const {
    networkId,
    viewMode = 'all', // 'all', 'consumer', 'generator'
    showFilters = true,
    showChart = true,
  } = widget.config;
  
  // Estado local para filtros
  const [selectedNetworkId, setSelectedNetworkId] = useState<string | null>(
    networkId ? String(networkId) : null
  );
  const [selectedView, setSelectedView] = useState<string>(viewMode);
  
  // Consultar redes disponíveis, se necessário
  const { data: networksData } = useQuery({
    queryKey: ['/api/v1/networks'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/v1/networks');
      return response.data;
    },
    enabled: showFilters && !networkId,
  });
  
  // Consultar unidades da rede
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/v1/units/summary', selectedNetworkId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedNetworkId) params.append('networkId', selectedNetworkId);
      
      const response = await apiRequest('GET', `/api/v1/units/summary?${params.toString()}`);
      return response.data;
    },
    enabled: !!selectedNetworkId || !!networkId,
  });
  
  // Renderizar estados de carregamento/erro
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center p-4">
          <p className="text-red-500 mb-2">Erro ao carregar dados</p>
          <p className="text-sm text-gray-500">Tente novamente mais tarde</p>
        </div>
      </div>
    );
  }
  
  if (!data) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center p-4">
          <p className="text-gray-500">Selecione uma rede para visualizar as unidades</p>
        </div>
      </div>
    );
  }
  
  const { 
    totalUnits,
    consumerUnits,
    generatorUnits,
    activeUnits,
    inactiveUnits,
    unitsByConcessionaire,
    unitsByRegion,
  } = data;
  
  // Preparar dados para gráficos
  const unitTypeData = [
    { name: 'Consumidoras', value: consumerUnits, color: '#FF9500' },
    { name: 'Geradoras', value: generatorUnits, color: '#10B981' },
  ];
  
  const unitStatusData = [
    { name: 'Ativas', value: activeUnits, color: '#10B981' },
    { name: 'Inativas', value: inactiveUnits, color: '#6B7280' },
  ];
  
  // Função para renderizar o gráfico de pizza
  const renderPieChart = (data: any[], title: string) => {
    if (!data || data.length === 0 || data.every(item => item.value === 0)) {
      return (
        <div className="flex h-full items-center justify-center">
          <p className="text-sm text-gray-500">Sem dados disponíveis</p>
        </div>
      );
    }
    
    return (
      <div className="flex flex-col h-full">
        <h4 className="text-xs font-medium text-center mb-2">{title}</h4>
        <div className="flex-1 flex items-center justify-center">
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={60}
                fill="#8884d8"
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [value, '']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };
  
  return (
    <div className="h-full flex flex-col">
      {/* Filtros */}
      {showFilters && !networkId && networksData && networksData.length > 0 && (
        <div className="mb-4">
          <Select
            value={selectedNetworkId || ""}
            onValueChange={(value) => setSelectedNetworkId(value || null)}
          >
            <SelectTrigger className="w-[220px] h-8">
              <SelectValue placeholder="Selecionar rede" />
            </SelectTrigger>
            <SelectContent>
              {networksData.map((network: any) => (
                <SelectItem key={network.id} value={network.id.toString()}>
                  {network.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
      {/* Cards de resumo */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="p-3">
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-500 mb-1">Total</span>
              <span className="text-lg font-semibold text-blue-700">{totalUnits}</span>
              <span className="text-xs text-gray-500">Unidades</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-orange-50 border-orange-100">
          <CardContent className="p-3">
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-500 mb-1">Consumidoras</span>
              <span className="text-lg font-semibold text-orange-700">{consumerUnits}</span>
              <span className="text-xs text-gray-500">Unidades</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-green-50 border-green-100">
          <CardContent className="p-3">
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-500 mb-1">Geradoras</span>
              <span className="text-lg font-semibold text-green-700">{generatorUnits}</span>
              <span className="text-xs text-gray-500">Unidades</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Visões detalhadas */}
      {showChart && (
        <Tabs 
          defaultValue={selectedView} 
          value={selectedView}
          onValueChange={setSelectedView}
          className="flex-1 flex flex-col"
        >
          <TabsList className="w-full grid grid-cols-3 h-8">
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="consumer">Consumidoras</TabsTrigger>
            <TabsTrigger value="generator">Geradoras</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="flex-1 flex flex-col space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4 flex-1">
              {renderPieChart(unitTypeData, 'Distribuição por Tipo')}
              {renderPieChart(unitStatusData, 'Status das Unidades')}
            </div>
          </TabsContent>
          
          <TabsContent value="consumer" className="flex-1 flex flex-col mt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Home className="h-4 w-4 text-orange-500 mr-1" />
                <h3 className="text-sm font-medium">Unidades Consumidoras</h3>
              </div>
              <Badge variant="outline" className="bg-orange-50">
                {consumerUnits} unidades
              </Badge>
            </div>
            
            <div className="flex-1 space-y-3 overflow-auto">
              {unitsByConcessionaire && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="text-xs font-medium mb-2">Por Distribuidora</h4>
                  <div className="space-y-2">
                    {Object.entries(unitsByConcessionaire)
                      .filter(([name, data]) => data.consumer > 0)
                      .map(([name, data]) => (
                        <div key={name} className="flex justify-between items-center">
                          <span className="text-xs truncate" style={{ maxWidth: '180px' }}>{name}</span>
                          <Badge variant="secondary">{data.consumer}</Badge>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
              
              {unitsByRegion && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="text-xs font-medium mb-2">Por Região</h4>
                  <div className="space-y-2">
                    {Object.entries(unitsByRegion)
                      .filter(([name, data]) => data.consumer > 0)
                      .map(([name, data]) => (
                        <div key={name} className="flex justify-between items-center">
                          <span className="text-xs">{name}</span>
                          <Badge variant="secondary">{data.consumer}</Badge>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="generator" className="flex-1 flex flex-col mt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Factory className="h-4 w-4 text-green-500 mr-1" />
                <h3 className="text-sm font-medium">Unidades Geradoras</h3>
              </div>
              <Badge variant="outline" className="bg-green-50">
                {generatorUnits} unidades
              </Badge>
            </div>
            
            <div className="flex-1 space-y-3 overflow-auto">
              {unitsByConcessionaire && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="text-xs font-medium mb-2">Por Distribuidora</h4>
                  <div className="space-y-2">
                    {Object.entries(unitsByConcessionaire)
                      .filter(([name, data]) => data.generator > 0)
                      .map(([name, data]) => (
                        <div key={name} className="flex justify-between items-center">
                          <span className="text-xs truncate" style={{ maxWidth: '180px' }}>{name}</span>
                          <Badge variant="secondary">{data.generator}</Badge>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
              
              {unitsByRegion && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="text-xs font-medium mb-2">Por Região</h4>
                  <div className="space-y-2">
                    {Object.entries(unitsByRegion)
                      .filter(([name, data]) => data.generator > 0)
                      .map(([name, data]) => (
                        <div key={name} className="flex justify-between items-center">
                          <span className="text-xs">{name}</span>
                          <Badge variant="secondary">{data.generator}</Badge>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default UnitsSummaryWidget;