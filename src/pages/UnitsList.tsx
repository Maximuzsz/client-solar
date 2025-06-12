import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye, Edit, Activity, Link } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { unitsAPI } from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';

// Interface da unidade
interface Unit {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  type: 'Consumer' | 'Generator';
  active: boolean;
  networkId: number;
  concessionaireId: number;
  createdAt: string;
  updatedAt: string;
}



export default function UnitsList() {
  const [searchTerm, setSearchTerm] = useState('');

  // Consulta para obter as unidades
  const { data: units, isLoading } = useQuery({
    queryKey: ['units'],
    queryFn: async () => {
      try {
        const data = await unitsAPI.getAll();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Erro ao buscar unidades:', error);
        return [];
      }
    },
    enabled: true
  });
  
  // Consulta para obter as distribuidoras
  const { data: distribuidoras } = useQuery({
    queryKey: ['concessionaires'],
    queryFn: async () => {
      try {
        // Usando API direta porque o método getConcessionaires não existe no unitsAPI
        const response = await fetch('/api/v1/concessionaires');
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Erro ao buscar distribuidoras:', error);
        return [];
      }
    }
  });

  // Filtra as unidades com base no termo de pesquisa
  const filteredUnits = units?.filter((unit: Unit) => 
    unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (unit.address && unit.address.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  // Funções de exemplo para os botões de ação
  const handleViewUnit = (id: number) => console.log('Ver unidade:', id);
  const handleEditUnit = (id: number) => console.log('Editar unidade:', id);
  const handleViewReadings = (id: number) => console.log('Ver leituras:', id);
  const handleOpenLinkDialog = (unit: Unit) => console.log('Vincular unidade:', unit);

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight">Unidades</h1>
            <Button>Nova Unidade</Button>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar unidades..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-md border">
            <DataTable 
              data={filteredUnits} 
              columns={[
                {
                  header: "Nome",
                  accessorKey: "name",
                  cell: (item) => <span className="font-medium">{item.name}</span>,
                },
                {
                  header: "Endereço",
                  accessorKey: "address",
                  cell: (item) => <span className="text-muted-foreground">{item.address || "Não informado"}</span>,
                  className: "hidden md:table-cell",
                },
                {
                  header: "Cidade/Estado",
                  accessorKey: "city",
                  cell: (item) => (
                    <span className="text-muted-foreground">
                      {item.city && item.state ? `${item.city}/${item.state}` : "Não informado"}
                    </span>
                  ),
                  className: "hidden md:table-cell",
                },
                {
                  header: "Distribuidora",
                  accessorKey: "concessionaireId",
                  cell: (item) => (
                    <span className="text-muted-foreground">
                      {distribuidoras?.find(d => d.id === item.concessionaireId)?.name || "Não informada"}
                    </span>
                  ),
                  className: "hidden md:table-cell",
                },
                {
                  header: "Tipo",
                  accessorKey: "type",
                  cell: (item) => (
                    <Badge variant={item.type === 'Consumer' ? "outline" : "default"}>
                      {item.type === 'Consumer' ? 'Consumidor' : 'Gerador'}
                    </Badge>
                  ),
                },
                {
                  header: "Ações",
                  accessorKey: "id",
                  cell: (item) => (
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewUnit(item.id)}
                        title="Ver detalhes"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditUnit(item.id)}
                        title="Editar unidade"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewReadings(item.id)}
                        title="Ver leituras"
                      >
                        <Activity className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenLinkDialog(item)}
                        title="Vincular a outra rede"
                      >
                        <Link className="h-4 w-4" />
                      </Button>
                    </div>
                  ),
                },
              ]}
              emptyMessage={searchTerm ? "Nenhuma unidade encontrada com o termo pesquisado." : "Nenhuma unidade cadastrada. Clique em 'Nova Unidade' para começar."}
              isLoading={isLoading}
              initialPageSize={10}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Componente de ícone de busca
function Search(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}