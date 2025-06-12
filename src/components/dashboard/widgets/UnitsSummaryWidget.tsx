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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiRequest } from '@/lib/queryClient';
import { WidgetConfig } from '@/services/dashboardCustomization/dashboardLayoutService';
import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

interface UnitsSummaryWidgetProps {
  widget: WidgetConfig;
}

const UnitsSummaryWidget: React.FC<UnitsSummaryWidgetProps> = ({ widget }) => {
  const {
    networkId,
    viewMode = 'all',
    showFilters = true,
    showChart = true,
  } = widget.config;

  const [selectedNetworkId, setSelectedNetworkId] = useState<string | null>(networkId ? String(networkId) : null);
  const [selectedView, setSelectedView] = useState<string>(viewMode);

  const { data: networksData } = useQuery({
    queryKey: ['/api/v1/networks'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/v1/networks');
      return response.data;
    },
    enabled: showFilters && !networkId,
  });

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

  if (isLoading) {
    return <div className="h-full flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div></div>;
  }

  if (error) {
    return <div className="h-full flex items-center justify-center"><div className="text-center p-4"><p className="text-red-500 mb-2">Erro ao carregar dados</p><p className="text-sm text-gray-500">Tente novamente mais tarde</p></div></div>;
  }

  if (!data) {
    return <div className="h-full flex items-center justify-center"><div className="text-center p-4"><p className="text-gray-500">Selecione uma rede para visualizar as unidades</p></div></div>;
  }

  const { totalUnits, consumerUnits, generatorUnits, activeUnits, inactiveUnits} = data;

  const unitTypeData = [
    { name: 'Consumidoras', value: consumerUnits, color: '#FF9500' },
    { name: 'Geradoras', value: generatorUnits, color: '#10B981' },
  ];

  const unitStatusData = [
    { name: 'Ativas', value: activeUnits, color: '#10B981' },
    { name: 'Inativas', value: inactiveUnits, color: '#6B7280' },
  ];

  const renderPieChart = (data: any[], title: string) => {
    if (!data || data.length === 0 || data.every(item => item.value === 0)) {
      return <div className="flex h-full items-center justify-center"><p className="text-sm text-gray-500">Sem dados disponíveis</p></div>;
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
                {data.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
              </Pie>
              <Tooltip formatter={(value) => [value, '']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {showFilters && !networkId && networksData?.length > 0 && (
        <div className="mb-4">
          <Select value={selectedNetworkId || ""} onValueChange={(value) => setSelectedNetworkId(value || null)}>
            <SelectTrigger className="w-[220px] h-8">
              <SelectValue placeholder="Selecionar rede" />
            </SelectTrigger>
            <SelectContent>
              {networksData.map((network: any) => (
                <SelectItem key={network.id} value={network.id.toString()}>{network.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 mb-4">
        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Total</p>
            <p className="text-lg font-semibold text-blue-700">{totalUnits}</p>
            <p className="text-xs text-gray-500">Unidades</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 border-orange-100">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Consumidoras</p>
            <p className="text-lg font-semibold text-orange-700">{consumerUnits}</p>
            <p className="text-xs text-gray-500">Unidades</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-100">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Geradoras</p>
            <p className="text-lg font-semibold text-green-700">{generatorUnits}</p>
            <p className="text-xs text-gray-500">Unidades</p>
          </CardContent>
        </Card>
      </div>

      {showChart && (
        <Tabs defaultValue={selectedView} value={selectedView} onValueChange={setSelectedView} className="flex-1 flex flex-col">
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

          {/* Conteúdos para consumer e generator podem ser revisados conforme necessidade */}
        </Tabs>
      )}
    </div>
  );
};

export default UnitsSummaryWidget;
