import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Leaf, Lightbulb, Droplets, Trees } from 'lucide-react';

interface EnvironmentalImpactProps {
  energyBalance: number;
  co2Saved: number;
}

const EnvironmentalImpact: React.FC<EnvironmentalImpactProps> = ({ energyBalance, co2Saved }) => {
  // Calcular métricas baseadas no balanço de energia e CO2 economizado
  const treesEquivalent = Math.round(co2Saved / 22); // 1 árvore absorve ~22kg de CO2 por ano
  const waterSaved = Math.round(energyBalance * 1.5); // Litros de água economizados
  const homesEquivalent = Math.round(energyBalance / 150); // Uma casa média consome ~150 kWh por mês

  // Mostrar dados apenas se o balanço for positivo
  if (energyBalance <= 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
      <CardContent className="p-6">
        <h3 className="text-lg font-bold text-green-700 mb-4 flex items-center gap-2">
          <Leaf className="h-5 w-5" />
          Impacto Ambiental Positivo
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <div className="bg-green-100 p-2 rounded-full">
              <Trees className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-green-800">Equivalente a</p>
              <p className="text-xl font-bold text-green-700">{treesEquivalent} {treesEquivalent === 1 ? 'árvore' : 'árvores'}</p>
              <p className="text-xs text-green-600">absorvendo CO₂ anualmente</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <Droplets className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-800">Economia de água</p>
              <p className="text-xl font-bold text-blue-700">{waterSaved.toLocaleString()} litros</p>
              <p className="text-xs text-blue-600">na geração de energia</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="bg-amber-100 p-2 rounded-full">
              <Lightbulb className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-amber-800">Alimenta</p>
              <p className="text-xl font-bold text-amber-700">{homesEquivalent} {homesEquivalent === 1 ? 'residência' : 'residências'}</p>
              <p className="text-xs text-amber-600">médias por mês</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnvironmentalImpact;