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

// Query keys
export const classroomKeys = {
  all: ['classrooms'] as const,
  lists: () => [...classroomKeys.all, 'list'] as const,
  list: (filters?: any) => [...classroomKeys.lists(), filters] as const,
  details: () => [...classroomKeys.all, 'detail'] as const,
  detail: (id: string) => [...classroomKeys.details(), id] as const,
};

export function useClassrooms(params?: {
  academic_year_id?: string;
  subject_id?: string;
  teacher_user_id?: string;
}) {
  return useQuery({
    queryKey: classroomKeys.list(params),
    queryFn: () => listClassrooms(params),
    staleTime: 60_000,
  });
}

export function useClassroom(id: string | undefined) {
  return useQuery({
    queryKey: classroomKeys.detail(id!),
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
      qc.invalidateQueries({ queryKey: classroomKeys.lists() });
    },
  });
}

export function useUpdateClassroom(id: string) {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: (payload: ClassroomUpdate) => updateClassroom(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: classroomKeys.detail(id) });
      qc.invalidateQueries({ queryKey: classroomKeys.lists() });
    },
  });
}

export function useDeleteClassroom() {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteClassroom(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: classroomKeys.lists() });
    },
  });
}
