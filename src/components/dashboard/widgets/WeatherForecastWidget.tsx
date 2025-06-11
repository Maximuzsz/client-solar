import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { WidgetConfig } from '@/services/dashboardCustomization/dashboardLayoutService';
import { 
  Card,
  CardContent,
} from '@/components/ui/card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Cloud, 
  Sun, 
  CloudRain, 
  Cloudy, 
  CloudSun, 
  CloudFog, 
  CloudSnow, 
  Wind,
  Zap
} from 'lucide-react';

interface WeatherForecastWidgetProps {
  widget: WidgetConfig;
}

// Interface para dados meteorológicos
interface WeatherData {
  location: {
    name: string;
    region: string;
    country: string;
    lat: number;
    lon: number;
  };
  current: {
    temp_c: number;
    condition: {
      text: string;
      icon: string;
      code: number;
    };
    wind_kph: number;
    wind_dir: string;
    humidity: number;
    cloud: number;
    uv: number;
  };
  forecast: {
    forecastday: {
      date: string;
      day: {
        maxtemp_c: number;
        mintemp_c: number;
        avgtemp_c: number;
        condition: {
          text: string;
          icon: string;
          code: number;
        };
        daily_chance_of_rain: number;
        daily_chance_of_snow: number;
        uv: number;
      };
      astro: {
        sunrise: string;
        sunset: string;
      };
      hour: {
        time: string;
        temp_c: number;
        condition: {
          text: string;
          icon: string;
          code: number;
        };
        chance_of_rain: number;
        chance_of_snow: number;
        uv: number;
      }[];
    }[];
  };
  solar: {
    generation_potential: number; // kWh estimado por instalação solar padrão
    radiation_index: number; // índice de 0-10
    cloud_coverage: number; // percentual de cobertura de nuvens
  };
}

// Mapeamento de códigos de condição climática para ícones
const weatherIcons: Record<number, React.ReactNode> = {
  1000: <Sun className="h-8 w-8 text-yellow-500" />, // Ensolarado
  1003: <CloudSun className="h-8 w-8 text-blue-400" />, // Parcialmente nublado
  1006: <Cloudy className="h-8 w-8 text-gray-500" />, // Nublado
  1009: <Cloud className="h-8 w-8 text-gray-600" />, // Encoberto
  1030: <CloudFog className="h-8 w-8 text-gray-400" />, // Névoa
  1063: <CloudRain className="h-8 w-8 text-blue-500" />, // Chuva esparsa
  1066: <CloudSnow className="h-8 w-8 text-blue-200" />, // Neve esparsa
  1183: <CloudRain className="h-8 w-8 text-blue-600" />, // Chuva leve
  1189: <CloudRain className="h-8 w-8 text-blue-700" />, // Chuva moderada
  1195: <CloudRain className="h-8 w-8 text-blue-800" />, // Chuva forte
  1273: <Zap className="h-8 w-8 text-yellow-600" />, // Tempestade
};

// Função auxiliar para obter ícone com base no código
const getWeatherIcon = (code: number) => {
  return weatherIcons[code] || <Cloud className="h-8 w-8 text-gray-500" />;
};

// Função para converter direção do vento em texto
const windDirectionToText = (dir: string) => {
  const directions: Record<string, string> = {
    N: 'Norte',
    NNE: 'Norte-Nordeste',
    NE: 'Nordeste',
    ENE: 'Leste-Nordeste',
    E: 'Leste',
    ESE: 'Leste-Sudeste',
    SE: 'Sudeste',
    SSE: 'Sul-Sudeste',
    S: 'Sul',
    SSW: 'Sul-Sudoeste',
    SW: 'Sudoeste',
    WSW: 'Oeste-Sudoeste',
    W: 'Oeste',
    WNW: 'Oeste-Noroeste',
    NW: 'Noroeste',
    NNW: 'Norte-Noroeste',
  };
  return directions[dir] || dir;
};

const WeatherForecastWidget: React.FC<WeatherForecastWidgetProps> = ({ widget }) => {
  // Extrair configurações do widget
  const {
    locationId,
    showForecast = true,
    showSolarPotential = true,
    days = 3,
  } = widget.config;
  
  // Estado local para a localização selecionada
  const [selectedLocation, setSelectedLocation] = useState<string | null>(
    locationId ? String(locationId) : null
  );
  
  // Consultar localizações disponíveis
  const { data: locationsData } = useQuery({
    queryKey: ['/api/v1/dashboard/advanced/weather-locations'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/v1/dashboard/advanced/weather-locations');
      return response.data;
    },
  });
  
  // Quando os dados de localização forem carregados, se não houver seleção, selecionar a primeira
  useEffect(() => {
    if (!selectedLocation && locationsData && locationsData.length > 0) {
      setSelectedLocation(locationsData[0].id);
    }
  }, [locationsData, selectedLocation]);
  
  // Consultar dados meteorológicos para a localização selecionada
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/v1/dashboard/advanced/weather-forecast', selectedLocation, days],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedLocation) params.append('locationId', selectedLocation);
      params.append('days', days.toString());
      
      const response = await apiRequest('GET', `/api/v1/dashboard/advanced/weather-forecast?${params.toString()}`);
      return response.data as WeatherData;
    },
    enabled: !!selectedLocation,
  });
  
  // Renderizar estados de carregamento/erro
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center p-4">
          <p className="text-red-500 mb-2">Erro ao carregar dados</p>
          <p className="text-sm text-gray-500">Tente novamente mais tarde</p>
        </div>
      </div>
    );
  }
  
  if (!data) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center p-4">
          <p className="text-gray-500">Selecione uma localização para ver a previsão</p>
        </div>
      </div>
    );
  }
  
  // Formatar data para exibição
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
    });
  };
  
  return (
    <div className="h-full flex flex-col">
      {/* Seletor de localização */}
      {locationsData && locationsData.length > 0 && (
        <div className="mb-4">
          <Select
            value={selectedLocation || ""}
            onValueChange={(value) => setSelectedLocation(value || null)}
          >
            <SelectTrigger className="w-[220px] h-8">
              <SelectValue placeholder="Selecionar localização" />
            </SelectTrigger>
            <SelectContent>
              {locationsData.map((location: any) => (
                <SelectItem key={location.id} value={location.id.toString()}>
                  {location.name}, {location.region}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
      {/* Clima atual */}
      <div className="grid grid-cols-12 gap-4 mb-4">
        <div className="col-span-5">
          <div className="flex flex-col items-center">
            {getWeatherIcon(data.current.condition.code)}
            <p className="text-sm mt-1">{data.current.condition.text}</p>
          </div>
        </div>
        
        <div className="col-span-7">
          <div className="flex flex-col">
            <div className="flex items-baseline">
              <span className="text-3xl font-bold">{Math.round(data.current.temp_c)}</span>
              <span className="text-xl ml-1">°C</span>
            </div>
            <p className="text-xs text-gray-500">{data.location.name}, {data.location.region}</p>
            <div className="flex items-center mt-2">
              <Wind className="h-3 w-3 text-gray-500 mr-1" />
              <span className="text-xs">{data.current.wind_kph} km/h ({windDirectionToText(data.current.wind_dir)})</span>
            </div>
            <div className="flex items-center mt-1">
              <Cloud className="h-3 w-3 text-gray-500 mr-1" />
              <span className="text-xs">Umidade: {data.current.humidity}%</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Potencial solar */}
      {showSolarPotential && data.solar && (
        <Card className="mb-4 bg-gradient-to-r from-yellow-50 to-blue-50">
          <CardContent className="p-3">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-xs font-medium text-gray-700">Potencial de Geração Solar</h4>
                <div className="flex items-baseline mt-1">
                  <span className="text-xl font-semibold text-yellow-600">{data.solar.generation_potential.toFixed(1)}</span>
                  <span className="text-xs ml-1 text-gray-500">kWh</span>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center justify-end">
                  <Sun className="h-4 w-4 text-yellow-500 mr-1" />
                  <span className="text-xs">Índice de Radiação: {data.solar.radiation_index}/10</span>
                </div>
                <div className="flex items-center justify-end mt-1">
                  <Cloud className="h-4 w-4 text-gray-400 mr-1" />
                  <span className="text-xs">Cobertura de Nuvens: {data.solar.cloud_coverage}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Previsão para os próximos dias */}
      {showForecast && data.forecast && data.forecast.forecastday.length > 0 && (
        <div className="grid grid-cols-12 gap-3 overflow-x-auto pb-1">
          {data.forecast.forecastday.map((day) => (
            <Card key={day.date} className="col-span-4 bg-gray-50">
              <CardContent className="p-3">
                <div className="flex flex-col items-center">
                  <p className="text-xs font-medium mb-1">{formatDate(day.date)}</p>
                  <div className="mb-1">
                    {getWeatherIcon(day.day.condition.code)}
                  </div>
                  <div className="flex items-center mt-1">
                    <span className="text-xs font-semibold text-red-500 mr-2">{Math.round(day.day.maxtemp_c)}°</span>
                    <span className="text-xs text-blue-500">{Math.round(day.day.mintemp_c)}°</span>
                  </div>
                  <p className="text-xs mt-1 text-center">{day.day.condition.text}</p>
                  
                  {day.day.daily_chance_of_rain > 0 && (
                    <div className="flex items-center mt-1">
                      <CloudRain className="h-3 w-3 text-blue-400 mr-1" />
                      <span className="text-xs">{day.day.daily_chance_of_rain}%</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default WeatherForecastWidget;