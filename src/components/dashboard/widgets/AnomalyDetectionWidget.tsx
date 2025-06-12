import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiRequest } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';

// Tipos de anomalias
enum AnomalyType {
  NONE = 'none',
  CONSUMPTION_SPIKE = 'consumption_spike',
  UNUSUAL_PATTERN = 'unusual_pattern',
  POSSIBLE_LEAK = 'possible_leak',
  DEVICE_MALFUNCTION = 'device_malfunction',
}

interface AnomalyDetectionWidgetConfig {
  unitId?: number | string;
  networkId?: number | string;
  timeRange?: 'week' | 'month' | 'quarter' | 'year';
  threshold?: number;
  showResolved?: boolean;
}

interface Anomaly {
  id: string;
  type: AnomalyType;
  confidence: number;
  unitName: string;
  date: string; // data vinda da API, converter ao renderizar
  status: 'new' | 'reviewing' | 'resolved' | 'false_positive';
  value: number;
  expectedValue: number;
  deviation: number;
  details: string;
}

const anomalyTypeNames: Record<AnomalyType, string> = {
  [AnomalyType.NONE]: 'Nenhuma Anomalia',
  [AnomalyType.CONSUMPTION_SPIKE]: 'Pico de Consumo',
  [AnomalyType.UNUSUAL_PATTERN]: 'Padrão Incomum',
  [AnomalyType.POSSIBLE_LEAK]: 'Possível Vazamento',
  [AnomalyType.DEVICE_MALFUNCTION]: 'Falha em Equipamento',
};

const anomalyTypeColors: Record<AnomalyType, { light: string; dark: string }> = {
  [AnomalyType.NONE]: { light: '#e5e7eb', dark: '#9ca3af' },
  [AnomalyType.CONSUMPTION_SPIKE]: { light: '#fee2e2', dark: '#ef4444' },
  [AnomalyType.UNUSUAL_PATTERN]: { light: '#fef3c7', dark: '#f59e0b' },
  [AnomalyType.POSSIBLE_LEAK]: { light: '#dbeafe', dark: '#3b82f6' },
  [AnomalyType.DEVICE_MALFUNCTION]: { light: '#f3e8ff', dark: '#8b5cf6' },
};

interface AnomalyDetectionWidgetProps {
  widget: {
    config: AnomalyDetectionWidgetConfig;
  };
}

const AnomalyDetectionWidget: React.FC<AnomalyDetectionWidgetProps> = ({
  widget,
}) => {
  const {
    unitId,
    networkId,
    timeRange = 'month',
    threshold = 0.8,
    showResolved = false,
  } = widget.config;

  const [selectedTimeRange, setSelectedTimeRange] = useState<
    'week' | 'month' | 'quarter' | 'year'
  >(timeRange);
  const [selectedView, setSelectedView] = useState<'list' | 'chart'>('list');

  const { data, isLoading, error } = useQuery<Anomaly[]>({
    queryKey: [
      '/api/v1/dashboard/advanced/anomalies',
      selectedTimeRange,
      unitId,
      networkId,
      threshold,
      showResolved,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('timeRange', selectedTimeRange);
      params.append('threshold', threshold.toString());
      params.append('showResolved', showResolved.toString());
      if (unitId !== undefined && unitId !== null) params.append('unitId', unitId.toString());
      if (networkId !== undefined && networkId !== null) params.append('networkId', networkId.toString());

      const response = await apiRequest(
        'GET',
        `/api/v1/dashboard/advanced/anomalies?${params.toString()}`
      );
      return response.data;
    },
  });

  // Inicializa os arrays por tipo de anomalia
  const anomaliesByType = useMemo(() => {
    if (!data) return {} as Record<AnomalyType, Anomaly[]>;
    const init: Record<AnomalyType, Anomaly[]> = {
      [AnomalyType.NONE]: [],
      [AnomalyType.CONSUMPTION_SPIKE]: [],
      [AnomalyType.UNUSUAL_PATTERN]: [],
      [AnomalyType.POSSIBLE_LEAK]: [],
      [AnomalyType.DEVICE_MALFUNCTION]: [],
    };

    return data.reduce((acc, anomaly) => {
      const type = Object.values(AnomalyType).includes(anomaly.type)
        ? anomaly.type
        : AnomalyType.NONE;
      acc[type].push(anomaly);
      return acc;
    }, init);
  }, [data]);

  const renderStatusBadge = (status: Anomaly['status']): React.ReactNode => {
    switch (status) {
      case 'new':
        return <Badge variant="destructive">Nova</Badge>;
      case 'reviewing':
        return <Badge variant="secondary">Em análise</Badge>;
      case 'resolved':
        return <Badge variant="outline">Resolvida</Badge>;
      case 'false_positive':
        return (
          <Badge variant="outline" className="bg-gray-100">
            Falso positivo
          </Badge>
        );
      default:
        return null;
    }
  };

  const renderSeverityIcon = (confidence: number): JSX.Element => {
    if (confidence >= 0.9) {
      return (
        <AlertCircle
          className="h-5 w-5 text-red-500"
          aria-label="Alta severidade"
        />
      );
    } else if (confidence >= 0.7) {
      return (
        <AlertTriangle
          className="h-5 w-5 text-amber-500"
          aria-label="Média severidade"
        />
      );
    } else {
      return (
        <Info className="h-5 w-5 text-blue-500" aria-label="Baixa severidade" />
      );
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div
          className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"
          aria-label="Carregando"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center p-4" role="alert">
          <p className="text-red-500 mb-2">Erro ao carregar dados</p>
          <pre>{(error as Error).message || String(error)}</pre>
        </div>
      </div>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Anomalias de Consumo</CardTitle>

        <div className="flex gap-2">
          <Select
            value={selectedTimeRange}
            onValueChange={(value) =>
              setSelectedTimeRange(value as typeof selectedTimeRange)
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Última Semana</SelectItem>
              <SelectItem value="month">Último Mês</SelectItem>
              <SelectItem value="quarter">Último Trimestre</SelectItem>
              <SelectItem value="year">Último Ano</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={selectedView}
            onValueChange={(value) =>
              setSelectedView(value as typeof selectedView)
            }
          >
            <SelectTrigger className="w-24">
              <SelectValue placeholder="Visualização" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="list">Lista</SelectItem>
              <SelectItem value="chart">Gráfico</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="flex-grow overflow-auto">
        {selectedView === 'list' ? (
          <>
            {Object.entries(anomaliesByType).map(([typeKey, anomalies]) => {
              const type = typeKey as AnomalyType;
              if (anomalies.length === 0) return null;

              return (
                <section key={type} className="mb-6">
                  <h3 className="mb-2 text-lg font-semibold text-gray-700">
                    {anomalyTypeNames[type]}
                  </h3>
                  <div className="space-y-2">
                    {anomalies.map((anomaly) => (
                      <article
                        key={anomaly.id}
                        className="border rounded p-3 flex items-center gap-4 hover:bg-gray-50"
                        aria-label={`Anomalia ${anomalyTypeNames[type]} unidade ${anomaly.unitName}`}
                      >
                        <div>{renderSeverityIcon(anomaly.confidence)}</div>
                        <div className="flex-grow">
                          <p className="font-medium">{anomaly.unitName}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(anomaly.date).toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-600">{anomaly.details}</p>
                          <p className="text-sm text-gray-700">
                            Valor: {anomaly.value.toFixed(2)} (Esperado:{' '}
                            {anomaly.expectedValue.toFixed(2)}), Desvio:{' '}
                            {(anomaly.deviation * 100).toFixed(1)}%
                          </p>
                        </div>
                        <div>{renderStatusBadge(anomaly.status)}</div>
                      </article>
                    ))}
                  </div>
                </section>
              );
            })}
          </>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="value"
                name="Valor"
                label={{ value: 'Valor', position: 'insideBottomRight', offset: 0 }}
              />
              <YAxis
                type="number"
                dataKey="expectedValue"
                name="Valor Esperado"
                label={{ value: 'Valor Esperado', angle: -90, position: 'insideLeft' }}
              />
              <ZAxis
                type="number"
                dataKey="confidence"
                range={[60, 400]}
                name="Confiança"
              />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                formatter={(value: number, name: string) => [
                  name === 'confidence' ? (value * 100).toFixed(1) + '%' : value.toFixed(2),
                  name,
                ]}
              />
              {Object.entries(anomaliesByType).map(([typeKey, anomalies]) => {
                const type = typeKey as AnomalyType;
                if (anomalies.length === 0) return null;
                return (
                  <Scatter
                    key={type}
                    name={anomalyTypeNames[type]}
                    data={anomalies}
                    fill={anomalyTypeColors[type].dark}
                  />
                );
              })}
              <Legend />
            </ScatterChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default AnomalyDetectionWidget;
