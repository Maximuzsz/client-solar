import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

interface PdfColumn {
  header: string;
  dataKey: string;
}

interface PdfExportOptions {
  title?: string;
  subtitle?: string;
  filename?: string;
  orientation?: 'portrait' | 'landscape';
  pageSize?: 'a4' | 'letter' | 'legal';
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  addSummaryRow?: boolean;
  summaryData?: Record<string, string>;
}

/**
 * Exporta dados para um arquivo PDF
 * 
 * @param columns Definição das colunas
 * @param data Dados para exportar
 * @param options Opções de configuração do PDF
 */
/**
 * Verifica se o usuário tem permissão para exportar relatórios
 * @param exportType Tipo de exportação (PDF ou CSV)
 * @returns Objeto com informações sobre o limite de exportações
 */
export async function checkExportLimit(exportType: 'ExportPDF' | 'ExportCSV'): Promise<{
  allowed: boolean;
  limit: number;
  used: number;
  remaining: number;
  canPayExtra: boolean;
  extraCost: number;
  message: string;
}> {
  try {
    // Log para debug
    console.log('Verificando limite de exportação:', exportType);
    
    const response = await fetch('/api/v1/reports/check-export-limit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ exportType }),
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Falha ao verificar limite de exportações');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erro ao verificar limite de exportações:', error);
    // Em caso de erro, presumir que o usuário tem permissão para exportar
    return {
      allowed: true,
      limit: 999,
      used: 0,
      remaining: 999,
      canPayExtra: false,
      extraCost: 0,
      message: 'Não foi possível verificar o limite de exportações.'
    };
  }
}

/**
 * Registra uma exportação no sistema
 * @param exportType Tipo de exportação (PDF ou CSV)
 * @param unitId ID da unidade (opcional)
 * @param networkId ID da rede (opcional)
 */
export async function registerExport(
  exportType: 'ExportPDF' | 'ExportCSV',
  unitId?: number | string,
  networkId?: number | string
): Promise<void> {
  try {
    // Log para debug
    console.log('Registrando exportação:', exportType);
    
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    const endDate = new Date();
    
    const data = {
      type: exportType,
      name: `Exportação ${exportType === 'ExportPDF' ? 'PDF' : 'CSV'}`,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      unitId,
      networkId
    };
    
    // Registrar a exportação no sistema
    await fetch('/api/v1/reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      credentials: 'include',
    });
  } catch (error) {
    console.error('Erro ao registrar exportação:', error);
    // Silenciar erro para não interromper a experiência do usuário
  }
}

export function exportToPdf(
  columns: PdfColumn[],
  data: Record<string, any>[],
  options: PdfExportOptions = {}
) {
  // Configurações padrão
  const defaultOptions: PdfExportOptions = {
    title: 'Relatório',
    subtitle: `Gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm')}`,
    filename: `relatorio-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`,
    orientation: 'portrait',
    pageSize: 'a4',
    margins: { top: 30, right: 15, bottom: 15, left: 15 },
    addSummaryRow: false
  };

  // Mesclar opções padrão com as fornecidas
  const mergedOptions = { ...defaultOptions, ...options };
  
  // Criar documento PDF
  const doc = new jsPDF({
    orientation: mergedOptions.orientation,
    unit: 'mm',
    format: mergedOptions.pageSize
  });
  
  // Adicionar título e subtítulo
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text(mergedOptions.title!, pageWidth / 2, 15, { align: 'center' });
  
  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  doc.text(mergedOptions.subtitle!, pageWidth / 2, 22, { align: 'center' });
  
  // Adicionar logo ou imagem de cabeçalho (opcional)
  // doc.addImage(logoUrl, 'JPEG', 10, 10, 40, 15);
  
  // Preparar colunas para a tabela
  const tableColumns = columns.map(col => ({
    header: col.header,
    dataKey: col.dataKey
  }));
  
  // Preparar dados para a tabela
  const tableData = data.map(item => {
    const row: string[] = [];
    columns.forEach(col => {
      // Se o dado para essa coluna for um número, formatar com 2 casas decimais se necessário
      const value = item[col.dataKey];
      if (typeof value === 'number') {
        row.push(Number.isInteger(value) ? value.toString() : value.toFixed(2));
      } else {
        row.push(value?.toString() || '');
      }
    });
    return row;
  });
  
  // Adicionar linha de resumo se necessário
  let footerData: string[][] = [];
  if (mergedOptions.addSummaryRow && mergedOptions.summaryData) {
    const summaryRow: string[] = [];
    columns.forEach(col => {
      summaryRow.push(mergedOptions.summaryData![col.dataKey] || '');
    });
    footerData = [summaryRow];
  }

  // Gerar tabela
  autoTable(doc, {
    head: [tableColumns.map(col => col.header)],
    body: tableData,
    foot: footerData.length > 0 ? footerData : undefined,
    startY: 30,
    margin: mergedOptions.margins,
    styles: {
      fontSize: 10,
      cellPadding: 3,
      lineColor: [200, 200, 200],
      lineWidth: 0.1
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold'
    },
    footStyles: {
      fillColor: [238, 238, 238],
      textColor: [0, 0, 0],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    }
  });
  
  // Adicionar informações de rodapé
  // @ts-ignore - getNumberOfPages pode não estar definido em alguns tipos
  const pageCount = doc.internal.getNumberOfPages ? doc.internal.getNumberOfPages() : 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const footerText = `Página ${i} de ${pageCount} | SolarShare`;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(
      footerText,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 5,
      { align: 'center' }
    );
  }
  
  // Salvar/baixar o PDF
  doc.save(mergedOptions.filename);
  
  return true;
}

/**
 * Cria um pagamento para relatório extra quando o usuário excede o limite
 * @param exportType Tipo de exportação (PDF ou CSV)
 * @param networkId ID opcional da rede
 * @param unitId ID opcional da unidade
 * @returns Informações de pagamento incluindo clientSecret
 */
export async function createExtraReportPayment(
  exportType: 'ExportPDF' | 'ExportCSV',
  networkId?: number | string,
  unitId?: number | string
): Promise<{
  reportId: number;
  clientSecret: string;
  message: string;
}> {
  try {
    const data: any = { exportType };
    
    if (networkId) {
      data.networkId = networkId;
    }
    
    if (unitId) {
      data.unitId = unitId;
    }
    
    // Dados de pagamento removidos por segurança
    
    const response = await fetch('/api/v1/reports/extra-report-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      credentials: 'include'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao criar pagamento para relatório extra');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erro ao criar pagamento para relatório extra:', error);
    throw error;
  }
}