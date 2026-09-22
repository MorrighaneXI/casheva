import { apiRequest } from './client';

// Alias for backward compatibility
const apiFetch = apiRequest;

export interface KotamaKpi {
  totalAnggotaAktif: number;
  totalSimpanan: number;
  totalKas: number;
  totalKasSimpanan: number;
  pinjamanBerjalan: number;
  countPinjamanBerjalan: number;
  estimasiShuKotama: number;
}

export interface KotamaSatminkalStat {
  id: string;
  kode: string;
  nama: string;
  status: boolean;
  totalAnggota: number;
  totalSimpanan: number;
  totalPinjaman: number;
  pinjamanBerjalan: number;
  countPinjamanBerjalan: number;
  estimasiShu: number;
  kasKoperasi: number;
  admin: {
    id: string;
    username: string;
    namaLengkap: string;
    role: string;
    isOnline: boolean;
    isIdle: boolean;
    isOffline: boolean;
    lastActiveAt?: string | null;
  } | null;
}

export interface KotamaSummaryResponse {
  kotama: {
    id: string;
    kode: string;
    nama: string;
    tipe: string;
  };
  tahun: number;
  kpi: KotamaKpi;
  satminkals: KotamaSatminkalStat[];
}

export interface KotamaMonthlyChartItem {
  bulan: string;
  bulanIndex: number;
  simpanan: number;
  pinjaman: number;
  angsuran: number;
}

export interface KotamaChartsResponse {
  tahun: number;
  data: KotamaMonthlyChartItem[];
}

export interface CreateKotamaSatminkalDto {
  kode: string;
  nama: string;
  adminUsername?: string;
  adminPassword?: string;
  adminNamaLengkap?: string;
  adminNrpNip?: string;
}

export interface ActiveMonitoringSession {
  isActive: boolean;
  monitoringId: string;
  startedAt: string;
  adminKotama: {
    id?: string;
    username?: string;
    namaLengkap?: string;
    kotama: string;
  };
  details?: any;
}

export interface ActiveKotamaMonitoringSession {
  isActive: boolean;
  monitoringId: string;
  startedAt: string;
  superAdmin: {
    id?: string;
    username?: string;
    namaLengkap: string;
  };
  details?: any;
}

export interface AuditLogItem {
  id: string;
  userId: string;
  username: string | null;
  role: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  kotamaId: string | null;
  satminkalId: string | null;
  details: any;
  timestamp: string;
}

// Alias types for backward compatibility with components
export type SatminkalSummaryItem = KotamaSatminkalStat;
export type KotamaSummaryData = KotamaSummaryResponse;

// Cache last started monitoring IDs so endMonitoring can be called without args
let _lastMonitoringSatminkalId: string | null = null;
let _lastMonitoringKotamaId: string | null = null;

export const apiKotama = {
  getSummary: (kotamaId?: string): Promise<KotamaSummaryResponse> => {
    const q = kotamaId ? `?kotamaId=${encodeURIComponent(kotamaId)}` : '';
    return apiFetch<KotamaSummaryResponse>(`/kotama/dashboard/summary${q}`);
  },

  getCharts: (tahun?: number, kotamaId?: string): Promise<KotamaChartsResponse> => {
    const params = new URLSearchParams();
    if (tahun) params.append('tahun', String(tahun));
    if (kotamaId) params.append('kotamaId', kotamaId);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return apiFetch<KotamaChartsResponse>(`/kotama/dashboard/charts${qs}`);
  },

  getSatminkalList: (): Promise<KotamaSatminkalStat[]> => {
    return apiFetch<KotamaSatminkalStat[]>('/kotama/satminkal');
  },

  createSatminkal: (dto: CreateKotamaSatminkalDto): Promise<{ message: string; satminkal: any; admin?: any }> => {
    return apiFetch<{ message: string; satminkal: any; admin?: any }>('/kotama/satminkal', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  updateSatminkal: (id: string, dto: { nama?: string; status?: boolean }): Promise<{ message: string; satminkal: any }> => {
    return apiFetch<{ message: string; satminkal: any }>(`/kotama/satminkal/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  },

  startMonitoring: (satminkalId: string, catatan?: string): Promise<{
    message: string;
    monitoringId: string;
    satminkal: { id: string; kode: string; nama: string };
    kotama: { id: string; nama: string };
    startedAt: string;
  }> => {
    _lastMonitoringSatminkalId = satminkalId;
    return apiFetch('/kotama/monitoring/start', {
      method: 'POST',
      body: JSON.stringify({ satminkalId, catatan }),
    });
  },

  startMonitoringAndCache: (satminkalId: string, catatan?: string) => {
    _lastMonitoringSatminkalId = satminkalId;
    return apiFetch<{
      message: string;
      monitoringId: string;
      satminkal: { id: string; kode: string; nama: string };
      kotama: { id: string; nama: string };
      startedAt: string;
    }>('/kotama/monitoring/start', {
      method: 'POST',
      body: JSON.stringify({ satminkalId, catatan }),
    });
  },

  endMonitoring: (satminkalId?: string): Promise<{ message: string; endedAt: string }> => {
    const id = satminkalId || _lastMonitoringSatminkalId || '';
    _lastMonitoringSatminkalId = null;
    return apiFetch('/kotama/monitoring/end', {
      method: 'POST',
      body: JSON.stringify({ satminkalId: id }),
    });
  },

  getActiveMonitoring: (satminkalId: string): Promise<ActiveMonitoringSession | null> => {
    return apiFetch<ActiveMonitoringSession | null>(`/kotama/monitoring/active/${satminkalId}`);
  },

  // Super Admin -> Kotama Monitoring
  startKotamaMonitoring: (kotamaId: string, catatan?: string): Promise<{
    message: string;
    monitoringId: string;
    kotama: { id: string; kode: string; nama: string };
    startedAt: string;
  }> => {
    _lastMonitoringKotamaId = kotamaId;
    return apiFetch('/kotama/monitoring/kotama/start', {
      method: 'POST',
      body: JSON.stringify({ kotamaId, catatan }),
    });
  },

  endKotamaMonitoring: (kotamaId?: string): Promise<{ message: string; endedAt: string }> => {
    const id = kotamaId || _lastMonitoringKotamaId || '';
    _lastMonitoringKotamaId = null;
    return apiFetch('/kotama/monitoring/kotama/end', {
      method: 'POST',
      body: JSON.stringify({ kotamaId: id }),
    });
  },

  getActiveKotamaMonitoring: (kotamaId: string): Promise<ActiveKotamaMonitoringSession | null> => {
    return apiFetch<ActiveKotamaMonitoringSession | null>(`/kotama/monitoring/kotama/active/${kotamaId}`);
  },

  getAuditLogs: (limit = 50): Promise<AuditLogItem[]> => {
    return apiFetch<AuditLogItem[]>(`/kotama/audit-logs?limit=${limit}`);
  },
};
