import { apiRequest } from '../lib/api';

export const readingsAPI = {
  // Buscar todas as leituras (admin)
  getAll: () => {
    return apiRequest('GET', '/readings');
  },
  
  // Buscar leituras de uma unidade específica
  getByUnit: (unitId: number, startDate?: string, endDate?: string) => {
    let url = `/readings/unit/${unitId}`;
    const params = new URLSearchParams();
    
    if (startDate) {
      params.append('startDate', startDate);
    }
    
    if (endDate) {
      params.append('endDate', endDate);
    }
    
    // Adiciona os parâmetros à URL se existirem
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    return apiRequest('GET', url);
  },
  
  // Buscar uma leitura específica
  getById: (id: number) => {
    return apiRequest('GET', `/readings/${id}`);
  },
  
  // Criar uma nova leitura
  create: (data: any) => {
    return apiRequest('POST', '/readings', data);
  }
};