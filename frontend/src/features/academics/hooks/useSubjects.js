// src/features/academics/hooks/useSubjects.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listSubjects, createSubject, updateSubject, deleteSubject } from '../services/subjects';
// Query keys
export const subjectKeys = {
    all: ['subjects'],
    lists: () => [...subjectKeys.all, 'list'],
    list: (filters) => [...subjectKeys.lists(), filters],
    details: () => [...subjectKeys.all, 'detail'],
    detail: (id) => [...subjectKeys.details(), id],
};
// Hook to list subjects
export function useSubjects(filters) {
    return useQuery({
        queryKey: subjectKeys.list(filters),
        queryFn: () => listSubjects(filters),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}
// Hook to create a subject
export function useCreateSubject() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createSubject,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: subjectKeys.lists() });
        },
    });
}
// Hook to update a subject
export function useUpdateSubject(id) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload) => updateSubject(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: subjectKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: subjectKeys.lists() });
        },
    });
}
// Hook to delete a subject
export function useDeleteSubject() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteSubject,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: subjectKeys.lists() });
        },
    });
}
