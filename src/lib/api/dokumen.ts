import { api } from './client';
import type { DokumenPinjaman } from './types';

export const apiDokumen = {
  getByPinjaman: async (pinjamanId: string): Promise<DokumenPinjaman[]> => {
    return api.get<DokumenPinjaman[]>(`/dokumen/pinjaman/${pinjamanId}`);
  },

  upload: async (
    file: File,
    pinjamanId: string,
    jenis: string = 'Dokumen Pendukung'
  ): Promise<DokumenPinjaman> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('jenis', jenis);

    return api.post<DokumenPinjaman>(`/dokumen/pinjaman/${pinjamanId}`, formData);
  },

  delete: async (id: string): Promise<{ message: string }> => {
    return api.delete<{ message: string }>(`/dokumen/${id}`);
  },
};
