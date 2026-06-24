import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { configurationsApi, CreateConfigurationInput } from '../api/configurations';

export function useConfigurations(params: { isActive?: boolean; search?: string; page?: number }) {
  return useQuery({
    queryKey: ['configurations', params],
    queryFn: () => configurationsApi.list(params),
  });
}

export function useConfiguration(id: string | undefined) {
  return useQuery({
    queryKey: ['configurations', id],
    queryFn: () => configurationsApi.getById(id as string),
    enabled: !!id,
  });
}

export function useCreateConfiguration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateConfigurationInput) => configurationsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configurations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteConfiguration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: configurationsApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['configurations'] }),
  });
}

export function useUpdateConfigurationParts(configId: string) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['configurations', configId] });
    queryClient.invalidateQueries({ queryKey: ['pricing', 'calculate', configId] });
  };

  const addPart = useMutation({
    mutationFn: ({ partId, quantity }: { partId: string; quantity: number }) =>
      configurationsApi.addPart(configId, partId, quantity),
    onSuccess: invalidate,
  });

  const updatePart = useMutation({
    mutationFn: ({ partId, quantity }: { partId: string; quantity: number }) =>
      configurationsApi.updatePart(configId, partId, quantity),
    onSuccess: invalidate,
  });

  const removePart = useMutation({
    mutationFn: (partId: string) => configurationsApi.removePart(configId, partId),
    onSuccess: invalidate,
  });

  return { addPart, updatePart, removePart };
}
