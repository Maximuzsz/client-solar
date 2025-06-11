import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface FinancialSummaryProps {
  energyBalance: number;
  estimatedSavings: number;
  estimatedCost: number;
  tariffValue?: number;
}

const FinancialSummary: React.FC<FinancialSummaryProps> = ({ 
  energyBalance, 
  estimatedSavings, 
  estimatedCost,
  tariffValue = 0.75 // Valor padrão da tarifa caso não seja fornecido
}) => {
  const isPositive = energyBalance >= 0;
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  return (
    <Card className={`border-l-4 ${isPositive ? 'border-l-green-500' : 'border-l-red-500'}`}>
      <CardContent className="p-6">
        <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
          <DollarSign className="h-5 w-5" />
          Sumário Financeiro
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isPositive ? (
            <>
              <div className="flex flex-col">
                <div className="flex items-center gap-2 text-green-600">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-medium">Economia Estimada</span>
                </div>
                <div className="text-2xl font-bold mt-1">{formatCurrency(estimatedSavings)}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Baseado em {Math.abs(energyBalance).toFixed(2)} kWh excedentes
                </div>
              </div>
              
              <div className="flex flex-col">
                <div className="text-sm font-medium text-muted-foreground">Detalhes do Cálculo</div>
                <div className="text-sm mt-2 space-y-1">
                  <div className="flex justify-between">
                    <span>Excedente:</span>
                    <span>{Math.abs(energyBalance).toFixed(2)} kWh</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tarifa média:</span>
                    <span>{formatCurrency(tariffValue)}/kWh</span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-1 mt-1">
                    <span>Economia total:</span>
                    <span className="text-green-600">{formatCurrency(estimatedSavings)}</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col">
                <div className="flex items-center gap-2 text-red-600">
                  <TrendingDown className="h-4 w-4" />
                  <span className="text-sm font-medium">Custo Adicional</span>
                </div>
                <div className="text-2xl font-bold mt-1">{formatCurrency(estimatedCost)}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Baseado em {Math.abs(energyBalance).toFixed(2)} kWh em déficit
                </div>
              </div>
              
              <div className="flex flex-col">
                <div className="text-sm font-medium text-muted-foreground">Detalhes do Cálculo</div>
                <div className="text-sm mt-2 space-y-1">
                  <div className="flex justify-between">
                    <span>Déficit:</span>
                    <span>{Math.abs(energyBalance).toFixed(2)} kWh</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tarifa média:</span>
                    <span>{formatCurrency(tariffValue)}/kWh</span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-1 mt-1">
                    <span>Custo adicional:</span>
                    <span className="text-red-600">{formatCurrency(estimatedCost)}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FinancialSummary;