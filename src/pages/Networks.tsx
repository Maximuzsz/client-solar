import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2, Search, Eye, BarChart2, AlertCircle, Users, Zap, Activity } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { networksAPI } from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AnimatePresence, motion } from 'framer-motion'

// Interface da rede
interface Network {
  id: number
  name: string
  description: string
  active: boolean
  ownerId: number
  createdAt: string
  updatedAt: string
  ownerName?: string
  unitCount?: number
}

export default function Networks() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [openViewDialog, setOpenViewDialog] = useState(false)
  const [openEditDialog, setOpenEditDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null)
  const [newNetwork, setNewNetwork] = useState({
    name: '',
    description: ''
  })

  // Consulta para obter as redes
  const { data: networks, isLoading, error } = useQuery({
    queryKey: ['networks'],
    queryFn: async () => {
      try {
        return await networksAPI.getAll();
      } catch (error) {
        console.error('Erro ao buscar redes:', error);
        return [];
      }
    }
  })
  
  // Função para criar uma nova rede
  const handleCreateNetwork = async () => {
    if (!newNetwork.name.trim()) {
      toast({
        title: 'Erro ao criar rede',
        description: 'O nome da rede é obrigatório.',
        variant: 'destructive'
      })
      return
    }
    
    try {
      setIsSubmitting(true)
      await networksAPI.create(newNetwork)
      
      // Limpa o formulário e fecha o diálogo
      setNewNetwork({ name: '', description: '' })
      setOpenDialog(false)
      
      // Atualiza a lista de redes
      queryClient.invalidateQueries({ queryKey: ['networks'] })
      
      toast({
        title: 'Rede criada com sucesso',
        description: 'A rede foi criada e já está disponível.'
      })
    } catch (error) {
      console.error('Erro ao criar rede:', error)
      toast({
        title: 'Erro ao criar rede',
        description: 'Não foi possível criar a rede. Verifique os dados e tente novamente.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filtra as redes com base no termo de pesquisa
  const filteredNetworks = networks?.filter(network => 
    network.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    network.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Função para buscar detalhes de uma rede
  const fetchNetworkDetails = async (id: number) => {
    try {
      console.log(`Buscando rede com ID: ${id}`);
      
      // Verificar se a rede já está disponível no estado local
      const networkInState = networks?.find(n => n.id === id);
      if (networkInState) {
        console.log('Rede encontrada no estado local:', networkInState);
        return networkInState;
      }
      
      // Se não estiver, buscar da API
      console.log('Rede não encontrada localmente, buscando da API');
      const response = await networksAPI.getById(id);
      console.log('Resposta da API getById:', response);
      
      // Tratar diferentes formatos de resposta
      if (response && typeof response === 'object') {
        // Se a resposta for a própria rede
        if (response.id) {
          console.log('Retornando objeto da rede diretamente');
          return response;
        }
        // Se a resposta estiver em um campo data
        if (response.data && response.data.id) {
          console.log('Retornando objeto dentro de data');
          return response.data;
        }
      }
      
      console.log('Resposta não contém uma rede válida:', response);
      throw new Error('Formato de resposta inválido');
    } catch (error) {
      console.error('Erro ao buscar detalhes da rede:', error);
      toast({
        title: 'Erro ao buscar detalhes',
        description: 'Não foi possível carregar os detalhes da rede.',
        variant: 'destructive',
      });
      return null;
    }
  }
  
  // Função para visualizar uma rede
  const handleViewNetwork = async (id: number) => {
    try {
      console.log(`Iniciando visualização da rede com ID: ${id}`);
      
      // Verificar primeiro se a rede já está disponível no estado local
      const networkInState = networks?.find(n => n.id === id);
      
      if (networkInState) {
        console.log('Rede encontrada no estado local para visualização:', networkInState);
        setSelectedNetwork(networkInState);
        setOpenViewDialog(true);
        return;
      }
      
      // Se não estiver no estado local, buscar da API
      const network = await fetchNetworkDetails(id);
      
      if (network) {
        console.log('Detalhes obtidos com sucesso da API, abrindo diálogo:', network);
        setSelectedNetwork(network);
        setOpenViewDialog(true);
      } else {
        toast({
          title: 'Erro ao visualizar',
          description: 'Não foi possível obter detalhes desta rede.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao visualizar rede:', error);
      toast({
        title: 'Erro ao visualizar',
        description: 'Ocorreu um erro ao tentar visualizar esta rede.',
        variant: 'destructive',
      });
    }
  }
  
  // Função para editar uma rede
  const handleEditNetwork = async (id: number) => {
    try {
      console.log(`Iniciando edição da rede com ID: ${id}`);
      
      // Verificar primeiro se a rede já está disponível no estado local
      const networkInState = networks?.find(n => n.id === id);
      
      if (networkInState) {
        console.log('Rede encontrada no estado local para edição:', networkInState);
        setSelectedNetwork(networkInState);
        setNewNetwork({
          name: networkInState.name || '',
          description: networkInState.description || ''
        });
        setOpenEditDialog(true);
        return;
      }
      
      // Se não estiver no estado local, buscar da API
      const network = await fetchNetworkDetails(id);
      
      if (network) {
        console.log('Detalhes obtidos da API para edição:', network);
        setSelectedNetwork(network);
        setNewNetwork({
          name: network.name || '',
          description: network.description || ''
        });
        setOpenEditDialog(true);
      } else {
        toast({
          title: 'Erro ao editar',
          description: 'Não foi possível obter detalhes desta rede para edição.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao editar rede:', error);
      toast({
        title: 'Erro ao editar',
        description: 'Ocorreu um erro ao tentar editar esta rede.',
        variant: 'destructive',
      });
    }
  }
  
  // Função para salvar alterações em uma rede
  const handleUpdateNetwork = async () => {
    if (!selectedNetwork) {
      console.error('Tentativa de atualizar sem rede selecionada');
      return;
    }
    
    if (!newNetwork.name.trim()) {
      toast({
        title: 'Erro ao atualizar rede',
        description: 'O nome da rede é obrigatório.',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      console.log(`Enviando atualização para rede ID ${selectedNetwork.id}:`, newNetwork);
      
      // Certifique-se de enviar apenas os campos específicos que deseja atualizar
      await networksAPI.update(selectedNetwork.id, {
        name: newNetwork.name.trim(),
        description: newNetwork.description.trim()
      });
      
      console.log('Rede atualizada com sucesso');
      
      // Limpa o formulário e fecha o diálogo
      setNewNetwork({ name: '', description: '' });
      setSelectedNetwork(null);
      setOpenEditDialog(false);
      
      // Atualiza a lista de redes
      queryClient.invalidateQueries({ queryKey: ['networks'] })
      
      toast({
        title: 'Rede atualizada com sucesso',
        description: 'As alterações foram salvas com sucesso.',
      })
    } catch (error) {
      console.error('Erro ao atualizar rede:', error)
      toast({
        title: 'Erro ao atualizar rede',
        description: 'Não foi possível atualizar a rede. Verifique os dados e tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Função para excluir uma rede
  const handleDeleteNetwork = async (id: number) => {
    try {
      await networksAPI.delete(id)
      
      // Atualiza a lista de redes
      queryClient.invalidateQueries({ queryKey: ['networks'] })
      
      toast({
        title: 'Rede excluída',
        description: 'A rede foi excluída com sucesso.',
      })
    } catch (error) {
      console.error('Erro ao excluir rede:', error)
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir a rede. Tente novamente.',
        variant: 'destructive',
      })
    }
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="flex h-full w-full items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className="flex h-full w-full flex-col items-center justify-center gap-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-destructive">Erro ao carregar dados</h2>
            <p className="text-muted-foreground">Ocorreu um erro ao buscar as redes. Por favor, tente novamente.</p>
          </div>
          <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
        </div>
      </Layout>
    )
  }

  // Calcular estatísticas das redes
  const networkStats = {
    total: networks?.length || 0,
    active: networks?.filter(n => n.active).length || 0,
    inactive: networks?.filter(n => !n.active).length || 0,
    totalUnits: networks?.reduce((sum, network) => sum + (network.unitCount || 0), 0) || 0
  };
  
  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-3xl font-bold">Redes de Energia</h1>
              <p className="text-muted-foreground">
                Gerencie suas redes de compartilhamento de energia
              </p>
            </div>
            <Button 
              className="shrink-0 shadow-md hover:shadow-lg transition-all bg-gradient-to-r from-primary to-primary/80" 
              onClick={() => setOpenDialog(true)}
            >
              <Plus className="mr-2 h-4 w-4" /> Nova Rede
            </Button>
          </div>
        </div>
        
        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card className="shadow-sm hover:shadow-md transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Activity className="mr-2 h-5 w-5 text-primary" />
                Total de Redes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{networkStats.total}</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm hover:shadow-md transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Users className="mr-2 h-5 w-5 text-green-500" />
                Unidades Associadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{networkStats.totalUnits}</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm hover:shadow-md transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Zap className="mr-2 h-5 w-5 text-amber-500" />
                Redes Ativas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{networkStats.active}</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm hover:shadow-md transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <AlertCircle className="mr-2 h-5 w-5 text-destructive" />
                Redes Inativas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{networkStats.inactive}</p>
            </CardContent>
          </Card>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Pesquisar redes por nome ou descrição..."
            className="pl-10 shadow-sm focus:shadow-md transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Diálogo para criar nova rede */}
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Rede</DialogTitle>
              <DialogDescription>
                Preencha os campos abaixo para criar uma nova rede de compartilhamento de energia.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Rede *</Label>
                <Input
                  id="name"
                  placeholder="Digite o nome da rede"
                  value={newNetwork.name}
                  onChange={(e) => setNewNetwork({...newNetwork, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Digite uma descrição para a rede"
                  value={newNetwork.description}
                  onChange={(e) => setNewNetwork({...newNetwork, description: e.target.value})}
                  className="min-h-[100px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenDialog(false)}>Cancelar</Button>
              <Button 
                onClick={handleCreateNetwork}
                disabled={isSubmitting || !newNetwork.name.trim()}
              >
                {isSubmitting ? 'Criando...' : 'Criar Rede'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Diálogo para visualizar detalhes da rede */}
        <Dialog open={openViewDialog} onOpenChange={setOpenViewDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalhes da Rede</DialogTitle>
            </DialogHeader>
            {selectedNetwork && (
              <div className="space-y-6 py-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Nome</h3>
                    <p className="text-base font-medium">{selectedNetwork.name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Status</h3>
                    <div className="flex items-center">
                      <span className="inline-flex mr-2 h-2.5 w-2.5 rounded-full bg-green-500"></span>
                      <p className="text-base">{selectedNetwork.active ? 'Ativo' : 'Inativo'}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Descrição</h3>
                  <p className="text-base">{selectedNetwork.description || 'Sem descrição'}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Unidades</h3>
                  <p className="text-base">{selectedNetwork.unitCount || 0} unidade(s)</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Criado em</h3>
                    <p className="text-base">
                      {new Date(selectedNetwork.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Atualizado em</h3>
                    <p className="text-base">
                      {new Date(selectedNetwork.updatedAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter className="flex-col sm:flex-row gap-2 space-y-2 sm:space-y-0">
              <div className="flex gap-2 w-full justify-start">
                <Button
                  variant="outline"
                  className="flex-1 sm:flex-none"
                  onClick={() => {
                    setOpenViewDialog(false);
                    setSelectedNetwork(null);
                  }}
                >
                  Fechar
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2 w-full justify-end">
                <Button 
                  variant="outline"
                  className="bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 border-blue-200"
                  onClick={() => {
                    if (selectedNetwork) {
                      window.location.href = `/networks/${selectedNetwork.id}/units`;
                    }
                  }}
                >
                  <Plus className="mr-1 h-4 w-4" /> Gerenciar Unidades
                </Button>
                
                <Button 
                  variant="outline"
                  className="bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 border-green-200"
                  onClick={() => {
                    if (selectedNetwork) {
                      window.location.href = `/networks/${selectedNetwork.id}/balance`;
                    }
                  }}
                >
                  <BarChart2 className="mr-1 h-4 w-4" /> Balanço Energético
                </Button>
                
                <Button 
                  className="bg-amber-500 hover:bg-amber-600 text-white"
                  onClick={() => {
                    setOpenViewDialog(false);
                    handleEditNetwork(selectedNetwork!.id);
                  }}
                >
                  Editar
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Diálogo para editar rede */}
        <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Rede</DialogTitle>
              <DialogDescription>
                Altere os campos abaixo para atualizar a rede de compartilhamento de energia.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome da Rede *</Label>
                <Input
                  id="edit-name"
                  placeholder="Digite o nome da rede"
                  value={newNetwork.name}
                  onChange={(e) => setNewNetwork({...newNetwork, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Descrição</Label>
                <Textarea
                  id="edit-description"
                  placeholder="Digite uma descrição para a rede"
                  value={newNetwork.description}
                  onChange={(e) => setNewNetwork({...newNetwork, description: e.target.value})}
                  className="min-h-[100px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setOpenEditDialog(false);
                  setSelectedNetwork(null);
                  setNewNetwork({ name: '', description: '' });
                }}
              >
                Cancelar
              </Button>
              <Button 
                variant="secondary"
                onClick={() => {
                  if (selectedNetwork) {
                    window.location.href = `/networks/${selectedNetwork.id}/units`;
                  }
                }}
              >
                <Plus className="mr-2 h-4 w-4" /> Gerenciar Unidades
              </Button>
              <Button 
                onClick={handleUpdateNetwork}
                disabled={isSubmitting || !newNetwork.name.trim()}
              >
                {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {filteredNetworks?.length === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
            <div className="rounded-full bg-primary/10 p-3">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-4 text-lg font-medium">Nenhuma rede encontrada</h3>
            <p className="mt-2 text-center text-muted-foreground">
              {searchTerm ? 'Nenhuma rede corresponde à sua pesquisa' : 'Você ainda não possui redes cadastradas'}
            </p>
            {!searchTerm && (
              <Button className="mt-4" onClick={() => setOpenDialog(true)}>
                <Plus className="mr-2 h-4 w-4" /> Criar Nova Rede
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-md border shadow-sm overflow-hidden">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr className="border-b transition-colors data-[state=selected]:bg-muted">
                    <th className="h-12 px-4 text-left align-middle font-medium text-primary">Nome</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-primary">Descrição</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-primary">Unidades</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-primary">Status</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-primary">Criado em</th>
                    <th className="h-12 px-4 text-right align-middle font-medium text-primary">Ações</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {filteredNetworks?.map((network, index) => (
                    <tr 
                      key={network.id} 
                      className="border-b transition-colors hover:bg-muted/30 data-[state=selected]:bg-muted animate-fadeIn"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="p-4 align-middle font-medium">{network.name}</td>
                      <td className="p-4 align-middle">{network.description || 'Sem descrição'}</td>
                      <td className="p-4 align-middle">
                        <div className="flex items-center">
                          <Badge variant="outline" className="mr-2 font-medium">
                            {network.unitCount || 0}
                          </Badge>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            title="Gerenciar unidades" 
                            className="hover:bg-primary/10 transition-colors"
                            onClick={() => window.location.href = `/networks/${network.id}/units`}
                          >
                            <Plus className="h-4 w-4 mr-1" /> Gerenciar
                          </Button>
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        <div className="flex items-center">
                          <Badge 
                            variant={network.active ? "success" : "destructive"} 
                            className="font-medium"
                          >
                            <div className={`mr-1.5 h-2 w-2 rounded-full bg-white`} />
                            {network.active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        {new Date(network.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="p-4 align-middle text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            title="Visualizar" 
                            className="hover:bg-primary/10 transition-colors"
                            onClick={() => handleViewNetwork(network.id)}
                          >
                            <Eye className="h-4 w-4 mr-1" /> Detalhes
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            title="Editar" 
                            className="hover:bg-amber-50 text-amber-600 border-amber-200"
                            onClick={() => handleEditNetwork(network.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" 
                            title="Excluir" 
                            onClick={() => handleDeleteNetwork(network.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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
  )
}