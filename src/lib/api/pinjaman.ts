import { api } from './client';
import type { Pinjaman, StatusPinjaman } from './types';

export interface CreatePinjamanDto {
  anggotaId: string;
  nominal: number;
  tenorBulan: number;
  catatan?: string;
}

export interface UpdateStatusPinjamanDto {
  status: StatusPinjaman;
  alasanPenolakan?: string;
  catatan?: string;
}

export interface CairkanPinjamanDto {
  tanggalPencairan?: string;
  catatan?: string;
}

export interface PelunasanDipercepatDto {
  tanggalPelunasan?: string;
  catatan?: string;
}

export interface SukuBungaPengaturan {
  satminkalId: string;
  sukuBungaTahunan: number;
  sukuBungaBulanan: number;
}

export const apiPinjaman = {
  findAll: async (status?: StatusPinjaman): Promise<Pinjaman[]> => {
    const query = status ? `?status=${status}` : '';
    return api.get<Pinjaman[]>(`/pinjaman${query}`);
  },

  findOne: async (id: string): Promise<Pinjaman> => {
    return api.get<Pinjaman>(`/pinjaman/${id}`);
  },

  create: async (dto: CreatePinjamanDto): Promise<Pinjaman> => {
    return api.post<Pinjaman>('/pinjaman', dto);
  },

  updateStatus: async (id: string, dto: UpdateStatusPinjamanDto): Promise<Pinjaman> => {
    return api.patch<Pinjaman>(`/pinjaman/${id}/status`, dto);
  },

  cairkan: async (id: string, dto?: CairkanPinjamanDto): Promise<Pinjaman> => {
    return api.post<Pinjaman>(`/pinjaman/${id}/cairkan`, dto || {});
  },

  pelunasanDipercepat: async (id: string, dto?: PelunasanDipercepatDto): Promise<Pinjaman> => {
    return api.post<Pinjaman>(`/pinjaman/${id}/pelunasan-dipercepat`, dto || {});
  },

  getPengaturanBunga: async (): Promise<SukuBungaPengaturan> => {
    return api.get<SukuBungaPengaturan>('/pinjaman/pengaturan-bunga');
  },

  updatePengaturanBunga: async (dto: { sukuBungaTahunan: number }): Promise<SukuBungaPengaturan> => {
    return api.patch<SukuBungaPengaturan>('/pinjaman/pengaturan-bunga', dto);
  },

  bayarAngsuran: async (angsuranId: string): Promise<any> => {
    return api.post(`/pinjaman/angsuran/${angsuranId}/bayar`);
  },
};
