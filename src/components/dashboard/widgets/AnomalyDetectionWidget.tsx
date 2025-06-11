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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis, Legend, ReferenceArea } from 'recharts';
import { AlertCircle, Check, AlertTriangle, Info } from 'lucide-react';

interface AnomalyDetectionWidgetProps {
  widget: WidgetConfig;
}

// Tipos de anomalias
enum AnomalyType {
  NONE = 'none',
  CONSUMPTION_SPIKE = 'consumption_spike',
  UNUSUAL_PATTERN = 'unusual_pattern',
  POSSIBLE_LEAK = 'possible_leak',
  DEVICE_MALFUNCTION = 'device_malfunction',
}

// Interface para anomalia
interface Anomaly {
  id: string;
  unitId: number;
  unitName: string;
  date: string;
  type: AnomalyType;
  value: number;
  expectedValue: number;
  deviation: number;
  confidence: number;
  status: 'new' | 'reviewing' | 'resolved' | 'false_positive';
  details: string;
}

// Mapeamento de nomes amigáveis para tipos de anomalias
const anomalyTypeNames: Record<AnomalyType, string> = {
  [AnomalyType.NONE]: 'Nenhuma Anomalia',
  [AnomalyType.CONSUMPTION_SPIKE]: 'Pico de Consumo',
  [AnomalyType.UNUSUAL_PATTERN]: 'Padrão Incomum',
  [AnomalyType.POSSIBLE_LEAK]: 'Possível Vazamento',
  [AnomalyType.DEVICE_MALFUNCTION]: 'Falha em Equipamento',
};

// Cores para os diferentes tipos de anomalias
const anomalyTypeColors: Record<AnomalyType, { light: string, dark: string }> = {
  [AnomalyType.NONE]: { light: '#e5e7eb', dark: '#9ca3af' },
  [AnomalyType.CONSUMPTION_SPIKE]: { light: '#fee2e2', dark: '#ef4444' },
  [AnomalyType.UNUSUAL_PATTERN]: { light: '#fef3c7', dark: '#f59e0b' },
  [AnomalyType.POSSIBLE_LEAK]: { light: '#dbeafe', dark: '#3b82f6' },
  [AnomalyType.DEVICE_MALFUNCTION]: { light: '#f3e8ff', dark: '#8b5cf6' },
};

const AnomalyDetectionWidget: React.FC<AnomalyDetectionWidgetProps> = ({ widget }) => {
  // Extrair configurações do widget
  const {
    unitId,
    networkId,
    timeRange = 'month',
    threshold = 0.8, // Limiar de confiança para exibir anomalias
    showResolved = false,
  } = widget.config;
  
  // Estado local para filtros que podem ser alterados pelo usuário
  const [selectedTimeRange, setSelectedTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>(
    timeRange as 'week' | 'month' | 'quarter' | 'year'
  );
  const [selectedView, setSelectedView] = useState<'list' | 'chart'>('list');
  
  // Consultar dados de anomalias da API
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/v1/dashboard/advanced/anomalies', selectedTimeRange, unitId, networkId, threshold, showResolved],
    queryFn: async () => {
      // Construir parâmetros de consulta
      const params = new URLSearchParams();
      params.append('timeRange', selectedTimeRange);
      params.append('threshold', threshold.toString());
      params.append('showResolved', showResolved.toString());
      if (unitId) params.append('unitId', unitId.toString());
      if (networkId) params.append('networkId', networkId.toString());
      
      const response = await apiRequest('GET', `/api/v1/dashboard/advanced/anomalies?${params.toString()}`);
      return response.data;
    },
  });
  
  // Formatar dados para o gráfico
  const chartData = useMemo(() => {
    if (!data) return [];
    
    return data.map((anomaly: Anomaly) => ({
      x: new Date(anomaly.date).getTime(),
      y: anomaly.value,
      z: anomaly.confidence * 10, // Tamanho do ponto baseado na confiança
      anomaly,
    }));
  }, [data]);
  
  // Agrupar anomalias por tipo
  const anomaliesByType = useMemo(() => {
    if (!data) return {};
    
    return data.reduce((acc: Record<AnomalyType, Anomaly[]>, anomaly: Anomaly) => {
      if (!acc[anomaly.type]) {
        acc[anomaly.type] = [];
      }
      acc[anomaly.type].push(anomaly);
      return acc;
    }, {} as Record<AnomalyType, Anomaly[]>);
  }, [data]);
  
  // Função para renderizar o status badge
  const renderStatusBadge = (status: 'new' | 'reviewing' | 'resolved' | 'false_positive') => {
    switch (status) {
      case 'new':
        return <Badge variant="destructive">Nova</Badge>;
      case 'reviewing':
        return <Badge variant="secondary">Em análise</Badge>;
      case 'resolved':
        return <Badge variant="outline">Resolvida</Badge>;
      case 'false_positive':
        return <Badge variant="outline" className="bg-gray-100">Falso positivo</Badge>;
      default:
        return null;
    }
  };
  
  // Função para renderizar o ícone de severidade
  const renderSeverityIcon = (confidence: number) => {
    if (confidence >= 0.9) {
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    } else if (confidence >= 0.7) {
      return <AlertTriangle className="h-5 w-5 text-amber-500" />;
    } else {
      return <Info className="h-5 w-5 text-blue-500" />;
    }
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
  
  // Se não houver dados
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <div className="mb-4 flex justify-between">
          <Select
            value={selectedTimeRange}
            onValueChange={(value: 'week' | 'month' | 'quarter' | 'year') => setSelectedTimeRange(value)}
          >
            <SelectTrigger className="w-[180px] h-8">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Esta Semana</SelectItem>
              <SelectItem value="month">Este Mês</SelectItem>
              <SelectItem value="quarter">Este Trimestre</SelectItem>
              <SelectItem value="year">Este Ano</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex-1 flex items-center justify-center bg-green-50 rounded-lg">
          <div className="text-center p-6">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">Nenhuma anomalia detectada</h3>
            <p className="mt-1 text-sm text-gray-500">Todos os padrões de consumo estão normais.</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 flex justify-between">
        <Select
          value={selectedTimeRange}
          onValueChange={(value: 'week' | 'month' | 'quarter' | 'year') => setSelectedTimeRange(value)}
        >
          <SelectTrigger className="w-[180px] h-8">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Esta Semana</SelectItem>
            <SelectItem value="month">Este Mês</SelectItem>
            <SelectItem value="quarter">Este Trimestre</SelectItem>
            <SelectItem value="year">Este Ano</SelectItem>
          </SelectContent>
        </Select>
        
        <Select
          value={selectedView}
          onValueChange={(value: 'list' | 'chart') => setSelectedView(value)}
        >
          <SelectTrigger className="w-[180px] h-8">
            <SelectValue placeholder="Visualização" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="list">Lista</SelectItem>
            <SelectItem value="chart">Gráfico</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {selectedView === 'chart' ? (
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{
                top: 20,
                right: 20,
                bottom: 20,
                left: 30,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="x"
                name="Data"
                domain={['auto', 'auto']}
                tickFormatter={(unixTime) => new Date(unixTime).toLocaleDateString('pt-BR')}
                label={{ value: 'Data', position: 'insideBottomRight', offset: -10 }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="Consumo"
                label={{ value: 'Consumo (kWh)', angle: -90, position: 'insideLeft' }}
              />
              <ZAxis type="number" dataKey="z" range={[40, 160]} />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                formatter={(value: any, name: any, props: any) => {
                  const { anomaly } = props.payload;
                  if (name === 'Consumo') {
                    return [`${value} kWh`, name];
                  }
                  return [value, name];
                }}
                labelFormatter={(value) => `Data: ${new Date(value).toLocaleDateString('pt-BR')}`}
              />
              <Legend />
              
              {Object.entries(anomaliesByType).map(([type, anomalies]) => (
                <Scatter
                  key={type}
                  name={anomalyTypeNames[type as AnomalyType]}
                  data={chartData.filter(d => d.anomaly.type === type)}
                  fill={anomalyTypeColors[type as AnomalyType].dark}
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <div className="space-y-3">
            {Object.entries(anomaliesByType).map(([type, anomalies]) => (
              <div key={type} className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-700">
                  {anomalyTypeNames[type as AnomalyType]}
                </h3>
                
                {anomalies.map((anomaly) => (
                  <Card key={anomaly.id} className={`shadow-sm border-l-4`} style={{ borderLeftColor: anomalyTypeColors[anomaly.type].dark }}>
                    <CardHeader className="p-3 pb-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            {renderSeverityIcon(anomaly.confidence)}
                            {anomaly.unitName}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {new Date(anomaly.date).toLocaleDateString('pt-BR')}
                          </CardDescription>
                        </div>
                        {renderStatusBadge(anomaly.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 pt-2">
                      <div className="text-xs text-gray-700">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-gray-500">Valor:</span> {anomaly.value} kWh
                          </div>
                          <div>
                            <span className="text-gray-500">Esperado:</span> {anomaly.expectedValue} kWh
                          </div>
                          <div>
                            <span className="text-gray-500">Desvio:</span> {(anomaly.deviation * 100).toFixed(1)}%
                          </div>
                          <div>
                            <span className="text-gray-500">Confiança:</span> {(anomaly.confidence * 100).toFixed(0)}%
                          </div>
                        </div>
                        <p className="mt-2">{anomaly.details}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnomalyDetectionWidget;