import { api } from './client';
import type { Anggota, BackendRole } from './types';

export interface CreateAnggotaDto {
  nrpNip: string;
  nama: string;
  pangkatId: string;
  korpsId: string;
  tmtAnggota?: string | undefined;
  role?: BackendRole | undefined;
  password?: string | undefined;
}

export interface UpdateAnggotaDto {
  nrpNip?: string | undefined;
  nama?: string | undefined;
  pangkatId?: string | undefined;
  korpsId?: string | undefined;
  isAktif?: boolean | undefined;
  tmtAnggota?: string | undefined;
  role?: BackendRole | undefined;
  password?: string | undefined;
}

const CACHE_KEY = 'casheva.anggota_cache';

function getLocalAnggotaCache(): Anggota[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalAnggotaCache(list: Anggota[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(list));
  } catch {}
}

export const apiAnggota = {
  findAll: async (hanyaAktif?: boolean, satminkalId?: string): Promise<Anggota[]> => {
    try {
      const params = new URLSearchParams();
      if (hanyaAktif !== undefined) params.set('hanyaAktif', String(hanyaAktif));
      if (satminkalId) params.set('satminkalId', satminkalId);
      const qs = params.toString() ? `?${params.toString()}` : '';
      const serverList = await api.get<Anggota[]>(`/anggota${qs}`);
      // Save server response as cache for offline use (replaces stale data)
      saveLocalAnggotaCache(serverList);
      return serverList;
    } catch {
      // Fallback to local cache only if backend is unreachable
      const localCache = getLocalAnggotaCache();
      return hanyaAktif ? localCache.filter((a) => a.isAktif) : localCache;
    }
  },

  findOne: async (id: string): Promise<Anggota> => {
    try {
      const res = await api.get<Anggota>(`/anggota/${id}`);
      return res;
    } catch {
      const localCache = getLocalAnggotaCache();
      const found = localCache.find((a) => a.id === id || a.nrpNip === id);
      if (found) return found;
      throw new Error('Anggota tidak ditemukan');
    }
  },

  create: async (dto: CreateAnggotaDto): Promise<Anggota> => {
    let created: Anggota;
    try {
      created = await api.post<Anggota>('/anggota', dto);
    } catch {
      // Create locally if backend unreachable
      let sessionUser: any = null;
      try {
        const raw = typeof window !== 'undefined' ? localStorage.getItem('casheva.user') : null;
        if (raw) sessionUser = JSON.parse(raw);
      } catch {}
      const satId = sessionUser?.satminkalId || 'satminkal-1';
      const satNama = sessionUser?.satminkal || 'INFOLAHTADAM IV/DIPONEGORO';
      const kotId = sessionUser?.kotamaId || 'kotama-1';

      created = {
        id: `ang-${Date.now()}`,
        nama: dto.nama,
        nrpNip: dto.nrpNip,
        pangkatId: dto.pangkatId,
        korpsId: dto.korpsId,
        satminkalId: satId,
        isAktif: true,
        tmtAnggota: dto.tmtAnggota || new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        satminkal: {
          id: satId,
          kode: satNama.split(' ')[0] || 'SAT',
          nama: satNama,
          kotamaId: kotId,
        },
      };
    }

    const localCache = getLocalAnggotaCache();
    const updated = [created, ...localCache.filter((a) => a.nrpNip !== created.nrpNip)];
    saveLocalAnggotaCache(updated);
    return created;
  },

  update: async (id: string, dto: UpdateAnggotaDto): Promise<Anggota> => {
    let updatedRes: Anggota;
    try {
      updatedRes = await api.patch<Anggota>(`/anggota/${id}`, dto);
    } catch {
      const localCache = getLocalAnggotaCache();
      const found = localCache.find((a) => a.id === id || a.nrpNip === id);
      if (found) {
        updatedRes = {
          ...found,
          ...(dto.nama ? { nama: dto.nama } : {}),
          ...(dto.nrpNip ? { nrpNip: dto.nrpNip } : {}),
          ...(dto.isAktif !== undefined ? { isAktif: dto.isAktif } : {}),
        };
      } else {
        throw new Error('Anggota tidak ditemukan');
      }
    }

    const localCache = getLocalAnggotaCache();
    const nextList = localCache.map((a) => (a.id === id || a.nrpNip === id ? { ...a, ...updatedRes } : a));
    saveLocalAnggotaCache(nextList);
    return updatedRes;
  },

  remove: async (id: string): Promise<Anggota> => {
    try {
      const res = await api.delete<Anggota>(`/anggota/${id}`);
      const localCache = getLocalAnggotaCache();
      saveLocalAnggotaCache(localCache.filter((a) => a.id !== id));
      return res;
    } catch {
      const localCache = getLocalAnggotaCache();
      const found = localCache.find((a) => a.id === id);
      saveLocalAnggotaCache(localCache.filter((a) => a.id !== id));
      return found as Anggota;
    }
  },
};
