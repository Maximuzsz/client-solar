import api from './api';


interface PredictionDataItem {
  date: string;
  consumption: number | null;
  predictedConsumption: number | null;
  consumptionLower: number | null;
  consumptionUpper: number | null;
  generation: number | null;
  predictedGeneration: number | null;
  generationLower: number | null;
  generationUpper: number | null;
  isPrediction: boolean;
}

 const dashboardAPI = {
    getPredictions: async ({
        range,
        type,
        method,
        unitId,
        networkId,
    }: {
        range: string;
        type: string;
        method: string;
        unitId?: number;
        networkId?: number;
    }): Promise<PredictionDataItem[]> => {
        const params = new URLSearchParams({
            range,
            type,
            method,
        });

        if (unitId !== undefined) {
            params.append('unitId', unitId.toString());
        }

        if (networkId !== undefined) {
            params.append('networkId', networkId.toString());
        }

        const response = await api.get(`/api/v1/dashboard/advanced/predictions?${params.toString()}`);
        return response.data as PredictionDataItem[];
    }

}

export default dashboardAPI;