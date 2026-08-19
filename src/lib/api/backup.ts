import { api } from './client';

export const apiBackup = {
  exportData: async (): Promise<any> => {
    return api.get('/backup/export');
  },

  importData: async (data: any): Promise<any> => {
    return api.post('/backup/import', data);
  },
};
