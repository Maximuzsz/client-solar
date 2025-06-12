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

// Tipos para os dados das APIs
interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
}

interface UnitData {
  // Defina os campos da unidade conforme sua API
  [key: string]: any;
}

interface ReadingData {
  // Defina os campos da leitura conforme sua API
  [key: string]: any;
}

interface ReportData {
  // Defina os campos do relatório conforme sua API
  [key: string]: any;
}

interface PaymentData {
  // Defina os campos do pagamento conforme sua API
  [key: string]: any;
}

// API para autenticação
export const authAPI = {
  login: (data: LoginData) => api.post('/auth/login', data).then(response => response.data),
  register: (data: RegisterData) => api.post('/auth/register', data).then(response => response.data),
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
        return response.data;
      })
      .catch(error => {
        console.error('Erro na API getById:', error);
        throw error;
      });
  },
  update: (id: number, data: any) => {
    return api.patch(`/networks/${id}`, data)
      .then(response => {
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
  create: (data: UnitData) => api.post('/units', data).then(response => response.data),
  getAll: () => api.get('/units').then(response => response.data),
  getByNetwork: (networkId: number) => api.get(`/units/network/${networkId}`).then(response => response.data),
  getById: (id: number) => api.get(`/units/${id}`).then(response => response.data),
  update: (id: number, data: UnitData) => api.patch(`/units/${id}`, data).then(response => response.data),
  delete: (id: number) => api.delete(`/units/${id}`).then(response => response.data),
  linkToNetwork: (id: number, networkId: number, keepCurrentNetwork = false) => 
    api.post(`/units/${id}/link-to-network`, { 
      networkId, 
      keepCurrentNetwork 
    }).then(response => response.data),
  bulkLinkToNetwork: (unitIds: number[], networkId: number, keepCurrentNetworks = false) => 
    api.post('/units/bulk-link-to-network', { 
      unitIds, 
      networkId, 
      keepCurrentNetworks 
    }).then(response => response.data),
};

// API para gerenciamento de leituras
export const readingsAPI = {
  create: (data: ReadingData) => api.post('/readings', data).then(response => response.data),
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
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    return api.get(url).then(response => response.data);
  },
  getById: (id: number) => api.get(`/readings/${id}`).then(response => response.data),
};

// API para relatórios
export const reportsAPI = {
  create: (data: ReportData) => api.post('/reports', data).then(response => response.data),
  getAll: () => api.get('/reports').then(response => response.data),
  getById: (id: number) => api.get(`/reports/${id}`).then(response => response.data),
  createPayment: (data: PaymentData) => api.post('/reports/payment', data).then(response => response.data),
};

// API para dashboard
export const dashboardAPI = {
  getData: () => api.get('/dashboard').then(response => response.data),
  getMonthlyReadings: () => api.get('/dashboard/monthly-readings').then(response => response.data),
};

// API para concessionárias
export const concessionairesAPI = {
  getAll: () => api.get('/concessionaires').then(response => response.data),
  getById: (id: number) => api.get(`/concessionaires/${id}`).then(response => response.data),
  getActiveTariffs: (id: number) => api.get(`/concessionaires/${id}/active-tariffs`).then(response => response.data),
  getAllTariffs: () => api.get('/concessionaires/tariffs').then(response => response.data),
};

export default api;