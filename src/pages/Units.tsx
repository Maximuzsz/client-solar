import { Layout } from '@/components/layout/Layout'
import { Badge } from '@/components/ui/badge'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { concessionairesAPI, networksAPI, unitsAPI } from '@/services/api'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { Activity, AlertCircle, ArrowLeft, Building, Edit, Eye, Home, Link, MapPin, Plus, Search, Zap } from 'lucide-react'
import { useState } from 'react'
import { useLocation, useParams } from 'wouter'

// Interface da unidade
interface Unit {
  id: number
  name: string
  address: string
  city: string
  state: string
  postalCode: string
  type: 'Consumer' | 'Generator'
  active: boolean
  networkId: number
  concessionaireId: number
  createdAt: string
  updatedAt: string
}

// Interface da rede
interface Network {
  id: number
  name: string
  description: string
  active: boolean
  ownerId: number
  createdAt: string
  updatedAt: string
}

interface Concessionaire {
  id: number
  name: string
  region: string
  createdAt: string
  updatedAt: string
}

export default function Units() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [, setLocation] = useLocation()
  const params = useParams<{ networkId: string }>()
  const networkId = params.networkId ? parseInt(params.networkId) : 0
  
  const [searchTerm, setSearchTerm] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [openViewDialog, setOpenViewDialog] = useState(false)
  const [openEditDialog, setOpenEditDialog] = useState(false)
  const [openLinkDialog, setOpenLinkDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)
  const [selectedNetworkForLink, setSelectedNetworkForLink] = useState<number | null>(null)
  const [keepCurrentNetwork, setKeepCurrentNetwork] = useState(false)
  const { user } = useAuth();
  const [newUnit, setNewUnit] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    type: 'Consumer' as 'Consumer' | 'Generator',
    networkId,
    userId: user?.id || 1,
    concessionaireId: 1 // ID da Energisa como padrão
  })

  // Consulta para obter a rede atual (se tiver networkId) ou todas as redes (se não tiver)
  const { data: network, isLoading: isNetworkLoading } = useQuery({
    queryKey: ['network', networkId || 'all'],
    queryFn: async () => {
      try {
        // Se temos um networkId, buscamos os detalhes daquela rede específica
        if (networkId) {
          const data = await networksAPI.getById(networkId);
          console.log('Dados da rede obtidos:', data);
          // Garantindo que nunca retornamos undefined
          return data || { id: networkId, name: "Rede não encontrada", description: "", ownerId: 0 };
        } else {
          // Se não temos networkId, retornamos um objeto vazio
          // Na versão futura, podemos buscar todas as redes e permitir selecionar na tela
          return { id: 0, name: "Todas as Unidades", description: "", ownerId: 0 };
        }
      } catch (error) {
        console.error('Erro ao buscar rede:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os dados da rede.',
          variant: 'destructive'
        });
        // Retorna um objeto vazio em vez de null para evitar erros com o TanStack Query
        return { id: networkId || 0, name: "Rede não encontrada", description: "", ownerId: 0 };
      }
    },
    // Sempre habilitado, para funcionar mesmo sem networkId
    enabled: true
  });
  
  // Consulta para obter todas as redes do usuário (para o diálogo de vinculação e quando acessando diretamente pelo menu)
  const { data: userNetworks } = useQuery({
    queryKey: ['networks', 'user'],
    queryFn: async () => {
      try {
        const data = await networksAPI.getAll();
        console.log('Redes do usuário obtidas:', data);
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Erro ao buscar redes do usuário:', error);
        return [];
      }
    },
    // Agora sempre busca as redes para poder vincular unidades entre redes
    enabled: true
  });

  // Consulta para obter as unidades
  const { data: units, isLoading, error } = useQuery({
    queryKey: ['units', networkId || 0],
    queryFn: async () => {
      try {
        
        let data;
        if (networkId) {
          // Se tiver networkId, busca unidades daquela rede específica 
          console.log(`Buscando unidades da rede ID ${networkId}`);
          data = await unitsAPI.getByNetwork(networkId);
          console.log('Dados das unidades da rede obtidos:', data);
        } else {
          // Se não tiver networkId, busca todas as unidades do usuário
          console.log('Buscando todas as unidades do usuário');
          data = await unitsAPI.getAll();
          console.log('Todas as unidades do usuário obtidas:', data);
        }
        // Garantindo que sempre retornamos um array, mesmo que vazio
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Erro ao buscar unidades:', error);
        // Retornamos um array vazio para evitar erros com o TanStack Query
        return [];
      }
    },
    // Sempre habilitado, independente de ter networkId ou não
    enabled: true
  });
  
  // Consulta para obter as distribuidoras
  const { data: distribuidoras } = useQuery({
    queryKey: ['concessionaires'],
    queryFn: async () => {
      try {
        console.log('Iniciando busca de concessionárias com API dedicada...');
        
        // Usando o serviço de API dedicado para concessionárias
        const data = await concessionairesAPI.getAll();
        
        // Log detalhado para depuração
        console.log('Dados das distribuidoras obtidos:', data);
        console.log('Quantidade de distribuidoras:', Array.isArray(data) ? data.length : 0);
        
        if (Array.isArray(data) && data.length > 0) {
          // Um log mais detalhado para verificar o conteúdo exato
          data.forEach((dist, index) => {
            console.log(`Distribuidora ${index + 1}:`, dist.id, dist.name, dist.region);
          });
          return data;
        } else {
          console.warn('Nenhuma distribuidora encontrada ou formato inválido');
          return [];
        }
      } catch (error) {
        console.error('Erro ao buscar distribuidoras:', error);
        // Retornamos um array vazio para evitar erros com o TanStack Query
        return [];
      }
    },
    // Garantir que sempre temos os dados mais recentes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0, // Sempre buscar novos dados
  });
  
  // Função para criar uma nova unidade
  const handleCreateUnit = async () => {
    if (!newUnit.name.trim()) {
      toast({
        title: 'Erro ao criar unidade',
        description: 'O nome da unidade é obrigatório.',
        variant: 'destructive'
      });
      return;
    }
    
    if (newUnit.concessionaireId === 0) {
      toast({
        title: 'Erro ao criar unidade',
        description: 'Selecione uma distribuidora de energia.',
        variant: 'destructive'
      });
      return;
    }
    
    // Se não estamos em uma rede específica, precisamos garantir que a unidade tenha uma rede
    if (isDirectAccess && (!newUnit.networkId || newUnit.networkId === 0)) {
      toast({
        title: 'Erro ao criar unidade',
        description: 'É necessário selecionar uma rede para a unidade.',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      console.log("Criando unidade com dados:", newUnit);
      await unitsAPI.create(newUnit);
      
      // Limpa o formulário e fecha o diálogo
      setNewUnit({
        name: '',
        address: '',
        city: '',
        state: '',
        postalCode: '',
        type: 'Consumer',
        networkId: networkId || 0,
        userId: user?.id || 1,
        concessionaireId: 0
      });
      setOpenDialog(false);
      
      // Atualiza a lista de unidades (com ou sem networkId)
      if (networkId) {
        queryClient.invalidateQueries({ queryKey: ['units', networkId] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['units', 0] });
      }
      
      toast({
        title: 'Unidade criada com sucesso',
        description: 'A unidade foi criada e já está disponível.'
      });
    } catch (error) {
      console.error('Erro ao criar unidade:', error);
      toast({
        title: 'Erro ao criar unidade',
        description: 'Não foi possível criar a unidade. Verifique os dados e tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtra as unidades com base no termo de pesquisa
  const filteredUnits = units?.filter((unit: Unit) => 
    unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (unit.address && unit.address.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  // Função para buscar detalhes de uma unidade
  const fetchUnitDetails = async (id: number) => {
    try {
      console.log(`Buscando unidade com ID: ${id}`);
      const response = await unitsAPI.getById(id);
      console.log('Resposta detalhes unidade:', response);
      // Se a resposta for a própria unidade (sem estar dentro de data)
      if (response && response.id) {
        return response;
      }
      // Se a resposta estiver em um campo data
      return response?.data || null;
    } catch (error) {
      console.error('Erro ao buscar detalhes da unidade:', error);
      toast({
        title: 'Erro ao buscar detalhes',
        description: 'Não foi possível carregar os detalhes da unidade.',
        variant: 'destructive',
      });
      return null;
    }
  };
  
  // Função para visualizar uma unidade
  const handleViewUnit = async (id: number) => {
    const unit = await fetchUnitDetails(id);
    if (unit) {
      setSelectedUnit(unit);
      setOpenViewDialog(true);
    }
  };
  
  // Função para navegar para a página de leituras de uma unidade
  const handleViewReadings = (unitId: number) => {
    setLocation(`/units/${unitId}/readings`);
  };
  
  // Função para editar uma unidade
  const handleEditUnit = async (id: number) => {
    const unit = await fetchUnitDetails(id);
    if (unit) {
      setSelectedUnit(unit);
      // Certifique-se de incluir apenas campos que o backend aceita para atualização
      setNewUnit({
        name: unit.name,
        address: unit.address || '',
        city: unit.city || '',
        state: unit.state || '',
        postalCode: unit.postalCode || '',
        type: unit.type,
        networkId: unit.networkId, // Use o valor existente na unidade
        concessionaireId: unit.concessionaireId || 1 // Definir valor padrão se não existir
      });
      setOpenEditDialog(true);
      console.log("Abrindo formulário de edição com dados:", {
        id: unit.id,
        ...unit
      });
    }
  };
  
  // Função para abrir o diálogo de vinculação de unidade a outra rede
  const handleOpenLinkDialog = (unit: Unit) => {
    setSelectedUnit(unit);
    setSelectedNetworkForLink(null);
    setKeepCurrentNetwork(false);
    setOpenLinkDialog(true);
  };

  // Função para vincular unidade a outra rede
  const handleLinkUnitToNetwork = async () => {
    if (!selectedUnit || !selectedNetworkForLink || selectedNetworkForLink === 0) {
      toast({
        title: 'Erro ao vincular unidade',
        description: 'Selecione uma rede válida para vincular a unidade.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      await unitsAPI.linkToNetwork(
        selectedUnit.id, 
        selectedNetworkForLink, 
        keepCurrentNetwork
      );
      
      setOpenLinkDialog(false);
      setSelectedUnit(null);
      setSelectedNetworkForLink(null);
      
      // Atualiza a lista de unidades
      queryClient.invalidateQueries({ queryKey: ['units', networkId] });
      
      toast({
        title: 'Unidade vinculada com sucesso',
        description: 'A unidade foi vinculada à rede selecionada.',
      });
    } catch (error) {
      console.error('Erro ao vincular unidade:', error);
      toast({
        title: 'Erro ao vincular unidade',
        description: 'Não foi possível vincular a unidade à rede selecionada.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para salvar alterações em uma unidade
  const handleUpdateUnit = async () => {
    if (!selectedUnit) return;
    
    if (!newUnit.name.trim()) {
      toast({
        title: 'Erro ao atualizar unidade',
        description: 'O nome da unidade é obrigatório.',
        variant: 'destructive'
      });
      return;
    }
    
    if (!newUnit.concessionaireId || newUnit.concessionaireId === 0) {
      toast({
        title: 'Erro ao atualizar unidade',
        description: 'Selecione uma distribuidora de energia.',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Preparar apenas os dados necessários para a atualização
      const updateData = {
        name: newUnit.name.trim(),
        address: newUnit.address?.trim(),
        city: newUnit.city?.trim(),
        state: newUnit.state?.trim(),
        postalCode: newUnit.postalCode?.trim(),
        type: newUnit.type,
        concessionaireId: newUnit.concessionaireId
      };
      
      console.log("Enviando dados para atualização:", updateData);
      await unitsAPI.update(selectedUnit.id, updateData);
      
      // Limpa o formulário e fecha o diálogo
      setNewUnit({
        name: '',
        address: '',
        city: '',
        state: '',
        postalCode: '',
        type: 'Consumer',
        networkId,
        userId: user?.id || 1,
        concessionaireId: 0
      });
      setSelectedUnit(null);
      setOpenEditDialog(false);
      
      // Atualiza a lista de unidades
      queryClient.invalidateQueries({ queryKey: ['units', networkId] });
      
      toast({
        title: 'Unidade atualizada com sucesso',
        description: 'As alterações foram salvas com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao atualizar unidade:', error);
      toast({
        title: 'Erro ao atualizar unidade',
        description: 'Não foi possível atualizar a unidade. Verifique os dados e tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading || isNetworkLoading) {
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
            <p className="text-muted-foreground">Ocorreu um erro ao buscar as unidades. Por favor, tente novamente.</p>
          </div>
          <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
          <Button variant="outline" onClick={() => setLocation('/networks')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Redes
          </Button>
        </div>
      </Layout>
    );
  }
  
  // Se não houver networkId, significa que o usuário está acessando pela navegação lateral
  const isDirectAccess = !networkId;

  // Calcular estatísticas das unidades
  const unitStats = {
    total: units?.length || 0,
    consumers: units?.filter(u => u.type === 'Consumer').length || 0,
    generators: units?.filter(u => u.type === 'Generator').length || 0,
    active: units?.filter(u => u.active !== false).length || 0,
    inactive: units?.filter(u => u.active === false).length || 0
  };

  return (
    <Layout>
      <div className="space-y-8">
        {!isDirectAccess && (
          <Breadcrumb
            segments={[
              { name: 'Redes', href: '/networks', current: false },
              { name: network?.name || 'Detalhes da Rede', href: `/networks/${networkId}/units`, current: true }
            ]}
            className="mb-4"
          />
        )}
        
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            {isDirectAccess ? (
              <>
                <h1 className="text-3xl font-bold">Todas as Unidades</h1>
                <p className="text-muted-foreground">
                  Gerencie todas as unidades consumidoras e geradoras disponíveis
                </p>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold">Unidades da Rede: {network?.name}</h1>
                <p className="text-muted-foreground">
                  Gerencie as unidades consumidoras e geradoras desta rede
                </p>
              </>
            )}
          </div>
          <div className="flex gap-2">
            {!isDirectAccess && (
              <Button 
                variant="outline" 
                onClick={() => setLocation('/networks')}
                className="shrink-0 hover:bg-muted/60 transition-colors"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Redes
              </Button>
            )}
            <Button 
              className="shrink-0 shadow-md hover:shadow-lg transition-all bg-gradient-to-r from-primary to-primary/80" 
              onClick={() => setOpenDialog(true)}
            >
              <Plus className="mr-2 h-4 w-4" /> Nova Unidade
            </Button>
          </div>
        </div>
        
        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <Card className="shadow-sm hover:shadow-md transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Activity className="mr-2 h-5 w-5 text-primary" />
                Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{unitStats.total}</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm hover:shadow-md transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Home className="mr-2 h-5 w-5 text-blue-500" />
                Consumidoras
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{unitStats.consumers}</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm hover:shadow-md transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Zap className="mr-2 h-5 w-5 text-amber-500" />
                Geradoras
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{unitStats.generators}</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm hover:shadow-md transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Building className="mr-2 h-5 w-5 text-green-500" />
                Ativas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{unitStats.active}</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm hover:shadow-md transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <AlertCircle className="mr-2 h-5 w-5 text-destructive" />
                Inativas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{unitStats.inactive}</p>
            </CardContent>
          </Card>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Pesquisar unidades por nome ou endereço..."
            className="pl-10 shadow-sm focus:shadow-md transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Diálogo para criar nova unidade */}
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Unidade</DialogTitle>
              <DialogDescription>
                Preencha os campos abaixo para criar uma nova unidade na rede {network.name}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Unidade *</Label>
                <Input
                  id="name"
                  placeholder="Digite o nome da unidade"
                  value={newUnit.name}
                  onChange={(e) => setNewUnit({...newUnit, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipo de Unidade</Label>
                <Select
                  value={newUnit.type}
                  onValueChange={(value) => setNewUnit({...newUnit, type: value as 'Consumer' | 'Generator'})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Consumer">Consumidora</SelectItem>
                    <SelectItem value="Generator">Geradora</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  placeholder="Digite o endereço"
                  value={newUnit.address}
                  onChange={(e) => setNewUnit({...newUnit, address: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    placeholder="Digite a cidade"
                    value={newUnit.city}
                    onChange={(e) => setNewUnit({...newUnit, city: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    placeholder="Digite o estado"
                    value={newUnit.state}
                    onChange={(e) => setNewUnit({...newUnit, state: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">CEP</Label>
                <Input
                  id="postalCode"
                  placeholder="Digite o CEP"
                  value={newUnit.postalCode}
                  onChange={(e) => setNewUnit({...newUnit, postalCode: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="distribuidora">Distribuidora de Energia</Label>
                <Select
                  value={newUnit.concessionaireId.toString()}
                  onValueChange={(value) => setNewUnit({...newUnit, concessionaireId: parseInt(value)})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a distribuidora" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Selecione uma distribuidora</SelectItem>
                    {distribuidoras?.map((distribuidora: Concessionaire) => (
                      <SelectItem key={distribuidora.id} value={distribuidora.id.toString()}>
                        {distribuidora.name} - {distribuidora.region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenDialog(false)}>Cancelar</Button>
              <Button 
                onClick={handleCreateUnit}
                disabled={isSubmitting || !newUnit.name.trim()}
              >
                {isSubmitting ? 'Criando...' : 'Criar Unidade'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Diálogo para visualizar detalhes da unidade */}
        <Dialog open={openViewDialog} onOpenChange={setOpenViewDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalhes da Unidade</DialogTitle>
            </DialogHeader>
            {selectedUnit && (
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Nome</h3>
                    <p className="text-base">{selectedUnit.name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Tipo</h3>
                    <p className="text-base">{selectedUnit.type === 'Consumer' ? 'Consumidora' : 'Geradora'}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Endereço</h3>
                  <p className="text-base">{selectedUnit.address || 'Não informado'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Cidade</h3>
                    <p className="text-base">{selectedUnit.city || 'Não informada'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Estado</h3>
                    <p className="text-base">{selectedUnit.state || 'Não informado'}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">CEP</h3>
                  <p className="text-base">{selectedUnit.postalCode || 'Não informado'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Distribuidora</h3>
                  <p className="text-base">
                    {distribuidoras?.find(d => d.id === selectedUnit.concessionaireId)?.name || 'Não informada'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                    <div className="flex items-center">
                      <div
                        className={`mr-2 h-2 w-2 rounded-full ${
                          selectedUnit.active !== false ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      />
                      <p>{selectedUnit.active !== false ? 'Ativo' : 'Inativo'}</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Criado em</h3>
                    <p className="text-base">
                      {selectedUnit.createdAt ? new Date(selectedUnit.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Atualizado em</h3>
                    <p className="text-base">
                      {selectedUnit.updatedAt ? new Date(selectedUnit.updatedAt).toLocaleDateString('pt-BR') : 'N/A'}
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
                  setSelectedUnit(null);
                }}
              >
                Fechar
              </Button>
              <Button 
                variant="secondary"
                onClick={() => {
                  if (selectedUnit) {
                    setLocation(`/units/${selectedUnit.id}/readings`);
                  }
                }}
              >
                <Plus className="mr-2 h-4 w-4" /> Gerenciar Leituras
              </Button>
              <Button onClick={() => {
                setOpenViewDialog(false);
                if (selectedUnit) {
                  handleEditUnit(selectedUnit.id);
                }
              }}>
                Editar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Diálogo para editar unidade */}
        <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Unidade</DialogTitle>
              <DialogDescription>
                Altere os campos abaixo para atualizar os dados da unidade.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome da Unidade *</Label>
                <Input
                  id="edit-name"
                  placeholder="Digite o nome da unidade"
                  value={newUnit.name}
                  onChange={(e) => setNewUnit({...newUnit, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-type">Tipo de Unidade</Label>
                <Select
                  value={newUnit.type}
                  onValueChange={(value) => setNewUnit({...newUnit, type: value as 'Consumer' | 'Generator'})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Consumer">Consumidora</SelectItem>
                    <SelectItem value="Generator">Geradora</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-address">Endereço</Label>
                <Input
                  id="edit-address"
                  placeholder="Digite o endereço"
                  value={newUnit.address}
                  onChange={(e) => setNewUnit({...newUnit, address: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-city">Cidade</Label>
                  <Input
                    id="edit-city"
                    placeholder="Digite a cidade"
                    value={newUnit.city}
                    onChange={(e) => setNewUnit({...newUnit, city: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-state">Estado</Label>
                  <Input
                    id="edit-state"
                    placeholder="Digite o estado"
                    value={newUnit.state}
                    onChange={(e) => setNewUnit({...newUnit, state: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-postalCode">CEP</Label>
                <Input
                  id="edit-postalCode"
                  placeholder="Digite o CEP"
                  value={newUnit.postalCode}
                  onChange={(e) => setNewUnit({...newUnit, postalCode: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-distribuidora">Distribuidora de Energia</Label>
                <Select
                  value={newUnit.concessionaireId.toString()}
                  onValueChange={(value) => setNewUnit({...newUnit, concessionaireId: parseInt(value)})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a distribuidora" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Selecione uma distribuidora</SelectItem>
                    {distribuidoras?.map((distribuidora: Concessionaire) => (
                      <SelectItem key={distribuidora.id} value={distribuidora.id.toString()}>
                        {distribuidora.name} - {distribuidora.region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setOpenEditDialog(false);
                  setSelectedUnit(null);
                  setNewUnit({
                    name: '',
                    address: '',
                    city: '',
                    state: '',
                    postalCode: '',
                    type: 'Consumer',
                    networkId,
                    userId: user?.id || 1,
                    concessionaireId: 0
                  });
                }}
              >
                Cancelar
              </Button>
              <Button 
                variant="secondary"
                onClick={() => {
                  if (selectedUnit) {
                    setLocation(`/units/${selectedUnit.id}/readings`);
                  }
                }}
              >
                <Plus className="mr-2 h-4 w-4" /> Gerenciar Leituras
              </Button>
              <Button 
                onClick={handleUpdateUnit}
                disabled={isSubmitting || !newUnit.name.trim()}
              >
                {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {filteredUnits?.length === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-dashed py-12 bg-muted/10">
            <div className="rounded-full bg-primary/10 p-4 shadow-inner">
              <Plus className="h-8 w-8 text-primary" />
            </div>
            <h3 className="mt-4 text-xl font-semibold">Nenhuma unidade encontrada</h3>
            <p className="mt-2 text-center text-muted-foreground max-w-md">
              {searchTerm ? 'Nenhuma unidade corresponde à sua pesquisa. Tente outros termos ou limpe o campo de busca.' : 'Você ainda não possui unidades cadastradas nesta rede. Crie sua primeira unidade agora mesmo!'}
            </p>
            {!searchTerm && (
              <Button 
                className="mt-6 shadow-md hover:shadow-lg transition-all bg-gradient-to-r from-primary to-primary/80" 
                onClick={() => setOpenDialog(true)}
              >
                <Plus className="mr-2 h-4 w-4" /> Criar Nova Unidade
              </Button>
            )}
          </div>
        ) : (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-md border shadow-sm"
            >
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="bg-gradient-to-r from-primary/10 to-primary/5 [&_tr]:border-b">
                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <th className="h-12 px-4 text-left align-middle font-medium text-primary-foreground/80">Nome</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-primary-foreground/80">Tipo</th>
                      <th className="hidden h-12 px-4 text-left align-middle font-medium text-primary-foreground/80 md:table-cell">Endereço</th>
                      <th className="hidden h-12 px-4 text-left align-middle font-medium text-primary-foreground/80 md:table-cell">Cidade/Estado</th>
                      <th className="hidden h-12 px-4 text-left align-middle font-medium text-primary-foreground/80 md:table-cell">Distribuidora</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-primary-foreground/80">Status</th>
                      <th className="h-12 px-4 text-right align-middle font-medium text-primary-foreground/80">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {filteredUnits?.map((unit) => (
                      <tr key={unit.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <td className="p-4 align-middle font-medium">{unit.name}</td>
                        <td className="p-4 align-middle">
                          <Badge variant={unit.type === 'Consumer' ? 'default' : 'outline'} className={unit.type === 'Consumer' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-amber-500 hover:bg-amber-600 text-white'}>
                            {unit.type === 'Consumer' ? 'Consumidora' : 'Geradora'}
                          </Badge>
                        </td>
                        <td className="hidden p-4 align-middle text-muted-foreground md:table-cell">
                          <div className="flex items-center">
                            <MapPin className="mr-2 h-4 w-4 text-muted-foreground/70" />
                            {unit.address || 'Não informado'}
                          </div>
                        </td>
                        <td className="hidden p-4 align-middle text-muted-foreground md:table-cell">
                          {unit.city ? `${unit.city}${unit.state ? `/${unit.state}` : ''}` : 'Não informado'}
                        </td>
                        <td className="hidden p-4 align-middle text-muted-foreground md:table-cell">
                          {distribuidoras?.find(d => d.id === unit.concessionaireId)?.name || 'Não informada'}
                        </td>
                        <td className="p-4 align-middle">
                          <Badge variant={unit.active !== false ? 'default' : 'destructive'} className={unit.active !== false ? 'bg-green-500 hover:bg-green-600' : ''}>
                            {unit.active !== false ? 'Ativa' : 'Inativa'}
                          </Badge>
                        </td>
                        <td className="p-4 align-middle text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title="Visualizar" 
                              onClick={() => handleViewUnit(unit.id)}
                              className="h-8 w-8 p-0 hover:bg-muted/80 transition-colors"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="h-8 flex items-center gap-1 shadow-sm hover:shadow transition-all"
                              title="Gerenciar Leituras" 
                              onClick={() => setLocation(`/units/${unit.id}/readings`)}
                            >
                              <Plus className="h-4 w-4" />
                              <span className="hidden sm:inline">Leituras</span>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title="Editar" 
                              onClick={() => handleEditUnit(unit.id)}
                              className="h-8 w-8 p-0 hover:bg-muted/80 transition-colors"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              title="Conectar unidade a outra rede" 
                              onClick={() => handleOpenLinkDialog(unit)}
                              className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600 hover:border-blue-400 transition-all ml-1"
                            >
                              <Link className="h-4 w-4" />
                            </Button>
                          </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
        
        {/* Diálogo para vincular unidade a outra rede */}
        <Dialog open={openLinkDialog} onOpenChange={setOpenLinkDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-blue-600">
                <div className="flex items-center gap-2">
                  <Link className="h-5 w-5" />
                  Conectar Unidade a Outra Rede
                </div>
              </DialogTitle>
              <DialogDescription>
                Selecione a rede para conectar a unidade <span className="font-medium">{selectedUnit?.name}</span>.
                Isso permitirá que esta unidade seja gerenciada em múltiplas redes.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="network">Rede de Destino</Label>
                <Select
                  value={selectedNetworkForLink?.toString() || ""}
                  onValueChange={(value) => setSelectedNetworkForLink(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma rede" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Selecione uma rede</SelectItem>
                    {userNetworks?.filter(net => net.id !== networkId).map((net) => (
                      <SelectItem key={net.id} value={net.id.toString()}>
                        {net.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="keepCurrentNetwork"
                  checked={keepCurrentNetwork}
                  onChange={() => setKeepCurrentNetwork(!keepCurrentNetwork)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="keepCurrentNetwork" className="text-sm font-normal">
                  Manter vínculo com a rede atual (recomendado apenas para testes)
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenLinkDialog(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button 
                type="button"
                onClick={handleLinkUnitToNetwork}
                disabled={isSubmitting || !selectedNetworkForLink || selectedNetworkForLink === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                    Conectando...
                  </>
                ) : (
                  <>
                    <Link className="mr-2 h-4 w-4" />
                    Conectar
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Fim do diálogo de vinculação */}
      </div>
    </Layout>
  );
}