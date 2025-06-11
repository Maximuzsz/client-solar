import api from './api';

export interface TariffData {
  Distribuidora: string;
  UF: string;
  Posição: string;
  Tarifa: string;
}

export interface Tariff {
  id: number;
  type: string;
  value: number;
  startDate: string;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  concessionaire: {
    id: number;
    name: string;
    region: string;
  };
}

const tariffsAPI = {
  // Obter dados das tarifas via webscraping (público)
  getWebScrapingTariffs: async (): Promise<TariffData[]> => {
    const response = await api.get('/concessionaires/webscraping/tariffs/public');
    return response.data;
  },

  // Salvar dados das tarifas obtidos via webscraping (requer autenticação)
  saveWebScrapingTariffs: async (): Promise<any> => {
    const response = await api.post('/concessionaires/webscraping/tariffs/save');
    return response.data;
  },

  // Obter todas as tarifas
  getAllTariffs: async (): Promise<Tariff[]> => {
    const response = await api.get('/concessionaires/tariffs/all');
    return response.data; 
  },

  // Obter tarifa mais recente por nome da concessionária e tipo
  getLatestTariff: async (concessionaireName: string, type: string): Promise<Tariff> => {
    const response = await api.get(`/concessionaires/tariff/latest?name=${encodeURIComponent(concessionaireName)}&type=${type}`);
    return response.data;
  }
};

export default tariffsAPI;