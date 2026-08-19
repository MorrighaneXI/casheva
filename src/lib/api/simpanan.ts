import { api } from './client';
import type { SimpananRecord, SimpananRekapItem } from './types';

export interface SimpananMassalDto {
  bulan?: number;
  tahun?: number;
  tanggal?: string;
  nominalPamen?: number;
  nominalPama?: number;
  nominalBataAsn?: number;
}

export interface SimpananMassalResponse {
  message: string;
  totalAnggota: number;
  totalNominal: number;
  periode: string;
}

export const apiSimpanan = {
  getRekap: async (): Promise<SimpananRekapItem[]> => {
    return api.get<SimpananRekapItem[]>('/simpanan/rekap');
  },

  getByAnggota: async (anggotaId: string): Promise<SimpananRecord[]> => {
    return api.get<SimpananRecord[]>(`/simpanan/anggota/${anggotaId}`);
  },

  setPokokWajib: async (anggotaId: string): Promise<{ message: string }> => {
    return api.post<{ message: string }>(`/simpanan/pokok-wajib/${anggotaId}`);
  },

  sukarelaMassal: async (dto?: SimpananMassalDto): Promise<SimpananMassalResponse> => {
    return api.post<SimpananMassalResponse>('/simpanan/sukarela/massal', dto || {});
  },
};
