import { api } from './client';
import type {
  BiayaOperasional,
  JenisBiayaOperasional,
  JenisPendapatan,
  Pendapatan,
  RingkasanKeuangan,
  ShuAnggotaItem,
} from './types';

export interface CreatePendapatanDto {
  jenis: JenisPendapatan;
  nominal: number;
  tanggal?: string;
  keterangan?: string;
}

export interface CreateBiayaDto {
  jenis: JenisBiayaOperasional;
  nominal: number;
  tanggal?: string;
  keterangan?: string;
}

export interface HitungShuDto {
  tahun: number;
  persenCadangan?: number;
  persenJasaModal?: number;
  persenJasaUsaha?: number;
  persenPengurus?: number;
  persenSosialPendidikan?: number;
}

export const apiKeuangan = {
  getPendapatan: async (tahun?: number): Promise<Pendapatan[]> => {
    const query = tahun ? `?tahun=${tahun}` : '';
    return api.get<Pendapatan[]>(`/keuangan/pendapatan${query}`);
  },

  createPendapatan: async (dto: CreatePendapatanDto): Promise<Pendapatan> => {
    return api.post<Pendapatan>('/keuangan/pendapatan', dto);
  },

  getBiaya: async (tahun?: number): Promise<BiayaOperasional[]> => {
    const query = tahun ? `?tahun=${tahun}` : '';
    return api.get<BiayaOperasional[]>(`/keuangan/biaya${query}`);
  },

  createBiaya: async (dto: CreateBiayaDto): Promise<BiayaOperasional> => {
    return api.post<BiayaOperasional>('/keuangan/biaya', dto);
  },

  getRingkasan: async (tahun: number): Promise<RingkasanKeuangan> => {
    return api.get<RingkasanKeuangan>(`/keuangan/ringkasan/${tahun}`);
  },

  hitungShu: async (dto: HitungShuDto): Promise<any> => {
    return api.post('/keuangan/shu/hitung', dto);
  },

  getShuPeriode: async (tahun: number): Promise<{
    ringkasan: RingkasanKeuangan;
    rincian: ShuAnggotaItem[];
  }> => {
    return api.get(`/keuangan/shu/${tahun}`);
  },
};
