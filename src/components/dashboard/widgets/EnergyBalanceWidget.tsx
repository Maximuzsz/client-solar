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
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip 
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, Zap } from 'lucide-react';

interface EnergyBalanceWidgetProps {
  widget: WidgetConfig;
}

const EnergyBalanceWidget: React.FC<EnergyBalanceWidgetProps> = ({ widget }) => {
  // Extrair configurações do widget
  const {
    unitId,
    networkId,
    timeRange = 'month',
    showFinancialData = true,
  } = widget.config;
  
  // Estado local para filtros que podem ser alterados pelo usuário
  const [selectedTimeRange, setSelectedTimeRange] = useState<'month' | 'quarter' | 'year'>(
    timeRange as 'month' | 'quarter' | 'year'
  );
  
  // Consultar dados de balanço energético da API
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/v1/dashboard/advanced/energy-balance', selectedTimeRange, unitId, networkId],
    queryFn: async () => {
      // Construir parâmetros de consulta
      const params = new URLSearchParams();
      params.append('timeRange', selectedTimeRange);
      if (unitId) params.append('unitId', unitId.toString());
      if (networkId) params.append('networkId', networkId.toString());
      
      const response = await apiRequest('GET', `/api/v1/dashboard/advanced/energy-balance?${params.toString()}`);
      return response.data;
    },
  });
  
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };
  
  // Preparar dados para o gráfico de pizza
  const getPieData = () => {
    if (!data) return [];
    
    const { totalConsumption, totalGeneration } = data;
    
    if (totalGeneration > totalConsumption) {
      return [
        { name: 'Consumo', value: totalConsumption, color: '#FF9500' },
        { name: 'Excedente', value: totalGeneration - totalConsumption, color: '#10B981' },
      ];
    } else {
      return [
        { name: 'Geração', value: totalGeneration, color: '#10B981' },
        { name: 'Déficit', value: totalConsumption - totalGeneration, color: '#EF4444' },
      ];
    }
  };
  
  const pieData = getPieData();
  
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
          <p className="text-gray-500">Nenhum dado disponível</p>
        </div>
      </div>
    );
  }
  
  const { 
    totalConsumption, 
    totalGeneration,
    energyBalance,
    estimatedSavings,
    estimatedCost,
    co2Saved,
  } = data;
  
  const isPositiveBalance = energyBalance >= 0;
  
  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <Select
          value={selectedTimeRange}
          onValueChange={(value: 'month' | 'quarter' | 'year') => setSelectedTimeRange(value)}
        >
          <SelectTrigger className="w-[180px] h-8">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">Este Mês</SelectItem>
            <SelectItem value="quarter">Este Trimestre</SelectItem>
            <SelectItem value="year">Este Ano</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card className="bg-green-50 border-green-100">
          <CardContent className="p-3">
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 mb-1">Geração Total</span>
              <div className="flex items-baseline">
                <span className="text-lg font-semibold text-green-700">{totalGeneration.toLocaleString()}</span>
                <span className="text-xs ml-1 text-gray-500">kWh</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-orange-50 border-orange-100">
          <CardContent className="p-3">
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 mb-1">Consumo Total</span>
              <div className="flex items-baseline">
                <span className="text-lg font-semibold text-orange-700">{totalConsumption.toLocaleString()}</span>
                <span className="text-xs ml-1 text-gray-500">kWh</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex-1 grid grid-cols-2 gap-4">
        <div className="flex flex-col justify-center">
          <div className="text-center mb-2">
            <h3 className="text-sm font-medium text-gray-700">Balanço Energético</h3>
            <div className="flex items-center justify-center mt-1">
              {isPositiveBalance ? (
                <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
              )}
              <span 
                className={`text-xl font-bold ${isPositiveBalance ? 'text-green-600' : 'text-red-600'}`}
              >
                {Math.abs(energyBalance).toLocaleString()} kWh
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {isPositiveBalance 
                ? 'Excedente de energia gerada' 
                : 'Déficit de energia gerada'}
            </p>
          </div>
          
          {showFinancialData && (
            <div className="text-center mt-2">
              <h3 className="text-sm font-medium text-gray-700">
                {isPositiveBalance ? 'Economia Estimada' : 'Custo Adicional'}
              </h3>
              <div className="flex items-center justify-center mt-1">
                <Zap className={`w-4 h-4 ${isPositiveBalance ? 'text-green-500' : 'text-red-500'} mr-1`} />
                <span 
                  className={`text-lg font-bold ${isPositiveBalance ? 'text-green-600' : 'text-red-600'}`}
                >
                  {formatCurrency(isPositiveBalance ? estimatedSavings : estimatedCost)}
                </span>
              </div>
              
              {co2Saved > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  CO₂ evitado: {co2Saved.toLocaleString()} kg
                </p>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-center">
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={60}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [`${value} kWh`, '']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default EnergyBalanceWidget;