import api from './api';
import { Tariff } from './tariffsAPI'; // Importa o tipo Tariff, se necessário

export interface Concessionaire {
  id: number;
  name: string;
  region: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EnrichedConcessionaire extends Concessionaire {
  currentTariff: Tariff | null;
  previousTariff: Tariff | null;
}

const concessionairesAPI = {
  // Buscar todas as distribuidoras
  getAllConcessionaires: async (): Promise<Concessionaire[]> => {
    const response = await api.get('/concessionaires');
    return response.data;
  },

  // Buscar distribuidoras já enriquecidas com tarifas
  getEnrichedConcessionaires: async (): Promise<EnrichedConcessionaire[]> => {
    // 1. Buscar distribuidoras
    const concessionairesRes = await api.get('/concessionaires');

    const concessionaires: Concessionaire[] = concessionairesRes.data;

    // 2. Buscar todas as tarifas
    const tariffsRes = await api.get('/concessionaires/tariffs/all');

    const tariffs: Tariff[] = tariffsRes.data;

    // 3. Agrupar e enriquecer
    const enriched = concessionaires.map((concessionaire) => {
      const relatedTariffs = tariffs
        .filter((t) => t.concessionaire.id === concessionaire.id)
        .sort(
          (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        );

      const residentialTariffs = relatedTariffs.filter((t) => t.type === 'Residential');

      return {
        ...concessionaire,
        currentTariff: residentialTariffs[0] || relatedTariffs[0] || null,
        previousTariff: residentialTariffs[1] || relatedTariffs[1] || null,
      };
    });
    console.log('Enriched concessionaires:', enriched);
    return enriched;
  },
};

export default concessionairesAPI;
