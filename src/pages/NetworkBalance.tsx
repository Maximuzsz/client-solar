import { Layout } from '@/components/layout/Layout';
import { Badge } from '@/components/ui/badge';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import { Button } from '@/components/ui/button';
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/api';
import { handleExportLimit } from '@/lib/exportLimits';
import { createExtraReportPayment, exportToPdf, registerExport } from '@/lib/pdfExport';
import { checkExportLimit } from '@/lib/reportLimits';
import { networksAPI } from '@/services/networksAPI';
import { unitsAPI } from '@/services/unitsAPI';
import { Unit } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DownloadIcon, FileText, FilterIcon } from 'lucide-react';
import { useState } from 'react';
import { useLocation, useParams } from 'wouter';

interface UnitBalance {
  id: number;
  name: string;
  type: 'Consumer' | 'Generator';
  consumption: number;
  costPerKwh: number;
  totalCost: number;
  generation: number;
  excessPayment: number;
}

interface ExportLimitResult {
  remaining: number;
}

interface BalanceData {
  totalConsumption: number;
  totalGeneration: number;
  surplus: number;
  totalCost: number;
  units: UnitBalance[];
}

export default function NetworkBalance() {
  const { networkId } = useParams();
  const [,] = useLocation();
  const { toast } = useToast();
  
  const [filterMonth, setFilterMonth] = useState<Date | undefined>(new Date());
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const { data: network, isLoading: isNetworkLoading } = useQuery({
    queryKey: ['network', networkId],
    queryFn: async () => {
      try {
        if (!networkId) {
          return { id: 0, name: "Rede não encontrada", description: "", ownerId: 0 };
        }

        const data = await networksAPI.getById(Number(networkId));
        return data || { id: Number(networkId), name: "Rede não encontrada", description: "", ownerId: 0 };
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

  const { data: balanceData, isLoading: isBalanceLoading, refetch: refetchBalance } = useQuery<BalanceData>({
    queryKey: ['network-balance', networkId, filterMonth ? format(filterMonth, 'yyyy-MM') : 'all'],
    queryFn: async () => {
      try {
        if (!networkId) {
          return {
            totalConsumption: 0,
            totalGeneration: 0,
            surplus: 0,
            totalCost: 0,
            units: []
          };
        }

        const units = await unitsAPI.getByNetwork(networkId);
        
        if (!Array.isArray(units)) {
          throw new Error("Não foi possível obter as unidades da rede");
        }

        const month = filterMonth ? filterMonth.getMonth() + 1 : new Date().getMonth() + 1;
        const year = filterMonth ? filterMonth.getFullYear() : new Date().getFullYear();
        
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

        const defaultTariff = 0.75;
        let totalConsumption = 0;
        let totalGeneration = 0;
        let totalCost = 0;
        
        const unitsBalance: UnitBalance[] = await Promise.all(units.map(async (unit: Unit) => {
          try {
            const response = await apiRequest('GET', `/readings/unit/${unit.id}?startDate=${startDate}&endDate=${endDate}`);
            const readings = Array.isArray(response) ? response : [];
            
            const totalValue = readings.reduce((sum, reading) => sum + reading.value, 0);
            const consumption = unit.type === 'Consumer' ? totalValue : 0;
            const generation = unit.type === 'Generator' ? totalValue : 0;
            
            totalConsumption += consumption;
            totalGeneration += generation;
            
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
              excessPayment: 0
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
        
        const surplus = totalGeneration - totalConsumption;
        
        if (surplus < 0) {
          
          unitsBalance.forEach(unit => {
            if (unit.type === 'Consumer' && unit.consumption > 0) {
              unit.excessPayment = 0;
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

  const handleExportCSV = async () => {
    if (!balanceData || !balanceData.units.length) {
      toast({
        title: 'Erro',
        description: 'Não há dados para exportar.',
        variant: 'destructive'
      });
      return;
    }

    let exportLimitResult: ExportLimitResult | undefined;
    const canProceed = await handleExportLimit(
      checkExportLimit,
      'ExportCSV',
      createExtraReportPayment,
      networkId,
      (result: ExportLimitResult) => { exportLimitResult = result; }
    );
    
    if (!canProceed) return;
    
    try {
      let csvContent = "ID,Nome,Tipo,Consumo (kWh),Tarifa (R$/kWh),Custo Total (R$),Geração (kWh),Pagamento Excedente (R$)\n";
      
      balanceData.units.forEach(unit => {
        csvContent += `${unit.id},${unit.name},${unit.type},${unit.consumption},${unit.costPerKwh.toFixed(2)},${unit.totalCost.toFixed(2)},${unit.generation},${unit.excessPayment.toFixed(2)}\n`;
      });
      
      csvContent += `\nTotal,,,"${balanceData.totalConsumption}",,"${balanceData.totalCost.toFixed(2)}","${balanceData.totalGeneration}",`;
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `balanço-rede-${networkId}-${format(filterMonth || new Date(), 'yyyy-MM')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      await registerExport('ExportCSV', undefined, networkId ? parseInt(networkId) : undefined);
      
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

    let exportLimitResult: ExportLimitResult | undefined;
    const canProceed = await handleExportLimit(
      checkExportLimit,
      'ExportPDF',
      createExtraReportPayment,
      networkId ? parseInt(networkId) : undefined,
      (result: ExportLimitResult) => { exportLimitResult = result; }
    );
    
    if (!canProceed) return;
    
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
      
      const summaryData = {
        name: 'Total',
        consumption: balanceData.totalConsumption.toString(),
        totalCost: balanceData.totalCost.toFixed(2),
        generation: balanceData.totalGeneration.toString()
      };
      
      const networkName = network?.name || `Rede #${networkId}`;
      
      const exportOptions = {
        title: `Balanço Energético - ${networkName}`,
        subtitle: `Período: ${format(filterMonth || new Date(), 'MMMM yyyy', { locale: ptBR })}`,
        filename: `balanco-energetico-${networkId}-${format(filterMonth || new Date(), 'yyyy-MM')}.pdf`,
        orientation: 'landscape' as const,
        addSummaryRow: true,
        summaryData
      };
      
      exportToPdf(columns, data, exportOptions);
      
      await registerExport('ExportPDF', undefined, networkId ? parseInt(networkId) : undefined);
      
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
                  onSelect={(date) => {
                    setFilterMonth(date);
                    setIsFilterOpen(false);
                    if (date) {
                      refetchBalance();
                    }
                  }}
                  captionLayout="dropdown" // Corrigido de "dropdown-buttons" para "dropdown"
                  fromYear={2020}
                  toYear={2030}
                  disabled={(date) => date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Button 
              variant="outline" 
              className="flex items-center gap-2 mr-2"
              onClick={handleExportCSV}
              disabled={!balanceData || !balanceData.units.length}
            >
              <DownloadIcon className="h-4 w-4" />
              <span>Exportar CSV</span>
            </Button>
            
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
                          <Badge 
                            variant={unit.type === 'Consumer' ? 'default' : 'outline'} 
                            className={unit.type === 'Generator' ? 'bg-green-100 text-green-800 hover:bg-green-200 border-green-300' : ''}
                          >
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
                            unit.type === 'Consumer' ? 
                              (unit.excessPayment > 0 ? 
                                unit.totalCost + unit.excessPayment : 
                                unit.totalCost) 
                              : 0
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    
                    {balanceData && balanceData.units.length > 0 && (
                      <TableRow className="bg-muted/50 font-medium">
                        <TableCell colSpan={3}>Total</TableCell>
                        <TableCell className="text-right">{balanceData.totalConsumption.toFixed(2)}</TableCell>
                        <TableCell className="text-right">-</TableCell>
                        <TableCell className="text-right">{formatCurrency(balanceData.totalCost)}</TableCell>
                        <TableCell className="text-right">{balanceData.totalGeneration.toFixed(2)}</TableCell>
                        <TableCell className="text-right">-</TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(balanceData.totalCost)}
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