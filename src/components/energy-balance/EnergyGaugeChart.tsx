import React from 'react';
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

interface EnergyGaugeChartProps {
  consumption: number;
  generation: number;
  showLabels?: boolean;
}

const COLORS = ['#ef4444', '#10b981'];

const EnergyGaugeChart: React.FC<EnergyGaugeChartProps> = ({ 
  consumption, 
  generation,
  showLabels = true
}) => {
  // Evitar divisão por zero
  const safeConsumption = consumption === 0 && generation === 0 ? 1 : consumption;

  const data = [
    { name: 'Consumo', value: safeConsumption },
    { name: 'Geração', value: generation }
  ];

  const total = safeConsumption + generation;
  const percentage = generation > 0 ? Math.round((generation / total) * 100) : 0;

  // Função customizada de formatação para o tooltip
  const customTooltipFormatter = (value: number, name: string) => {
    return [`${value.toFixed(2)} kWh`, name];
  };

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            startAngle={180}
            endAngle={0}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={customTooltipFormatter}
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '0.5rem',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              border: 'none'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-3xl font-bold">{percentage}%</div>
        {showLabels && <div className="text-xs text-muted-foreground mt-1">Geração/Consumo</div>}
      </div>
    </div>
  );
};

export default EnergyGaugeChart;