import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import dashboardLayoutService, { DashboardLayout, WidgetConfig, WidgetType } from '@/services/dashboardCustomization/dashboardLayoutService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FileCheck,
  Grid,
  LayoutTemplate,
  Plus,
  RotateCw,
  Save
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

// Importing components for the widgets
import WidgetContainer from "./widgets/WidgetContainer";

// Import gridster library for drag-n-drop feature
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

// Create responsive grid layout
const ResponsiveGridLayout = WidthProvider(Responsive);

// Widget type options for the add dialog
const widgetTypeOptions = [
  { value: WidgetType.CONSUMPTION_CHART, label: 'Gráfico de Consumo', icon: '📊' },
  { value: WidgetType.GENERATION_CHART, label: 'Gráfico de Geração', icon: '⚡' },
  { value: WidgetType.ENERGY_BALANCE, label: 'Balanço Energético', icon: '⚖️' },
  { value: WidgetType.FINANCIAL_SUMMARY, label: 'Resumo Financeiro', icon: '💰' },
  { value: WidgetType.READING_HISTORY, label: 'Histórico de Leituras', icon: '📝' },
  { value: WidgetType.UNITS_SUMMARY, label: 'Resumo de Unidades', icon: '🏠' },
  { value: WidgetType.PREDICTION_CHART, label: 'Previsão de Energia', icon: '🔮' },
  { value: WidgetType.ANOMALY_DETECTION, label: 'Detecção de Anomalias', icon: '⚠️' },
  { value: 'weather_forecast', label: 'Previsão do Tempo', icon: '☀️' },
  { value: 'tariff_alerts', label: 'Alertas de Tarifas', icon: '🔔' },
];

// Grid configuration
const GRID_COLS = 12;
const GRID_ROW_HEIGHT = 100;
const GRID_MARGIN: [number, number] = [10, 10];

const CustomizableDashboard = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Estado para controlar os diálogos
  const [addWidgetDialogOpen, setAddWidgetDialogOpen] = useState(false);
  const [saveLayoutDialogOpen, setSaveLayoutDialogOpen] = useState(false);
  const [loadLayoutDialogOpen, setLoadLayoutDialogOpen] = useState(false);
  const [configWidgetDialogOpen, setConfigWidgetDialogOpen] = useState(false);
  
  // Estados para o layout e os widgets
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [currentLayout, setCurrentLayout] = useState<DashboardLayout | null>(null);
  const [layoutName, setLayoutName] = useState('Meu Dashboard');
  const [selectedLayoutId, setSelectedLayoutId] = useState<string | null>(null);
  const [selectedWidgetType, setSelectedWidgetType] = useState<WidgetType | null>(null);
  const [selectedWidgetForConfig, setSelectedWidgetForConfig] = useState<WidgetConfig | null>(null);
  
  // Consultar layouts disponíveis
  const { data: layouts, isLoading: isLoadingLayouts } = useQuery({
    queryKey: ['/api/v1/dashboard/layouts'],
    queryFn: async () => dashboardLayoutService.getLayouts(),
  });
  
  
  // Mutação para salvar layout
  const saveMutation = useMutation({
    mutationFn: async (layout: DashboardLayout) => {
      if (layout.id === 'default' || !layout.id) {
        // Criar novo layout
        return dashboardLayoutService.createLayout({
          name: layoutName,
          isDefault: false,
          widgets,
        });
      } else {
        // Atualizar layout existente
        return dashboardLayoutService.updateLayout(layout.id, {
          name: layoutName,
          widgets,
        });
      }
    },
    onSuccess: (data) => {
      setCurrentLayout(data);
      queryClient.invalidateQueries({ queryKey: ['/api/v1/dashboard/layouts'] });
      toast({
        title: 'Layout salvo com sucesso',
        description: `O layout "${data.name}" foi salvo.`,
      });
      setSaveLayoutDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Erro ao salvar layout,', 
        description: error.message || 'Ocorreu um erro ao salvar o layout. Tente novamente.',
        variant: 'destructive',
      });
    },
  });
  
  // Mutação para carregar layout
  const loadMutation = useMutation({
    mutationFn: async (layoutId: string) => {
      return dashboardLayoutService.getLayout(layoutId);
    },
    onSuccess: (data) => {
      setCurrentLayout(data);
      setWidgets(data.widgets);
      setLayoutName(data.name);
      toast({
        title: 'Layout carregado com sucesso',
        description: `O layout "${data.name}" foi carregado.`,
      });
      setLoadLayoutDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Erro ao carregar layout',
        description: error.message || 'Ocorreu um erro ao carregar o layout. Tente novamente.',
        variant: 'destructive',
      });
    },
  });
  

  
  // Callback para adicionar um novo widget
  const handleAddWidget = useCallback(() => {
    if (!selectedWidgetType) return;
    
    const newWidget = dashboardLayoutService.getDefaultWidget(selectedWidgetType as WidgetType);
    
    let maxY = 0;
    
    for (const widget of widgets) {
      const bottom = widget.layout.y + widget.layout.h;
      if (bottom > maxY) {
        maxY = bottom;
      }
    }
    
    newWidget.layout.y = maxY;
    
    setWidgets(prev => [...prev, newWidget]);
    setAddWidgetDialogOpen(false);
    setSelectedWidgetType(null);
    
    toast({
      title: 'Widget adicionado',
      description: `O widget "${newWidget.title}" foi adicionado ao dashboard.`,
    });
  }, [selectedWidgetType, widgets, toast]);
  
  // Callback para duplicar um widget
  const handleDuplicateWidget = useCallback((widgetId: string) => {
    const widgetToDuplicate = widgets.find(w => w.id === widgetId);
    if (!widgetToDuplicate) return;
    
    const newWidget = { ...widgetToDuplicate };
    newWidget.id = `widget-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    newWidget.title = `${widgetToDuplicate.title} (cópia)`;
    
    // Colocar o widget duplicado abaixo do original
    newWidget.layout = {
      ...widgetToDuplicate.layout,
      y: widgetToDuplicate.layout.y + widgetToDuplicate.layout.h,
    };
    
    setWidgets(prev => [...prev, newWidget]);
    
    toast({
      title: 'Widget duplicado',
      description: `O widget "${widgetToDuplicate.title}" foi duplicado.`,
    });
  }, [widgets, toast]);
  
  // Callback para excluir um widget
  const handleDeleteWidget = useCallback((widgetId: string) => {
    setWidgets(prev => prev.filter(w => w.id !== widgetId));
    
    toast({
      title: 'Widget excluído',
      description: 'O widget foi excluído do dashboard.',
    });
  }, [toast]);
  
  // Callback para atualizar o título de um widget
  const handleUpdateWidgetTitle = useCallback((widgetId: string, title: string) => {
    setWidgets(prev => prev.map(w => 
      w.id === widgetId 
        ? { ...w, title } 
        : w
    ));
  }, []);
  
  // Callback para editar a configuração de um widget
  const handleEditWidgetConfig = useCallback((widgetId: string) => {
    const widget = widgets.find(w => w.id === widgetId);
    if (!widget) return;
    
    setSelectedWidgetForConfig(widget);
    setConfigWidgetDialogOpen(true);
  }, [widgets]);
  
  // Callback para atualizar a configuração de um widget
  const handleUpdateWidgetConfig = useCallback((config: Record<string, any>) => {
    if (!selectedWidgetForConfig) return;
    
    setWidgets(prev => prev.map(w => 
      w.id === selectedWidgetForConfig.id 
        ? { 
            ...w, 
            config: {
              ...w.config,
              ...config,
            } 
          } 
        : w
    ));
    
    setConfigWidgetDialogOpen(false);
    setSelectedWidgetForConfig(null);
    
    toast({
      title: 'Configuração atualizada',
      description: 'As configurações do widget foram atualizadas.',
    });
  }, [selectedWidgetForConfig, toast]);
  
  // Callback para lidar com mudanças no layout da grade
  const handleLayoutChange = useCallback((layout: any[]) => {
    setWidgets(prev => 
      prev.map(widget => {
        const layoutItem = layout.find(item => item.i === widget.id);
        if (layoutItem) {
          return {
            ...widget,
            layout: {
              ...widget.layout,
              x: layoutItem.x,
              y: layoutItem.y,
              w: layoutItem.w,
              h: layoutItem.h,
            },
          };
        }
        return widget;
      })
    );
  }, []);
  
  // Converter widgets para o formato exigido pelo GridLayout
  const gridItems = useMemo(() => {
    return widgets.map(widget => ({
      i: widget.id,
      x: widget.layout.x,
      y: widget.layout.y,
      w: widget.layout.w,
      h: widget.layout.h,
      minW: widget.layout.minW || 2,
      minH: widget.layout.minH || 2,
      maxW: widget.layout.maxW,
      maxH: widget.layout.maxH,
    }));
  }, [widgets]);
  
  // Renderizar componentes de configuração específicos para cada tipo de widget
  const renderWidgetConfigContent = () => {
    if (!selectedWidgetForConfig) return null;
    
    const widget = selectedWidgetForConfig;
    
    switch (widget.type) {
      case WidgetType.CONSUMPTION_CHART:
      case WidgetType.GENERATION_CHART:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Período</label>
              <Select
                value={widget.config.timeRange || 'month'}
                onValueChange={(value) => 
                  handleUpdateWidgetConfig({ timeRange: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Hoje</SelectItem>
                  <SelectItem value="week">Esta Semana</SelectItem>
                  <SelectItem value="month">Este Mês</SelectItem>
                  <SelectItem value="year">Este Ano</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Esquema de Cores</label>
              <div className="grid grid-cols-4 gap-2">
                {['blue', 'green', 'purple', 'orange'].map(color => (
                  <div
                    key={color}
                    className={`h-8 rounded-md cursor-pointer border-2 ${
                      widget.config.colorScheme === color ? 'border-primary' : 'border-transparent'
                    }`}
                    style={{ 
                      backgroundColor: 
                        color === 'blue' ? '#3b82f6' : 
                        color === 'green' ? '#10b981' : 
                        color === 'purple' ? '#8b5cf6' : 
                        '#f97316' 
                    }}
                    onClick={() => handleUpdateWidgetConfig({ colorScheme: color })}
                  />
                ))}
              </div>
            </div>
          </div>
        );
      
      case WidgetType.ENERGY_BALANCE:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Período</label>
              <Select
                value={widget.config.timeRange || 'month'}
                onValueChange={(value) => 
                  handleUpdateWidgetConfig({ timeRange: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Este Mês</SelectItem>
                  <SelectItem value="quarter">Este Trimestre</SelectItem>
                  <SelectItem value="year">Este Ano</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showFinancialData"
                checked={widget.config.showFinancialData !== false}
                onChange={(e) => 
                  handleUpdateWidgetConfig({ showFinancialData: e.target.checked })
                }
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="showFinancialData" className="text-sm">
                Exibir dados financeiros
              </label>
            </div>
          </div>
        );
      
      case WidgetType.PREDICTION_CHART:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Período de Previsão</label>
              <Select
                value={widget.config.predictionRange || 'week'}
                onValueChange={(value) => 
                  handleUpdateWidgetConfig({ predictionRange: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Próximas 24h</SelectItem>
                  <SelectItem value="week">Próximos 7 dias</SelectItem>
                  <SelectItem value="month">Próximo mês</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Tipo de Dados</label>
              <Select
                value={widget.config.predictionType || 'both'}
                onValueChange={(value) => 
                  handleUpdateWidgetConfig({ predictionType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consumption">Consumo</SelectItem>
                  <SelectItem value="generation">Geração</SelectItem>
                  <SelectItem value="both">Ambos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showConfidenceInterval"
                checked={widget.config.showConfidenceInterval !== false}
                onChange={(e) => 
                  handleUpdateWidgetConfig({ showConfidenceInterval: e.target.checked })
                }
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="showConfidenceInterval" className="text-sm">
                Exibir intervalo de confiança
              </label>
            </div>
          </div>
        );
      
      case WidgetType.ANOMALY_DETECTION:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Período</label>
              <Select
                value={widget.config.timeRange || 'month'}
                onValueChange={(value) => 
                  handleUpdateWidgetConfig({ timeRange: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Esta Semana</SelectItem>
                  <SelectItem value="month">Este Mês</SelectItem>
                  <SelectItem value="quarter">Este Trimestre</SelectItem>
                  <SelectItem value="year">Este Ano</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Limiar de Confiança</label>
              <Select
                value={String(widget.config.threshold || 0.8)}
                onValueChange={(value) => 
                  handleUpdateWidgetConfig({ threshold: parseFloat(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o limiar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.7">70% (mais sensível)</SelectItem>
                  <SelectItem value="0.8">80% (recomendado)</SelectItem>
                  <SelectItem value="0.9">90% (mais preciso)</SelectItem>
                  <SelectItem value="0.95">95% (alta precisão)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showResolved"
                checked={!!widget.config.showResolved}
                onChange={(e) => 
                  handleUpdateWidgetConfig({ showResolved: e.target.checked })
                }
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="showResolved" className="text-sm">
                Exibir anomalias resolvidas
              </label>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="py-4 text-center text-gray-500">
            <p>Configurações não disponíveis para este tipo de widget.</p>
          </div>
        );
    }
  };
  
  // Renderização dos widgets no grid
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-bold">Dashboard Personalizado</h2>
          {currentLayout && currentLayout.id !== 'default' && (
            <Badge variant="outline" className="text-xs">
              {currentLayout.name}
            </Badge>
          )}
        </div>
        
        <div className="flex space-x-2">
          <Dialog open={addWidgetDialogOpen} onOpenChange={setAddWidgetDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Widget
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Widget</DialogTitle>
                <DialogDescription>
                  Selecione o tipo de widget que deseja adicionar ao seu dashboard.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-2 gap-3 py-4">
                {widgetTypeOptions.map((option) => (
                  <Card 
                    key={option.value} 
                    className={`cursor-pointer transition-all hover:border-primary ${
                      selectedWidgetType === option.value ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => setSelectedWidgetType(option.value as WidgetType)}
                  >
                    <CardContent className="p-4 flex items-center space-x-3">
                      <div className="text-2xl">{option.icon}</div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{option.label}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setAddWidgetDialogOpen(false);
                    setSelectedWidgetType(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleAddWidget}
                  disabled={!selectedWidgetType}
                >
                  Adicionar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Dialog open={saveLayoutDialogOpen} onOpenChange={setSaveLayoutDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Salvar Layout</DialogTitle>
                <DialogDescription>
                  Salve seu layout personalizado para uso futuro.
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nome do Layout</label>
                  <input
                    type="text"
                    value={layoutName}
                    onChange={(e) => setLayoutName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Meu Dashboard"
                  />
                </div>
                
                {currentLayout && currentLayout.id !== 'default' && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="setAsDefault"
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <label htmlFor="setAsDefault" className="text-sm">
                      Definir como layout padrão
                    </label>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setSaveLayoutDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={() => saveMutation.mutate(currentLayout!)}
                  disabled={!layoutName.trim() || saveMutation.isPending}
                >
                  {saveMutation.isPending ? (
                    <>
                      <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Dialog open={loadLayoutDialogOpen} onOpenChange={setLoadLayoutDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <LayoutTemplate className="h-4 w-4 mr-2" />
                Carregar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Carregar Layout</DialogTitle>
                <DialogDescription>
                  Selecione um layout salvo para carregar.
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4 space-y-4">
                {isLoadingLayouts ? (
                  <div className="text-center py-4">
                    <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">Carregando layouts...</p>
                  </div>
                ) : layouts && layouts.length > 0 ? (
                  <div className="space-y-3">
                    {layouts.map((layout) => (
                      <Card 
                        key={layout.id} 
                        className={`cursor-pointer transition-all hover:border-primary ${
                          selectedLayoutId === layout.id ? 'border-primary bg-primary/5' : ''
                        }`}
                        onClick={() => setSelectedLayoutId(layout.id)}
                      >
                        <CardContent className="p-4 flex items-center justify-between">
                          <div>
                            <p className="font-medium">{layout.name}</p>
                            <p className="text-xs text-gray-500">
                              Atualizado em {new Date(layout.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                          {layout.isDefault && (
                            <Badge variant="secondary">Padrão</Badge>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500">Nenhum layout salvo encontrado.</p>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setLoadLayoutDialogOpen(false);
                    setSelectedLayoutId(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={() => selectedLayoutId && loadMutation.mutate(selectedLayoutId)}
                  disabled={!selectedLayoutId || loadMutation.isPending}
                >
                  {loadMutation.isPending ? (
                    <>
                      <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                      Carregando...
                    </>
                  ) : (
                    <>
                      <FileCheck className="h-4 w-4 mr-2" />
                      Carregar
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Grid de widgets */}
      <div className="bg-gray-50 rounded-lg p-4 min-h-[600px]">
        {widgets.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-12">
            <Grid className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-500">Nenhum widget adicionado</h3>
            <p className="text-gray-400 mb-6">Adicione widgets para começar a personalizar seu dashboard</p>
            <Button 
              onClick={() => setAddWidgetDialogOpen(true)}
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Widget
            </Button>
          </div>
        ) : (
          <ResponsiveGridLayout
            className="layout"
            layouts={{ lg: gridItems }}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: GRID_COLS, md: GRID_COLS, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={GRID_ROW_HEIGHT}
            margin={GRID_MARGIN}
            containerPadding={[0, 0]}
            onLayoutChange={handleLayoutChange}
            isDraggable={true}
            isResizable={true}
            draggableHandle=".card-header"
          >
            {widgets.map((widget) => (
              <div key={widget.id}>
                <WidgetContainer
                  widget={widget}
                  onDelete={handleDeleteWidget}
                  onDuplicate={handleDuplicateWidget}
                  onUpdateTitle={handleUpdateWidgetTitle}
                  onEditConfig={handleEditWidgetConfig}
                  gridColumnWidth={100}
                />
              </div>
            ))}
          </ResponsiveGridLayout>
        )}
      </div>
      
      {/* Diálogo de configuração de widget */}
      <Dialog open={configWidgetDialogOpen} onOpenChange={setConfigWidgetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurar Widget</DialogTitle>
            <DialogDescription>
              Personalize as configurações do widget "{selectedWidgetForConfig?.title}".
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {renderWidgetConfigContent()}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setConfigWidgetDialogOpen(false);
                setSelectedWidgetForConfig(null);
              }}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomizableDashboard;