import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pricingApi } from '../api/pricing';

export function usePriceHistory(partId: string | undefined) {
  return useQuery({
    queryKey: ['pricing', 'history', partId],
    queryFn: () => pricingApi.getHistory(partId as string),
    enabled: !!partId,
  });
}

export function useAddPrice(partId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cost, effectiveDate, note }: { cost: number; effectiveDate: string; note?: string }) =>
      pricingApi.addPrice(partId, cost, effectiveDate, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing', 'history', partId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useConfigurationPrice(configId: string | undefined, date?: string) {
  return useQuery({
    queryKey: ['pricing', 'calculate', configId, date],
    queryFn: () => pricingApi.calculateConfigurationPrice(configId as string, date),
    enabled: !!configId,
  });
}
