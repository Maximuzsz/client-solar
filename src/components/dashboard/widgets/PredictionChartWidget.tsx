import React, { useState, useMemo } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceArea } from 'recharts';
import { 
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group';

interface PredictionChartWidgetProps {
  widget: WidgetConfig;
}

enum PredictionType {
  CONSUMPTION = 'consumption',
  GENERATION = 'generation',
  BOTH = 'both',
}

const PredictionChartWidget: React.FC<PredictionChartWidgetProps> = ({ widget }) => {
  // Extrair configurações do widget
  const {
    unitId,
    networkId,
    predictionRange = 'week',
    predictionType = PredictionType.BOTH,
    showConfidenceInterval = true,
    predictionMethod = 'ensemble', // 'arima', 'lstm', 'ensemble'
    colorScheme = 'default',
  } = widget.config;
  
  // Estado local para filtros que podem ser alterados pelo usuário
  const [selectedPredictionRange, setSelectedPredictionRange] = useState<'day' | 'week' | 'month'>(
    predictionRange as 'day' | 'week' | 'month'
  );
  const [selectedPredictionType, setSelectedPredictionType] = useState<PredictionType>(
    predictionType as PredictionType
  );
  const [selectedConfidenceInterval, setSelectedConfidenceInterval] = useState<boolean>(
    !!showConfidenceInterval
  );
  
  // Consultar dados de previsão da API
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/v1/dashboard/advanced/predictions', selectedPredictionRange, selectedPredictionType, unitId, networkId, predictionMethod],
    queryFn: async () => {
      // Construir parâmetros de consulta
      const params = new URLSearchParams();
      params.append('range', selectedPredictionRange);
      params.append('type', selectedPredictionType);
      params.append('method', predictionMethod);
      if (unitId) params.append('unitId', unitId.toString());
      if (networkId) params.append('networkId', networkId.toString());
      
      const response = await apiRequest('GET', `/api/v1/dashboard/advanced/predictions?${params.toString()}`);
      return response.data;
    },
  });
  
  // Função para obter cores com base no esquema de cores definido
  const getColors = () => {
    switch (colorScheme) {
      case 'default':
        return {
          consumption: {
            actual: '#3b82f6',
            predicted: '#1d4ed8',
            confidence: '#93c5fd',
          },
          generation: {
            actual: '#10b981',
            predicted: '#047857',
            confidence: '#6ee7b7',
          }
        };
      case 'contrast':
        return {
          consumption: {
            actual: '#ef4444',
            predicted: '#b91c1c',
            confidence: '#fca5a5',
          },
          generation: {
            actual: '#8b5cf6',
            predicted: '#6d28d9',
            confidence: '#c4b5fd',
          }
        };
      default:
        return {
          consumption: {
            actual: '#3b82f6',
            predicted: '#1d4ed8',
            confidence: '#93c5fd',
          },
          generation: {
            actual: '#10b981',
            predicted: '#047857',
            confidence: '#6ee7b7',
          }
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
      }),
      timestamp: new Date(item.date).getTime(),
      consumption: item.consumption,
      predictedConsumption: item.predictedConsumption,
      consumptionLower: item.consumptionLower,
      consumptionUpper: item.consumptionUpper,
      generation: item.generation,
      predictedGeneration: item.predictedGeneration,
      generationLower: item.generationLower,
      generationUpper: item.generationUpper,
      isPrediction: item.isPrediction,
    }));
  }, [data]);
  
  // Separar dados históricos e previsões
  const historicalData = useMemo(() => {
    return formattedData.filter(item => !item.isPrediction);
  }, [formattedData]);
  
  const predictionData = useMemo(() => {
    return formattedData.filter(item => item.isPrediction);
  }, [formattedData]);
  
  // Encontrar o ponto de divisão entre dados históricos e previsões
  const transitionPoint = useMemo(() => {
    if (historicalData.length > 0 && predictionData.length > 0) {
      const lastHistorical = historicalData[historicalData.length - 1];
      return {
        x1: lastHistorical.timestamp,
        x2: predictionData[0].timestamp,
      };
    }
    return null;
  }, [historicalData, predictionData]);
  
  // Formatador para o eixo Y (kWh)
  const formatYAxis = (value: number) => {
    return `${value} kWh`;
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
      <div className="mb-3 flex flex-wrap gap-2 justify-between">
        <Select
          value={selectedPredictionRange}
          onValueChange={(value: 'day' | 'week' | 'month') => setSelectedPredictionRange(value)}
        >
          <SelectTrigger className="w-[140px] h-8">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Próximas 24h</SelectItem>
            <SelectItem value="week">Próximos 7 dias</SelectItem>
            <SelectItem value="month">Próximo mês</SelectItem>
          </SelectContent>
        </Select>
        
        <ToggleGroup 
          type="single" 
          value={selectedPredictionType} 
          onValueChange={(value) => {
            if (value) setSelectedPredictionType(value as PredictionType);
          }}
          className="h-8"
        >
          <ToggleGroupItem value={PredictionType.CONSUMPTION} size="sm">
            Consumo
          </ToggleGroupItem>
          <ToggleGroupItem value={PredictionType.GENERATION} size="sm">
            Geração
          </ToggleGroupItem>
          <ToggleGroupItem value={PredictionType.BOTH} size="sm">
            Ambos
          </ToggleGroupItem>
        </ToggleGroup>
        
        <ToggleGroup 
          type="single" 
          value={selectedConfidenceInterval ? 'on' : 'off'} 
          onValueChange={(value) => {
            setSelectedConfidenceInterval(value === 'on');
          }}
          className="h-8"
        >
          <ToggleGroupItem value="on" size="sm">
            Intervalo de Confiança
          </ToggleGroupItem>
          <ToggleGroupItem value="off" size="sm">
            Ocultar Intervalo
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={formattedData}
            margin={{
              top: 5,
              right: 20,
              left: 30,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }} 
              tickMargin={10}
            />
            <YAxis 
              tickFormatter={formatYAxis} 
              tick={{ fontSize: 12 }} 
              tickMargin={10}
            />
            <Tooltip 
              labelFormatter={(label) => `Data: ${label}`}
              formatter={(value, name) => {
                switch (name) {
                  case 'consumption':
                    return [`${value} kWh`, 'Consumo (real)'];
                  case 'predictedConsumption':
                    return [`${value} kWh`, 'Consumo (previsto)'];
                  case 'generation':
                    return [`${value} kWh`, 'Geração (real)'];
                  case 'predictedGeneration':
                    return [`${value} kWh`, 'Geração (prevista)'];
                  default:
                    return [value, name];
                }
              }}
            />
            <Legend />
            
            {/* Área de transição entre dados históricos e previsões */}
            {transitionPoint && (
              <ReferenceArea
                x1={transitionPoint.x1}
                x2={transitionPoint.x2}
                strokeOpacity={0.3}
                fill="#f9fafb"
              />
            )}
            
            {/* Dados de consumo */}
            {(selectedPredictionType === PredictionType.CONSUMPTION || selectedPredictionType === PredictionType.BOTH) && (
              <>
                {/* Dados históricos */}
                <Line
                  type="monotone"
                  dataKey="consumption"
                  name="Consumo (real)"
                  stroke={colors.consumption.actual}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  isAnimationActive={true}
                />
                
                {/* Previsões */}
                <Line
                  type="monotone"
                  dataKey="predictedConsumption"
                  name="Consumo (previsto)"
                  stroke={colors.consumption.predicted}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 4 }}
                  isAnimationActive={true}
                />
                
                {/* Intervalo de confiança */}
                {selectedConfidenceInterval && (
                  <ReferenceArea
                    dataKey="timestamp"
                    y1="consumptionLower"
                    y2="consumptionUpper"
                    fill={colors.consumption.confidence}
                    fillOpacity={0.3}
                    ifOverflow="extendDomain"
                    data={predictionData}
                  />
                )}
              </>
            )}
            
            {/* Dados de geração */}
            {(selectedPredictionType === PredictionType.GENERATION || selectedPredictionType === PredictionType.BOTH) && (
              <>
                {/* Dados históricos */}
                <Line
                  type="monotone"
                  dataKey="generation"
                  name="Geração (real)"
                  stroke={colors.generation.actual}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  isAnimationActive={true}
                />
                
                {/* Previsões */}
                <Line
                  type="monotone"
                  dataKey="predictedGeneration"
                  name="Geração (prevista)"
                  stroke={colors.generation.predicted}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 4 }}
                  isAnimationActive={true}
                />
                
                {/* Intervalo de confiança */}
                {selectedConfidenceInterval && (
                  <ReferenceArea
                    dataKey="timestamp"
                    y1="generationLower"
                    y2="generationUpper"
                    fill={colors.generation.confidence}
                    fillOpacity={0.3}
                    ifOverflow="extendDomain"
                    data={predictionData}
                  />
                )}
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-2 px-2">
        <p className="text-xs text-gray-500 italic">
          Método de previsão: {predictionMethod === 'ensemble' ? 'Ensemble (combinado)' : predictionMethod.toUpperCase()}
        </p>
      </div>
    </div>
  );
};

export default PredictionChartWidget;