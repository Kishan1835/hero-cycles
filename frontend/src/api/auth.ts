import { apiClient } from './client';
import { User } from '../types/domain';

export interface LoginResponse {
  token: string;
  user: User;
}

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<LoginResponse>('/auth/login', { email, password }).then((r) => r.data),

  register: (name: string, email: string, password: string, role: string) =>
    apiClient.post<LoginResponse>('/auth/register', { name, email, password, role }).then((r) => r.data),

  me: () => apiClient.get<{ user: User }>('/auth/me').then((r) => r.data.user),
};
