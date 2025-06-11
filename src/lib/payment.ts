import { apiRequest } from './queryClient';

// Interfaces
export interface Feature {
  name: string;
  limit: string;
}

export interface PlanType {
  id: number;
  name: string;
  description: string;
  price: number;
  interval: 'monthly' | 'annual' | 'both';
  status: 'Active' | 'Inactive' | 'Deprecated';
  features: string[] | Feature[];
}

export interface CurrentSubscription {
  id: string;
  active: boolean;
  plan: PlanType;
  nextBillingDate: string;
  features: Feature[];
}

export interface Payment {
  id: string;
  planName: string;
  date: string;
  value: number;
  status: 'Pago' | 'Pendente' | 'Falhou';
  invoiceId?: string;
}

export type PaymentHistory = Payment[];

/**
 * Cria um intent de pagamento no Stripe
 * @param planId ID do plano a ser assinado
 * @param amount Valor do pagamento em centavos
 * @returns Objeto contendo o clientSecret para o intent de pagamento
 */
export const createPaymentIntent = async (planId: number, amount: number) => {
  const response = await apiRequest('POST', '/api/v1/payment/create-intent', {
    planId,
    amount,
  });
  
  // O apiRequest já retorna os dados em formato JSON
  return response;
};

/**
 * Obtém a lista de planos disponíveis
 * @returns Lista de planos disponíveis para assinatura
 */
export const getAvailablePlans = async () => {
  return await apiRequest('GET', '/payment/plans');
};

/**
 * Processa resultado do pagamento
 * @returns Objeto com status da transação
 */
export const processPaymentResult = async () => {
  // Recupera os parâmetros da URL
  const urlParams = new URLSearchParams(window.location.search);
  const paymentIntentId = urlParams.get('payment_intent');
  const paymentIntentClientSecret = urlParams.get('payment_intent_client_secret');
  const redirectStatus = urlParams.get('redirect_status');

  // Retorna o resultado do pagamento
  return {
    paymentIntentId,
    paymentIntentClientSecret,
    status: redirectStatus,
    success: redirectStatus === 'succeeded',
  };
};

/**
 * Obtém informações da assinatura atual do usuário
 * @returns Objeto com dados da assinatura atual
 */
export const getCurrentSubscription = async (): Promise<CurrentSubscription> => {
  try {
    // O apiRequest já retorna os dados em formato JSON
    return await apiRequest('GET', '/api/v1/payment/current-subscription');
  } catch (error) {
    console.error('Erro ao obter assinatura atual:', error);
    // Retorna objeto vazio em caso de erro para evitar quebra da UI
    return {
      id: "",
      active: false,
      plan: {
        id: 0,
        name: "Nenhum plano",
        description: "Nenhum plano ativo",
        price: 0,
        interval: "monthly",
        status: "Inactive",
        features: []
      },
      nextBillingDate: new Date().toISOString(),
      features: []
    };
  }
};

/**
 * Obtém histórico de pagamentos do usuário
 * @returns Array com histórico de pagamentos
 */
export const getPaymentHistory = async (): Promise<PaymentHistory> => {
  try {
    // O apiRequest já retorna os dados em formato JSON
    return await apiRequest('GET', '/api/v1/payment/payment-history');
  } catch (error) {
    console.error('Erro ao obter histórico de pagamentos:', error);
    return [];
  }
};