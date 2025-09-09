// src/features/academics/hooks/useTeachers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  listTeachers, 
  createTeacher, 
  updateTeacher, 
  deleteTeacher
} from '../services/teachers';
import type { Teacher } from '@/schemas/academics';
import { queryKeys } from '@/api/queryKeys';

// Hook to list teachers
export function useTeachers(filters?: {
  school_id?: string;
  is_active?: boolean;
  grade_level?: string;
  is_specialist?: boolean;
}) {
  return useQuery({
    queryKey: queryKeys.teachers.list(filters),
    queryFn: () => listTeachers(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to create a teacher
export function useCreateTeacher() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createTeacher,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teachers.lists() });
    },
  });
}

// Hook to update a teacher
export function useUpdateTeacher(id: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (payload: Partial<Teacher>) => updateTeacher(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teachers.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.teachers.lists() });
    },
  });
}

// Hook to delete a teacher
export function useDeleteTeacher() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteTeacher,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teachers.lists() });
    },
  });
}