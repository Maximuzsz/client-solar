import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Dados fictícios para o componente - serão substituídos por dados reais da API
const mockData = [
  { month: 'Jan', consumo: 240, geracao: 320 },
  { month: 'Fev', consumo: 300, geracao: 350 },
  { month: 'Mar', consumo: 280, geracao: 400 },
  { month: 'Abr', consumo: 200, geracao: 380 },
  { month: 'Mai', consumo: 230, geracao: 340 },
  { month: 'Jun', consumo: 250, geracao: 300 },
];

interface MonthlyData {
  month: string;
  consumo: number;
  geracao: number;
}

interface MonthlyComparisonChartProps {
  data?: MonthlyData[];
  title?: string;
}

const MonthlyComparisonChart: React.FC<MonthlyComparisonChartProps> = ({ 
  data = mockData,
  title = "Comparativo Mensal" 
}) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" />
              <YAxis 
                tickFormatter={(value) => `${value} kWh`}
                width={80}
              />
              <Tooltip
                formatter={(value: number) => [`${value.toFixed(2)} kWh`, undefined]}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '0.5rem',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  border: 'none'
                }}
              />
              <Legend />
              <Bar 
                dataKey="consumo" 
                name="Consumo" 
                fill="#ef4444" 
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="geracao" 
                name="Geração" 
                fill="#10b981" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthlyComparisonChart;