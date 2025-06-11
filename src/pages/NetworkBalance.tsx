import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { FilterIcon, DownloadIcon, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { handleExportLimit } from '@/lib/exportLimits';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import Breadcrumbs from '@/components/ui/breadcrumbs';
import { apiRequest } from '@/lib/api';
import { networksAPI } from '@/services/networksAPI';
import { unitsAPI } from '@/services/unitsAPI';
import { Unit, Reading } from '@/types';
import { exportToPdf, registerExport, createExtraReportPayment } from '@/lib/pdfExport';
import { checkExportLimit } from '@/lib/reportLimits';

// Interface para os dados de balanço da rede
interface UnitBalance {
  id: number;
  name: string;
  type: 'Consumer' | 'Generator';
  consumption: number; // em kWh
  costPerKwh: number;  // valor da tarifa
  totalCost: number;   // consumo * tarifa
  generation: number;  // geração em kWh (0 para consumidores)
  excessPayment: number; // valor proporcional excedente a pagar
}

// Esta interface está sendo usada diretamente na implementação
interface NetworkBalanceInfo {
  totalConsumption: number;
  totalGeneration: number;
  surplus: number; // Excedente (positivo) ou déficit (negativo)
  totalCost: number;
  units: UnitBalance[];
}

export default function NetworkBalance() {
  const { networkId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Estado para o filtro de mês/ano
  const [filterMonth, setFilterMonth] = useState<Date | undefined>(new Date());
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Consulta para obter a rede atual
  const { data: network, isLoading: isNetworkLoading } = useQuery({
    queryKey: ['network', networkId],
    queryFn: async () => {
      try {
        if (networkId) {
          const data = await networksAPI.getById(Number(networkId));
          console.log('Dados da rede obtidos:', data);
          return data || { id: Number(networkId), name: "Rede não encontrada", description: "", ownerId: 0 };
        }
        return { id: 0, name: "Rede não encontrada", description: "", ownerId: 0 };
      } catch (error) {
        console.error('Erro ao buscar rede:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os dados da rede.',
          variant: 'destructive'
        });
        return { id: networkId ? Number(networkId) : 0, name: "Rede não encontrada", description: "", ownerId: 0 };
      }
    },
    enabled: !!networkId
  });

  // Consulta para obter o balanço da rede (unidades + leituras + cálculos)
  const { data: balanceData, isLoading: isBalanceLoading, refetch: refetchBalance } = useQuery({
    queryKey: ['network-balance', networkId, filterMonth ? format(filterMonth, 'yyyy-MM') : 'all'],
    queryFn: async () => {
      try {
        // Aqui faremos a chamada para a API que calcula o balanço da rede
        // Por enquanto, vamos construir esse cálculo no frontend como uma solução temporária
        
        // 1. Obter todas as unidades da rede
        const units = networkId ? await unitsAPI.getByNetwork(Number(networkId)) : [];
        
        if (!Array.isArray(units)) {
          throw new Error("Não foi possível obter as unidades da rede");
        }

        // 2. Para cada unidade, obter as leituras no período filtrado
        const month = filterMonth ? filterMonth.getMonth() + 1 : new Date().getMonth() + 1;
        const year = filterMonth ? filterMonth.getFullYear() : new Date().getFullYear();
        
        // Formatar datas para filtro
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

        // 3. Obter tarifa atual da concessionária
        // Assumindo uma tarifa padrão de exemplo (R$ 0.75 por kWh) para todas as unidades
        // Idealmente, isso viria da API com a tarifa correta de cada concessionária
        const defaultTariff = 0.75;
        
        // 4. Calcular o balanço de cada unidade
        let totalConsumption = 0;
        let totalGeneration = 0;
        let totalCost = 0;
        
        const unitsBalance: UnitBalance[] = await Promise.all(units.map(async (unit: Unit) => {
          try {
            // Buscar leituras da unidade no período filtrado
            const response = await apiRequest('GET', `/readings/unit/${unit.id}?startDate=${startDate}&endDate=${endDate}`);
            console.log(`Leituras da unidade ${unit.id}:`, response);
            const readings: Reading[] = Array.isArray(response) ? response : [];
            
            // Somar os valores das leituras (consumo ou geração dependendo do tipo da unidade)
            const totalValue = readings.reduce((sum, reading) => sum + reading.value, 0);
            
            // Determinar se é consumo ou geração baseado no tipo da unidade
            const consumption = unit.type === 'Consumer' ? totalValue : 0;
            const generation = unit.type === 'Generator' ? totalValue : 0;
            
            // Acumular totais
            totalConsumption += consumption;
            totalGeneration += generation;
            
            // Calcular custo total (apenas para unidades consumidoras)
            const unitCost = consumption * defaultTariff;
            totalCost += unitCost;

            return {
              id: unit.id,
              name: unit.name,
              type: unit.type,
              consumption,
              costPerKwh: defaultTariff,
              totalCost: unitCost,
              generation,
              excessPayment: 0 // Será calculado depois
            };
          } catch (error) {
            console.error(`Erro ao processar unidade ${unit.id}:`, error);
            return {
              id: unit.id,
              name: unit.name,
              type: unit.type,
              consumption: 0,
              costPerKwh: defaultTariff,
              totalCost: 0,
              generation: 0,
              excessPayment: 0
            };
          }
        }));
        
        // 5. Calcular o excedente geral e os pagamentos proporcionais
        const surplus = totalGeneration - totalConsumption;
        
        // Se houver déficit (geração menor que consumo), calcular pagamento excedente proporcional
        if (surplus < 0) {
          const deficit = Math.abs(surplus);
          const deficitCost = deficit * defaultTariff;
          
          // Distribuir o custo do déficit proporcionalmente entre os consumidores
          const consumerUnits = unitsBalance.filter(unit => unit.type === 'Consumer');
          const totalConsumerConsumption = consumerUnits.reduce((sum, unit) => sum + unit.consumption, 0);
          
          // Atualizar os pagamentos excedentes para cada unidade consumidora
          // Importante: o excessPayment não deve ser somado ao custo base, pois isso duplicaria o valor
          unitsBalance.forEach(unit => {
            if (unit.type === 'Consumer' && unit.consumption > 0) {
              const proportion = unit.consumption / totalConsumerConsumption;
              // Calcular o pagamento excedente apenas para exibição
              // O valor não deve ser somado ao custo total, pois já está incluído no custo base
              unit.excessPayment = 0; // Para evitar soma duplicada no cálculo
            }
          });
        }
        
        return {
          totalConsumption,
          totalGeneration,
          surplus,
          totalCost,
          units: unitsBalance
        };
      } catch (error) {
        console.error('Erro ao calcular balanço da rede:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível calcular o balanço da rede.',
          variant: 'destructive'
        });
        return {
          totalConsumption: 0,
          totalGeneration: 0,
          surplus: 0,
          totalCost: 0,
          units: []
        };
      }
    },
    enabled: !!networkId
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // A função showUpgradeMessage agora é importada do arquivo de utilidades

  const handleExportCSV = async () => {
    if (!balanceData || !balanceData.units.length) {
      toast({
        title: 'Erro',
        description: 'Não há dados para exportar.',
        variant: 'destructive'
      });
      return;
    }

    // Verificar limite de exportação usando nossa função utilitária
    let exportLimitResult;
    const canProceed = await handleExportLimit(
      checkExportLimit,
      'ExportCSV',
      createExtraReportPayment,
      networkId,
      (result) => { exportLimitResult = result; }
    );
    
    if (!canProceed) {
      return; // Não prosseguir se não puder exportar
    }
    
    try {
      // Cabeçalho do CSV
      let csvContent = "ID,Nome,Tipo,Consumo (kWh),Tarifa (R$/kWh),Custo Total (R$),Geração (kWh),Pagamento Excedente (R$)\n";
      
      // Adicionar dados de cada unidade
      balanceData.units.forEach(unit => {
        csvContent += `${unit.id},${unit.name},${unit.type},${unit.consumption},${unit.costPerKwh.toFixed(2)},${unit.totalCost.toFixed(2)},${unit.generation},${unit.excessPayment.toFixed(2)}\n`;
      });
      
      // Adicionar linha de totais
      csvContent += `\nTotal,,,"${balanceData.totalConsumption}",,"${balanceData.totalCost.toFixed(2)}","${balanceData.totalGeneration}",`;
      
      // Criar blob e link para download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `balanço-rede-${networkId}-${format(filterMonth || new Date(), 'yyyy-MM')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Registrar exportação no sistema
      await registerExport('ExportCSV', undefined, networkId ? parseInt(networkId) : undefined);
      
      // Mostrar mensagem de limite restante
      let limitMessage = 'Exportação concluída com sucesso.';
      if (exportLimitResult && exportLimitResult.remaining > 0) {
        limitMessage += ` Você tem ${exportLimitResult.remaining} exportações CSV restantes neste mês.`;
      }
      
      toast({
        title: 'Sucesso',
        description: limitMessage,
      });
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível exportar o arquivo CSV.',
        variant: 'destructive'
      });
    }
  };
  
  const handleExportPDF = async () => {
    if (!balanceData || !balanceData.units.length) {
      toast({
        title: 'Erro',
        description: 'Não há dados para exportar.',
        variant: 'destructive'
      });
      return;
    }

    // Verificar limite de exportação usando nossa função utilitária
    let exportLimitResult;
    const canProceed = await handleExportLimit(
      checkExportLimit,
      'ExportPDF',
      createExtraReportPayment,
      networkId ? parseInt(networkId) : undefined,
      (result) => { exportLimitResult = result; }
    );
    
    if (!canProceed) {
      return; // Não prosseguir se não puder exportar
    }
    
    try {
      const columns = [
        { header: 'ID', dataKey: 'id' },
        { header: 'Nome', dataKey: 'name' },
        { header: 'Tipo', dataKey: 'type' },
        { header: 'Consumo (kWh)', dataKey: 'consumption' },
        { header: 'Tarifa (R$/kWh)', dataKey: 'costPerKwh' },
        { header: 'Custo Total (R$)', dataKey: 'totalCost' },
        { header: 'Geração (kWh)', dataKey: 'generation' },
        { header: 'Pagamento Excedente (R$)', dataKey: 'excessPayment' }
      ];
      
      // Preparar dados formatados para o PDF
      const data = balanceData.units.map(unit => ({
        id: unit.id,
        name: unit.name,
        type: unit.type === 'Consumer' ? 'Consumidor' : 'Gerador',
        consumption: unit.consumption,
        costPerKwh: unit.costPerKwh,
        totalCost: unit.totalCost,
        generation: unit.generation,
        excessPayment: unit.excessPayment
      }));
      
      // Dados de resumo/totais para o rodapé
      const summaryData = {
        name: 'Total',
        consumption: balanceData.totalConsumption.toString(),
        totalCost: balanceData.totalCost.toFixed(2),
        generation: balanceData.totalGeneration.toString()
      };
      
      // Nome da rede para o título do relatório
      const networkName = network?.name || `Rede #${networkId}`;
      
      // Opções do PDF
      const exportOptions = {
        title: `Balanço Energético - ${networkName}`,
        subtitle: `Período: ${format(filterMonth || new Date(), 'MMMM yyyy', { locale: ptBR })}`,
        filename: `balanco-energetico-${networkId}-${format(filterMonth || new Date(), 'yyyy-MM')}.pdf`,
        orientation: 'landscape' as const,
        addSummaryRow: true,
        summaryData
      };
      
      // Gerar o PDF
      exportToPdf(columns, data, exportOptions);
      
      // Registrar exportação no sistema
      await registerExport('ExportPDF', undefined, networkId ? parseInt(networkId) : undefined);
      
      // Mostrar mensagem de limite restante
      let limitMessage = 'Exportação concluída com sucesso.';
      if (exportLimitResult && exportLimitResult.remaining > 0) {
        limitMessage += ` Você tem ${exportLimitResult.remaining} exportações PDF restantes neste mês.`;
      }
      
      toast({
        title: 'Sucesso',
        description: limitMessage,
      });
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível exportar o arquivo PDF.',
        variant: 'destructive'
      });
    }
  };

  const isLoading = isNetworkLoading || isBalanceLoading;

  return (
    <Layout>
      <div className="container mx-auto p-4 space-y-6">
        <Breadcrumbs 
          items={[
            { label: 'Redes', href: '/networks' },
            { label: network?.name || 'Rede', href: `/networks/${networkId}` },
            { label: 'Balanço Energético', href: '#' }
          ]} 
        />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Balanço Energético da Rede</h1>
            <p className="text-muted-foreground">
              {network?.name || 'Carregando...'} - {filterMonth ? format(filterMonth, 'MMMM yyyy', { locale: ptBR }) : 'Todos os períodos'}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Filtro por mês */}
            <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <FilterIcon className="h-4 w-4" />
                  <span>Filtrar</span>
                  {filterMonth && (
                    <Badge variant="outline" className="ml-2">
                      {format(filterMonth, 'MMM/yyyy', { locale: ptBR })}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={filterMonth}
                  onSelect={(date: Date | undefined) => {
                    setFilterMonth(date);
                    setIsFilterOpen(false);
                    if (date) {
                      refetchBalance();
                    }
                  }}
                  captionLayout="dropdown-buttons"
                  fromYear={2020}
                  toYear={2030}
                  disabled={(date: Date) => date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {/* Botão para exportar CSV */}
            <Button 
              variant="outline" 
              className="flex items-center gap-2 mr-2"
              onClick={handleExportCSV}
              disabled={!balanceData || !balanceData.units.length}
            >
              <DownloadIcon className="h-4 w-4" />
              <span>Exportar CSV</span>
            </Button>
            
            {/* Botão para exportar PDF */}
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={handleExportPDF}
              disabled={!balanceData || !balanceData.units.length}
            >
              <FileText className="h-4 w-4" />
              <span>Exportar PDF</span>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <>
            {/* Cards com informações consolidadas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Consumo Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{balanceData?.totalConsumption.toFixed(2)} kWh</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Geração Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{balanceData?.totalGeneration.toFixed(2)} kWh</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    {balanceData?.surplus && balanceData.surplus >= 0 ? 'Excedente' : 'Déficit'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${balanceData?.surplus && balanceData.surplus >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {Math.abs(balanceData?.surplus || 0).toFixed(2)} kWh
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Custo Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(balanceData?.totalCost || 0)}</div>
                </CardContent>
              </Card>
            </div>

            {/* Tabela com detalhes de cada unidade */}
            <Card>
              <CardHeader>
                <CardTitle>Detalhes por Unidade</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Consumo (kWh)</TableHead>
                      <TableHead className="text-right">Tarifa (R$/kWh)</TableHead>
                      <TableHead className="text-right">Custo Base (R$)</TableHead>
                      <TableHead className="text-right">Geração (kWh)</TableHead>
                      <TableHead className="text-right">Fator Excedente</TableHead>
                      <TableHead className="text-right">Total (R$)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {balanceData?.units.map(unit => (
                      <TableRow key={unit.id}>
                        <TableCell>{unit.id}</TableCell>
                        <TableCell>{unit.name}</TableCell>
                        <TableCell>
                          <Badge variant={unit.type === 'Consumer' ? 'default' : 'outline'} 
                                 className={unit.type === 'Generator' ? 'bg-green-100 text-green-800 hover:bg-green-200 border-green-300' : ''}>
                            {unit.type === 'Consumer' ? 'Consumidor' : 'Gerador'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{unit.consumption.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{unit.costPerKwh.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(unit.totalCost)}</TableCell>
                        <TableCell className="text-right">{unit.generation.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          {unit.excessPayment > 0 ? unit.excessPayment.toFixed(2) : "-"}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(
                            // Se for uma unidade consumidora com excedente, somamos o custo base com o pagamento do excedente
                            // Se não houver excedente, o total é igual ao custo base
                            unit.type === 'Consumer' ? 
                              (unit.excessPayment > 0 ? 
                                unit.totalCost + unit.excessPayment : 
                                unit.totalCost) 
                              : 0
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    
                    {/* Linha de totais */}
                    {balanceData && balanceData.units.length > 0 && (
                      <TableRow className="bg-muted/50 font-medium">
                        <TableCell colSpan={3}>Total</TableCell>
                        <TableCell className="text-right">{balanceData.totalConsumption.toFixed(2)}</TableCell>
                        <TableCell className="text-right">-</TableCell>
                        <TableCell className="text-right">{formatCurrency(balanceData.totalCost)}</TableCell>
                        <TableCell className="text-right">{balanceData.totalGeneration.toFixed(2)}</TableCell>
                        <TableCell className="text-right">-</TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(
                            // Calcular o total dos pagamentos (custo base, sem duplicação)
                            // Quando há excedente, o custo já inclui o pagamento do excedente
                            balanceData.totalCost
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                    
                    {balanceData?.units.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-6">
                          Nenhum dado encontrado para o período selecionado.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
}