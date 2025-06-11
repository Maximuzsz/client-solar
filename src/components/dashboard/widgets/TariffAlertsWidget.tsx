import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { WidgetConfig } from '@/services/dashboardCustomization/dashboardLayoutService';
import { Badge } from '@/components/ui/badge';
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, TrendingUp, TrendingDown, Bell, BellOff } from 'lucide-react';

interface TariffAlertsWidgetProps {
  widget: WidgetConfig;
}

// Interface para alertas de tarifas
interface TariffAlert {
  id: string;
  concessionaireId: number;
  concessionaire: {
    id: number;
    name: string;
    region: string;
  };
  tariffType: 'Residential' | 'Commercial' | 'Industrial';
  prevValue: number;
  newValue: number;
  changePercent: number;
  effectiveDate: string;
  notificationSent: boolean;
  createdAt: string;
}

const TariffAlertsWidget: React.FC<TariffAlertsWidgetProps> = ({ widget }) => {
  // Extrair configurações do widget
  const {
    limit = 5,
    thresholdPercent = 5,
    concessionaireId,
    showAll = true,
  } = widget.config;
  
  // Estado local para filtros que podem ser alterados pelo usuário
  const [selectedThreshold, setSelectedThreshold] = useState<number>(thresholdPercent);
  const [selectedConcessionaire, setSelectedConcessionaire] = useState<string | null>(
    concessionaireId ? String(concessionaireId) : null
  );
  
  // Consultar concessionárias disponíveis, se necessário
  const { data: concessionairesData } = useQuery({
    queryKey: ['/api/v1/concessionaires'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/v1/concessionaires');
      return response.data;
    },
    enabled: !concessionaireId,
  });
  
  // Consultar alertas de tarifas
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/v1/dashboard/advanced/tariffs-alerts', selectedThreshold, selectedConcessionaire],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('threshold', selectedThreshold.toString());
      if (selectedConcessionaire) params.append('concessionaireId', selectedConcessionaire);
      params.append('limit', limit.toString());
      
      const response = await apiRequest('GET', `/api/v1/dashboard/advanced/tariffs-alerts?${params.toString()}`);
      return response.data as TariffAlert[];
    },
  });
  
  // Formatar valor monetário
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    });
  };
  
  // Formatar data para exibição
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
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
          <p className="text-red-500 mb-2">Erro ao carregar alertas</p>
          <p className="text-sm text-gray-500">Tente novamente mais tarde</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between mb-4">
        {/* Seletor de concessionária */}
        {!concessionaireId && showAll && concessionairesData && concessionairesData.length > 0 && (
          <Select
            value={selectedConcessionaire || ""}
            onValueChange={(value) => setSelectedConcessionaire(value || null)}
          >
            <SelectTrigger className="w-[180px] h-8">
              <SelectValue placeholder="Todas as distribuidoras" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas as distribuidoras</SelectItem>
              {concessionairesData.map((concessionaire: any) => (
                <SelectItem key={concessionaire.id} value={concessionaire.id.toString()}>
                  {concessionaire.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        
        {/* Seletor de limiar de variação */}
        <Select
          value={selectedThreshold.toString()}
          onValueChange={(value) => setSelectedThreshold(Number(value))}
        >
          <SelectTrigger className="w-[180px] h-8">
            <SelectValue placeholder="Variação mínima" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Variação de 1% ou mais</SelectItem>
            <SelectItem value="3">Variação de 3% ou mais</SelectItem>
            <SelectItem value="5">Variação de 5% ou mais</SelectItem>
            <SelectItem value="10">Variação de 10% ou mais</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Lista de alertas */}
      {data && data.length > 0 ? (
        <div className="flex-1 overflow-auto space-y-3">
          {data.map((alert) => (
            <Card 
              key={alert.id} 
              className={`border-l-4 ${alert.changePercent > 0 ? 'border-l-red-500' : 'border-l-green-500'}`}
            >
              <CardHeader className="p-3 pb-0">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-sm font-medium">
                    {alert.concessionaire.name}
                  </CardTitle>
                  <Badge 
                    variant={alert.changePercent > 0 ? 'destructive' : 'success'}
                    className="ml-2"
                  >
                    {alert.changePercent > 0 ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {alert.changePercent > 0 ? '+' : ''}{alert.changePercent.toFixed(2)}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-1">
                <div className="text-xs text-gray-500 mb-1 flex items-center">
                  <span className="mr-2">{alert.concessionaire.region}</span>
                  <span className="bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded text-[10px]">
                    {alert.tariffType === 'Residential' ? 'Residencial' : 
                     alert.tariffType === 'Commercial' ? 'Comercial' : 'Industrial'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 text-xs gap-2 mb-1">
                  <div>
                    <span className="text-gray-500">Valor anterior:</span>{' '}
                    <span>{formatCurrency(alert.prevValue)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Novo valor:</span>{' '}
                    <span className={alert.changePercent > 0 ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                      {formatCurrency(alert.newValue)}
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-1 text-xs">
                  <span className="text-gray-500">
                    Vigência: {formatDate(alert.effectiveDate)}
                  </span>
                  
                  {alert.notificationSent ? (
                    <div className="flex items-center text-gray-400">
                      <Bell className="h-3 w-3 mr-1" />
                      <span>Notificado</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-amber-500">
                      <BellOff className="h-3 w-3 mr-1" />
                      <span>Pendente</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center p-6">
            <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 font-medium">Nenhum alerta encontrado</p>
            <p className="text-sm text-gray-500 mt-1">
              Não há alertas de alteração de tarifas com variação acima de {selectedThreshold}%
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TariffAlertsWidget;