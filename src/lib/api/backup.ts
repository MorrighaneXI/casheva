import { api, API_BASE_URL } from './client';

export interface BackupStatus {
  status: string;
  scheduler: string;
  cipher: string;
  integrityHash: string;
  totalSnapshots: number;
  lastBackupAt: string;
  backupStorageLocation: string;
  isRansomwareProtected: boolean;
  scope?: 'GLOBAL' | 'KOTAMA' | 'SATMINKAL';
  scopeTitle?: string;
  totalSatminkalCovered?: number;
}

export const apiBackup = {
  getStatus: async (): Promise<BackupStatus> => {
    return api.get<BackupStatus>('/backup/status');
  },

  exportEncryptedData: async (): Promise<any> => {
    return api.get('/backup/export-encrypted');
  },

  triggerManualBackup: async (): Promise<any> => {
    return api.post('/backup/trigger-manual');
  },

  downloadEncryptedFile: async (fallbackName?: string): Promise<string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('casheva.token') : null;
    const url = `${API_BASE_URL}/backup/export-encrypted`;

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-Token': 'casheva-secure-client',
      },
    });

    if (!res.ok) {
      throw new Error(`Gagal mengunduh file cadangan terenkripsi (${res.status} ${res.statusText})`);
    }

    // Extract filename from header
    const disposition = res.headers.get('Content-Disposition') || res.headers.get('content-disposition');
    let filename = fallbackName || `backup-siskopad-${new Date().toISOString().slice(0, 10)}.siskopad.enc`;
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^";]+)"?/);
      if (match && match[1]) {
        filename = match[1].trim();
      }
    }

    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);

    return filename;
  },

  exportRawData: async (): Promise<any> => {
    return api.get('/backup/export');
  },

  restoreEncryptedData: async (payload: any): Promise<any> => {
    return api.post('/backup/restore-encrypted', payload);
  },
};
