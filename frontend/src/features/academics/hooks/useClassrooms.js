// src/features/academics/hooks/useClassrooms.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClassroom, deleteClassroom, listClassrooms, updateClassroom, getClassroom } from "../services/classrooms";
import { queryKeys } from '@/api/queryKeys';
export function useClassrooms(params) {
    return useQuery({
        queryKey: queryKeys.classrooms.list(params),
        queryFn: () => listClassrooms(params),
        staleTime: 60_000,
    });
}
export function useClassroom(id) {
    return useQuery({
        queryKey: queryKeys.classrooms.detail(id),
        queryFn: () => getClassroom(id),
        enabled: !!id,
        staleTime: 60_000,
    });
}
export function useCreateClassroom() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload) => createClassroom(payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: queryKeys.classrooms.lists() });
        },
    });
}
export function useUpdateClassroom(id) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload) => updateClassroom(id, payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: queryKeys.classrooms.detail(id) });
            qc.invalidateQueries({ queryKey: queryKeys.classrooms.lists() });
        },
    });
}
export function useDeleteClassroom() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id) => deleteClassroom(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: queryKeys.classrooms.lists() });
        },
    });
}
