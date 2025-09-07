// src/features/enrollment/hooks/useStudents.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listStudents, getStudent, createStudent, updateStudent, deleteStudent, getStudentEnrollments, enrollStudent, withdrawEnrollment, getNextStudentId } from '../services/students';
// Query keys
export const studentKeys = {
    all: ['students'],
    lists: () => [...studentKeys.all, 'list'],
    list: (filters) => [...studentKeys.lists(), filters],
    details: () => [...studentKeys.all, 'detail'],
    detail: (id) => [...studentKeys.details(), id],
    enrollments: (studentId, params) => [...studentKeys.all, 'enrollments', studentId, params],
    nextId: (schoolId) => [...studentKeys.all, 'nextId', schoolId],
};
// Hook to list students
export function useStudents(filters) {
    return useQuery({
        queryKey: studentKeys.list(filters),
        queryFn: () => listStudents(filters),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}
// Hook to get a specific student
export function useStudent(id) {
    return useQuery({
        queryKey: studentKeys.detail(id),
        queryFn: () => getStudent(id),
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
    });
}
// Hook to create a student
export function useCreateStudent() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createStudent,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
        },
    });
}
// Hook to update a student
export function useUpdateStudent(id) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload) => updateStudent(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: studentKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
        },
    });
}
// Hook to delete a student
export function useDeleteStudent() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteStudent,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
        },
    });
}
// Hook to get student enrollments
export function useStudentEnrollments(studentId, params) {
    return useQuery({
        queryKey: studentKeys.enrollments(studentId, params),
        queryFn: () => getStudentEnrollments(studentId, params),
        enabled: !!studentId,
        staleTime: 5 * 60 * 1000,
    });
}
// Hook to enroll a student
export function useEnrollStudent() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: enrollStudent,
        onSuccess: (_, variables) => {
            // Invalidate all enrollment queries for this student
            queryClient.invalidateQueries({
                queryKey: [...studentKeys.all, 'enrollments', variables.student_id]
            });
            // Also invalidate classroom rosters if needed
            queryClient.invalidateQueries({
                queryKey: ['classrooms', 'roster', variables.classroom_id]
            });
        },
    });
}
// Hook to withdraw an enrollment
export function useWithdrawEnrollment(studentId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: withdrawEnrollment,
        onSuccess: () => {
            // Invalidate all enrollment queries for this student  
            queryClient.invalidateQueries({
                queryKey: [...studentKeys.all, 'enrollments', studentId]
            });
        },
    });
}
// Hook to get next student ID
export function useNextStudentId(schoolId) {
    return useQuery({
        queryKey: studentKeys.nextId(schoolId),
        queryFn: () => getNextStudentId(schoolId),
        enabled: !!schoolId,
        staleTime: 0, // Always fresh
    });
}
