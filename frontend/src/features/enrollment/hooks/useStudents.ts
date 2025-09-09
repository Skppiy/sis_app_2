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
import { queryKeys } from '@/api/queryKeys';

// Hook to list students
export function useStudents(filters?: {
  school_id?: string;
  grade_level?: string;
  is_active?: boolean;
}) {
  return useQuery({
    queryKey: queryKeys.students.list(filters),
    queryFn: () => listStudents(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to get a specific student
export function useStudent(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.students.detail(id!),
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
    onMutate: async (newStudent) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.students.lists() });
      
      // Snapshot the previous value
      const previousStudents = queryClient.getQueriesData({ queryKey: queryKeys.students.lists() });
      
      // Optimistically update to the new value
      queryClient.setQueriesData({ queryKey: queryKeys.students.lists() }, (old: any) => {
        if (!old) return old;
        
        // Create temporary student for optimistic update
        const tempStudent = {
          id: `temp-${Date.now()}`,
          school_id: '', // Will be filled by backend
          first_name: newStudent.first_name,
          last_name: newStudent.last_name,
          email: newStudent.email,
          date_of_birth: newStudent.date_of_birth,
          student_id: newStudent.student_id || 'Pending...',
          entry_date: newStudent.entry_date,
          entry_grade_level: newStudent.entry_grade_level,
          current_grade_level: newStudent.entry_grade_level,
          is_active: true,
        };
        
        return [tempStudent, ...old];
      });
      
      return { previousStudents };
    },
    onError: (err, newStudent, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousStudents) {
        context.previousStudents.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.students.lists() });
    },
  });
}

// Hook to update a student
export function useUpdateStudent(id: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (payload: StudentUpdate) => updateStudent(id, payload),
    onMutate: async (updatedStudent) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.students.detail(id) });
      await queryClient.cancelQueries({ queryKey: queryKeys.students.lists() });
      
      // Snapshot the previous values
      const previousStudent = queryClient.getQueryData(queryKeys.students.detail(id));
      const previousStudents = queryClient.getQueriesData({ queryKey: queryKeys.students.lists() });
      
      // Optimistically update the individual student
      queryClient.setQueryData(queryKeys.students.detail(id), (old: any) => {
        if (!old) return old;
        return { ...old, ...updatedStudent };
      });
      
      // Optimistically update student in lists
      queryClient.setQueriesData({ queryKey: queryKeys.students.lists() }, (old: any) => {
        if (!old) return old;
        return old.map((student: any) => 
          student.id === id ? { ...student, ...updatedStudent } : student
        );
      });
      
      return { previousStudent, previousStudents };
    },
    onError: (err, updatedStudent, context) => {
      // Rollback on error
      if (context?.previousStudent) {
        queryClient.setQueryData(queryKeys.students.detail(id), context.previousStudent);
      }
      if (context?.previousStudents) {
        context.previousStudents.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.students.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.students.lists() });
    },
  });
}

// Hook to delete a student
export function useDeleteStudent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students.lists() });
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
    queryKey: queryKeys.students.enrollments(studentId!),
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
    onMutate: async (enrollmentData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: queryKeys.students.enrollments(enrollmentData.student_id) 
      });
      
      // Snapshot previous enrollments
      const previousEnrollments = queryClient.getQueryData(
        queryKeys.students.enrollments(enrollmentData.student_id)
      );
      
      // Optimistically add the new enrollment
      queryClient.setQueryData(
        queryKeys.students.enrollments(enrollmentData.student_id),
        (old: any) => {
          if (!old) return old;
          
          const tempEnrollment = {
            id: `temp-enrollment-${Date.now()}`,
            student_id: enrollmentData.student_id,
            classroom_id: enrollmentData.classroom_id,
            grade_level: enrollmentData.grade_level,
            enrollment_date: enrollmentData.enrollment_date || new Date().toISOString(),
            withdrawal_date: null,
            enrollment_status: 'ACTIVE',
            is_active: true,
            withdrawal_reason: null,
            is_audit_only: false,
            requires_accommodation: false,
          };
          
          return [tempEnrollment, ...old];
        }
      );
      
      return { previousEnrollments };
    },
    onError: (err, enrollmentData, context) => {
      // Rollback optimistic update
      if (context?.previousEnrollments) {
        queryClient.setQueryData(
          queryKeys.students.enrollments(enrollmentData.student_id),
          context.previousEnrollments
        );
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate the student's enrollment list
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.students.enrollments(variables.student_id) 
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
        queryKey: queryKeys.students.enrollments(studentId) 
      });
    },
  });
}

// Hook to get next student ID
export function useNextStudentId(schoolId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.students.nextId(schoolId!),
    queryFn: () => getNextStudentId(schoolId!),
    enabled: !!schoolId,
    staleTime: 0, // Always fresh
  });
}