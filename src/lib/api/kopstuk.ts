import { api } from './client';
import type { Kopstuk } from './types';

export interface UpsertKopstukDto {
  namaSatuan: string;
  namaBalak: string;
  alamat: string;
  nomorTelepon: string;
  logoUrl?: string;
}

export const apiKopstuk = {
  getKopstuk: async (): Promise<Kopstuk> => {
    return api.get<Kopstuk>('/kopstuk');
  },

  upsertKopstuk: async (dto: UpsertKopstukDto): Promise<Kopstuk> => {
    return api.post<Kopstuk>('/kopstuk', dto);
  },
};
