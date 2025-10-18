// src/features/academics/hooks/useClassrooms.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  createClassroom, 
  deleteClassroom, 
  listClassrooms, 
  updateClassroom,
  getClassroom 
} from "../services/classrooms";
import { ClassroomCreate, ClassroomUpdate } from "@schemas/academics";
import { queryKeys } from '@/api/queryKeys';

export function useClassrooms(params?: {
  academic_year_id?: string;
  subject_id?: string;
  teacher_user_id?: string;
  grade_level?: string;
}) {
  return useQuery({
    queryKey: queryKeys.classrooms.list(params),
    queryFn: () => listClassrooms(params),
    staleTime: 60_000,
  });
}

export function useClassroom(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.classrooms.detail(id!),
    queryFn: () => getClassroom(id!),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useCreateClassroom() {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: (payload: ClassroomCreate) => createClassroom(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.classrooms.lists() });
    },
  });
}

export function useUpdateClassroom(id: string) {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: (payload: ClassroomUpdate) => updateClassroom(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.classrooms.detail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.classrooms.lists() });
    },
  });
}

export function useDeleteClassroom() {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteClassroom(id),
    onSuccess: (data, id) => {
      // Invalidate both lists and detail queries
      qc.invalidateQueries({ queryKey: queryKeys.classrooms.lists() });
      qc.invalidateQueries({ queryKey: queryKeys.classrooms.detail(id) });
      
      // Force refetch with active type
      qc.invalidateQueries({ 
        queryKey: queryKeys.classrooms.lists(),
        refetchType: 'active'
      });
    },
    onError: (error) => {
      console.error('Delete classroom failed:', error);
    },
  });
}
