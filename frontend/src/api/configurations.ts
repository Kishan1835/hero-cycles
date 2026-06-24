import { apiClient } from './client';
import { BicycleConfiguration, PaginatedResult } from '../types/domain';

export interface CreateConfigurationInput {
  name: string;
  description?: string;
  modelCode: string;
  parts: { partId: string; quantity: number }[];
}

export const configurationsApi = {
  list: (params: { isActive?: boolean; search?: string; page?: number; pageSize?: number }) =>
    apiClient
      .get<PaginatedResult<BicycleConfiguration>>('/configurations', { params })
      .then((r) => r.data),

  getById: (id: string) => apiClient.get<BicycleConfiguration>(`/configurations/${id}`).then((r) => r.data),

  create: (data: CreateConfigurationInput) =>
    apiClient.post<BicycleConfiguration>('/configurations', data).then((r) => r.data),

  update: (id: string, data: Partial<{ name: string; description: string; isActive: boolean }>) =>
    apiClient.patch<BicycleConfiguration>(`/configurations/${id}`, data).then((r) => r.data),

  delete: (id: string) => apiClient.delete(`/configurations/${id}`),

  addPart: (id: string, partId: string, quantity: number) =>
    apiClient.post<BicycleConfiguration>(`/configurations/${id}/parts`, { partId, quantity }).then((r) => r.data),

  updatePart: (id: string, partId: string, quantity: number) =>
    apiClient
      .patch<BicycleConfiguration>(`/configurations/${id}/parts/${partId}`, { quantity })
      .then((r) => r.data),

  removePart: (id: string, partId: string) =>
    apiClient.delete<BicycleConfiguration>(`/configurations/${id}/parts/${partId}`).then((r) => r.data),
};
