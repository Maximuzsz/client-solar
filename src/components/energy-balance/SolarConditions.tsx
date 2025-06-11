import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Sun, Cloud, Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface SolarData {
  generation_potential: number;
  radiation_index: number;
  cloud_coverage: number;
}

interface SolarConditionsProps {
  solarData: SolarData;
}

const SolarConditions: React.FC<SolarConditionsProps> = ({ solarData }) => {
  // Formatar valores para exibição e classificação
  const radiationLevel = getRadiationLevel(solarData.radiation_index);
  const cloudImpact = getCloudImpact(solarData.cloud_coverage);
  const potentialClass = getPotentialClass(solarData.generation_potential);
  
  return (
    <Card className="bg-gradient-to-br from-blue-50 to-amber-50 border-amber-100">
      <CardContent className="p-6">
        <h3 className="text-lg font-bold text-amber-700 mb-4 flex items-center gap-2">
          <Sun className="h-5 w-5" />
          Condições Solares
        </h3>
        
        <div className="grid grid-cols-1 gap-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium">Potencial de Geração</span>
              </div>
              <span className={`text-sm font-semibold ${potentialClass.color}`}>
                {solarData.generation_potential}kWh/m²
              </span>
            </div>
            <Progress 
              className={`h-2 bg-amber-100 ${potentialClass.bgColor}`}
              value={Math.min(solarData.generation_potential * 5, 100)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {potentialClass.label}
            </p>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium">Índice de Radiação</span>
              </div>
              <span className={`text-sm font-semibold ${radiationLevel.color}`}>
                {solarData.radiation_index}/10
              </span>
            </div>
            <Progress 
              className={`h-2 bg-amber-100 ${radiationLevel.bgColor}`}
              value={solarData.radiation_index * 10} 
            />
            <p className="text-xs text-muted-foreground mt-1">
              {radiationLevel.label}
            </p>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <Cloud className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Cobertura de Nuvens</span>
              </div>
              <span className={`text-sm font-semibold ${cloudImpact.color}`}>
                {solarData.cloud_coverage}%
              </span>
            </div>
            <Progress 
              className={`h-2 bg-blue-100 ${cloudImpact.bgColor}`}
              value={solarData.cloud_coverage} 
            />
            <p className="text-xs text-muted-foreground mt-1">
              {cloudImpact.label}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Funções auxiliares para classificação
function getRadiationLevel(index: number) {
  if (index >= 8) return { 
    label: 'Radiação solar excelente para geração', 
    color: 'text-green-600',
    bgColor: 'bg-green-500' 
  };
  if (index >= 5) return { 
    label: 'Boa radiação solar', 
    color: 'text-amber-600',
    bgColor: 'bg-amber-500' 
  };
  return { 
    label: 'Radiação solar moderada', 
    color: 'text-orange-600',
    bgColor: 'bg-orange-500' 
  };
}

function getCloudImpact(coverage: number) {
  if (coverage <= 20) return { 
    label: 'Céu limpo, excelente para geração solar', 
    color: 'text-green-600',
    bgColor: 'bg-green-500' 
  };
  if (coverage <= 50) return { 
    label: 'Parcialmente nublado, boa geração solar', 
    color: 'text-amber-600',
    bgColor: 'bg-amber-500' 
  };
  return { 
    label: 'Muito nublado, redução na geração solar', 
    color: 'text-red-600',
    bgColor: 'bg-red-500' 
  };
}

function getPotentialClass(potential: number) {
  if (potential >= 15) return { 
    label: 'Excelente potencial de geração', 
    color: 'text-green-600',
    bgColor: 'bg-green-500' 
  };
  if (potential >= 10) return { 
    label: 'Bom potencial de geração', 
    color: 'text-amber-600',
    bgColor: 'bg-amber-500' 
  };
  return { 
    label: 'Potencial moderado de geração', 
    color: 'text-orange-600',
    bgColor: 'bg-orange-500' 
  };
}

export default SolarConditions;