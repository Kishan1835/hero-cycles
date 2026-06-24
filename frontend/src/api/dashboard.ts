import { apiClient } from './client';
import { DashboardSummary, User } from '../types/domain';

export const dashboardApi = {
  getSummary: () => apiClient.get<DashboardSummary>('/dashboard/summary').then((r) => r.data),
};

export const adminApi = {
  listUsers: () => apiClient.get<User[]>('/admin/users').then((r) => r.data),
  setActive: (id: string, isActive: boolean) =>
    apiClient.patch<User>(`/admin/users/${id}/active`, { isActive }).then((r) => r.data),
  updateRole: (id: string, role: string) =>
    apiClient.patch<User>(`/admin/users/${id}/role`, { role }).then((r) => r.data),
};
