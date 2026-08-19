import { api } from './client';
import type { Korps, Kotama, Pangkat, Satminkal } from './types';

export const apiMaster = {
  getKotama: async (): Promise<Kotama[]> => {
    return api.get<Kotama[]>('/master/kotama');
  },

  getSatminkal: async (kotamaId?: string): Promise<Satminkal[]> => {
    const query = kotamaId ? `?kotamaId=${kotamaId}` : '';
    return api.get<Satminkal[]>(`/master/satminkal${query}`);
  },

  getPangkat: async (kategori?: string): Promise<Pangkat[]> => {
    const query = kategori ? `?kategori=${kategori}` : '';
    return api.get<Pangkat[]>(`/master/pangkat${query}`);
  },

  getKorps: async (): Promise<Korps[]> => {
    return api.get<Korps[]>('/master/korps');
  },
};
