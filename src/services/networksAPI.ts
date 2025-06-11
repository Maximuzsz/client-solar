import { apiRequest } from '@/lib/api';
import { Network } from '@/types';

export const networksAPI = {
  /**
   * Busca todas as redes do usuário
   */
  getAll: async () => {
    return apiRequest('GET', '/networks');
  },
  
  /**
   * Busca uma rede específica pelo ID
   */
  getById: async (id: string | number) => {
    return apiRequest<Network>('GET', `/networks/${id}`);
  },
  
  /**
   * Cria uma nova rede
   */
  create: async (data: Partial<Network>) => {
    return apiRequest('POST', '/networks', data);
  },
  
  /**
   * Atualiza uma rede existente
   */
  update: async (id: string | number, data: Partial<Network>) => {
    return apiRequest('PATCH', `/networks/${id}`, data);
  },
  
  /**
   * Remove uma rede
   */
  delete: async (id: string | number) => {
    return apiRequest('DELETE', `/networks/${id}`);
  }
};