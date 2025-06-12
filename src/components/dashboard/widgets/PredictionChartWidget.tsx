import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { WidgetConfig } from '@/services/dashboardCustomization/dashboardLayoutService';

import dashboardAPI from '@/services/dashboardAPI';
import {
  Area,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

interface PredictionChartWidgetProps {
  widget: WidgetConfig;
}

enum PredictionType {
  CONSUMPTION = 'consumption',
  GENERATION = 'generation',
  BOTH = 'both',
}

type PredictionRange = 'day' | 'week' | 'month';

interface DataItem {
  date: string;
  consumption: number | null;
  predictedConsumption: number | null;
  consumptionLower: number | null;
  consumptionUpper: number | null;
  generation: number | null;
  predictedGeneration: number | null;
  generationLower: number | null;
  generationUpper: number | null;
  isPrediction: boolean;
}

interface FormattedDataItem extends DataItem {
  date: string;
  timestamp: number;
  isPrediction: boolean;
}

interface ColorScheme {
  consumption: {
    actual: string;
    predicted: string;
    confidence: string;
  };
  generation: {
    actual: string;
    predicted: string;
    confidence: string;
  };
}

interface ColorSchemes {
  contrast: ColorScheme;
  default: ColorScheme;
}

const colorSchemes: ColorSchemes = {
  contrast: {
    consumption: { actual: '#ef4444', predicted: '#b91c1c', confidence: '#fca5a5' },
    generation: { actual: '#8b5cf6', predicted: '#6d28d9', confidence: '#c4b5fd' },
  },
  default: {
    consumption: { actual: '#3b82f6', predicted: '#1d4ed8', confidence: '#93c5fd' },
    generation: { actual: '#10b981', predicted: '#047857', confidence: '#6ee7b7' },
  },
};

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

const formatYAxis = (value: number): string => `${value} kWh`;

const Loading = () => (
  <div className="h-full flex items-center justify-center">
    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
  </div>
);

const ErrorMessage = () => (
  <div className="h-full flex items-center justify-center">
    <div className="text-center p-4">
      <p className="text-red-500 mb-2">Erro ao carregar dados</p>
      <p className="text-sm text-gray-500">Tente novamente mais tarde</p>
    </div>
  </div>
);

interface FiltersProps {
  selectedRange: PredictionRange;
  setSelectedRange: (range: PredictionRange) => void;
  selectedType: PredictionType;
  setSelectedType: (type: PredictionType) => void;
  showConfidence: boolean;
  setShowConfidence: (show: boolean) => void;
}

const Filters: React.FC<FiltersProps> = ({
  selectedRange,
  setSelectedRange,
  selectedType,
  setSelectedType,
  showConfidence,
  setShowConfidence,
}) => (
  <div className="mb-3 flex flex-wrap gap-2 justify-between">
    <Select
      value={selectedRange}
      onValueChange={(value: PredictionRange) => setSelectedRange(value)}
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
      value={selectedType}
      onValueChange={(value: PredictionType) => {
        if (value) setSelectedType(value);
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
      value={showConfidence ? 'on' : 'off'}
      onValueChange={(value: string) => {
        setShowConfidence(value === 'on');
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
);

const PredictionChartWidget: React.FC<PredictionChartWidgetProps> = ({ widget }) => {
  const {
    unitId,
    networkId,
    predictionRange = 'week',
    predictionType = PredictionType.BOTH,
    showConfidenceInterval = true,
    predictionMethod = 'ensemble',
  } = widget.config;

  const [selectedPredictionRange, setSelectedPredictionRange] = useState<PredictionRange>(
    predictionRange as PredictionRange
  );
  const [selectedPredictionType, setSelectedPredictionType] = useState<PredictionType>(
    predictionType as PredictionType
  );
  const [selectedConfidenceInterval, setSelectedConfidenceInterval] = useState<boolean>(
    showConfidenceInterval as boolean
  );

  const { data, isLoading, error } = useQuery<DataItem[]>({
    queryKey: [
      '/api/v1/dashboard/advanced/predictions',
      selectedPredictionRange,
      selectedPredictionType,
      unitId,
      networkId,
      predictionMethod,
    ],
    queryFn: () =>
      dashboardAPI.getPredictions({
        range: selectedPredictionRange,
        type: selectedPredictionType,
        method: predictionMethod,
        unitId,
        networkId,
      }),
    staleTime: 60 * 1000,
  });

  type ColorSchemeKey = keyof typeof colorSchemes;
  const [colorScheme] = useState<ColorSchemeKey>('default');

  const colors = useMemo(
    () => colorSchemes[colorScheme] ?? colorSchemes.default,
    [colorScheme]
  );

  const formattedData: FormattedDataItem[] = useMemo(() => {
    if (!data) return [];
    return data.map((item) => ({
      ...item,
      date: formatDate(item.date),
      timestamp: new Date(item.date).getTime(),
      isPrediction: item.isPrediction || false,
    }));
  }, [data]);

  if (isLoading) return <Loading />;
  if (error) return <ErrorMessage />;

  return (
    <div className="h-full flex flex-col">
      <Filters
        selectedRange={selectedPredictionRange}
        setSelectedRange={setSelectedPredictionRange}
        selectedType={selectedPredictionType}
        setSelectedType={setSelectedPredictionType}
        showConfidence={selectedConfidenceInterval}
        setShowConfidence={setSelectedConfidenceInterval}
      />

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={formattedData} margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} tickMargin={10} />
            <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 12 }} tickMargin={10} />
            <Tooltip
              labelFormatter={(label) => `Data: ${label}`}
              formatter={(value: number, name: string) => {
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

            {(selectedPredictionType === PredictionType.CONSUMPTION || selectedPredictionType === PredictionType.BOTH) && (
              <>
                <Line
                  type="monotone"
                  dataKey="consumption"
                  name="Consumo (real)"
                  stroke={colors.consumption.actual}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="predictedConsumption"
                  name="Consumo (previsto)"
                  stroke={colors.consumption.predicted}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 4 }}
                  isAnimationActive={false}
                />
                {selectedConfidenceInterval && (
                  <Area
                    type="monotone"
                    dataKey="consumptionUpper"
                    name="Intervalo de confiança consumo"
                    stroke="none"
                    fill={colors.consumption.confidence}
                    fillOpacity={0.3}
                    activeDot={false}
                    isAnimationActive={false}
                  />
                )}
              </>
            )}

            {(selectedPredictionType === PredictionType.GENERATION || selectedPredictionType === PredictionType.BOTH) && (
              <>
                <Line
                  type="monotone"
                  dataKey="generation"
                  name="Geração (real)"
                  stroke={colors.generation.actual}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="predictedGeneration"
                  name="Geração (prevista)"
                  stroke={colors.generation.predicted}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 4 }}
                  isAnimationActive={false}
                />
                {selectedConfidenceInterval && (
                  <Area
                    type="monotone"
                    dataKey="generationUpper"
                    name="Intervalo de confiança geração"
                    stroke="none"
                    fill={colors.generation.confidence}
                    fillOpacity={0.3}
                    activeDot={false}
                    isAnimationActive={false}
                  />
                )}
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PredictionChartWidget;