// src/features/academics/hooks/useClassrooms.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClassroom, deleteClassroom, listClassrooms, updateClassroom, getClassroom } from "../services/classrooms";
// Query keys
export const classroomKeys = {
    all: ['classrooms'],
    lists: () => [...classroomKeys.all, 'list'],
    list: (filters) => [...classroomKeys.lists(), filters],
    details: () => [...classroomKeys.all, 'detail'],
    detail: (id) => [...classroomKeys.details(), id],
};
export function useClassrooms(params) {
    return useQuery({
        queryKey: classroomKeys.list(params),
        queryFn: () => listClassrooms(params),
        staleTime: 60_000,
    });
}
export function useClassroom(id) {
    return useQuery({
        queryKey: classroomKeys.detail(id),
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
            qc.invalidateQueries({ queryKey: classroomKeys.lists() });
        },
    });
}
export function useUpdateClassroom(id) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload) => updateClassroom(id, payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: classroomKeys.detail(id) });
            qc.invalidateQueries({ queryKey: classroomKeys.lists() });
        },
    });
}
export function useDeleteClassroom() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id) => deleteClassroom(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: classroomKeys.lists() });
        },
    });
}
