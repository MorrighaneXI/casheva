import { api } from './client';
import type { Korps, Kotama, Pangkat, Satminkal } from './types';

export interface CreateKotamaWithAdminDto {
  kode: string;
  nama: string;
  tipe?: string;
  adminUsername: string;
  adminPassword: string;
  adminNamaLengkap: string;
}

export interface CreateSatminkalWithAdminDto {
  kode: string;
  nama: string;
  kotamaId: string;
  adminUsername: string;
  adminPassword: string;
  adminNamaLengkap: string;
}

export const apiMaster = {
  getKotama: async (): Promise<Kotama[]> => {
    return api.get<Kotama[]>('/master/kotama');
  },

  getSatminkal: async (kotamaId?: string): Promise<Satminkal[]> => {
    const query = kotamaId ? `?kotamaId=${kotamaId}` : '';
    return api.get<Satminkal[]>(`/master/satminkal${query}`);
  },

  createKotamaWithAdmin: async (dto: CreateKotamaWithAdminDto): Promise<{ message: string; kotama: Kotama; admin: any }> => {
    return api.post<any>('/master/kotama/with-admin', dto);
  },

  createSatminkalWithAdmin: async (dto: CreateSatminkalWithAdminDto): Promise<{ message: string; satminkal: Satminkal; admin: any }> => {
    return api.post<any>('/master/satminkal/with-admin', dto);
  },

  updateKotama: async (id: string, dto: any): Promise<any> => {
    return api.patch<any>(`/master/kotama/${id}`, dto);
  },

  deleteKotama: async (id: string): Promise<any> => {
    return api.delete<any>(`/master/kotama/${id}`);
  },

  updateSatminkal: async (id: string, dto: any): Promise<any> => {
    return api.patch<any>(`/master/satminkal/${id}`, dto);
  },

  deleteSatminkal: async (id: string): Promise<any> => {
    return api.delete<any>(`/master/satminkal/${id}`);
  },


  getPangkat: async (kategori?: string): Promise<Pangkat[]> => {
    const query = kategori ? `?kategori=${kategori}` : '';
    return api.get<Pangkat[]>(`/master/pangkat${query}`);
  },

  getKorps: async (): Promise<Korps[]> => {
    return api.get<Korps[]>('/master/korps');
  },

  getKelompokDokumen: async (): Promise<any[]> => {
    return [
      { id: "1", nama: "Surat Permohonan Usipa", keterangan: "Formulir resmi permohonan pinjaman simpan pinjam" },
      { id: "2", nama: "Rekomendasi Juru Bayar", keterangan: "Verifikasi kapasitas potong gaji & penghasilan dinas" },
      { id: "3", nama: "Rekomendasi Dan/Ka/Bagian", keterangan: "Persetujuan komandan/atasan langsung" },
      { id: "4", nama: "Surat Perjanjian Akad Kredit", keterangan: "Perjanjian pinjaman bermeterai" },
      { id: "5", nama: "Fotokopi KTP / KTA", keterangan: "Identitas kependudukan dan prajurit/PNS aktif" },
      { id: "6", nama: "Rincian Penghasilan (Gaji, ULP, Tunkin)", keterangan: "Slip gaji dan remunerasi resmi" },
    ];
  },

  getPengurus: async (): Promise<any[]> => {
    return [
      { id: "1", jabatan: "Kepala Primkopad (Keprim)", nama: "Letkol Cba Dedi Kurnia", periode: "2024 - 2027", isAktif: true },
      { id: "2", jabatan: "Bendahara", nama: "Lettu Cku Budi", periode: "2024 - 2027", isAktif: true },
      { id: "3", jabatan: "Pengawas Koperasi", nama: "Mayor Inf Tri", periode: "2024 - 2027", isAktif: true },
      { id: "4", jabatan: "Juru Bayar", nama: "Serma Agus", periode: "2024 - 2027", isAktif: true },
    ];
  },
};
