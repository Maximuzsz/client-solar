import { apiRequest } from '@/lib/queryClient';

// Tipos de widgets disponíveis
export enum WidgetType {
  CONSUMPTION_CHART = 'consumption_chart',
  GENERATION_CHART = 'generation_chart',
  ENERGY_BALANCE = 'energy_balance',
  FINANCIAL_SUMMARY = 'financial_summary',
  READING_HISTORY = 'reading_history',
  UNITS_SUMMARY = 'units_summary',
  PREDICTION_CHART = 'prediction_chart',
  ANOMALY_DETECTION = 'anomaly_detection',
}

// Interface para a configuração de um widget
export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  description?: string;
  config: {
    [key: string]: any;
  };
  layout: {
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;
    minH?: number;
    maxW?: number;
    maxH?: number;
  };
}

// Interface para um layout completo do dashboard
export interface DashboardLayout {
  id: string;
  name: string;
  isDefault: boolean;
  userId: string;
  widgets: WidgetConfig[];
  createdAt: string;
  updatedAt: string;
}

// Serviço para operações com layouts do dashboard
export const dashboardLayoutService = {
  // Obter todos os layouts do usuário
  getLayouts: async (): Promise<DashboardLayout[]> => {
    try {
      const response = await apiRequest('GET', '/api/v1/dashboard/layouts/user');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar layouts do dashboard:', error);
      throw error;
    }
  },
  
  // Obter layout específico
  getLayout: async (layoutId: string): Promise<DashboardLayout> => {
    try {
      const response = await apiRequest('GET', `/api/v1/dashboard/layouts/detail/${layoutId}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar layout ${layoutId}:`, error);
      throw error;
    }
  },
  
  // Obter layout padrão do usuário
  getDefaultLayout: async (): Promise<DashboardLayout> => {
    try {
      const response = await apiRequest('GET', '/api/v1/dashboard/layouts/default');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar layout padrão:', error);
      // Se não existir um layout padrão, retornar um novo
      return dashboardLayoutService.getDefaultWidgets();
    }
  },
  
  // Criar um novo layout
  createLayout: async (layout: Omit<DashboardLayout, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<DashboardLayout> => {
    try {
      const response = await apiRequest('POST', '/api/v1/dashboard/layouts/create', layout);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar layout:', error);
      throw error;
    }
  },
  
  // Atualizar um layout existente
  updateLayout: async (layoutId: string, layout: Partial<DashboardLayout>): Promise<DashboardLayout> => {
    try {
      const response = await apiRequest('PUT', `/api/v1/dashboard/layouts/update/${layoutId}`, layout);
      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar layout ${layoutId}:`, error);
      throw error;
    }
  },
  
  // Excluir um layout
  deleteLayout: async (layoutId: string): Promise<void> => {
    try {
      await apiRequest('DELETE', `/api/v1/dashboard/layouts/delete/${layoutId}`);
    } catch (error) {
      console.error(`Erro ao excluir layout ${layoutId}:`, error);
      throw error;
    }
  },
  
  // Definir um layout como padrão
  setDefaultLayout: async (layoutId: string): Promise<DashboardLayout> => {
    try {
      const response = await apiRequest('POST', `/api/v1/dashboard/layouts/set-default/${layoutId}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao definir layout ${layoutId} como padrão:`, error);
      throw error;
    }
  },
  
  // Obter um layout padrão preenchido com widgets padrão
  getDefaultWidgets: (): DashboardLayout => {
    const now = new Date().toISOString();
    return {
      id: 'default',
      name: 'Dashboard Padrão',
      isDefault: true,
      userId: '',
      widgets: [
        {
          id: 'widget-consumption-chart',
          type: WidgetType.CONSUMPTION_CHART,
          title: 'Consumo de Energia',
          description: 'Gráfico de consumo de energia ao longo do tempo',
          config: {
            timeRange: 'month',
            showLabels: true,
            colorScheme: 'blue',
          },
          layout: {
            x: 0,
            y: 0,
            w: 6,
            h: 4,
            minW: 3,
            minH: 3,
          },
        },
        {
          id: 'widget-generation-chart',
          type: WidgetType.GENERATION_CHART,
          title: 'Geração de Energia',
          description: 'Gráfico de geração de energia ao longo do tempo',
          config: {
            timeRange: 'month',
            showLabels: true,
            colorScheme: 'green',
          },
          layout: {
            x: 6,
            y: 0,
            w: 6,
            h: 4,
            minW: 3,
            minH: 3,
          },
        },
        {
          id: 'widget-energy-balance',
          type: WidgetType.ENERGY_BALANCE,
          title: 'Balanço Energético',
          description: 'Resumo do balanço entre consumo e geração',
          config: {
            timeRange: 'month',
            showFinancialData: true,
          },
          layout: {
            x: 0,
            y: 4,
            w: 4,
            h: 4,
            minW: 3,
            minH: 3,
          },
        },
        {
          id: 'widget-financial-summary',
          type: WidgetType.FINANCIAL_SUMMARY,
          title: 'Resumo Financeiro',
          description: 'Resumo financeiro com economias e custos',
          config: {
            timeRange: 'month',
            showChart: true,
          },
          layout: {
            x: 4,
            y: 4,
            w: 4,
            h: 4,
            minW: 3,
            minH: 3,
          },
        },
        {
          id: 'widget-reading-history',
          type: WidgetType.READING_HISTORY,
          title: 'Histórico de Leituras',
          description: 'Lista das leituras recentes',
          config: {
            limit: 5,
            showDownload: true,
          },
          layout: {
            x: 8,
            y: 4,
            w: 4,
            h: 4,
            minW: 3,
            minH: 3,
          },
        },
        {
          id: 'widget-prediction-chart',
          type: WidgetType.PREDICTION_CHART,
          title: 'Previsão de Energia',
          description: 'Previsão de consumo e geração para os próximos períodos',
          config: {
            predictionRange: 'week',
            predictionType: 'both',
            showConfidenceInterval: true,
          },
          layout: {
            x: 0,
            y: 8,
            w: 6,
            h: 4,
            minW: 4,
            minH: 3,
          },
        },
        {
          id: 'widget-anomaly-detection',
          type: WidgetType.ANOMALY_DETECTION,
          title: 'Detecção de Anomalias',
          description: 'Identificação de anomalias no consumo ou geração',
          config: {
            timeRange: 'month',
            threshold: 0.8,
          },
          layout: {
            x: 6,
            y: 8,
            w: 6,
            h: 4,
            minW: 4,
            minH: 3,
          },
        },
      ],
      createdAt: now,
      updatedAt: now,
    };
  },
  
  // Gerar um novo widget com configuração padrão
  getDefaultWidget: (type: WidgetType): WidgetConfig => {
    const widgetId = `widget-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    switch (type) {
      case WidgetType.CONSUMPTION_CHART:
        return {
          id: widgetId,
          type,
          title: 'Consumo de Energia',
          description: 'Gráfico de consumo de energia ao longo do tempo',
          config: {
            timeRange: 'month',
            showLabels: true,
            colorScheme: 'blue',
          },
          layout: {
            x: 0,
            y: 0,
            w: 6,
            h: 4,
            minW: 3,
            minH: 3,
          },
        };
        
      case WidgetType.GENERATION_CHART:
        return {
          id: widgetId,
          type,
          title: 'Geração de Energia',
          description: 'Gráfico de geração de energia ao longo do tempo',
          config: {
            timeRange: 'month',
            showLabels: true,
            colorScheme: 'green',
          },
          layout: {
            x: 0,
            y: 0,
            w: 6,
            h: 4,
            minW: 3,
            minH: 3,
          },
        };
        
      case WidgetType.ENERGY_BALANCE:
        return {
          id: widgetId,
          type,
          title: 'Balanço Energético',
          description: 'Resumo do balanço entre consumo e geração',
          config: {
            timeRange: 'month',
            showFinancialData: true,
          },
          layout: {
            x: 0,
            y: 0,
            w: 4,
            h: 4,
            minW: 3,
            minH: 3,
          },
        };
        
      case WidgetType.FINANCIAL_SUMMARY:
        return {
          id: widgetId,
          type,
          title: 'Resumo Financeiro',
          description: 'Resumo financeiro com economias e custos',
          config: {
            timeRange: 'month',
            showChart: true,
          },
          layout: {
            x: 0,
            y: 0,
            w: 4,
            h: 4,
            minW: 3,
            minH: 3,
          },
        };
        
      case WidgetType.READING_HISTORY:
        return {
          id: widgetId,
          type,
          title: 'Histórico de Leituras',
          description: 'Lista das leituras recentes',
          config: {
            limit: 5,
            showDownload: true,
          },
          layout: {
            x: 0,
            y: 0,
            w: 4,
            h: 4,
            minW: 3,
            minH: 3,
          },
        };
        
      case WidgetType.UNITS_SUMMARY:
        return {
          id: widgetId,
          type,
          title: 'Resumo de Unidades',
          description: 'Resumo de unidades consumidoras e geradoras',
          config: {
            viewMode: 'all',
            showFilters: true,
            showChart: true,
          },
          layout: {
            x: 0,
            y: 0,
            w: 4,
            h: 4,
            minW: 3,
            minH: 3,
          },
        };
        
      case WidgetType.PREDICTION_CHART:
        return {
          id: widgetId,
          type,
          title: 'Previsão de Energia',
          description: 'Previsão de consumo e geração para os próximos períodos',
          config: {
            predictionRange: 'week',
            predictionType: 'both',
            showConfidenceInterval: true,
            predictionMethod: 'ensemble',
          },
          layout: {
            x: 0,
            y: 0,
            w: 6,
            h: 4,
            minW: 4,
            minH: 3,
          },
        };
        
      case WidgetType.ANOMALY_DETECTION:
        return {
          id: widgetId,
          type,
          title: 'Detecção de Anomalias',
          description: 'Identificação de anomalias no consumo ou geração',
          config: {
            timeRange: 'month',
            threshold: 0.8,
            showResolved: false,
          },
          layout: {
            x: 0,
            y: 0,
            w: 6,
            h: 4,
            minW: 4,
            minH: 3,
          },
        };
        
      default:
        return {
          id: widgetId,
          type: WidgetType.CONSUMPTION_CHART,
          title: 'Novo Widget',
          description: 'Widget adicionado',
          config: {},
          layout: {
            x: 0,
            y: 0,
            w: 4,
            h: 3,
            minW: 2,
            minH: 2,
          },
        };
    }
  },
};

export default dashboardLayoutService;