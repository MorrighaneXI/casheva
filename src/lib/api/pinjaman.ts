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

export interface BayarAngsuranDinamisDto {
  nominalBayar: number;
  bulanKe?: number;
  isPelunasanDipercepat?: boolean;
  tanggalBayar?: string;
  catatan?: string;
}

export interface JatuhTempoInfo {
  tanggalJatuhTempo: string | null;
  isLewatJatuhTempo: boolean;
  toleransiHingga: string | null;
  isMasaToleransi: boolean;
  isLewatToleransi: boolean;
  isBlacklist: boolean;
  sanksiBlacklistHingga: string | null;
  statusPeringatan: 'NORMAL' | 'MASA_TOLERANSI_2_BULAN' | 'GAGAL_BAYAR_POTONG_JURU_BAYAR' | 'LUNAS';
  keterangan: string;
}

export interface KalkulasiDinamisResponse {
  pinjamanId: string;
  anggota: {
    id: string;
    nama: string;
    nrpNip: string;
    pangkat?: string;
    korps?: string;
  };
  nominalAwal: number;
  sisaPokok: number;
  tenorBulan: number;
  bungaPersenTahun: number;
  bungaBulanan: number;
  pokokBulanan: number;
  tunggakanBunga: number;
  nextBulanKe: number;
  totalKewajibanBulanIni: number;
  pelunasanDipercepat: {
    sisaPokok: number;
    pinaltiBunga2x: number;
    totalBayar: number;
  };
  jatuhTempoInfo: JatuhTempoInfo;
}

export interface PlafondInfoResponse {
  anggotaId: string;
  kategoriPangkat: string;
  maksPlafond: number;
  totalPinjamanAktif: number;
  sisaKuota: number;
  isBlacklist?: boolean;
  sanksiKeterangan?: string | null;
  sanksiHingga?: string | null;
  label: string;
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

  getKalkulasiDinamis: async (pinjamanId: string): Promise<KalkulasiDinamisResponse> => {
    return api.get<KalkulasiDinamisResponse>(`/pinjaman/${pinjamanId}/kalkulasi-dinamis`);
  },

  bayarDinamis: async (pinjamanId: string, dto: BayarAngsuranDinamisDto): Promise<{
    message: string;
    noInvoice: string;
    tanggalBayar: string;
    nominalBayar: number;
    alokasi: {
      porsiBunga: number;
      porsiPokok: number;
      sisaPokokBaru: number;
    };
    isLunas: boolean;
    pinjamanId: string;
  }> => {
    return api.post(`/pinjaman/${pinjamanId}/bayar-dinamis`, dto);
  },

  getPlafond: async (anggotaId: string): Promise<PlafondInfoResponse> => {
    return api.get(`/pinjaman/plafond/${anggotaId}`);
  },

  getRekapAngsuranBulanan: async (bulan: number, tahun: number): Promise<any[]> => {
    return api.get<any[]>(`/pinjaman/rekap-angsuran-bulanan?bulan=${bulan}&tahun=${tahun}`);
  },
};
