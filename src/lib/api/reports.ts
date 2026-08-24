import { api } from './client';
import type { Kopstuk, ReportShuAnggotaResponse, ShuAnggotaItem, TajukTtd } from './types';

export interface ReportAnggotaResponse {
  kopstuk: Kopstuk | null;
  tajukTtd: TajukTtd | null;
  data: {
    no: number;
    nama: string;
    pangkatKorpsNrp: string;
    kesatuan: string;
    tmtAnggota: string;
    status: string;
    keterangan: string;
  }[];
}

export interface ReportRekapSimpananResponse {
  kopstuk: Kopstuk | null;
  tajukTtd: TajukTtd | null;
  data: {
    no: number;
    nama: string;
    pangkatKorpsNrp: string;
    kesatuan: string;
    simpananWajib: number;
    simpananKhusus: number;
    simpananSukarela: number;
    total: number;
  }[];
  totalWajib: number;
  totalKhusus: number;
  totalSukarela: number;
  grandTotal: number;
}

export interface ReportPinjamanAnggotaResponse {
  kopstuk: Kopstuk | null;
  tajukTtd: TajukTtd | null;
  tahun: number;
  data: {
    no: number;
    nama: string;
    pangkatKorpsNrp: string;
    kesatuan: string;
    jumlahPinjaman: number;
    jangkaWaktuBulan: number;
    angsuranMulai: string;
    angsuranSelesai: string;
    tglAkad: string;
    keterangan: string;
  }[];
  totalPinjaman: number;
}

export interface ReportAkadKreditResponse {
  kopstuk: Kopstuk | null;
  tajukTtd: TajukTtd | null;
  debitur: {
    nama: string;
    pangkatKorpsNrp: string;
    jabatan: string;
    kesatuan: string;
    telpHp: string;
    alamat: string;
  };
  pinjaman: {
    plafonPinjaman: number;
    jangkaWaktuBulan: number;
    sukuBungaTahunan: number;
    sukuBungaBulanan: number;
    angsuranPerBulan: number;
    tanggalPeminjaman: string;
  };
  jadwal: {
    periode: number;
    bulan: string;
    angsuranPokok: number;
    angsuranBunga: number;
    angsuranPerBulan: number;
    sisaPinjaman: number;
    keterangan: string;
    paraf: string;
  }[];
  totalPokok: number;
  totalBunga: number;
  totalAngsuran: number;
}

export interface ReportKwitansiResponse {
  kopstuk: Kopstuk | null;
  tajukTtd: TajukTtd | null;
  debitur: {
    nama: string;
    pangkatKorpsNrp: string;
    jabatan: string;
    kesatuan: string;
    telpHp: string;
  };
  kwitansi: {
    noKwitansi: string;
    noTransaksi: string;
    plafonPinjaman: number;
    jangkaWaktu: string;
    jatuhTempo: string;
    tanggalPembayaran: string;
    angsuranKe: string;
    angsuranPerBulan: number;
    administrasi: number;
    jumlahTagihan: number;
  };
  tanggalCetak: string;
}

export interface ReportRekapKwitansiBulananResponse {
  kopstuk: Kopstuk | null;
  tajukTtd: TajukTtd | null;
  bulan: number;
  tahun: number;
  namaBulan: string;
  data: {
    no: number;
    noKwitansi: string;
    noTrans: string;
    nama: string;
    pangkatKorpsNrp: string;
    kesatuan: string;
    jumlahPinjaman: number;
    jumlahAngsuran: number;
    angsuranKeDari: string;
    jatuhTempo: string;
  }[];
  totalJumlah: number;
}

export const apiReports = {
  getReportAnggota: async (): Promise<ReportAnggotaResponse> => {
    return api.get<ReportAnggotaResponse>('/reports/anggota');
  },

  getAnggota: async (): Promise<any> => {
    return api.get('/reports/anggota');
  },

  getBrosurPinjaman: async (): Promise<any> => {
    return api.get('/reports/brosur-pinjaman');
  },

  getRekapSimpanan: async (): Promise<ReportRekapSimpananResponse> => {
    return api.get<ReportRekapSimpananResponse>('/reports/rekap-simpanan');
  },

  getPinjamanAnggota: async (tahun?: number): Promise<ReportPinjamanAnggotaResponse> => {
    const query = tahun ? `?tahun=${tahun}` : '';
    return api.get<ReportPinjamanAnggotaResponse>(`/reports/pinjaman-anggota${query}`);
  },

  getAkadKredit: async (pinjamanId: string): Promise<ReportAkadKreditResponse> => {
    return api.get<ReportAkadKreditResponse>(`/reports/akad-kredit/${pinjamanId}`);
  },

  getKwitansi: async (angsuranId: string): Promise<ReportKwitansiResponse> => {
    return api.get<ReportKwitansiResponse>(`/reports/kwitansi/${angsuranId}`);
  },

  getRekapKwitansiBulanan: async (
    tahun?: number,
    bulan?: number
  ): Promise<ReportRekapKwitansiBulananResponse> => {
    const params = new URLSearchParams();
    if (tahun) params.set('tahun', String(tahun));
    if (bulan) params.set('bulan', String(bulan));
    const qs = params.toString() ? `?${params.toString()}` : '';
    return api.get<ReportRekapKwitansiBulananResponse>(`/reports/rekap-kwitansi-bulanan${qs}`);
  },

  getShuAnggota: async (tahun: number): Promise<ReportShuAnggotaResponse> => {
    return api.get<ReportShuAnggotaResponse>(`/reports/shu-anggota/${tahun}`);
  },
};
