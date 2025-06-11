import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { WidgetConfig } from '@/services/dashboardCustomization/dashboardLayoutService';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface ConsumptionChartWidgetProps {
  widget: WidgetConfig;
}

const ConsumptionChartWidget: React.FC<ConsumptionChartWidgetProps> = ({ widget }) => {
  // Extrair configurações do widget
  const {
    timeRange = 'month',
    unitId,
    networkId,
    showLabels = true,
    colorScheme = 'blue',
  } = widget.config;
  
  // Estado local para filtros que podem ser alterados pelo usuário
  const [selectedTimeRange, setSelectedTimeRange] = useState<'day' | 'week' | 'month' | 'year'>(
    timeRange as 'day' | 'week' | 'month' | 'year'
  );
  
  // Consultar dados de consumo da API
  const { data, isLoading, error } = useQuery({
    queryKey: ['/dashboard/consumption', selectedTimeRange, unitId, networkId],
    queryFn: async () => {
      // Construir parâmetros de consulta
      const params = new URLSearchParams();
      params.append('timeRange', selectedTimeRange);
      if (unitId) params.append('unitId', unitId.toString());
      if (networkId) params.append('networkId', networkId.toString());
      
      const response = await apiRequest('GET', `/dashboard/consumption?${params.toString()}`);
      return response.data;
    },
  });
  
  // Função para obter cor com base no esquema de cores definido
  const getColors = () => {
    switch (colorScheme) {
      case 'blue':
        return {
          stroke: '#3b82f6',
          fill: '#3b82f680',
        };
      case 'orange':
        return {
          stroke: '#f97316',
          fill: '#f9731680',
        };
      case 'purple':
        return {
          stroke: '#8b5cf6',
          fill: '#8b5cf680',
        };
      case 'red':
        return {
          stroke: '#ef4444',
          fill: '#ef444480',
        };
      default:
        return {
          stroke: '#3b82f6',
          fill: '#3b82f680',
        };
    }
  };
  
  const colors = getColors();
  
  // Formatar dados para o gráfico
  const formattedData = useMemo(() => {
    if (!data) return [];
    
    // Mapear dados da API para o formato que o Recharts espera
    return data.map((item: any) => ({
      date: new Date(item.date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        ...(selectedTimeRange === 'year' && { year: 'numeric' }),
      }),
      consumo: item.consumption,
    }));
  }, [data, selectedTimeRange]);
  
  // Formatador para o eixo Y (kWh)
  const formatYAxis = (value: number) => {
    return `${value} kWh`;
  };
  
  // Formatador para o tooltip
  const formatTooltip = (value: number) => {
    return [`${value} kWh`, 'Consumo'];
  };
  
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
  
  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <Select
          value={selectedTimeRange}
          onValueChange={(value: 'day' | 'week' | 'month' | 'year') => setSelectedTimeRange(value)}
        >
          <SelectTrigger className="w-[180px] h-8">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Hoje</SelectItem>
            <SelectItem value="week">Esta Semana</SelectItem>
            <SelectItem value="month">Este Mês</SelectItem>
            <SelectItem value="year">Este Ano</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={formattedData}
            margin={{
              top: 5,
              right: 20,
              left: showLabels ? 30 : 0,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }} 
              tickMargin={10}
              hide={!showLabels}
            />
            <YAxis 
              tickFormatter={formatYAxis} 
              tick={{ fontSize: 12 }} 
              tickMargin={10}
              hide={!showLabels}
            />
            <Tooltip 
              formatter={formatTooltip} 
              labelFormatter={(label) => `Data: ${label}`}
            />
            {showLabels && <Legend />}
            <Area
              type="monotone"
              dataKey="consumo"
              name="Consumo"
              stroke={colors.stroke}
              fill={colors.fill}
              strokeWidth={2}
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ConsumptionChartWidget;