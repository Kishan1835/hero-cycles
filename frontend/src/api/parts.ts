import { apiClient } from './client';
import { Part, PaginatedResult } from '../types/domain';

export interface ListPartsParams {
  category?: string;
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export const partsApi = {
  list: (params: ListPartsParams) =>
    apiClient.get<PaginatedResult<Part>>('/parts', { params }).then((r) => r.data),

  getById: (id: string) => apiClient.get<Part>(`/parts/${id}`).then((r) => r.data),

  create: (data: {
    name: string;
    category: string;
    sku: string;
    status?: string;
    initialCost: number;
    effectiveDate?: string;
  }) => apiClient.post<Part>('/parts', data).then((r) => r.data),

  update: (id: string, data: Partial<{ name: string; category: string; status: string }>) =>
    apiClient.patch<Part>(`/parts/${id}`, data).then((r) => r.data),

  delete: (id: string) => apiClient.delete(`/parts/${id}`),
};
