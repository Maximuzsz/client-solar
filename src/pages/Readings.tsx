import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams, useLocation } from 'wouter'
import { Plus, Download, Filter, BarChart, ArrowLeft, X, FileText } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { exportToPdf, checkExportLimit, registerExport, createExtraReportPayment } from '@/lib/pdfExport'
import { Button } from '@/components/ui/button'
import { readingsAPI, unitsAPI, networksAPI } from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Breadcrumb } from '@/components/ui/breadcrumb'



export default function Readings() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [, setLocation] = useLocation()
  const params = useParams<{ unitId: string }>()
  const unitId = params.unitId ? parseInt(params.unitId) : 0
  
  const [openDialog, setOpenDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [openFilterDialog, setOpenFilterDialog] = useState(false)
  const [dateRange, setDateRange] = useState<{ startDate: string; endDate: string }>({
    startDate: '',
    endDate: ''
  })
  const [filterActive, setFilterActive] = useState(false)
  const [newReading, setNewReading] = useState({
    value: '',
    readingAt: new Date(),
    unitId
  })

  // Consulta para obter a unidade atual
  const { data: unit, isLoading: isUnitLoading } = useQuery({
    queryKey: ['unit', unitId],
    queryFn: async () => {
      try {
        return await unitsAPI.getById(unitId);
      } catch (error) {
        console.error('Erro ao buscar unidade:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os dados da unidade.',
          variant: 'destructive'
        });
        return null;
      }
    },
    enabled: !!unitId
  });
  
  // Consulta para obter a rede à qual a unidade pertence
  const { data: network, isLoading: isNetworkLoading } = useQuery({
    queryKey: ['network', unit?.networkId],
    queryFn: async () => {
      try {
        return await networksAPI.getById(unit.networkId);
      } catch (error) {
        console.error('Erro ao buscar rede:', error);
        return null;
      }
    },
    enabled: !!unit?.networkId
  });

  // Importa a função apiRequest para fazer requisições autenticadas
  const { data: readings, isLoading, error } = useQuery({
    queryKey: ['readings', unitId, dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      try {
        let url = `/readings/unit/${unitId}`;
        const params = new URLSearchParams();
        
        if (dateRange.startDate) {
          params.append('startDate', dateRange.startDate);
        }
        
        if (dateRange.endDate) {
          params.append('endDate', dateRange.endDate);
        }
        
        // Adiciona os parâmetros à URL se existirem
        if (params.toString()) {
          url += `?${params.toString()}`;
        }
        
        // Usa a função apiRequest que já inclui o cabeçalho de autenticação
        return await readingsAPI.getByUnit(unitId, dateRange.startDate, dateRange.endDate);
      } catch (error) {
        console.error('Erro ao buscar leituras:', error);
        return [];
      }
    },
    enabled: !!unitId
  });
  
  // Função para criar uma nova leitura
  const handleCreateReading = async () => {
    if (!newReading.value || isNaN(parseFloat(newReading.value))) {
      toast({
        title: 'Erro ao registrar leitura',
        description: 'O valor da leitura é obrigatório e deve ser um número válido.',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      const readingData = {
        unitId: newReading.unitId,
        value: parseFloat(newReading.value),
        readingAt: newReading.readingAt
      };
      
      // Dados de leitura removidos por segurança
      await readingsAPI.create(readingData);
      
      // Limpa o formulário e fecha o diálogo
      setNewReading({
        value: '',
        readingAt: new Date(),
        unitId
      });
      setOpenDialog(false);
      
      // Atualiza a lista de leituras
      queryClient.invalidateQueries({ queryKey: ['readings', unitId, dateRange.startDate, dateRange.endDate] });
      
      toast({
        title: 'Leitura registrada com sucesso',
        description: 'A leitura foi registrada e já está disponível.'
      });
    } catch (error) {
      console.error('Erro ao registrar leitura:', error);
      toast({
        title: 'Erro ao registrar leitura',
        description: 'Não foi possível registrar a leitura. Verifique os dados e tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const sortedReadings = Array.isArray(readings) ? [...readings].sort((a, b) => 
    new Date(b.readingAt).getTime() - new Date(a.readingAt).getTime()
  ) : [];
  
  // Função para aplicar filtros
  const handleApplyFilter = () => {
    setFilterActive(!!dateRange.startDate || !!dateRange.endDate);
    setOpenFilterDialog(false);
    queryClient.invalidateQueries({ queryKey: ['readings', unitId, dateRange.startDate, dateRange.endDate] });
  };
  
  // Função para limpar filtros
  const handleClearFilter = () => {
    setDateRange({ startDate: '', endDate: '' });
    setFilterActive(false);
    queryClient.invalidateQueries({ queryKey: ['readings', unitId, '', ''] });
  };
  
  // Função para exportar leituras para CSV
  const handleExportCSV = async () => {
    if (!sortedReadings || sortedReadings.length === 0) {
      toast({
        title: 'Erro ao exportar',
        description: 'Não há leituras para exportar.',
        variant: 'destructive'
      });
      return;
    }
    
    setIsExporting(true);
    
    try {
      // Verificar limite do plano no backend
      const exportLimitCheck = await checkExportLimit('ExportCSV');
      
      if (!exportLimitCheck.allowed) {
        if (exportLimitCheck.canPayExtra) {
          // Mostrar diálogo de confirmação para pagamento mais detalhado
          if (window.confirm(`${exportLimitCheck.message}\n\nVocê tem duas opções:\n1. Pagar R$ ${exportLimitCheck.extraCost.toFixed(2)} por este relatório específico\n2. Fazer upgrade do seu plano para aumentar o limite mensal\n\nDeseja pagar por este relatório agora?`)) {
            try {
              // Criar pagamento para relatório extra
              const paymentInfo = await createExtraReportPayment(
                'ExportCSV', 
                unit.networkId,
                params.unitId // Usar o ID original como string
              );
              
              // Informar ao usuário sobre o pagamento iniciado
              toast({
                title: 'Pagamento iniciado',
                description: paymentInfo.message,
              });

              // Por simplicidade, apenas logamos o client secret
              // Informação de pagamento removida por segurança
              
              // Em uma implementação real, redirecionaríamos para uma tela de checkout
              // ou abriríamos um modal com o formulário de pagamento Stripe
              return;
            } catch (paymentError) {
              console.error('Erro ao criar pagamento:', paymentError);
              toast({
                title: 'Erro no pagamento',
                description: 'Não foi possível processar o pagamento para o relatório extra.',
                variant: 'destructive'
              });
              return;
            }
          } else {
            return; // Usuário cancelou o pagamento
          }
        } else {
          // Comportamento padrão quando não é possível pagar extra
          toast({
            title: 'Limite de exportações atingido',
            description: exportLimitCheck.message || 'Você atingiu o limite de exportações do seu plano. Considere fazer upgrade para um plano superior.',
            variant: 'destructive'
          });
          return;
        }
      }
      
      // Cabeçalho do CSV
      const csvHeader = ['ID', 'Data da Leitura', 'Valor (kWh)', 'Data de Registro'];
      
      // Dados das leituras
      const csvData = sortedReadings.map(reading => [
        reading.id,
        format(new Date(reading.readingAt), 'dd/MM/yyyy'),
        reading.value.toString().replace('.', ','),
        format(new Date(reading.createdAt), 'dd/MM/yyyy HH:mm')
      ]);
      
      // Combinar cabeçalho e dados
      const csvContent = [
        csvHeader.join(';'),
        ...csvData.map(row => row.join(';'))
      ].join('\n');
      
      // Criar e baixar o arquivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `leituras_${unit.name}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Registrar exportação no sistema
      await registerExport('ExportCSV', unitId, unit.networkId);
      
      // Mostrar mensagem de limite restante
      let limitMessage = 'Exportação concluída com sucesso.';
      if (exportLimitCheck.remaining > 0) {
        limitMessage += ` Você tem ${exportLimitCheck.remaining} exportações CSV restantes neste mês.`;
      }
      
      toast({
        title: 'Exportação concluída',
        description: limitMessage
      });
    } catch (error) {
      console.error('Erro ao exportar leituras:', error);
      toast({
        title: 'Erro ao exportar',
        description: 'Ocorreu um erro ao exportar as leituras. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  // Função para exportar leituras para PDF
  const handleExportPDF = async () => {
    if (!sortedReadings || sortedReadings.length === 0) {
      toast({
        title: 'Erro ao exportar',
        description: 'Não há leituras para exportar.',
        variant: 'destructive'
      });
      return;
    }
    
    setIsExporting(true);
    
    try {
      // Verificar limite do plano no backend
      const exportLimitCheck = await checkExportLimit('ExportPDF');
      
      if (!exportLimitCheck.allowed) {
        if (exportLimitCheck.canPayExtra) {
          // Mostrar diálogo de confirmação para pagamento mais detalhado
          if (window.confirm(`${exportLimitCheck.message}\n\nVocê tem duas opções:\n1. Pagar R$ ${exportLimitCheck.extraCost.toFixed(2)} por este relatório específico\n2. Fazer upgrade do seu plano para aumentar o limite mensal\n\nDeseja pagar por este relatório agora?`)) {
            try {
              // Criar pagamento para relatório extra
              const paymentInfo = await createExtraReportPayment(
                'ExportPDF', 
                unit.networkId,
                params.unitId // Usar o ID original como string
              );
              
              // Informar ao usuário sobre o pagamento iniciado
              toast({
                title: 'Pagamento iniciado',
                description: paymentInfo.message,
              });

              // Por simplicidade, apenas logamos o client secret
              // Informação de pagamento removida por segurança
              
              // Em uma implementação real, redirecionaríamos para uma tela de checkout
              // ou abriríamos um modal com o formulário de pagamento Stripe
              return;
            } catch (paymentError) {
              console.error('Erro ao criar pagamento:', paymentError);
              toast({
                title: 'Erro no pagamento',
                description: 'Não foi possível processar o pagamento para o relatório extra.',
                variant: 'destructive'
              });
              return;
            }
          } else {
            return; // Usuário cancelou o pagamento
          }
        } else {
          // Comportamento padrão quando não é possível pagar extra
          toast({
            title: 'Limite de exportações atingido',
            description: exportLimitCheck.message || 'Você atingiu o limite de exportações do seu plano. Considere fazer upgrade para um plano superior.',
            variant: 'destructive'
          });
          return;
        }
      }
      
      // Definir colunas para o PDF
      const columns = [
        { header: 'ID', dataKey: 'id' },
        { header: 'Data da Leitura', dataKey: 'readingDate' },
        { header: 'Valor (kWh)', dataKey: 'value' },
        { header: 'Data de Registro', dataKey: 'createdAt' }
      ];
      
      // Dados para o PDF
      const data = sortedReadings.map(reading => ({
        id: reading.id,
        readingDate: format(new Date(reading.readingAt), 'dd/MM/yyyy'),
        value: reading.value,
        createdAt: format(new Date(reading.createdAt), 'dd/MM/yyyy HH:mm')
      }));
      
      // Opções do PDF
      const exportOptions = {
        title: `Leituras - ${unit.name}`,
        subtitle: `Período: ${dateRange.startDate ? format(new Date(dateRange.startDate), 'dd/MM/yyyy') : 'Início'} até ${dateRange.endDate ? format(new Date(dateRange.endDate), 'dd/MM/yyyy') : 'Atual'}`,
        filename: `leituras_${unit.name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`,
        orientation: 'portrait' as const,
        pageSize: 'a4' as const,
        margins: { top: 30, right: 15, bottom: 15, left: 15 }
      };
      
      // Gerar o PDF
      exportToPdf(columns, data, exportOptions);
      
      // Registrar exportação no sistema
      await registerExport('ExportPDF', unitId, unit.networkId);
      
      // Mostrar mensagem de limite restante
      let limitMessage = 'Exportação concluída com sucesso.';
      if (exportLimitCheck.remaining > 0) {
        limitMessage += ` Você tem ${exportLimitCheck.remaining} exportações PDF restantes neste mês.`;
      }
      
      toast({
        title: 'Exportação concluída',
        description: limitMessage
      });
    } catch (error) {
      console.error('Erro ao exportar leituras para PDF:', error);
      toast({
        title: 'Erro ao exportar',
        description: 'Ocorreu um erro ao exportar as leituras para PDF. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  if (isLoading || isUnitLoading || isNetworkLoading) {
    return (
      <Layout>
        <div className="flex h-full w-full items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </Layout>
    );
  }

  if (error || !unit) {
    return (
      <Layout>
        <div className="flex h-full w-full flex-col items-center justify-center gap-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-destructive">Erro ao carregar dados</h2>
            <p className="text-muted-foreground">Ocorreu um erro ao buscar as leituras. Por favor, tente novamente.</p>
          </div>
          <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
          <Button variant="outline" onClick={() => setLocation(`/networks/${unit?.networkId}/units`)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Unidades
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {network && (
          <Breadcrumb
            segments={[
              { name: 'Redes', href: '/networks', current: false },
              { name: network.name, href: `/networks/${unit.networkId}/units`, current: false },
              { name: unit.name, href: `/units/${unit.id}/readings`, current: true }
            ]}
            className="mb-4"
          />
        )}
        
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold">
              Leituras: {unit.name} ({unit.type === 'Consumer' ? 'Consumidora' : 'Geradora'})
            </h1>
            <p className="text-muted-foreground">
              Gerenciar leituras de energia da unidade
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              onClick={() => setLocation(`/networks/${unit.networkId}/units`)}
              className="shrink-0"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Unidades
            </Button>
            <Button variant="outline" onClick={() => setLocation(`/calculator`)}>
              <BarChart className="mr-2 h-4 w-4" /> Calculadora
            </Button>
            {sortedReadings.length > 0 && (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => setOpenFilterDialog(true)}
                  className={filterActive ? "border-primary text-primary" : ""}
                >
                  <Filter className="mr-2 h-4 w-4" /> Filtrar
                  {filterActive && <Badge variant="outline" className="ml-2 bg-primary/20 text-xs">Ativo</Badge>}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleExportCSV}
                  disabled={isExporting || sortedReadings.length === 0}
                  className="mr-1"
                >
                  <Download className="mr-2 h-4 w-4" /> 
                  {isExporting ? 'Exportando...' : 'Exportar CSV'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleExportPDF}
                  disabled={isExporting || sortedReadings.length === 0}
                >
                  <FileText className="mr-2 h-4 w-4" /> 
                  {isExporting ? 'Exportando...' : 'Exportar PDF'}
                </Button>
              </>
            )}
            <Button className="shrink-0" onClick={() => setOpenDialog(true)}>
              <Plus className="mr-2 h-4 w-4" /> Nova Leitura
            </Button>
          </div>
        </div>

        {/* Diálogo para criar nova leitura */}
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Nova Leitura</DialogTitle>
              <DialogDescription>
                Preencha os campos abaixo para registrar uma nova leitura para a unidade {unit.name}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="name">Valor da Leitura (kWh) *</Label>
                <Input
                  id="value"
                  type="number"
                  placeholder="Digite o valor da leitura em kWh"
                  value={newReading.value}
                  onChange={(e) => setNewReading({...newReading, value: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="readingAt">Data da Leitura</Label>
                <Input
                  id="readingAt"
                  type="date"
                  value={newReading.readingAt instanceof Date ? format(newReading.readingAt, 'yyyy-MM-dd') : ''}
                  onChange={(e) => setNewReading({...newReading, readingAt: new Date(e.target.value)})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenDialog(false)}>Cancelar</Button>
              <Button 
                onClick={handleCreateReading}
                disabled={isSubmitting || !newReading.value}
              >
                {isSubmitting ? 'Registrando...' : 'Registrar Leitura'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Diálogo para filtrar leituras */}
        <Dialog open={openFilterDialog} onOpenChange={setOpenFilterDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Filtrar Leituras</DialogTitle>
              <DialogDescription>
                Selecione um período para filtrar as leituras da unidade {unit.name}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">Data Inicial</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Data Final</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={handleClearFilter}>
                <X className="mr-2 h-4 w-4" />
                Limpar Filtros
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setOpenFilterDialog(false)}
              >
                Cancelar
              </Button>
              <Button onClick={handleApplyFilter}>
                <Filter className="mr-2 h-4 w-4" />
                Aplicar Filtro
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Indicador de filtro ativo */}
        {filterActive && (
          <div className="flex justify-between rounded-md border border-primary/30 bg-primary/5 px-4 py-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">
                Filtro ativo: 
                {dateRange.startDate && ` de ${format(new Date(dateRange.startDate), 'dd/MM/yyyy')}`}
                {dateRange.endDate && ` até ${format(new Date(dateRange.endDate), 'dd/MM/yyyy')}`}
              </span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 text-muted-foreground hover:text-foreground"
              onClick={handleClearFilter}
            >
              <X className="mr-1 h-4 w-4" /> Limpar filtro
            </Button>
          </div>
        )}
        
        {sortedReadings.length === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
            <div className="rounded-full bg-primary/10 p-3">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-4 text-lg font-medium">Nenhuma leitura encontrada</h3>
            <p className="mt-2 text-center text-muted-foreground">
              {filterActive 
                ? 'Não foram encontradas leituras para os filtros selecionados'
                : 'Você ainda não possui leituras registradas para esta unidade'
              }
            </p>
            {!filterActive ? (
              <Button className="mt-4" onClick={() => setOpenDialog(true)}>
                <Plus className="mr-2 h-4 w-4" /> Registrar Nova Leitura
              </Button>
            ) : (
              <Button className="mt-4" variant="outline" onClick={handleClearFilter}>
                <X className="mr-2 h-4 w-4" /> Limpar Filtros
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-md border">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Data da Leitura</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Valor (kWh)</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Data de Registro</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {sortedReadings.map((reading) => (
                    <tr key={reading.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <td className="p-4 align-middle font-medium">
                        {format(new Date(reading.readingAt), 'dd/MM/yyyy')}
                      </td>
                      <td className="p-4 align-middle">
                        {reading.value.toLocaleString('pt-BR')} kWh
                      </td>
                      <td className="p-4 align-middle">
                        {format(new Date(reading.createdAt), 'dd/MM/yyyy HH:mm')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}