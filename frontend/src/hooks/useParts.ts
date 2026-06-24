import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { partsApi, ListPartsParams } from '../api/parts';

export function useParts(params: ListPartsParams) {
  return useQuery({
    queryKey: ['parts', params],
    queryFn: () => partsApi.list(params),
  });
}

export function usePart(id: string | undefined) {
  return useQuery({
    queryKey: ['parts', id],
    queryFn: () => partsApi.getById(id as string),
    enabled: !!id,
  });
}

export function useCreatePart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: partsApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['parts'] }),
  });
}

export function useUpdatePart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof partsApi.update>[1] }) =>
      partsApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['parts'] }),
  });
}

export function useDeletePart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: partsApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['parts'] }),
  });
}
