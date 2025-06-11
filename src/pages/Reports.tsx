import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLocation } from 'wouter'
import { FileText, Download, BarChart, Filter, Calendar, ArrowLeft } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { reportsAPI } from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from '@/components/ui/badge'

// Interface do relatório
interface Report {
  id: number
  period: string
  generationTotal: number
  consumptionTotal: number
  energyBalance: number
  compensatedValue: number
  status: 'Pending' | 'Completed' | 'Failed' | 'Cancelled'
  networkId: number
  createdAt: string
  updatedAt: string
  networkName?: string
}

export default function Reports() {
  const { toast } = useToast()
  const [, setLocation] = useLocation()
  
  const [openFilterDialog, setOpenFilterDialog] = useState(false)
  const [openViewDialog, setOpenViewDialog] = useState(false)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [filter, setFilter] = useState({
    period: '',
    status: '',
    network: ''
  })

  // Consulta para obter os relatórios
  const { data: reports, isLoading, error } = useQuery({
    queryKey: ['reports'],
    queryFn: async () => {
      try {
        const response = await reportsAPI.getAll();
        return response.data;
      } catch (error) {
        console.error('Erro ao buscar relatórios:', error);
        return [];
      }
    }
  });

  // Função para visualizar um relatório
  const handleViewReport = (report: Report) => {
    setSelectedReport(report);
    setOpenViewDialog(true);
  };
  
  // Função para baixar um relatório (simulado)
  const handleDownloadReport = (report: Report) => {
    toast({
      title: 'Download iniciado',
      description: `O relatório de ${report.period} está sendo baixado.`
    });
  };

  // Função para realizar o pagamento de um relatório
  const handlePayReport = (report: Report) => {
    setLocation(`/report-payment?id=${report.id}`);
  };
  
  // Função para aplicar filtros
  const handleApplyFilters = () => {
    setOpenFilterDialog(false);
    // Os filtros já estão armazenados no estado, 
    // então só precisamos fechar o diálogo
  };
  
  // Filtra os relatórios de acordo com os filtros aplicados
  const filteredReports = reports?.filter(report => {
    let passesFilter = true;
    
    if (filter.period && report.period !== filter.period) {
      passesFilter = false;
    }
    
    if (filter.status && report.status !== filter.status) {
      passesFilter = false;
    }
    
    if (filter.network && report.networkId.toString() !== filter.network) {
      passesFilter = false;
    }
    
    return passesFilter;
  });
  
  // Ordena os relatórios por data de criação (mais recente primeiro)
  const sortedReports = filteredReports ? [...filteredReports].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ) : [];
  
  // Formata o status para exibição
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400">Pendente</Badge>;
      case 'Completed':
        return <Badge variant="outline" className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400">Concluído</Badge>;
      case 'Failed':
        return <Badge variant="outline" className="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400">Falhou</Badge>;
      case 'Cancelled':
        return <Badge variant="outline" className="bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-400">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  if (isLoading) {
    return (
      <Layout>
        <div className="flex h-full w-full items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex h-full w-full flex-col items-center justify-center gap-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-destructive">Erro ao carregar dados</h2>
            <p className="text-muted-foreground">Ocorreu um erro ao buscar os relatórios. Por favor, tente novamente.</p>
          </div>
          <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold">Relatórios</h1>
            <p className="text-muted-foreground">
              Gerencie seus relatórios de geração e consumo de energia
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpenFilterDialog(true)}>
              <Filter className="mr-2 h-4 w-4" /> Filtrar
            </Button>
            <Button variant="outline" onClick={() => setLocation('/calculator')}>
              <BarChart className="mr-2 h-4 w-4" /> Calculadora
            </Button>
          </div>
        </div>

        {/* Diálogo para filtrar relatórios */}
        <Dialog open={openFilterDialog} onOpenChange={setOpenFilterDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Filtrar Relatórios</DialogTitle>
              <DialogDescription>
                Selecione os critérios para filtrar os relatórios.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="period">Período</Label>
                <Select
                  value={filter.period}
                  onValueChange={(value) => setFilter({...filter, period: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="Janeiro/2025">Janeiro/2025</SelectItem>
                    <SelectItem value="Fevereiro/2025">Fevereiro/2025</SelectItem>
                    <SelectItem value="Março/2025">Março/2025</SelectItem>
                    <SelectItem value="Abril/2025">Abril/2025</SelectItem>
                    <SelectItem value="Maio/2025">Maio/2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={filter.status}
                  onValueChange={(value) => setFilter({...filter, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="Pending">Pendente</SelectItem>
                    <SelectItem value="Completed">Concluído</SelectItem>
                    <SelectItem value="Failed">Falhou</SelectItem>
                    <SelectItem value="Cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setFilter({ period: '', status: '', network: '' })}>
                Limpar Filtros
              </Button>
              <Button onClick={handleApplyFilters}>
                Aplicar Filtros
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Diálogo para visualizar detalhes do relatório */}
        <Dialog open={openViewDialog} onOpenChange={setOpenViewDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Detalhes do Relatório</DialogTitle>
              <DialogDescription>
                {selectedReport?.period} - {selectedReport?.networkName || `Rede #${selectedReport?.networkId}`}
              </DialogDescription>
            </DialogHeader>
            {selectedReport && (
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Período</h3>
                    <p className="text-base">{selectedReport.period}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                    <div className="mt-1">
                      {getStatusBadge(selectedReport.status)}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Consumo Total</h3>
                    <p className="text-base">{selectedReport.consumptionTotal.toLocaleString('pt-BR')} kWh</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Geração Total</h3>
                    <p className="text-base">{selectedReport.generationTotal.toLocaleString('pt-BR')} kWh</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Balanço Energético</h3>
                    <p className={`text-base ${selectedReport.energyBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedReport.energyBalance.toLocaleString('pt-BR')} kWh
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Valor Compensado</h3>
                    <p className="text-base">
                      R$ {selectedReport.compensatedValue.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Data de Criação</h3>
                    <p className="text-base">
                      {format(new Date(selectedReport.createdAt), 'dd/MM/yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setOpenViewDialog(false);
                  setSelectedReport(null);
                }}
              >
                Fechar
              </Button>
              {selectedReport && selectedReport.status === 'Pending' && (
                <Button 
                  variant="default"
                  onClick={() => {
                    setOpenViewDialog(false);
                    handlePayReport(selectedReport);
                  }}
                >
                  Realizar Pagamento
                </Button>
              )}
              {selectedReport && (
                <Button 
                  variant="secondary"
                  onClick={() => {
                    handleDownloadReport(selectedReport);
                  }}
                >
                  <Download className="mr-2 h-4 w-4" /> Baixar PDF
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {sortedReports.length === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
            <div className="rounded-full bg-primary/10 p-3">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-4 text-lg font-medium">Nenhum relatório encontrado</h3>
            <p className="mt-2 text-center text-muted-foreground">
              {Object.values(filter).some(val => val !== '') 
                ? 'Nenhum relatório corresponde aos filtros aplicados' 
                : 'Você ainda não possui relatórios gerados'}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sortedReports.map((report) => (
              <Card key={report.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{report.period}</CardTitle>
                    {getStatusBadge(report.status)}
                  </div>
                  <CardDescription>
                    {report.networkName || `Rede #${report.networkId}`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Consumo</p>
                      <p className="text-base">{report.consumptionTotal.toLocaleString('pt-BR')} kWh</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Geração</p>
                      <p className="text-base">{report.generationTotal.toLocaleString('pt-BR')} kWh</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm font-medium text-muted-foreground">Valor Compensado</p>
                    <p className="text-lg font-bold text-primary">
                      R$ {report.compensatedValue.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between pt-4">
                  <Button variant="outline" size="sm" onClick={() => handleViewReport(report)}>
                    Detalhes
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleDownloadReport(report)}>
                      <Download className="h-4 w-4" />
                    </Button>
                    {report.status === 'Pending' && (
                      <Button size="sm" onClick={() => handlePayReport(report)}>
                        Pagar
                      </Button>
                    )}
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}