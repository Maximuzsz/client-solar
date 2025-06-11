import api from './api';

export interface NotificationSettings {
  email?: boolean;
  app?: boolean;
  consumption?: boolean;
  generation?: boolean;
  billing?: boolean;
}

export interface DisplaySettings {
  theme?: string;
  chartStyle?: string;
  language?: string;
}

export interface UserSettings {
  notifications?: NotificationSettings;
  display?: DisplaySettings;
}

const userAPI = {
  // Obter perfil do usuário
  getProfile: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },

  // Obter configurações do usuário
  getUserSettings: async (): Promise<UserSettings> => {
    const response = await api.get('/users/me/settings');
    return response.data;
  },

  // Atualizar configurações do usuário
  updateUserSettings: async (settings: UserSettings): Promise<UserSettings> => {
    const response = await api.patch('/users/me/settings', settings);
    return response.data;
  },

  // Atualizar apenas configurações de notificação
  updateNotificationSettings: async (notifications: NotificationSettings): Promise<UserSettings> => {
    return userAPI.updateUserSettings({ notifications });
  },

  // Atualizar apenas configurações de exibição
  updateDisplaySettings: async (display: DisplaySettings): Promise<UserSettings> => {
    return userAPI.updateUserSettings({ display });
  }
};

export default userAPI;