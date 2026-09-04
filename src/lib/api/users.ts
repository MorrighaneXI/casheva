import { api } from './client';
import type { BackendRole, UserItem } from './types';

export interface CreateUserDto {
  username: string;
  password?: string | undefined;
  namaLengkap?: string | undefined;
  pangkatId?: string | undefined;
  korpsId?: string | undefined;
  nrpNip?: string | undefined;
  role: BackendRole;
  kotamaId?: string | undefined;
  satminkalId?: string | undefined;
  email?: string | undefined;
  phone?: string | undefined;
}

export interface UpdateUserDto {
  username?: string | undefined;
  password?: string | undefined;
  namaLengkap?: string | undefined;
  role?: BackendRole | undefined;
  kotamaId?: string | undefined;
  satminkalId?: string | undefined;
  isActive?: boolean | undefined;
  isAktif?: boolean | undefined;
  email?: string | undefined;
  phone?: string | undefined;
}

export const apiUsers = {
  findAll: async (): Promise<UserItem[]> => {
    return api.get<UserItem[]>('/users');
  },

  list: async (): Promise<UserItem[]> => {
    return api.get<UserItem[]>('/users');
  },

  findOne: async (id: string): Promise<UserItem> => {
    return api.get<UserItem>(`/users/${id}`);
  },

  create: async (dto: CreateUserDto): Promise<UserItem> => {
    return api.post<UserItem>('/users', dto);
  },

  update: async (id: string, dto: UpdateUserDto): Promise<UserItem> => {
    return api.patch<UserItem>(`/users/${id}`, dto);
  },

  remove: async (id: string): Promise<UserItem> => {
    return api.delete<UserItem>(`/users/${id}`);
  },

  deactivate: async (id: string): Promise<any> => {
    return api.delete<any>(`/users/${id}`);
  },

  toggleAktif: async (id: string): Promise<any> => {
    return api.patch<any>(`/users/${id}/toggle-status`, {});
  },

  resetPassword: async (id: string, body: any): Promise<any> => {
    return api.post<any>(`/users/${id}/reset-password`, body);
  },
};
