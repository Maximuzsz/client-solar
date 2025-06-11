import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { WidgetConfig } from '@/services/dashboardCustomization/dashboardLayoutService';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReadingHistoryWidgetProps {
  widget: WidgetConfig;
}

const ReadingHistoryWidget: React.FC<ReadingHistoryWidgetProps> = ({ widget }) => {
  // Extrair configurações do widget
  const {
    unitId,
    networkId,
    limit = 5,
    showDownload = true,
    showUnit = true,
  } = widget.config;
  
  // Estado local para filtros que podem ser alterados pelo usuário
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(
    unitId ? String(unitId) : null
  );
  
  // Consultar unidades disponíveis
  const { data: unitsData } = useQuery({
    queryKey: ['/api/v1/units', networkId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (networkId) params.append('networkId', networkId.toString());
      
      const response = await apiRequest('GET', `/api/v1/units?${params.toString()}`);
      return response.data;
    },
    enabled: showUnit && !unitId && !!networkId,
  });
  
  // Consultar histórico de leituras
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/v1/readings/history', selectedUnitId, networkId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedUnitId) params.append('unitId', selectedUnitId);
      if (networkId) params.append('networkId', networkId.toString());
      params.append('limit', limit.toString());
      
      const response = await apiRequest('GET', `/api/v1/readings/history?${params.toString()}`);
      return response.data;
    },
    enabled: !!selectedUnitId || !!networkId,
  });
  
  // Função para exportar dados como CSV
  const handleExportCSV = () => {
    if (!data || data.length === 0) return;
    
    const headers = ['ID', 'Unidade', 'Valor (kWh)', 'Data da Leitura', 'Tipo de Unidade'];
    const csvData = data.map((reading: any) => [
      reading.id,
      reading.unitName,
      reading.value,
      new Date(reading.readingAt).toLocaleString(),
      reading.unitType === 'Consumer' ? 'Consumidor' : 'Gerador'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `leituras_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Formatar data para exibição
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  // Renderizar estados de carregamento/erro
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center p-4">
          <p className="text-red-500 mb-2">Erro ao carregar dados</p>
          <p className="text-sm text-gray-500">Tente novamente mais tarde</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        {showUnit && !unitId && unitsData && unitsData.length > 0 && (
          <Select
            value={selectedUnitId || ""}
            onValueChange={(value) => setSelectedUnitId(value || null)}
          >
            <SelectTrigger className="w-[220px] h-8">
              <SelectValue placeholder="Selecionar unidade" />
            </SelectTrigger>
            <SelectContent>
              {unitsData.map((unit: any) => (
                <SelectItem key={unit.id} value={unit.id.toString()}>
                  {unit.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        
        {showDownload && data && data.length > 0 && (
          <Button 
            size="sm" 
            variant="outline" 
            className="h-8"
            onClick={handleExportCSV}
          >
            <FileDown className="h-4 w-4 mr-1" />
            Exportar
          </Button>
        )}
      </div>
      
      {data && data.length > 0 ? (
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {showUnit && <TableHead>Unidade</TableHead>}
                <TableHead>Valor</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((reading: any) => (
                <TableRow key={reading.id}>
                  {showUnit && (
                    <TableCell className="font-medium truncate" style={{ maxWidth: '120px' }}>
                      {reading.unitName}
                    </TableCell>
                  )}
                  <TableCell>{reading.value} kWh</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <CalendarDays className="h-3 w-3 mr-1 text-gray-400" />
                      {formatDate(reading.readingAt)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={reading.unitType === 'Consumer' ? 'warning' : 'success'}
                      className="whitespace-nowrap"
                    >
                      {reading.unitType === 'Consumer' ? 'Consumo' : 'Geração'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center p-6">
            <p className="text-gray-500">Nenhuma leitura encontrada</p>
            {!selectedUnitId && unitsData && unitsData.length > 0 && (
              <p className="text-sm text-gray-400 mt-1">
                Selecione uma unidade para visualizar suas leituras
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReadingHistoryWidget;