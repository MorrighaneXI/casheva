import { api } from './client';
import type { Anggota } from './types';

export interface CreateAnggotaDto {
  nrpNip: string;
  nama: string;
  pangkatId: string;
  korpsId: string;
  tmtAnggota?: string;
}

export interface UpdateAnggotaDto {
  nrpNip?: string;
  nama?: string;
  pangkatId?: string;
  korpsId?: string;
  isAktif?: boolean;
  tmtAnggota?: string;
}

export const apiAnggota = {
  findAll: async (hanyaAktif?: boolean): Promise<Anggota[]> => {
    const query = hanyaAktif !== undefined ? `?hanyaAktif=${hanyaAktif}` : '';
    return api.get<Anggota[]>(`/anggota${query}`);
  },

  findOne: async (id: string): Promise<Anggota> => {
    return api.get<Anggota>(`/anggota/${id}`);
  },

  create: async (dto: CreateAnggotaDto): Promise<Anggota> => {
    return api.post<Anggota>('/anggota', dto);
  },

  update: async (id: string, dto: UpdateAnggotaDto): Promise<Anggota> => {
    return api.patch<Anggota>(`/anggota/${id}`, dto);
  },

  remove: async (id: string): Promise<Anggota> => {
    return api.delete<Anggota>(`/anggota/${id}`);
  },
};
