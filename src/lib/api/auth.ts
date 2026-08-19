import { api } from './client';
import type { BackendRole } from './types';

export interface LoginDto {
  username: string;
  password?: string;
}

export interface LoginResponse {
  message: string;
  accessToken: string;
  user: {
    id: string;
    namaLengkap: string;
    role: BackendRole;
    kotama: string | null;
    satminkal: string | null;
  };
}

export interface UserProfile {
  id?: string;
  sub?: string;
  username: string;
  namaLengkap?: string;
  role: BackendRole;
  kotamaId: string;
  satminkalId: string;
  kotama?: string;
  satminkal?: string;
}

export const apiAuth = {
  login: async (dto: LoginDto): Promise<LoginResponse> => {
    return api.post<LoginResponse>('/auth/login', dto);
  },

  getProfile: async (): Promise<UserProfile> => {
    return api.get<UserProfile>('/auth/profile');
  },
};
