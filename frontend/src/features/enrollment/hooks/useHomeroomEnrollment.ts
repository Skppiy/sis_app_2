// src/features/enrollment/hooks/useHomeroomEnrollment.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  autoEnrollStudentsInCoreSubjects,
  getTeacherAssignedSubjects,
  type AutoEnrollStudentsRequest,
  type AutoEnrollResponse,
  type TeacherSubjects
} from '@/features/academics/services/homeroom';
import { listTeachers } from '@/features/academics/services/teachers';
import { apiFetch } from '@/api/requestHelper';
import { listStudents } from '@/features/enrollment/services/students';
import type { Teacher } from '@/schemas/academics';
import type { Student } from '@/schemas/students';
import { queryKeys } from '@/api/queryKeys';

/**
 * Main hook for managing homeroom enrollment process.
 * This hook provides the core functionality for auto-enrolling students
 * in their homeroom teacher's CORE subjects.
 */
export function useHomeroomEnrollment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (payload: AutoEnrollStudentsRequest) => 
      autoEnrollStudentsInCoreSubjects(payload),
    onMutate: async (variables) => {
      // Cancel outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({ 
        queryKey: queryKeys.homeroom.teacherSubjects(variables.teacher_id)
      });
      await queryClient.cancelQueries({ 
        queryKey: queryKeys.students.lists() 
      });
      await queryClient.cancelQueries({ 
        queryKey: queryKeys.enrollments.lists() 
      });
      
      // Snapshot previous data for potential rollback
      const previousTeacherSubjects = queryClient.getQueryData(
        queryKeys.homeroom.teacherSubjects(variables.teacher_id)
      );
      const previousStudents = queryClient.getQueriesData({ 
        queryKey: queryKeys.students.lists() 
      });
      
      return { previousTeacherSubjects, previousStudents };
    },
    onError: (error, variables, context) => {
      // Rollback optimistic updates on error
      if (context?.previousTeacherSubjects) {
        queryClient.setQueryData(
          queryKeys.homeroom.teacherSubjects(variables.teacher_id),
          context.previousTeacherSubjects
        );
      }
      
      if (context?.previousStudents) {
        context.previousStudents.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      
      // Log error for debugging
      console.error('[HomeroomEnrollment] Auto-enrollment failed:', error);
    },
    onSuccess: (data, variables) => {
      // Invalidate all related queries to ensure data consistency
      
      // Teacher-specific queries
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.homeroom.teacherSubjects(variables.teacher_id) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.teachers.detail(variables.teacher_id) 
      });
      
      // Student enrollment queries
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.students.lists() 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.enrollments.lists() 
      });
      
      // Individual student enrollment queries for enrolled students
      data.students_enrolled.forEach((student) => {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.students.enrollments(student.student_id) 
        });
      });
      
      // Classroom and homeroom queries
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.classrooms.lists() 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.homeroom.lists() 
      });
      
      // Homeroom metrics and conflicts
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.homeroom.metrics() 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.homeroom.conflicts(variables.grade_level) 
      });
      
      console.log(`[HomeroomEnrollment] Successfully enrolled ${data.students_enrolled.length} students in core subjects`);
    },
    onSettled: () => {
      // Always refetch core data after mutation completes
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.homeroom.all 
      });
    },
  });
}

/**
 * Hook to get teachers who have homeroom assignments.
 * These are teachers who can have students auto-enrolled in their CORE subjects.
 */
export function useHomeroomTeachers(filters?: {
  academic_year_id?: string;
  grade_level?: string;
  is_active?: boolean;
}) {
  return useQuery({
    queryKey: ['homeroom-teachers', filters],
    queryFn: async () => {
      if (!filters?.academic_year_id) {
        throw new Error('Academic year ID is required for homeroom teachers query');
      }

      const searchParams = new URLSearchParams({
        academic_year_id: filters.academic_year_id,
        is_active: (filters?.is_active ?? true).toString(),
      });

      if (filters.grade_level) {
        searchParams.append('grade_level', filters.grade_level);
      }

      const data = await apiFetch<any[]>(`/admin/teachers/homeroom?${searchParams.toString()}`);
      return data;
    },
    enabled: !!filters?.academic_year_id,
    staleTime: 2 * 60 * 1000, // 2 minutes cache
  });
}

/**
 * Hook to get students available for enrollment in homeroom subjects.
 * This includes students who are not yet enrolled in the teacher's CORE subjects.
 */
export function useStudentsForEnrollment(filters?: {
  school_id?: string;
  grade_level?: string;
  teacher_id?: string;
  academic_year_id?: string;
}) {
  const studentsQuery = useQuery({
    queryKey: queryKeys.students.list({
      school_id: filters?.school_id,
      grade_level: filters?.grade_level,
      is_active: true,
    }),
    queryFn: () => listStudents({
      school_id: filters?.school_id,
      grade_level: filters?.grade_level,
      is_active: true,
    }),
    enabled: !!filters?.grade_level, // Only run when grade_level is provided
    staleTime: 30 * 1000, // 30 seconds cache - enrollment data changes frequently
  });

  // Get teacher's subjects to understand what subjects students could be enrolled in
  const teacherSubjectsQuery = useQuery({
    queryKey: queryKeys.homeroom.teacherSubjects(
      filters?.teacher_id!, 
      { academic_year_id: filters?.academic_year_id }
    ),
    queryFn: () => getTeacherAssignedSubjects(filters?.teacher_id!, {
      academic_year_id: filters?.academic_year_id
    }),
    enabled: !!filters?.teacher_id,
    staleTime: 60 * 1000, // 1 minute cache
  });

  return {
    students: studentsQuery.data || [],
    teacherSubjects: teacherSubjectsQuery.data || [],
    isLoadingStudents: studentsQuery.isLoading,
    isLoadingTeacherSubjects: teacherSubjectsQuery.isLoading,
    isLoading: studentsQuery.isLoading || teacherSubjectsQuery.isLoading,
    error: studentsQuery.error || teacherSubjectsQuery.error,
    studentsError: studentsQuery.error,
    teacherSubjectsError: teacherSubjectsQuery.error,
  };
}

/**
 * Hook to get enrollment preview/metrics for a homeroom teacher.
 * Shows how many students would be enrolled and in which subjects.
 */
export function useHomeroomEnrollmentPreview(
  teacherId: string | undefined,
  gradeLevel: string | undefined,
  academicYearId: string | undefined
) {
  const { students, teacherSubjects, isLoading } = useStudentsForEnrollment({
    teacher_id: teacherId,
    grade_level: gradeLevel,
    academic_year_id: academicYearId,
  });

  return useQuery({
    queryKey: [
      'homeroom', 
      'enrollment-preview', 
      teacherId, 
      gradeLevel, 
      academicYearId,
      students.length,
      teacherSubjects.length
    ],
    queryFn: () => {
      // Calculate enrollment preview data
      const coreSubjects = teacherSubjects.filter(subject => 
        subject.subject_name && [
          'Mathematics',
          'English Language Arts', 
          'Science',
          'Social Studies',
          'Reading'
        ].some(core => subject.subject_name.includes(core))
      );

      const totalPotentialEnrollments = students.length * coreSubjects.length;

      return {
        students_count: students.length,
        core_subjects_count: coreSubjects.length,
        total_potential_enrollments: totalPotentialEnrollments,
        subjects: coreSubjects.map(subject => ({
          id: subject.subject_id,
          name: subject.subject_name,
          code: subject.subject_code,
          classroom_id: subject.classroom_id,
          current_enrollment: subject.enrollment_count,
          potential_new_enrollments: students.length,
        })),
        ready_for_enrollment: students.length > 0 && coreSubjects.length > 0,
      };
    },
    enabled: !isLoading && !!teacherId && !!gradeLevel && !!academicYearId,
    staleTime: 30 * 1000, // 30 seconds cache
  });
}

/**
 * Hook to check enrollment conflicts before auto-enrolling students.
 * Identifies potential issues like capacity limits, schedule conflicts, etc.
 */
export function useHomeroomEnrollmentConflicts(
  teacherId: string | undefined,
  gradeLevel: string | undefined,
  academicYearId: string | undefined
) {
  return useQuery({
    queryKey: queryKeys.homeroom.conflicts(gradeLevel),
    queryFn: async () => {
      // This would typically call a backend endpoint to check for conflicts
      // For now, we'll return a basic structure that can be expanded
      const conflicts: Array<{
        type: string;
        message: string;
        severity: 'warning' | 'error';
      }> = [];
      
      // Add logic here to check for:
      // - Classroom capacity limits
      // - Schedule conflicts
      // - Prerequisite requirements
      // - Special accommodation needs
      
      return {
        has_conflicts: conflicts.length > 0,
        conflicts,
        warnings: [] as Array<string>,
        can_proceed: conflicts.length === 0,
      };
    },
    enabled: !!teacherId && !!gradeLevel && !!academicYearId,
    staleTime: 30 * 1000, // 30 seconds cache
  });
}

/**
 * Helper hook to get enrollment metrics for dashboard/reporting.
 * Provides summary statistics about homeroom enrollments.
 */
export function useHomeroomEnrollmentMetrics(academicYearId?: string) {
  return useQuery({
    queryKey: queryKeys.homeroom.metrics(),
    queryFn: async () => {
      // This would call a backend endpoint for enrollment metrics
      // Placeholder implementation for now
      return {
        total_homeroom_teachers: 0,
        total_students_enrolled: 0,
        total_core_enrollments: 0,
        average_enrollments_per_teacher: 0,
        completion_rate: 0,
        last_updated: new Date().toISOString(),
      };
    },
    enabled: !!academicYearId,
    staleTime: 5 * 60 * 1000, // 5 minutes cache - metrics don't change frequently
  });
}

/**
 * Utility hook to validate homeroom enrollment eligibility.
 * Checks if a teacher/grade combination is ready for auto-enrollment.
 */
export function useHomeroomEnrollmentEligibility(
  teacherId: string | undefined,
  gradeLevel: string | undefined,
  academicYearId: string | undefined
) {
  const { students, teacherSubjects, isLoading } = useStudentsForEnrollment({
    teacher_id: teacherId,
    grade_level: gradeLevel,
    academic_year_id: academicYearId,
  });

  const conflicts = useHomeroomEnrollmentConflicts(teacherId, gradeLevel, academicYearId);

  return {
    is_eligible: !isLoading && 
                 students.length > 0 && 
                 teacherSubjects.length > 0 && 
                 !conflicts.data?.has_conflicts,
    has_students: students.length > 0,
    has_subjects: teacherSubjects.length > 0,
    has_conflicts: conflicts.data?.has_conflicts ?? false,
    students_count: students.length,
    subjects_count: teacherSubjects.length,
    is_loading: isLoading || conflicts.isLoading,
    eligibility_message: getEligibilityMessage(
      students.length, 
      teacherSubjects.length, 
      conflicts.data?.has_conflicts
    ),
  };
}

// Helper function to generate eligibility messages
function getEligibilityMessage(
  studentsCount: number,
  subjectsCount: number,
  hasConflicts?: boolean
): string {
  if (hasConflicts) {
    return "Enrollment cannot proceed due to conflicts that need to be resolved.";
  }
  
  if (studentsCount === 0 && subjectsCount === 0) {
    return "No students or subjects available for enrollment.";
  }
  
  if (studentsCount === 0) {
    return "No students available for enrollment in this grade level.";
  }
  
  if (subjectsCount === 0) {
    return "Teacher has no CORE subjects assigned for auto-enrollment.";
  }
  
  return `Ready to enroll ${studentsCount} students in ${subjectsCount} subjects.`;
}