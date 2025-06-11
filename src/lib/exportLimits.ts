import { showUpgradeMessage, showNearLimitWarning } from './upgradeMessage';
import { toast } from '@/hooks/use-toast';
import { ExportLimitResponse } from './reportLimits';

/**
 * Função utilitária para verificar os limites de exportação e mostrar mensagens apropriadas
 * Retorna true se a exportação pode prosseguir, false caso contrário
 */
export async function handleExportLimit(
  checkExportLimit: (reportType: 'ExportPDF' | 'ExportCSV') => Promise<ExportLimitResponse>,
  reportType: 'ExportPDF' | 'ExportCSV',
  createExtraReportPayment?: (reportType: 'ExportPDF' | 'ExportCSV', entityId?: number | string) => Promise<any>,
  entityId?: number | string,
  onResultCallback?: (result: ExportLimitResponse) => void
): Promise<boolean> {
  try {
    // Verificar limite do plano no backend
    const exportLimitCheck = await checkExportLimit(reportType);
    
    // Chamar callback com o resultado, se fornecido
    if (onResultCallback) {
      onResultCallback(exportLimitCheck);
    }
    
    // Se o usuário ainda tem exportações disponíveis, mas está próximo do limite (>80%)
    // Mostra um aviso, mas permite continuar
    if (exportLimitCheck.allowed && exportLimitCheck.used > 0) {
      const percentUsed = (exportLimitCheck.used / exportLimitCheck.limit) * 100;
      if (percentUsed >= 80) {
        showNearLimitWarning(exportLimitCheck.used, exportLimitCheck.limit);
      }
      return true;
    }
    
    // Se não tem mais exportações disponíveis
    if (!exportLimitCheck.allowed) {
      // Se pode pagar por relatório extra
      if (exportLimitCheck.canPayExtra && createExtraReportPayment) {
        // Mostrar diálogo de confirmação para pagamento
        if (window.confirm(`${exportLimitCheck.message}\n\nVocê tem duas opções:\n1. Pagar R$ ${exportLimitCheck.extraCost.toFixed(2)} por este relatório específico\n2. Fazer upgrade do seu plano para aumentar o limite mensal\n\nDeseja pagar por este relatório agora?`)) {
          try {
            // Criar pagamento para relatório extra
            const paymentInfo = await createExtraReportPayment(
              reportType, 
              entityId
            );
            
            // Informar sobre o pagamento iniciado
            toast({
              title: 'Pagamento iniciado',
              description: paymentInfo.message,
            });

            // Em uma implementação real, redirecionaríamos para uma tela de checkout
            // ou abriríamos um modal com o formulário de pagamento Stripe
            // Informação de pagamento removida por segurança
            return false; // Não prosseguir com a exportação ainda
          } catch (paymentError) {
            console.error('Erro ao criar pagamento:', paymentError);
            toast({
              title: 'Erro no pagamento',
              description: 'Não foi possível processar o pagamento para o relatório extra.',
              variant: 'destructive'
            });
            return false;
          }
        } else {
          return false; // Usuário cancelou o pagamento
        }
      } else {
        // Comportamento padrão quando não é possível pagar extra
        showUpgradeMessage(exportLimitCheck.message);
        return false;
      }
    }
    
    return true; // Permitir exportação
  } catch (error) {
    console.error('Erro ao verificar limite de exportação:', error);
    toast({
      title: 'Erro',
      description: 'Não foi possível verificar o limite de exportações.',
      variant: 'destructive'
    });
    return false;
  }
}