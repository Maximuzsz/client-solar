import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import concessionairesAPI, { EnrichedConcessionaire } from '@/services/concessionairesAPI'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Plus, Search } from 'lucide-react'
import { useState } from 'react'


export default function Distribuidoras() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newDistribuidora, setNewDistribuidora] = useState({
    name: '',
    region: ''
  });

  // Buscar distribuidoras
  const { data: distribuidoras, isLoading } = useQuery({
    queryKey: ['/api/v1/concessionaires'],
    queryFn: async () => {
      return await concessionairesAPI.getEnrichedConcessionaires();
    },
  });

  // Criar nova distribuidora
  const handleCreateDistribuidora = async () => {
    if (!newDistribuidora.name.trim() || !newDistribuidora.region.trim()) {
      toast({
        title: 'Erro ao criar distribuidora',
        description: 'Nome e região são obrigatórios.',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const response = await fetch('/api/v1/concessionaires', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newDistribuidora)
      });
      
      if (!response.ok) {
        throw new Error('Erro ao criar distribuidora');
      }
      
      // Limpa o formulário e fecha o diálogo
      setNewDistribuidora({
        name: '',
        region: ''
      });
      setOpenDialog(false);
      
      // Atualiza a lista de distribuidoras
      queryClient.invalidateQueries({ queryKey: ['/api/v1/concessionaires'] });
      
      toast({
        title: 'Distribuidora criada com sucesso',
        description: 'A distribuidora foi criada e já está disponível.'
      });
    } catch (error) {
      console.error('Erro ao criar distribuidora:', error);
      toast({
        title: 'Erro ao criar distribuidora',
        description: 'Não foi possível criar a distribuidora. Verifique os dados e tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtrar distribuidoras
  const filteredDistribuidoras = distribuidoras?.filter(
    (distribuidora: EnrichedConcessionaire) =>
      distribuidora.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      distribuidora.region.toLowerCase().includes(searchTerm.toLowerCase())
  );


  if (isLoading) {
    return (
      <Layout>
        <div className="flex h-full w-full items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold">Distribuidoras</h1>
            <p className="text-muted-foreground">
              Gerencie as distribuidoras de energia elétrica disponíveis no sistema
            </p>
          </div>
          {user?.role === 'Admin' && (
            <Button className="shrink-0" onClick={() => setOpenDialog(true)}>
              <Plus className="mr-2 h-4 w-4" /> Nova Distribuidora
            </Button>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Pesquisar distribuidoras..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Diálogo para criar nova distribuidora */}
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Distribuidora</DialogTitle>
              <DialogDescription>
                Preencha os campos abaixo para cadastrar uma nova distribuidora de energia elétrica.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Distribuidora *</Label>
                <Input
                  id="name"
                  placeholder="Ex: CPFL Paulista"
                  value={newDistribuidora.name}
                  onChange={(e) => setNewDistribuidora({...newDistribuidora, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="region">Região/UF *</Label>
                <Input
                  id="region"
                  placeholder="Ex: SP"
                  value={newDistribuidora.region}
                  onChange={(e) => setNewDistribuidora({...newDistribuidora, region: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenDialog(false)}>Cancelar</Button>
              <Button 
                onClick={handleCreateDistribuidora}
                disabled={isSubmitting || !newDistribuidora.name.trim() || !newDistribuidora.region.trim()}
              >
                {isSubmitting ? 'Criando...' : 'Criar Distribuidora'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <DataTable 
          data={filteredDistribuidoras || []}
          columns={[
            {
              header: "Nome",
              accessorKey: "name",
              cell: (item) => <span className="font-medium">{item.name}</span>
            },
            {
              header: "Região",
              accessorKey: "region",
              cell: (item) => (
                <div className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-sm font-medium text-blue-700 border border-blue-200">
                  {item.region}
                </div>
              )
            },
            {
              header: "Tarifa Atual (R$/kWh)",
              accessorKey: "currentTariff",
              cell: (item) => {
                const startDate = item.currentTariff?.startDate;
                const formattedDate = startDate && !isNaN(Date.parse(startDate))
                  ? format(new Date(startDate), 'MM/yyyy', { locale: ptBR })
                  : 'Data inválida';

                return item.currentTariff ? (
                  <div className="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-1 text-sm font-medium text-primary">
                    R$ {item.currentTariff.value.toFixed(2)}
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({formattedDate})
                    </span>
                  </div>
                ) : (
                  <div className="inline-flex items-center rounded-md bg-blue-100 px-2.5 py-1 text-sm font-medium text-blue-600">
                    Sem tarifa
                  </div>
                );
              }
            },
            {
              header: "Tarifa Anterior (R$/kWh)",
              accessorKey: "previousTariff",
              cell: (item) => {
                return item.previousTariff ? (
                  <div className="inline-flex items-center rounded-md bg-muted px-2.5 py-1 text-sm font-medium">
                    R$ {item.previousTariff.value.toFixed(2)}
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({format(new Date(item.previousTariff.startDate), 'MM/yyyy')})
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Não disponível</span>
                );
              }
            },
            {
              header: "Variação (%)",
              accessorKey: "id",
              cell: (item) => {
                let variacao = 0;
                if (item.currentTariff?.value && item.previousTariff?.value) {
                  variacao = ((item.currentTariff.value - item.previousTariff.value) / item.previousTariff.value) * 100;
                }
                
                return item.currentTariff && item.previousTariff ? (
                  <div className={`inline-flex items-center rounded-md px-2.5 py-1 text-sm font-medium ${
                    variacao > 0 
                      ? 'bg-red-100 text-red-600' 
                      : variacao < 0 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-gray-100 text-gray-600'
                  }`}>
                    {variacao > 0 ? '+' : ''}{variacao.toFixed(2)}%
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                );
              }
            },
            {
              header: "Criado em",
              accessorKey: "createdAt",
              cell: (item) => (
                item.createdAt 
                  ? format(new Date(item.createdAt), 'dd/MM/yyyy', { locale: ptBR }) 
                  : '02/05/2025'
              )
            }
          ]}
          isLoading={isLoading}
          emptyMessage={searchTerm ? 'Nenhuma distribuidora encontrada para esta pesquisa.' : 'Nenhuma distribuidora cadastrada.'}
          initialPageSize={10}
        />
      </div>
    </Layout>
  );
}