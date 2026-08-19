import { api } from './client';
import type { DokumenPinjaman } from './types';

export const apiDokumen = {
  getByPinjaman: async (pinjamanId: string): Promise<DokumenPinjaman[]> => {
    return api.get<DokumenPinjaman[]>(`/dokumen/pinjaman/${pinjamanId}`);
  },

  upload: async (
    file: File,
    pinjamanId: string,
    jenisDokumen?: string,
    namaDokumen?: string
  ): Promise<DokumenPinjaman> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('pinjamanId', pinjamanId);
    if (jenisDokumen) formData.append('jenisDokumen', jenisDokumen);
    if (namaDokumen) formData.append('namaDokumen', namaDokumen);

    return api.post<DokumenPinjaman>('/dokumen/upload', formData);
  },
};
