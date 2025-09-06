// src/features/academics/hooks/useSubjects.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  listSubjects, 
  createSubject, 
  updateSubject, 
  deleteSubject
} from '../services/subjects';
import type { Subject } from '@/schemas/academics';

// Query keys
export const subjectKeys = {
  all: ['subjects'] as const,
  lists: () => [...subjectKeys.all, 'list'] as const,
  list: (filters?: any) => [...subjectKeys.lists(), filters] as const,
  details: () => [...subjectKeys.all, 'detail'] as const,
  detail: (id: string) => [...subjectKeys.details(), id] as const,
};

// Hook to list subjects
export function useSubjects(filters?: {
  school_id?: string;
  is_active?: boolean;
  grade_band?: string;
  subject_type?: string;
}) {
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
export function useUpdateSubject(id: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (payload: Partial<Subject>) => updateSubject(id, payload),
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