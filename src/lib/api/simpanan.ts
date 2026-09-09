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

  getPengaturan: async (): Promise<{
    nominalSimpananPokok: number;
    nominalSimpananWajib: number;
    nominalSimpananKhusus: number;
    updatedAt: string | null;
  }> => {
    return api.get('/simpanan/pengaturan');
  },

  updatePengaturan: async (dto: {
    nominalPokok?: number;
    nominalWajib?: number;
    nominalKhusus?: number;
  }): Promise<any> => {
    return api.patch('/simpanan/pengaturan', dto);
  },

  getRekapBulanan: async (bulan: number, tahun: number): Promise<any[]> => {
    return api.get<any[]>(`/simpanan/rekap-bulanan?bulan=${bulan}&tahun=${tahun}`);
  },

  setor: async (dto: {
    anggotaId: string;
    jenis: 'POKOK' | 'WAJIB' | 'SUKARELA' | 'KHUSUS';
    nominal: number;
    keterangan?: string;
  }): Promise<any> => {
    return api.post('/simpanan/setor', dto);
  },

  batchGolongan: async (dto: {
    rates: { golongan: string; nominalPokok: number; nominalWajib: number }[];
    periode?: string;
    keterangan?: string;
  }): Promise<{
    message: string;
    periode: string;
    totalAnggota: number;
    totalTransaksi: number;
    totalPokok: number;
    totalWajib: number;
    totalNominal: number;
    rincian: {
      id: string;
      nama: string;
      nrpNip: string;
      pangkat: string;
      kategoriPangkat: string;
      korps: string;
      golongan: string;
      simpananPokok: number;
      simpananWajib: number;
      totalPotongan: number;
    }[];
  }> => {
    return api.post('/simpanan/batch-golongan', dto);
  },
};

