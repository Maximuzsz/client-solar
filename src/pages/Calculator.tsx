import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { CalculatorIcon, ArrowLeft, Info } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function Calculator() {
  const [, setLocation] = useLocation();
  const [currentTab, setCurrentTab] = useState('economia');
  
  // Dados de entrada para cálculo de economia
  const [consumption, setConsumption] = useState<number>(500);
  const [tariff, setTariff] = useState<number>(0.75);
  const [solarGeneration, setSolarGeneration] = useState<number>(450);
  const [systemCost, setSystemCost] = useState<number>(15000);
  
  // Dados de saída do cálculo de economia
  const [monthlySavings, setMonthlySavings] = useState<number>(0);
  const [annualSavings, setAnnualSavings] = useState<number>(0);
  const [paybackTime, setPaybackTime] = useState<number>(0);
  const [return25Years, setReturn25Years] = useState<number>(0);
  const [co2Reduction, setCo2Reduction] = useState<number>(0);
  const [treesEquivalent, setTreesEquivalent] = useState<number>(0);
  
  // Dados para cálculo de dimensionamento
  const [monthlyConsumption, setMonthlyConsumption] = useState<number>(500);
  const [panelPower, setPanelPower] = useState<number>(550);
  const [systemEfficiency, setSystemEfficiency] = useState<number>(80);
  const [regionSunHours, setRegionSunHours] = useState<number>(5.5);
  
  // Dados de saída do dimensionamento
  const [recommendedCapacity, setRecommendedCapacity] = useState<number>(0);
  const [numberOfPanels, setNumberOfPanels] = useState<number>(0);
  const [estimatedGeneration, setEstimatedGeneration] = useState<number>(0);
  const [areaRequired, setAreaRequired] = useState<number>(0);
  const [estimatedCost, setEstimatedCost] = useState<number>(0);
  
  // Constantes para cálculos
  const PANEL_AREA_M2 = 2.2; // área média de um painel em m²
  const COST_PER_KWP = 3000; // custo médio por kWp instalado em R$
  const KG_CO2_PER_KWH = 0.071; // kg de CO2 por kWh gerado com fontes convencionais
  const TREES_PER_TON_CO2 = 6; // árvores equivalentes por tonelada de CO2 compensada
  
  // Efeito para calcular economia
  useEffect(() => {
    // Cálculo de economia mensal
    const calculatedMonthlySavings = consumption > solarGeneration 
      ? solarGeneration * tariff 
      : consumption * tariff;
    
    setMonthlySavings(calculatedMonthlySavings);
    
    // Cálculo de economia anual
    const calculatedAnnualSavings = calculatedMonthlySavings * 12;
    setAnnualSavings(calculatedAnnualSavings);
    
    // Cálculo do tempo de retorno (payback)
    const calculatedPaybackTime = systemCost / calculatedAnnualSavings;
    setPaybackTime(calculatedPaybackTime);
    
    // Cálculo do retorno em 25 anos
    const calculatedReturn25Years = (calculatedAnnualSavings * 25) - systemCost;
    setReturn25Years(calculatedReturn25Years);
    
    // Cálculo da redução de CO2
    const calculatedCo2Reduction = (solarGeneration * 12 * 25 * KG_CO2_PER_KWH) / 1000; // em toneladas
    setCo2Reduction(calculatedCo2Reduction);
    
    // Cálculo de árvores equivalentes
    const calculatedTreesEquivalent = Math.round(calculatedCo2Reduction * TREES_PER_TON_CO2);
    setTreesEquivalent(calculatedTreesEquivalent);
  }, [consumption, tariff, solarGeneration, systemCost]);
  
  // Efeito para calcular dimensionamento
  useEffect(() => {
    // Cálculo da capacidade recomendada em kWp
    const dailyConsumption = monthlyConsumption / 30; // consumo diário em kWh
    const calculatedCapacity = dailyConsumption / (regionSunHours * (systemEfficiency / 100));
    setRecommendedCapacity(calculatedCapacity);
    
    // Cálculo do número de painéis
    const calculatedPanels = Math.ceil(calculatedCapacity * 1000 / panelPower);
    setNumberOfPanels(calculatedPanels);
    
    // Cálculo da geração estimada
    const calculatedGeneration = Math.round(calculatedCapacity * regionSunHours * (systemEfficiency / 100) * 30);
    setEstimatedGeneration(calculatedGeneration);
    
    // Cálculo da área necessária
    const calculatedArea = calculatedPanels * PANEL_AREA_M2;
    setAreaRequired(calculatedArea);
    
    // Cálculo do custo estimado
    const calculatedCost = calculatedCapacity * COST_PER_KWP;
    setEstimatedCost(calculatedCost);
  }, [monthlyConsumption, panelPower, systemEfficiency, regionSunHours]);

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => setLocation('/')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-3xl font-bold">Calculadora Solar</h1>
            </div>
            <p className="text-muted-foreground">
              Simule a economia e dimensione seu sistema de energia solar
            </p>
          </div>
        </div>
        
        <Tabs 
          defaultValue="economia" 
          value={currentTab}
          onValueChange={setCurrentTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="economia">Cálculo de Economia</TabsTrigger>
            <TabsTrigger value="dimensionamento">Dimensionamento</TabsTrigger>
          </TabsList>
          
          {/* Tab de Cálculo de Economia */}
          <TabsContent value="economia" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Parâmetros de Entrada</CardTitle>
                  <CardDescription>
                    Informe os dados do seu consumo e sistema solar
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="consumption">Consumo Mensal (kWh)</Label>
                      <span className="text-sm text-muted-foreground">{consumption} kWh</span>
                    </div>
                    <Slider
                      id="consumption"
                      min={100}
                      max={2000}
                      step={10}
                      value={[consumption]}
                      onValueChange={(value) => setConsumption(value[0])}
                    />
                    <Input 
                      type="number"
                      value={consumption}
                      onChange={(e) => setConsumption(Number(e.target.value))}
                      className="mt-2"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="tariff">Tarifa de Energia (R$/kWh)</Label>
                      <span className="text-sm text-muted-foreground">R$ {tariff.toFixed(2)}/kWh</span>
                    </div>
                    <Slider
                      id="tariff"
                      min={0.5}
                      max={2}
                      step={0.01}
                      value={[tariff]}
                      onValueChange={(value) => setTariff(value[0])}
                    />
                    <Input 
                      type="number"
                      value={tariff}
                      onChange={(e) => setTariff(Number(e.target.value))}
                      step={0.01}
                      className="mt-2"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="solarGeneration">Geração Solar Mensal (kWh)</Label>
                      <span className="text-sm text-muted-foreground">{solarGeneration} kWh</span>
                    </div>
                    <Slider
                      id="solarGeneration"
                      min={0}
                      max={2000}
                      step={10}
                      value={[solarGeneration]}
                      onValueChange={(value) => setSolarGeneration(value[0])}
                    />
                    <Input 
                      type="number"
                      value={solarGeneration}
                      onChange={(e) => setSolarGeneration(Number(e.target.value))}
                      className="mt-2"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="systemCost">Custo do Sistema (R$)</Label>
                      <span className="text-sm text-muted-foreground">
                        R$ {systemCost.toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <Slider
                      id="systemCost"
                      min={5000}
                      max={100000}
                      step={1000}
                      value={[systemCost]}
                      onValueChange={(value) => setSystemCost(value[0])}
                    />
                    <Input 
                      type="number"
                      value={systemCost}
                      onChange={(e) => setSystemCost(Number(e.target.value))}
                      className="mt-2"
                    />
                  </div>
                </CardContent>
              </Card>
              
              <div className="space-y-6">
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
                  <CardHeader>
                    <CardTitle>Economia Financeira</CardTitle>
                    <CardDescription>
                      Resultados calculados com base nos parâmetros informados
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Economia Mensal</p>
                        <p className="text-2xl font-bold text-primary">
                          R$ {monthlySavings.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Economia Anual</p>
                        <p className="text-2xl font-bold text-primary">
                          R$ {annualSavings.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <p className="text-sm text-muted-foreground">Tempo de Retorno</p>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-3 w-3 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Tempo estimado para recuperar o investimento</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <p className="font-bold">
                          {paybackTime.toFixed(1)} anos
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <p className="text-sm text-muted-foreground">Retorno em 25 anos</p>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-3 w-3 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Economia total em 25 anos menos o investimento inicial</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <p className="font-bold">
                          R$ {return25Years.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/20 dark:to-green-800/10">
                  <CardHeader>
                    <CardTitle>Impacto Ambiental</CardTitle>
                    <CardDescription>
                      Reduções estimadas de emissões em 25 anos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Redução de CO₂</p>
                        <p className="font-bold">
                          {co2Reduction.toFixed(1)} toneladas
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Equivalente em Árvores</p>
                        <p className="font-bold">
                          {treesEquivalent} árvores
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          {/* Tab de Dimensionamento */}
          <TabsContent value="dimensionamento" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Parâmetros para Dimensionamento</CardTitle>
                  <CardDescription>
                    Informe os dados para calcular o sistema adequado
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="monthlyConsumption">Consumo Mensal (kWh)</Label>
                      <span className="text-sm text-muted-foreground">{monthlyConsumption} kWh</span>
                    </div>
                    <Slider
                      id="monthlyConsumption"
                      min={100}
                      max={2000}
                      step={10}
                      value={[monthlyConsumption]}
                      onValueChange={(value) => setMonthlyConsumption(value[0])}
                    />
                    <Input 
                      type="number"
                      value={monthlyConsumption}
                      onChange={(e) => setMonthlyConsumption(Number(e.target.value))}
                      className="mt-2"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="panelPower">Potência do Painel (W)</Label>
                      <span className="text-sm text-muted-foreground">{panelPower} W</span>
                    </div>
                    <Select
                      value={panelPower.toString()}
                      onValueChange={(value) => setPanelPower(Number(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a potência" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="400">400 W</SelectItem>
                        <SelectItem value="450">450 W</SelectItem>
                        <SelectItem value="500">500 W</SelectItem>
                        <SelectItem value="550">550 W</SelectItem>
                        <SelectItem value="600">600 W</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="systemEfficiency">Eficiência do Sistema (%)</Label>
                      <span className="text-sm text-muted-foreground">{systemEfficiency}%</span>
                    </div>
                    <Slider
                      id="systemEfficiency"
                      min={60}
                      max={90}
                      step={1}
                      value={[systemEfficiency]}
                      onValueChange={(value) => setSystemEfficiency(value[0])}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="regionSunHours">Horas de Sol Pico (h/dia)</Label>
                      <span className="text-sm text-muted-foreground">{regionSunHours} h/dia</span>
                    </div>
                    <Select
                      value={regionSunHours.toString()}
                      onValueChange={(value) => setRegionSunHours(Number(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a região" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="4.5">Norte - 4.5 h/dia</SelectItem>
                        <SelectItem value="5.5">Nordeste - 5.5 h/dia</SelectItem>
                        <SelectItem value="5.2">Centro-Oeste - 5.2 h/dia</SelectItem>
                        <SelectItem value="4.8">Sudeste - 4.8 h/dia</SelectItem>
                        <SelectItem value="4.6">Sul - 4.6 h/dia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
                <CardHeader>
                  <CardTitle>Dimensionamento do Sistema</CardTitle>
                  <CardDescription>
                    Resultados calculados com base nos parâmetros informados
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Capacidade Recomendada</p>
                      <p className="text-2xl font-bold text-primary">
                        {recommendedCapacity.toFixed(2)} kWp
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Número de Painéis</p>
                      <p className="text-2xl font-bold text-primary">
                        {numberOfPanels} unidades
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Geração Estimada</p>
                      <p className="font-bold">
                        {estimatedGeneration} kWh/mês
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Área Necessária</p>
                      <p className="font-bold">
                        {areaRequired.toFixed(1)} m²
                      </p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">Investimento Estimado</p>
                      <Badge variant="outline" className="font-bold">
                        R$ {estimatedCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Badge>
                    </div>
                    
                    <div className="mt-4">
                      <p className="text-xs text-muted-foreground">
                        * Os valores apresentados são aproximados e podem variar de acordo com diversos fatores como a 
                        qualidade dos equipamentos, complexidade da instalação, condições do local, etc.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}