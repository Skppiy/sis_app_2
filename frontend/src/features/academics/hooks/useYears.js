// src/features/academics/hooks/useYears.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listYears, getYear, createYear, updateYear, deleteYear } from '../services/years';
import { queryKeys } from '@/api/queryKeys';
// Hook to list years
export function useYears(filters) {
    return useQuery({
        queryKey: queryKeys.years.list(filters),
        queryFn: () => listYears(filters),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}
// Hook to get a specific year
export function useYear(id) {
    return useQuery({
        queryKey: queryKeys.years.detail(id),
        queryFn: () => getYear(id),
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
    });
}
// Hook to create a year
export function useCreateYear() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createYear,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.years.lists() });
        },
    });
}
// Hook to update a year
export function useUpdateYear(id) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload) => updateYear(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.years.detail(id) });
            queryClient.invalidateQueries({ queryKey: queryKeys.years.lists() });
        },
    });
}
// Hook to delete a year
export function useDeleteYear() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteYear,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.years.lists() });
        },
    });
}
