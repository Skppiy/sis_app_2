import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  autoEnrollStudentInHomeroom,
  getStudentSubjectEnrollments,
  bulkEnrollStudents,
  removeStudentEnrollment,
  syncStudentWithHomeroom,
  getEnrollmentConflicts,
  resolveEnrollmentConflicts
} from '../services/studentSubjectEnrollments';
import { queryKeys } from '@/api/queryKeys';
import type { 
  BulkEnrollmentRequest,
  EnrollmentConflict
} from '@/schemas/students';

// Query student's current subject enrollments
export const useStudentEnrollments = (studentId: string) => {
  return useQuery({
    queryKey: queryKeys.students.enrollments(studentId),
    queryFn: () => getStudentSubjectEnrollments(studentId),
    enabled: !!studentId,
  });
};

// Mutation for auto-enrollment in homeroom CORE subjects
export const useAutoEnrollStudent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ studentId, homeroomId }: { studentId: string; homeroomId: string }) =>
      autoEnrollStudentInHomeroom(studentId, homeroomId),
    onSuccess: (data, { studentId }) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.students.enrollments(studentId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.students.detail(studentId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.homeroom.conflicts() });
    },
  });
};

// Mutation for bulk enrollment operations
export const useBulkEnrollStudents = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (request: BulkEnrollmentRequest) => bulkEnrollStudents(request),
    onSuccess: (data) => {
      // Invalidate enrollment-related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.students.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.homeroom.conflicts() });
      
      // Invalidate specific student enrollments if provided
      if (data.processed_students) {
        data.processed_students.forEach(studentId => {
          queryClient.invalidateQueries({ queryKey: queryKeys.students.enrollments(studentId) });
        });
      }
    },
  });
};

// Mutation for removing enrollment
export const useRemoveEnrollment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ studentId, enrollmentId }: { studentId: string; enrollmentId: string }) =>
      removeStudentEnrollment(studentId, enrollmentId),
    onSuccess: (data, { studentId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students.enrollments(studentId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.students.detail(studentId) });
    },
  });
};

// Mutation for syncing student with homeroom
export const useSyncWithHomeroom = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (studentId: string) => syncStudentWithHomeroom(studentId),
    onSuccess: (data, studentId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students.enrollments(studentId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.students.detail(studentId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.homeroom.conflicts() });
    },
  });
};

// Query enrollment conflicts
export const useEnrollmentConflicts = (grade?: string) => {
  return useQuery({
    queryKey: queryKeys.homeroom.conflicts(grade),
    queryFn: () => getEnrollmentConflicts(grade),
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });
};

// Mutation for resolving enrollment conflicts
export const useResolveConflicts = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (conflicts: string[]) => resolveEnrollmentConflicts(conflicts),
    onSuccess: () => {
      // Invalidate all enrollment-related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.homeroom.conflicts() });
      queryClient.invalidateQueries({ queryKey: queryKeys.students.list() });
    },
  });
};

// Helper hook to check if student needs enrollment sync
export const useStudentEnrollmentStatus = (studentId: string) => {
  const { data: enrollments, isLoading } = useStudentEnrollments(studentId);
  
  return {
    enrollments,
    isLoading,
    needsSync: enrollments?.some(enrollment => enrollment.enrollment_status !== 'ACTIVE') ?? false,
    coreSubjectsCount: enrollments?.filter(e => 
      e.enrollment_status === 'ACTIVE' && e.subject?.code && ['MATH', 'ELA', 'SCIENCE', 'SOCIAL_STUDIES', 'READING'].includes(e.subject.code)
    ).length ?? 0,
    hasAllCoreSubjects: (enrollments?.filter(e => 
      e.enrollment_status === 'ACTIVE' && e.subject?.code && ['MATH', 'ELA', 'SCIENCE', 'SOCIAL_STUDIES', 'READING'].includes(e.subject.code)
    ).length ?? 0) >= 5
  };
};