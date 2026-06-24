import { apiClient } from './client';
import { PricePoint, ConfigurationPriceResult } from '../types/domain';

export const pricingApi = {
  getHistory: (partId: string, from?: string, to?: string) =>
    apiClient.get<PricePoint[]>(`/pricing/parts/${partId}/history`, { params: { from, to } }).then((r) => r.data),

  getPriceAsOf: (partId: string, date?: string) =>
    apiClient.get<PricePoint>(`/pricing/parts/${partId}/as-of`, { params: { date } }).then((r) => r.data),

  addPrice: (partId: string, cost: number, effectiveDate: string, note?: string) =>
    apiClient.post<PricePoint>(`/pricing/parts/${partId}`, { cost, effectiveDate, note }).then((r) => r.data),

  calculateConfigurationPrice: (configId: string, date?: string) =>
    apiClient
      .get<ConfigurationPriceResult>(`/pricing/configurations/${configId}/calculate`, { params: { date } })
      .then((r) => r.data),

  compareOverTime: (configId: string, date: string) =>
    apiClient
      .get(`/pricing/configurations/${configId}/compare`, { params: { date } })
      .then((r) => r.data as { current: ConfigurationPriceResult; historical: ConfigurationPriceResult; difference: number; percentChange: number | null }),
};
