import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { WidgetConfig } from '@/services/dashboardCustomization/dashboardLayoutService';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface FinancialSummaryWidgetProps {
  widget: WidgetConfig;
}

const FinancialSummaryWidget: React.FC<FinancialSummaryWidgetProps> = ({ widget }) => {
  // Extrair configurações do widget
  const {
    unitId,
    networkId,
    timeRange = 'month',
    showChart = true,
    comparisonMode = 'year', // 'year', 'prev'
  } = widget.config;
  
  // Estado local para filtros que podem ser alterados pelo usuário
  const [selectedTimeRange, setSelectedTimeRange] = useState<'month' | 'quarter' | 'year'>(
    timeRange as 'month' | 'quarter' | 'year'
  );
  
  // Consultar dados financeiros da API
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/v1/dashboard/advanced/financial', selectedTimeRange, unitId, networkId, comparisonMode],
    queryFn: async () => {
      // Construir parâmetros de consulta
      const params = new URLSearchParams();
      params.append('timeRange', selectedTimeRange);
      params.append('comparisonMode', comparisonMode);
      if (unitId) params.append('unitId', unitId.toString());
      if (networkId) params.append('networkId', networkId.toString());
      
      const response = await apiRequest('GET', `/api/v1/dashboard/advanced/financial?${params.toString()}`);
      return response.data;
    },
  });
  
  // Formatação de moeda
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };
  
  // Formatação de percentual
  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
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
    currentSavings,
    previousSavings,
    savingsChange,
    consumptionCost,
    generationValue,
    netSavings,
    monthlySavings = [],
    projectedAnnualSavings,
    roi,
  } = data;
  
  // Formatação de dados para o gráfico
  const chartData = monthlySavings.map((item: any) => ({
    name: item.month,
    savings: item.value,
  }));
  
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
      
      <div className="flex flex-col space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-medium text-gray-700">Economia Total</h3>
              <p className="text-2xl font-bold">{formatCurrency(currentSavings)}</p>
            </div>
            
            <div className="flex items-center">
              {savingsChange >= 0 ? (
                <TrendingUp className="h-5 w-5 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500 mr-1" />
              )}
              <span 
                className={`text-sm font-semibold ${
                  savingsChange >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formatPercentage(savingsChange)}
              </span>
            </div>
          </div>
          
          <div className="text-xs text-gray-500">
            {comparisonMode === 'year' 
              ? 'Comparado ao mesmo período do ano anterior' 
              : 'Comparado ao período anterior'}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="text-xs font-medium text-gray-500">Custo de Consumo</h4>
            <p className="text-base font-semibold text-red-600">{formatCurrency(consumptionCost)}</p>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="text-xs font-medium text-gray-500">Valor Gerado</h4>
            <p className="text-base font-semibold text-green-600">{formatCurrency(generationValue)}</p>
          </div>
        </div>
        
        {/* Exibir gráfico se configurado */}
        {showChart && (
          <div className="flex-1 min-h-[130px]">
            <h3 className="text-xs font-medium text-gray-700 mb-1">Economia Mensal</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} tickMargin={5} />
                <YAxis 
                  tickFormatter={(value) => `R$${value}`} 
                  tick={{ fontSize: 10 }} 
                  tickMargin={5}
                  width={45}
                />
                <Tooltip 
                  formatter={(value) => [formatCurrency(value as number), 'Economia']}
                  labelFormatter={(label) => `Mês: ${label}`}
                />
                <Bar 
                  dataKey="savings" 
                  fill="#10B981" 
                  radius={[4, 4, 0, 0]}
                  name="Economia"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        
        {/* Projeção anual e ROI */}
        {projectedAnnualSavings && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex justify-between items-start mb-1">
              <h4 className="text-xs font-medium text-gray-500">Projeção Anual</h4>
              <span className="text-sm font-semibold">{formatCurrency(projectedAnnualSavings)}</span>
            </div>
            
            {roi && (
              <div className="mt-2">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="text-xs font-medium text-gray-500">Retorno do Investimento</h4>
                  <span className="text-xs">{roi.years.toFixed(1)} anos</span>
                </div>
                <Progress value={Math.min((roi.current / roi.target) * 100, 100)} className="h-2" />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-500">{formatCurrency(roi.current)}</span>
                  <span className="text-xs text-gray-500">{formatCurrency(roi.target)}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialSummaryWidget;