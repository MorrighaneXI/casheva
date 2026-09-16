import { api } from './client';

export interface PesananItemDto {
  produkId: string;
  jumlah: number;
}

export interface CreatePesananDto {
  anggotaId?: string;
  tipePengambilan: 'AMBIL_SENDIRI' | 'TITIP_PIKET_SATUAN' | 'DELIVERY_CEPAT';
  lokasiTujuan?: string;
  namaPetugasPiket?: string;
  noHpPenerima?: string;
  metodeBayar?: 'TUNAI' | 'QRIS' | 'TRANSFER' | 'KREDIT_TEMPO';
  items: PesananItemDto[];
}

export interface PesananItemResponse {
  id: string;
  produkId: string;
  jumlah: number;
  hargaSatuan: number;
  subtotal: number;
  produk?: {
    id: string;
    namaProduk: string;
    hargaJual: number;
    kategori?: { namaKategori: string };
  };
}

export interface PesananResponse {
  id: string;
  nomorPesanan: string;
  anggotaId: string;
  tipePengambilan: 'AMBIL_SENDIRI' | 'TITIP_PIKET_SATUAN' | 'DELIVERY_CEPAT';
  lokasiTujuan?: string;
  namaPetugasPiket?: string;
  noHpPenerima?: string;
  ongkir: number;
  totalHargaBarang: number;
  totalTagihan: number;
  metodeBayar: string;
  status: 'MENUNGGU_KONFIRMASI' | 'DIPROSES_PETUGAS' | 'SEDANG_DIANTAR' | 'TITIP_DI_PIKET' | 'SELESAI' | 'DIBATALKAN';
  estimasiMenit: number;
  isTerlambatSla: boolean;
  kompensasiDiskon: number;
  waktuPesan: string;
  waktuMulaiAntar?: string;
  waktuSelesai?: string;
  items: PesananItemResponse[];
  anggota?: {
    id: string;
    nama: string;
    nrpNip: string;
  };
}

export const apiPesanan = {
  getAll: async (params?: {
    anggotaId?: string;
    status?: string;
    tipePengambilan?: string;
  }): Promise<PesananResponse[]> => {
    const query = new URLSearchParams();
    if (params?.anggotaId) query.append('anggotaId', params.anggotaId);
    if (params?.status) query.append('status', params.status);
    if (params?.tipePengambilan) query.append('tipePengambilan', params.tipePengambilan);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return api.get<PesananResponse[]>(`/pesanan${qs}`);
  },

  create: async (dto: CreatePesananDto): Promise<PesananResponse> => {
    return api.post<PesananResponse>('/pesanan', dto);
  },

  updateStatus: async (
    id: string,
    status: string,
    petugasPiket?: string,
  ): Promise<PesananResponse> => {
    return api.patch<PesananResponse>(`/pesanan/${id}/status`, {
      status,
      petugasPiket,
    });
  },
};
