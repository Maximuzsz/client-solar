import axios from 'axios';

const api = axios.create({
  baseURL: 'http://api.solarshare.com.br/api/v1',
});

// Interceptador para incluir o token de autenticação em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// API para autenticação
export const authAPI = {
  login: (data) => api.post('/auth/login', data).then(response => response.data),
  register: (data) => api.post('/auth/register', data).then(response => response.data),
  getProfile: () => api.get('/auth/profile').then(response => response.data),
  getProfileAlt: () => api.get('/auth/me').then(response => response.data),
};

// API para gerenciamento de redes
export const networksAPI = {
  create: (data: any) => api.post('/networks', data).then(response => response.data),
  getAll: () => api.get('/networks?includeUnitCount=true').then(response => response.data),
  getById: (id: number) => {
    console.log(`Fazendo requisição GET para /networks/${id}?includeUnitCount=true`);
    return api.get(`/networks/${id}?includeUnitCount=true`)
      .then(response => {
        // Log de resposta da API removido por segurança
        return response.data;
      })
      .catch(error => {
        console.error('Erro na API getById:', error);
        throw error;
      });
  },
  update: (id: number, data: any) => {
    // Dados de atualização removidos por segurança
    return api.patch(`/networks/${id}`, data)
      .then(response => {
        // Log de resposta de update removido por segurança
        return response.data;
      })
      .catch(error => {
        console.error('Erro na API update:', error);
        throw error;
      });
  },
  delete: (id: number) => api.delete(`/networks/${id}`).then(response => response.data),
};

// API para gerenciamento de unidades
export const unitsAPI = {
  create: (data) => api.post('/units', data).then(response => response.data),
  getAll: () => api.get('/units').then(response => response.data),
  getByNetwork: (networkId) => api.get(`/units/network/${networkId}`).then(response => response.data),
  getById: (id) => api.get(`/units/${id}`).then(response => response.data),
  update: (id, data) => api.patch(`/units/${id}`, data).then(response => response.data),
  delete: (id) => api.delete(`/units/${id}`).then(response => response.data),
  linkToNetwork: (id, networkId, keepCurrentNetwork = false) => 
    api.post(`/units/${id}/link-to-network`, { 
      networkId, 
      keepCurrentNetwork 
    }).then(response => response.data),
  bulkLinkToNetwork: (unitIds, networkId, keepCurrentNetworks = false) => 
    api.post('/units/bulk-link-to-network', { 
      unitIds, 
      networkId, 
      keepCurrentNetworks 
    }).then(response => response.data),
};

// API para gerenciamento de leituras
export const readingsAPI = {
  create: (data) => api.post('/readings', data).then(response => response.data),
  getAll: () => api.get('/readings').then(response => response.data),
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
    
    return api.get(url).then(response => response.data);
  },
  getById: (id) => api.get(`/readings/${id}`).then(response => response.data),
};

// API para relatórios
export const reportsAPI = {
  create: (data) => api.post('/reports', data).then(response => response.data),
  getAll: () => api.get('/reports').then(response => response.data),
  getById: (id) => api.get(`/reports/${id}`).then(response => response.data),
  createPayment: (data) => api.post('/reports/payment', data).then(response => response.data),
};

// API para dashboard
export const dashboardAPI = {
  getData: () => api.get('/dashboard').then(response => response.data),
  getMonthlyReadings: () => api.get('/dashboard/monthly-readings').then(response => response.data),
};

// API para concessionárias
export const concessionairesAPI = {
  getAll: () => api.get('/concessionaires').then(response => response.data),
  getById: (id) => api.get(`/concessionaires/${id}`).then(response => response.data),
  getActiveTariffs: (id) => api.get(`/concessionaires/${id}/active-tariffs`).then(response => response.data),
  getAllTariffs: () => api.get('/concessionaires/tariffs').then(response => response.data),
};

export default api;