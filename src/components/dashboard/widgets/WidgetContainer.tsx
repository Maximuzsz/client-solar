import React, { useState } from 'react';
import { WidgetConfig, WidgetType } from '@/services/dashboardCustomization/dashboardLayoutService';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  MoreHorizontal, 
  Maximize2, 
  X, 
  Minimize2, 
  Settings, 
  Edit, 
  Copy, 
  Trash,
  Zap,
  LineChart,
  BarChart,
  Gauge,
  Table,
  Users,
  Calendar,
  AlertCircle,
  CloudSun,
  Bell
} from 'lucide-react';

// Importar componentes de widget
import ConsumptionChartWidget from './ConsumptionChartWidget';
import GenerationChartWidget from './GenerationChartWidget';
import EnergyBalanceWidget from './EnergyBalanceWidget';
import FinancialSummaryWidget from './FinancialSummaryWidget';
import ReadingHistoryWidget from './ReadingHistoryWidget';
import UnitsSummaryWidget from './UnitsSummaryWidget';
import PredictionChartWidget from './PredictionChartWidget';
import AnomalyDetectionWidget from './AnomalyDetectionWidget';
import WeatherForecastWidget from './WeatherForecastWidget';
import TariffAlertsWidget from './TariffAlertsWidget';

interface WidgetContainerProps {
  widget: WidgetConfig;
  onDelete: (widgetId: string) => void;
  onDuplicate: (widgetId: string) => void;
  onUpdateTitle: (widgetId: string, title: string) => void;
  onEditConfig: (widgetId: string) => void;
  gridColumnWidth?: number;
}

// Mapeamento dos tipos de widgets para componentes
const widgetComponents: Record<WidgetType, React.ComponentType<any>> = {
  [WidgetType.CONSUMPTION_CHART]: ConsumptionChartWidget,
  [WidgetType.GENERATION_CHART]: GenerationChartWidget,
  [WidgetType.ENERGY_BALANCE]: EnergyBalanceWidget,
  [WidgetType.FINANCIAL_SUMMARY]: FinancialSummaryWidget,
  [WidgetType.READING_HISTORY]: ReadingHistoryWidget,
  [WidgetType.UNITS_SUMMARY]: UnitsSummaryWidget,
  [WidgetType.PREDICTION_CHART]: PredictionChartWidget,
  [WidgetType.ANOMALY_DETECTION]: AnomalyDetectionWidget,
};

// Mapeamento adicional para os novos tipos de widgets
{
  widgetComponents['weather_forecast' as WidgetType] = WeatherForecastWidget;
  widgetComponents['tariff_alerts' as WidgetType] = TariffAlertsWidget;
}

// Mapeamento de ícones para tipos de widgets
const widgetIcons: Record<string, React.ReactNode> = {
  [WidgetType.CONSUMPTION_CHART]: <LineChart className="h-4 w-4" />,
  [WidgetType.GENERATION_CHART]: <LineChart className="h-4 w-4" />,
  [WidgetType.ENERGY_BALANCE]: <Gauge className="h-4 w-4" />,
  [WidgetType.FINANCIAL_SUMMARY]: <BarChart className="h-4 w-4" />,
  [WidgetType.READING_HISTORY]: <Table className="h-4 w-4" />,
  [WidgetType.UNITS_SUMMARY]: <Users className="h-4 w-4" />,
  [WidgetType.PREDICTION_CHART]: <Calendar className="h-4 w-4" />,
  [WidgetType.ANOMALY_DETECTION]: <AlertCircle className="h-4 w-4" />,
  'weather_forecast': <CloudSun className="h-4 w-4" />,
  'tariff_alerts': <Bell className="h-4 w-4" />,
};

const WidgetContainer: React.FC<WidgetContainerProps> = ({ 
  widget, 
  onDelete, 
  onDuplicate, 
  onUpdateTitle,
  onEditConfig,
  gridColumnWidth = 100,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(widget.title);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  
  // Buscar o componente apropriado para o tipo de widget
  const WidgetComponent = widgetComponents[widget.type] || (() => (
    <div className="h-full flex items-center justify-center">
      <p className="text-gray-500">Widget não encontrado</p>
    </div>
  ));
  
  // Buscar o ícone apropriado para o tipo de widget
  const WidgetIcon = widgetIcons[widget.type] || <Zap className="h-4 w-4" />;
  
  // Calcular largura em pixels com base no grid
  const widgetWidth = widget.layout.w * gridColumnWidth;
  
  // Manipulador para confirmar edição do título
  const handleTitleConfirm = () => {
    if (editedTitle.trim() !== '') {
      onUpdateTitle(widget.id, editedTitle);
    }
    setIsEditing(false);
  };
  
  // Manipulador para cancelar edição
  const handleTitleCancel = () => {
    setEditedTitle(widget.title);
    setIsEditing(false);
  };
  
  // Manipulador para teclas (Enter, Escape) durante edição
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleConfirm();
    } else if (e.key === 'Escape') {
      handleTitleCancel();
    }
  };
  
  return (
    <>
      <Card className={`shadow-sm overflow-hidden h-full ${expanded ? 'fixed inset-0 z-50 m-4 rounded-lg' : ''}`}>
        <CardHeader className="p-3 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center">
            {WidgetIcon}
            {isEditing ? (
              <input
                type="text"
                className="ml-2 p-1 text-sm font-medium border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={handleTitleConfirm}
                onKeyDown={handleKeyDown}
                autoFocus
              />
            ) : (
              <CardTitle className="ml-2 text-sm font-medium">{widget.title}</CardTitle>
            )}
          </div>
          <div className="flex items-center space-x-1">
            {expanded ? (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7"
                onClick={() => setExpanded(false)}
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
            ) : (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7"
                onClick={() => setExpanded(true)}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  <span>Renomear</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEditConfig(widget.id)}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configurar</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate(widget.id)}>
                  <Copy className="mr-2 h-4 w-4" />
                  <span>Duplicar</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-red-600 focus:bg-red-50 focus:text-red-600"
                  onClick={() => setDeleteConfirmOpen(true)}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  <span>Excluir</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className={`p-3 pt-0 ${expanded ? 'overflow-auto' : 'overflow-hidden'} h-[calc(100%-40px)]`}>
          <div className={`h-full ${widgetWidth < 300 ? 'text-xs' : ''}`}>
            <WidgetComponent widget={widget} />
          </div>
        </CardContent>
      </Card>
      
      {/* Diálogo de confirmação de exclusão */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir widget</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o widget "{widget.title}"?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                onDelete(widget.id);
                setDeleteConfirmOpen(false);
              }}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WidgetContainer;