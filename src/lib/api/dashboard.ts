import { api } from './client';
import type { DashboardCharts, DashboardSummary } from './types';

export const apiDashboard = {
  getSummary: async (): Promise<DashboardSummary> => {
    return api.get<DashboardSummary>('/dashboard/summary');
  },

  getCharts: async (tahun?: number): Promise<DashboardCharts> => {
    const query = tahun ? `?tahun=${tahun}` : '';
    return api.get<DashboardCharts>(`/dashboard/charts${query}`);
  },
};
