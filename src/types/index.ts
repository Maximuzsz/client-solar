// Definições de tipos para a aplicação

// Tipo de usuário
export interface User {
  id: number;
  username: string;
  email: string;
  name?: string;
  role: 'Admin' | 'NetworkOwner' | 'Consumer' | 'Generator';
  createdAt?: string;
  updatedAt?: string;
}

// Tipos de planos
export interface PlanFeature {
  id: number;
  name: string;
  description: string;
  planId: number;
}

export interface Plan {
  id: number;
  name: string;
  description: string;
  price: number;
  status: 'Active' | 'Inactive' | 'Deprecated';
  features?: PlanFeature[];
  createdAt?: string;
  updatedAt?: string;
}

// Tipos de redes
export interface Network {
  id: number;
  name: string;
  description: string;
  ownerId: number;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Tipos de distribuidoras
export interface Concessionaire {
  id: number;
  name: string;
  region: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Tariff {
  id: number;
  concessionaireId: number;
  value: number;
  type: 'Residential' | 'Commercial' | 'Industrial';
  startDate: string;
  endDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Tipos de unidades
export interface Unit {
  id: number;
  name: string;
  type: 'Consumer' | 'Generator';
  networkId: number;
  userId: number;
  concessionaireId?: number;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  installationDate?: string;
  capacity?: number;
  documentType?: 'CPF' | 'CNPJ';
  documentNumber?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Tipos de leituras
export interface Reading {
  id: number;
  unitId: number;
  value: number;
  readingAt: string; // Data da leitura
  createdAt?: string;
  updatedAt?: string;
}

// Tipos para dashboard
export interface DashboardData {
  totalConsumption: number;
  consumptionChange: number;
  totalGeneration: number;
  generationChange: number;
  energyBalance: number;
  estimatedSavings: number;
  co2Saved: number;
  treesEquivalent: number;
  recentReadings: Array<{
    unit: string;
    value: number;
    date: string;
    type: 'Consumer' | 'Generator';
  }>;
  monthlyProgress: Array<{
    month: string;
    consumption: number;
    generation: number;
  }>;
}

// Tipos de relatórios
export interface Report {
  id: number;
  title: string;
  content: string;
  networkId: number;
  userId: number;
  createdAt?: string;
  updatedAt?: string;
}

// Tipos de transações
export interface Transaction {
  id: number;
  amount: number;
  status: 'Pending' | 'Completed' | 'Failed' | 'Cancelled';
  unitId: number;
  userId: number;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Tipos para erros da API
export interface ApiError {
  message: string;
  statusCode?: number;
  error?: string;
}