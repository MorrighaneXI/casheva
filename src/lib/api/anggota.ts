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
  findAll: async (hanyaAktif?: boolean): Promise<Anggota[]> => {
    const localCache = getLocalAnggotaCache();
    try {
      const query = hanyaAktif !== undefined ? `?hanyaAktif=${hanyaAktif}` : '';
      const serverList = await api.get<Anggota[]>(`/anggota${query}`);
      
      // Merge server list with local created members if any
      const map = new Map<string, Anggota>();
      serverList.forEach((a) => map.set(a.nrpNip, a));
      localCache.forEach((a) => {
        if (!map.has(a.nrpNip)) {
          map.set(a.nrpNip, a);
        }
      });
      const merged = Array.from(map.values());
      saveLocalAnggotaCache(merged);
      return merged;
    } catch {
      // Fallback to local cache if offline
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
      created = {
        id: `ang-${Date.now()}`,
        nama: dto.nama,
        nrpNip: dto.nrpNip,
        pangkatId: dto.pangkatId,
        korpsId: dto.korpsId,
        satminkalId: 'satminkal-1',
        isAktif: true,
        tmtAnggota: dto.tmtAnggota || new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        satminkal: {
          id: 'satminkal-1',
          kode: 'INFOLAHTA',
          nama: 'INFOLAHTADAM IV/DIPONEGORO',
          kotamaId: 'kotama-1',
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
