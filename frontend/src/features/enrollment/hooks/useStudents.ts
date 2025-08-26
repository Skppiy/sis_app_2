// src/features/enrollment/hooks/useStudents.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  listStudents, 
  getStudent, 
  createStudent, 
  updateStudent, 
  deleteStudent,
  getStudentEnrollments,
  enrollStudent,
  withdrawEnrollment,
  getNextStudentId
} from '../services/students';
import type { StudentCreate, StudentUpdate } from '@/schemas/students';

// Query keys
export const studentKeys = {
  all: ['students'] as const,
  lists: () => [...studentKeys.all, 'list'] as const,
  list: (filters?: any) => [...studentKeys.lists(), filters] as const,
  details: () => [...studentKeys.all, 'detail'] as const,
  detail: (id: string) => [...studentKeys.details(), id] as const,
  enrollments: (studentId: string) => [...studentKeys.all, 'enrollments', studentId] as const,
  nextId: (schoolId: string) => [...studentKeys.all, 'nextId', schoolId] as const,
};

// Hook to list students
export function useStudents(filters?: {
  school_id?: string;
  grade_level?: string;
  is_active?: boolean;
}) {
  return useQuery({
    queryKey: studentKeys.list(filters),
    queryFn: () => listStudents(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to get a specific student
export function useStudent(id: string | undefined) {
  return useQuery({
    queryKey: studentKeys.detail(id!),
    queryFn: () => getStudent(id!),
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
export function useUpdateStudent(id: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (payload: StudentUpdate) => updateStudent(id, payload),
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
export function useStudentEnrollments(
  studentId: string | undefined,
  params?: {
    academic_year_id?: string;
    active_only?: boolean;
  }
) {
  return useQuery({
    queryKey: studentKeys.enrollments(studentId!),
    queryFn: () => getStudentEnrollments(studentId!, params),
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
      // Invalidate the student's enrollment list
      queryClient.invalidateQueries({ 
        queryKey: studentKeys.enrollments(variables.student_id) 
      });
      // Also invalidate classroom rosters if needed
      queryClient.invalidateQueries({ 
        queryKey: ['classrooms', 'roster', variables.classroom_id] 
      });
    },
  });
}

// Hook to withdraw an enrollment
export function useWithdrawEnrollment(studentId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: withdrawEnrollment,
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: studentKeys.enrollments(studentId) 
      });
    },
  });
}

// Hook to get next student ID
export function useNextStudentId(schoolId: string | undefined) {
  return useQuery({
    queryKey: studentKeys.nextId(schoolId!),
    queryFn: () => getNextStudentId(schoolId!),
    enabled: !!schoolId,
    staleTime: 0, // Always fresh
  });
}