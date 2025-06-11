import { apiRequest } from './api';

/**
 * Interface para a resposta da verificação de limites de exportação
 */
export interface ExportLimitResponse {
  allowed: boolean;
  limit: number;
  used: number;
  remaining: number;
  canPayExtra: boolean;
  extraCost: number;
  message: string;
}

/**
 * Verifica se o usuário pode exportar um relatório com base nos limites do seu plano
 * 
 * @param exportType Tipo de exportação ('ExportPDF' ou 'ExportCSV')
 * @returns Informações sobre o limite de exportação
 */
export async function checkExportLimit(exportType: 'ExportPDF' | 'ExportCSV'): Promise<ExportLimitResponse> {
  try {
    const response = await apiRequest('POST', '/reports/check-export-limit', { reportType: exportType });
    return response;
  } catch (error) {
    console.error('Erro ao verificar limite de exportação:', error);
    // Retornar resposta padrão em caso de erro
    return {
      allowed: false,
      limit: 0,
      used: 0,
      remaining: 0,
      canPayExtra: false,
      extraCost: 0,
      message: 'Não foi possível verificar os limites de exportação. Por favor, tente novamente mais tarde.'
    };
  }
}