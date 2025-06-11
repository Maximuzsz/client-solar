import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';
import { Slider } from '@/components/ui/slider';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface MonthlyReading {
  month: string;
  year: number;
  consumption: number;
  generation: number;
}

interface ProjectionParams {
  growthRateConsumption: number;
  growthRateGeneration: number;
  forecastMonths: number;
}

interface ProjectedData {
  month: string;
  year: number;
  consumption: number;
  generation: number;
  projected: boolean;
}

export default function EnergyProjection() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [projectionParams, setProjectionParams] = useState<ProjectionParams>({
    growthRateConsumption: 2,
    growthRateGeneration: 5,
    forecastMonths: 12
  });
  const [projectedData, setProjectedData] = useState<ProjectedData[]>([]);
  
  // Buscar dados históricos
  const { data: historicalData, isLoading: isLoadingHistorical } = useQuery({
    queryKey: ['/api/v1/dashboard/monthly-readings'],
    select: (data: MonthlyReading[]) => data || [],
  });

  useEffect(() => {
    if (historicalData) {
      generateProjection();
    }
  }, [historicalData, projectionParams]);

  const handleGrowthRateChange = (type: 'consumption' | 'generation', value: number[]) => {
    setProjectionParams(prev => ({
      ...prev,
      [type === 'consumption' ? 'growthRateConsumption' : 'growthRateGeneration']: value[0]
    }));
  };

  const handleForecastMonthsChange = (value: string) => {
    setProjectionParams(prev => ({
      ...prev,
      forecastMonths: parseInt(value)
    }));
  };

  const generateProjection = () => {
    setLoading(true);
    
    try {
      if (!historicalData || historicalData.length === 0) {
        toast({
          title: 'Dados insuficientes',
          description: 'Não há dados históricos suficientes para gerar uma projeção.',
          variant: 'destructive'
        });
        setLoading(false);
        return;
      }

      // Ordenar dados históricos por data
      const sortedHistorical = [...historicalData].sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        const monthOrder = {
          'jan': 0, 'fev': 1, 'mar': 2, 'abr': 3, 'mai': 4, 'jun': 5,
          'jul': 6, 'ago': 7, 'set': 8, 'out': 9, 'nov': 10, 'dez': 11
        };
        return monthOrder[a.month.toLowerCase() as keyof typeof monthOrder] - 
               monthOrder[b.month.toLowerCase() as keyof typeof monthOrder];
      });

      // Marcar dados históricos como não projetados
      const historicalWithFlag = sortedHistorical.map(item => ({
        ...item,
        projected: false
      }));

      // Obter último mês e ano para iniciar a projeção
      const lastEntry = sortedHistorical[sortedHistorical.length - 1];
      let lastMonth = lastEntry.month.toLowerCase();
      let lastYear = lastEntry.year;
      
      // Médias de consumo e geração dos últimos 3 meses (ou menos se não houver dados suficientes)
      const recentData = sortedHistorical.slice(-3);
      const avgConsumption = recentData.reduce((sum, item) => sum + item.consumption, 0) / recentData.length;
      const avgGeneration = recentData.reduce((sum, item) => sum + item.generation, 0) / recentData.length;

      // Array para armazenar dados projetados
      const projected: ProjectedData[] = [];

      // Gerar projeção para os próximos meses
      const monthOrder = [
        'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
        'jul', 'ago', 'set', 'out', 'nov', 'dez'
      ];
      
      let currentMonthIndex = monthOrder.indexOf(lastMonth);
      let currentYear = lastYear;
      let currentConsumption = avgConsumption;
      let currentGeneration = avgGeneration;

      for (let i = 0; i < projectionParams.forecastMonths; i++) {
        // Avançar para o próximo mês
        currentMonthIndex = (currentMonthIndex + 1) % 12;
        if (currentMonthIndex === 0) { // Janeiro do próximo ano
          currentYear++;
        }

        // Aplicar taxa de crescimento mensal
        currentConsumption *= (1 + projectionParams.growthRateConsumption / 100);
        currentGeneration *= (1 + projectionParams.growthRateGeneration / 100);

        // Adicionar ao array de projeção
        projected.push({
          month: monthOrder[currentMonthIndex].charAt(0).toUpperCase() + monthOrder[currentMonthIndex].slice(1),
          year: currentYear,
          consumption: parseFloat(currentConsumption.toFixed(2)),
          generation: parseFloat(currentGeneration.toFixed(2)),
          projected: true
        });
      }

      // Combinar dados históricos e projetados
      setProjectedData([...historicalWithFlag, ...projected]);

    } catch (error) {
      console.error('Erro ao gerar projeção:', error);
      toast({
        title: 'Erro ao gerar projeção',
        description: 'Ocorreu um erro ao calcular a projeção de energia.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projeção de Energia</h1>
          <p className="text-muted-foreground">
            Analise projeções futuras de consumo e geração com base em dados históricos.
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Parâmetros de Projeção</CardTitle>
            <CardDescription>
              Configure os parâmetros para personalizar sua projeção de energia.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="mb-2 block">Taxa de crescimento de consumo: {projectionParams.growthRateConsumption}%</Label>
                  <Slider 
                    defaultValue={[projectionParams.growthRateConsumption]} 
                    max={20} 
                    step={0.5}
                    onValueChange={(value) => handleGrowthRateChange('consumption', value)} 
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>0%</span>
                    <span>10%</span>
                    <span>20%</span>
                  </div>
                </div>
                
                <div>
                  <Label className="mb-2 block">Taxa de crescimento de geração: {projectionParams.growthRateGeneration}%</Label>
                  <Slider 
                    defaultValue={[projectionParams.growthRateGeneration]} 
                    max={20} 
                    step={0.5}
                    onValueChange={(value) => handleGrowthRateChange('generation', value)} 
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>0%</span>
                    <span>10%</span>
                    <span>20%</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="forecast-months">Meses para projeção</Label>
                  <Select 
                    value={projectionParams.forecastMonths.toString()} 
                    onValueChange={handleForecastMonthsChange}
                  >
                    <SelectTrigger id="forecast-months">
                      <SelectValue placeholder="Selecione um período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 meses</SelectItem>
                      <SelectItem value="6">6 meses</SelectItem>
                      <SelectItem value="12">12 meses</SelectItem>
                      <SelectItem value="24">24 meses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="pt-4">
                  <Button 
                    className="w-full" 
                    onClick={generateProjection}
                    disabled={loading || isLoadingHistorical}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {loading ? 'Gerando projeção...' : 'Gerar projeção'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Tabs defaultValue="area" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="area">Gráfico de Área</TabsTrigger>
            <TabsTrigger value="bar">Gráfico de Barras</TabsTrigger>
            <TabsTrigger value="data">Tabela de Dados</TabsTrigger>
          </TabsList>
          
          <TabsContent value="area">
            <Card>
              <CardHeader>
                <CardTitle>Projeção de Energia: Gráfico de Área</CardTitle>
                <CardDescription>
                  Visualize a projeção de consumo e geração de energia ao longo do tempo.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(isLoadingHistorical || loading) ? (
                  <div className="flex justify-center items-center h-80">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : projectedData.length > 0 ? (
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={projectedData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorConsumption" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#8884d8" stopOpacity={0.2}/>
                          </linearGradient>
                          <linearGradient id="colorGeneration" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.2}/>
                          </linearGradient>
                          <pattern id="projectionPattern" patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)">
                            <rect width="2" height="2" fill="rgba(255, 255, 255, 0.5)" />
                          </pattern>
                        </defs>
                        <XAxis 
                          dataKey={(entry) => `${entry.month}/${entry.year}`} 
                          tick={{ fontSize: 12 }}
                          interval={Math.max(1, Math.floor(projectedData.length / 12))}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <CartesianGrid strokeDasharray="3 3" />
                        <Tooltip 
                          formatter={(value, name) => [
                            `${parseFloat(value as string).toFixed(2)} kWh`, 
                            name === 'consumption' ? 'Consumo' : 'Geração'
                          ]}
                          labelFormatter={(label) => `${label}`}
                          separator=": "
                        />
                        <Legend 
                          verticalAlign="top" 
                          height={36} 
                          formatter={(value) => value === 'consumption' ? 'Consumo' : value === 'generation' ? 'Geração' : value}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="consumption" 
                          stroke="#8884d8" 
                          fillOpacity={1} 
                          fill="url(#colorConsumption)" 
                          strokeWidth={2}
                          dot={{ r: 3, strokeWidth: 1, fill: "#8884d8" }}
                          activeDot={{ r: 5, strokeWidth: 0 }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="generation" 
                          stroke="#82ca9d" 
                          fillOpacity={1} 
                          fill="url(#colorGeneration)"
                          strokeWidth={2}
                          dot={{ r: 3, strokeWidth: 1, fill: "#82ca9d" }}
                          activeDot={{ r: 5, strokeWidth: 0 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <p>Nenhum dado disponível. Ajuste os parâmetros e gere uma projeção.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="bar">
            <Card>
              <CardHeader>
                <CardTitle>Projeção de Energia: Gráfico de Barras</CardTitle>
                <CardDescription>
                  Compare o consumo e geração projetados em barras para cada período.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(isLoadingHistorical || loading) ? (
                  <div className="flex justify-center items-center h-80">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : projectedData.length > 0 ? (
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={projectedData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey={(entry) => `${entry.month}/${entry.year}`} 
                          tick={{ fontSize: 12 }}
                          interval={Math.max(1, Math.floor(projectedData.length / 12))}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip 
                          formatter={(value, name) => [
                            `${parseFloat(value as string).toFixed(2)} kWh`, 
                            name === 'consumption' ? 'Consumo' : 'Geração'
                          ]}
                          labelFormatter={(label) => `${label}`}
                          separator=": "
                        />
                        <Legend 
                          verticalAlign="top" 
                          height={36}
                          formatter={(value) => value === 'consumption' ? 'Consumo' : value === 'generation' ? 'Geração' : value}
                        />
                        <Bar name="consumption" dataKey="consumption" fill="#8884d8" />
                        <Bar name="generation" dataKey="generation" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <p>Nenhum dado disponível. Ajuste os parâmetros e gere uma projeção.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="data">
            <Card>
              <CardHeader>
                <CardTitle>Projeção de Energia: Dados Detalhados</CardTitle>
                <CardDescription>
                  Visualize os valores numéricos da projeção em formato de tabela.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(isLoadingHistorical || loading) ? (
                  <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : projectedData.length > 0 ? (
                  <div className="rounded-md border">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="p-2 text-left font-medium">Período</th>
                            <th className="p-2 text-right font-medium">Consumo (kWh)</th>
                            <th className="p-2 text-right font-medium">Geração (kWh)</th>
                            <th className="p-2 text-right font-medium">Saldo (kWh)</th>
                            <th className="p-2 text-center font-medium">Tipo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {projectedData.map((entry, index) => (
                            <tr 
                              key={index} 
                              className={`border-t ${entry.projected ? 'bg-muted/20' : ''} 
                                         ${entry.generation > entry.consumption ? 'text-emerald-600' : ''}`}
                            >
                              <td className="p-2 text-left">{`${entry.month}/${entry.year}`}</td>
                              <td className="p-2 text-right">{entry.consumption.toFixed(2)}</td>
                              <td className="p-2 text-right">{entry.generation.toFixed(2)}</td>
                              <td className="p-2 text-right font-medium">
                                {(entry.generation - entry.consumption).toFixed(2)}
                              </td>
                              <td className="p-2 text-center">
                                <span className={`text-xs px-2 py-1 rounded-full ${entry.projected 
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' 
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'}`}
                                >
                                  {entry.projected ? 'Projeção' : 'Histórico'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <p>Nenhum dado disponível. Ajuste os parâmetros e gere uma projeção.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <Card>
          <CardHeader>
            <CardTitle>Análise de Projeção</CardTitle>
            <CardDescription>
              Resumo dos resultados da projeção e recomendações.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(isLoadingHistorical || loading) ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : projectedData.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Tendências Projetadas</h3>
                  <ul className="space-y-2 text-sm">
                    {(() => {
                      // Filtrar apenas dados projetados
                      const projectedOnly = projectedData.filter(item => item.projected);
                      
                      // Calcular médias de consumo e geração
                      const avgConsumption = projectedOnly.reduce((sum, item) => sum + item.consumption, 0) / projectedOnly.length;
                      const avgGeneration = projectedOnly.reduce((sum, item) => sum + item.generation, 0) / projectedOnly.length;
                      
                      // Calcular saldo médio
                      const avgBalance = avgGeneration - avgConsumption;
                      
                      // Tendência de crescimento ou queda
                      const firstProjected = projectedOnly[0];
                      const lastProjected = projectedOnly[projectedOnly.length - 1];
                      const consumptionTrend = lastProjected.consumption > firstProjected.consumption ? 'crescimento' : 'queda';
                      const generationTrend = lastProjected.generation > firstProjected.generation ? 'crescimento' : 'queda';
                      
                      return (
                        <>
                          <li className="flex items-center">
                            <span className="h-2 w-2 rounded-full bg-purple-500 mr-2"></span>
                            Consumo médio projetado: <span className="font-medium ml-1">{avgConsumption.toFixed(2)} kWh</span>
                          </li>
                          <li className="flex items-center">
                            <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                            Geração média projetada: <span className="font-medium ml-1">{avgGeneration.toFixed(2)} kWh</span>
                          </li>
                          <li className="flex items-center">
                            <span className={`h-2 w-2 rounded-full ${avgBalance >= 0 ? 'bg-emerald-500' : 'bg-red-500'} mr-2`}></span>
                            Saldo energético médio: <span className={`font-medium ml-1 ${avgBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                              {avgBalance.toFixed(2)} kWh ({avgBalance >= 0 ? 'positivo' : 'negativo'})
                            </span>
                          </li>
                          <li className="flex items-center">
                            <span className="h-2 w-2 rounded-full bg-blue-500 mr-2"></span>
                            Tendência de consumo: <span className="font-medium ml-1">{consumptionTrend}</span>
                          </li>
                          <li className="flex items-center">
                            <span className="h-2 w-2 rounded-full bg-amber-500 mr-2"></span>
                            Tendência de geração: <span className="font-medium ml-1">{generationTrend}</span>
                          </li>
                        </>
                      );
                    })()}
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Recomendações</h3>
                  <ul className="space-y-2 text-sm">
                    {(() => {
                      // Filtrar apenas dados projetados
                      const projectedOnly = projectedData.filter(item => item.projected);
                      
                      // Calcular médias de consumo e geração
                      const avgConsumption = projectedOnly.reduce((sum, item) => sum + item.consumption, 0) / projectedOnly.length;
                      const avgGeneration = projectedOnly.reduce((sum, item) => sum + item.generation, 0) / projectedOnly.length;
                      
                      // Calcular saldo médio
                      const avgBalance = avgGeneration - avgConsumption;
                      
                      return (
                        <>
                          {avgBalance < 0 ? (
                            <>
                              <li className="flex items-start">
                                <span className="h-5 w-5 text-red-500 mr-2">⚠️</span>
                                <span>Projeção indica déficit energético médio. Considere reduzir o consumo ou aumentar a capacidade de geração.</span>
                              </li>
                              <li className="flex items-start">
                                <span className="h-5 w-5 text-amber-500 mr-2">💡</span>
                                <span>Avalie a instalação de painéis solares adicionais para compensar o déficit projetado.</span>
                              </li>
                            </>
                          ) : (
                            <li className="flex items-start">
                              <span className="h-5 w-5 text-green-500 mr-2">✅</span>
                              <span>Projeção indica superávit energético. Seu sistema está bem dimensionado para necessidades futuras.</span>
                            </li>
                          )}
                          
                          {projectionParams.growthRateConsumption > projectionParams.growthRateGeneration ? (
                            <li className="flex items-start">
                              <span className="h-5 w-5 text-amber-500 mr-2">⚠️</span>
                              <span>A taxa de crescimento do consumo está superior à da geração, o que pode levar a déficits futuros.</span>
                            </li>
                          ) : null}
                          
                          <li className="flex items-start">
                            <span className="h-5 w-5 text-blue-500 mr-2">📊</span>
                            <span>Monitore regularmente o consumo real versus projetado para ajustar suas previsões.</span>
                          </li>
                          
                          <li className="flex items-start">
                            <span className="h-5 w-5 text-purple-500 mr-2">📝</span>
                            <span>Considere fazer uma revisão dos equipamentos elétricos para manter a eficiência energética.</span>
                          </li>
                        </>
                      );
                    })()}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p>Gere uma projeção para visualizar a análise detalhada e recomendações.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}