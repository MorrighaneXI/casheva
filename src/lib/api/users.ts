import { api } from './client';
import type { BackendRole, UserItem } from './types';

export interface CreateUserDto {
  username: string;
  password?: string;
  namaLengkap: string;
  role: BackendRole;
  kotamaId: string;
  satminkalId: string;
}

export interface UpdateUserDto {
  username?: string;
  password?: string;
  namaLengkap?: string;
  role?: BackendRole;
  kotamaId?: string;
  satminkalId?: string;
  isActive?: boolean;
}

export const apiUsers = {
  findAll: async (): Promise<UserItem[]> => {
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
};
