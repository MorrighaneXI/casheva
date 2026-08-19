import { api } from './client';
import type { TajukTtd } from './types';

export interface CreateTajukTtdDto {
  jabatan: string;
  namaPejabat: string;
  pangkat: string;
  nrp: string;
  isAktif?: boolean;
  kategori: string;
}

export interface UpdateTajukTtdDto {
  jabatan?: string;
  namaPejabat?: string;
  pangkat?: string;
  nrp?: string;
  isAktif?: boolean;
  kategori?: string;
}

export const apiTajukTtd = {
  findAll: async (kategori?: string): Promise<TajukTtd[]> => {
    const query = kategori ? `?kategori=${kategori}` : '';
    return api.get<TajukTtd[]>(`/tajuk-ttd${query}`);
  },

  findOne: async (id: string): Promise<TajukTtd> => {
    return api.get<TajukTtd>(`/tajuk-ttd/${id}`);
  },

  create: async (dto: CreateTajukTtdDto): Promise<TajukTtd> => {
    return api.post<TajukTtd>('/tajuk-ttd', dto);
  },

  update: async (id: string, dto: UpdateTajukTtdDto): Promise<TajukTtd> => {
    return api.patch<TajukTtd>(`/tajuk-ttd/${id}`, dto);
  },

  remove: async (id: string): Promise<TajukTtd> => {
    return api.delete<TajukTtd>(`/tajuk-ttd/${id}`);
  },
};
