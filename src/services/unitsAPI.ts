import { apiRequest } from '@/lib/api';
import { Unit } from '@/types';

export const unitsAPI = {
  /**
   * Busca todas as unidades
   */
  getAll: async () => {
    return apiRequest<Unit[]>('GET', '/units');
  },
  
  /**
   * Busca uma unidade específica pelo ID
   */
  getById: async (id: string | number) => {
    return apiRequest<Unit>('GET', `/units/${id}`);
  },
  
  /**
   * Busca unidades por rede
   */
  getByNetwork: async (networkId: string | number) => {
    return apiRequest<Unit[]>('GET', `/units/network/${networkId}`);
  },
  
  /**
   * Cria uma nova unidade
   */
  create: async (data: Partial<Unit>) => {
    return apiRequest<Unit>('POST', '/units', data);
  },
  
  /**
   * Atualiza uma unidade existente
   */
  update: async (id: string | number, data: Partial<Unit>) => {
    return apiRequest<Unit>('PATCH', `/units/${id}`, data);
  },
  
  /**
   * Remove uma unidade
   */
  delete: async (id: string | number) => {
    return apiRequest('DELETE', `/units/${id}`);
  }
};