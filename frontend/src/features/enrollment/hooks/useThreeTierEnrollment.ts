// src/features/enrollment/hooks/useThreeTierEnrollment.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useMemo } from 'react';
import { 
  bulkHomeroomEnrollment,
  flexibleSubjectEnrollment,
  specialProgramEnrollment,
  detectEnrollmentConflicts,
  getStudentEnrollmentSummary,
  getEnrollmentTiersInfo,
  validateBulkEnrollmentRequest,
  estimateEnrollmentCapacity,
  formatEnrollmentSummary
} from '@/features/enrollment/services/enrollment';
import type {
  BulkHomeroomEnrollmentRequest,
  BulkHomeroomEnrollmentResponse,
  FlexibleSubjectEnrollmentRequest,
  FlexibleSubjectEnrollmentResponse,
  SpecialProgramEnrollmentRequest,
  SpecialProgramEnrollmentResponse,
  ConflictDetectionResponse,
  StudentEnrollmentSummaryResponse,
  EnrollmentTierInfo,
  EnrollmentConflict
} from '@/schemas/threeTierEnrollment';
import { queryKeys } from '@/api/queryKeys';

// ========================================================================
// TIER 1: BULK HOMEROOM ENROLLMENT HOOKS
// ========================================================================

/**
 * Hook for Tier 1: Bulk homeroom enrollment
 * Handles CORE subjects enrollment for elementary grades
 */
export function useBulkHomeroomEnrollment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (request: BulkHomeroomEnrollmentRequest) => 
      bulkHomeroomEnrollment(request),
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: queryKeys.enrollments.lists() 
      });
      await queryClient.cancelQueries({ 
        queryKey: queryKeys.students.lists() 
      });
      
      // Snapshot previous data for rollback
      const previousEnrollments = queryClient.getQueriesData({ 
        queryKey: queryKeys.enrollments.lists() 
      });
      
      return { previousEnrollments };
    },
    onError: (error, variables, context) => {
      // Rollback optimistic updates on error
      if (context?.previousEnrollments) {
        context.previousEnrollments.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      
      console.error('[BulkHomeroomEnrollment] Failed:', error);
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.enrollments.lists() 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.classrooms.lists() 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.homeroom.all 
      });
      
      // Invalidate student enrollment queries for enrolled students
      variables.students.forEach((studentId) => {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.students.enrollments(studentId) 
        });
      });
      
      console.log(`[BulkHomeroomEnrollment] Success: ${data.summary.total_enrollments_created} enrollments created`);
    },
    onSettled: () => {
      // Always refetch core data
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.enrollments.all 
      });
    },
  });
}

/**
 * Hook to validate bulk enrollment requests before submission
 */
export function useBulkEnrollmentValidation() {
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }>({ isValid: false, errors: [], warnings: [] });

  const validateRequest = useCallback((
    studentIds: string[],
    gradeLevel: string,
    academicYearId: string
  ) => {
    const validation = validateBulkEnrollmentRequest(studentIds, gradeLevel);
    const warnings: string[] = [];

    // Add capacity warnings
    const capacityEstimate = estimateEnrollmentCapacity(studentIds.length, 5); // 5 CORE subjects
    warnings.push(...capacityEstimate.capacityWarnings);

    if (studentIds.length > 50) {
      warnings.push('Large enrollment operations may take several minutes');
    }

    const result = {
      isValid: validation.isValid,
      errors: validation.errors,
      warnings
    };

    setValidationResult(result);
    return result;
  }, []);

  return {
    validationResult,
    validateRequest
  };
}

// ========================================================================
// TIER 2: FLEXIBLE SUBJECT ENROLLMENT HOOKS
// ========================================================================

/**
 * Hook for Tier 2: Flexible subject enrollment
 * Handles non-CORE subjects with teacher distribution options
 */
export function useFlexibleSubjectEnrollment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ subjectId, request }: { 
      subjectId: string; 
      request: FlexibleSubjectEnrollmentRequest 
    }) => flexibleSubjectEnrollment(subjectId, request),
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: queryKeys.enrollments.lists() 
      });
      await queryClient.cancelQueries({ 
        queryKey: queryKeys.subjects.detail(variables.subjectId) 
      });
      
      const previousData = queryClient.getQueriesData({ 
        queryKey: queryKeys.enrollments.lists() 
      });
      
      return { previousData };
    },
    onError: (error, variables, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      
      console.error('[FlexibleSubjectEnrollment] Failed:', error);
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.enrollments.lists() 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.subjects.detail(variables.subjectId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.classrooms.lists() 
      });
      
      // Invalidate student enrollment queries
      variables.request.students.forEach((studentId) => {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.students.enrollments(studentId) 
        });
      });
      
      console.log(`[FlexibleSubjectEnrollment] Success: ${data.summary.total_enrollments_created} enrollments created`);
    },
  });
}

// ========================================================================
// TIER 3: SPECIAL PROGRAM ENROLLMENT HOOKS
// ========================================================================

/**
 * Hook for Tier 3: Special program enrollment
 * Handles individual enrollments for special programs
 */
export function useSpecialProgramEnrollment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (request: SpecialProgramEnrollmentRequest) => 
      specialProgramEnrollment(request),
    onMutate: async (variables) => {
      // Cancel outgoing refetches for the specific student
      await queryClient.cancelQueries({ 
        queryKey: queryKeys.students.enrollments(variables.student_id) 
      });
      
      const previousStudentData = queryClient.getQueryData(
        queryKeys.students.enrollments(variables.student_id)
      );
      
      return { previousStudentData };
    },
    onError: (error, variables, context) => {
      if (context?.previousStudentData) {
        queryClient.setQueryData(
          queryKeys.students.enrollments(variables.student_id),
          context.previousStudentData
        );
      }
      
      console.error('[SpecialProgramEnrollment] Failed:', error);
    },
    onSuccess: (data, variables) => {
      // Invalidate student-specific queries
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.students.enrollments(variables.student_id) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.students.detail(variables.student_id) 
      });
      
      // Invalidate general enrollment queries
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.enrollments.lists() 
      });
      
      console.log(`[SpecialProgramEnrollment] Success for student: ${variables.student_id}`);
    },
  });
}

// ========================================================================
// CONFLICT DETECTION AND RESOLUTION HOOKS
// ========================================================================

/**
 * Hook to detect enrollment conflicts
 */
export function useEnrollmentConflictDetection(
  academicYearId: string,
  gradeLevel?: string,
  studentId?: string,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: [
      'enrollment-conflicts', 
      academicYearId, 
      gradeLevel, 
      studentId
    ],
    queryFn: () => detectEnrollmentConflicts(academicYearId, gradeLevel, studentId),
    enabled: enabled && !!academicYearId,
    staleTime: 30 * 1000, // 30 seconds - conflicts change frequently
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to manage conflict resolution workflow
 */
export function useConflictResolution() {
  const [selectedConflicts, setSelectedConflicts] = useState<EnrollmentConflict[]>([]);
  const [resolutionStrategy, setResolutionStrategy] = useState<'AUTO' | 'MANUAL' | 'SKIP'>('AUTO');
  const queryClient = useQueryClient();

  const selectConflict = useCallback((conflict: EnrollmentConflict) => {
    setSelectedConflicts(prev => {
      const exists = prev.find(c => 
        c.student_id === conflict.student_id && 
        c.subject_name === conflict.subject_name
      );
      if (exists) {
        return prev.filter(c => c !== exists);
      }
      return [...prev, conflict];
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedConflicts([]);
  }, []);

  const resolveConflicts = useMutation({
    mutationFn: async (conflicts: EnrollmentConflict[]) => {
      // This would call a conflict resolution endpoint
      // For now, we'll simulate the resolution
      return {
        resolved: conflicts.filter(c => c.auto_resolvable).length,
        manual_review: conflicts.filter(c => !c.auto_resolvable).length,
        message: 'Conflicts processed successfully'
      };
    },
    onSuccess: () => {
      // Invalidate conflict queries
      queryClient.invalidateQueries({ 
        queryKey: ['enrollment-conflicts'] 
      });
      clearSelection();
    }
  });

  return {
    selectedConflicts,
    resolutionStrategy,
    setResolutionStrategy,
    selectConflict,
    clearSelection,
    resolveConflicts
  };
}

// ========================================================================
// STUDENT ENROLLMENT SUMMARY HOOKS
// ========================================================================

/**
 * Hook to get comprehensive student enrollment summary
 */
export function useStudentEnrollmentSummary(
  studentId: string,
  academicYearId: string,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: [
      'student-enrollment-summary', 
      studentId, 
      academicYearId
    ],
    queryFn: () => getStudentEnrollmentSummary(studentId, academicYearId),
    enabled: enabled && !!studentId && !!academicYearId,
    staleTime: 60 * 1000, // 1 minute cache
  });
}

/**
 * Hook to get enrollment summaries for multiple students
 */
export function useMultipleStudentSummaries(
  studentIds: string[],
  academicYearId: string,
  enabled: boolean = true
) {
  const summaryQueries = useQuery({
    queryKey: [
      'multiple-student-summaries', 
      studentIds.join(','), 
      academicYearId
    ],
    queryFn: async () => {
      if (!enabled || studentIds.length === 0) return [];
      
      // Fetch summaries in parallel
      const summaries = await Promise.allSettled(
        studentIds.map(studentId => 
          getStudentEnrollmentSummary(studentId, academicYearId)
        )
      );
      
      return summaries.map((result, index) => ({
        studentId: studentIds[index],
        status: result.status,
        data: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason : null
      }));
    },
    enabled: enabled && studentIds.length > 0 && !!academicYearId,
    staleTime: 60 * 1000, // 1 minute cache
  });

  return {
    ...summaryQueries,
    successfulSummaries: summaryQueries.data?.filter(s => s.status === 'fulfilled') || [],
    failedSummaries: summaryQueries.data?.filter(s => s.status === 'rejected') || [],
  };
}

// ========================================================================
// ENROLLMENT TIERS INFORMATION HOOK
// ========================================================================

/**
 * Hook to get enrollment tiers information and guidelines
 */
export function useEnrollmentTiersInfo() {
  return useQuery({
    queryKey: ['enrollment-tiers-info'],
    queryFn: getEnrollmentTiersInfo,
    staleTime: 10 * 60 * 1000, // 10 minutes - static information
  });
}

// ========================================================================
// ENROLLMENT WORKFLOW MANAGEMENT HOOK
// ========================================================================

/**
 * Comprehensive hook for managing the three-tier enrollment workflow
 */
export function useEnrollmentWorkflow(academicYearId: string) {
  const [currentTier, setCurrentTier] = useState<1 | 2 | 3>(1);
  const [workflowStep, setWorkflowStep] = useState<string>('selection');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [enrollmentHistory, setEnrollmentHistory] = useState<Array<{
    tier: number;
    type: string;
    timestamp: Date;
    summary: string;
  }>>([]);

  // Tier 1 mutations
  const tier1Mutation = useBulkHomeroomEnrollment();
  
  // Tier 2 mutations  
  const tier2Mutation = useFlexibleSubjectEnrollment();
  
  // Tier 3 mutations
  const tier3Mutation = useSpecialProgramEnrollment();

  // Conflict detection
  const conflictsQuery = useEnrollmentConflictDetection(academicYearId);

  const resetWorkflow = useCallback(() => {
    setCurrentTier(1);
    setWorkflowStep('selection');
    setSelectedStudents([]);
    setEnrollmentHistory([]);
  }, []);

  const addToHistory = useCallback((
    tier: number, 
    type: string, 
    result: BulkHomeroomEnrollmentResponse | FlexibleSubjectEnrollmentResponse | SpecialProgramEnrollmentResponse
  ) => {
    setEnrollmentHistory(prev => [...prev, {
      tier,
      type,
      timestamp: new Date(),
      summary: formatEnrollmentSummary(result as any)
    }]);
  }, []);

  const workflowStats = useMemo(() => {
    const totalEnrollments = enrollmentHistory.reduce((acc, entry) => {
      // Extract enrollment count from summary string
      const match = entry.summary.match(/(\d+) enrollment/);
      return acc + (match ? parseInt(match[1]) : 0);
    }, 0);

    return {
      totalEnrollments,
      tiersUsed: new Set(enrollmentHistory.map(e => e.tier)).size,
      operationsCompleted: enrollmentHistory.length,
      hasConflicts: (conflictsQuery.data?.summary.total_conflicts || 0) > 0
    };
  }, [enrollmentHistory, conflictsQuery.data]);

  return {
    // Current state
    currentTier,
    setCurrentTier,
    workflowStep,
    setWorkflowStep,
    selectedStudents,
    setSelectedStudents,
    
    // History and stats
    enrollmentHistory,
    workflowStats,
    addToHistory,
    
    // Mutations
    tier1Mutation,
    tier2Mutation,
    tier3Mutation,
    
    // Conflicts
    conflictsQuery,
    
    // Actions
    resetWorkflow
  };
}

// ========================================================================
// ENROLLMENT PROGRESS TRACKING HOOK
// ========================================================================

/**
 * Hook to track enrollment progress across all tiers
 */
export function useEnrollmentProgress(
  studentIds: string[],
  academicYearId: string
) {
  const summariesQuery = useMultipleStudentSummaries(studentIds, academicYearId);
  
  const progress = useMemo(() => {
    if (!summariesQuery.data) {
      return {
        totalStudents: studentIds.length,
        fullyEnrolled: 0,
        partiallyEnrolled: 0,
        notEnrolled: 0,
        completionRate: 0,
        coreSubjectsCompletion: 0,
        conflictsCount: 0
      };
    }

    const successful = summariesQuery.successfulSummaries;
    const fullyEnrolled = successful.filter(s => 
      s.data?.statistics.core_completion_rate === 100
    ).length;
    
    const partiallyEnrolled = successful.filter(s => 
      s.data && s.data.statistics.core_completion_rate > 0 && 
      s.data.statistics.core_completion_rate < 100
    ).length;
    
    const notEnrolled = studentIds.length - successful.length;
    
    const avgCoreCompletion = successful.length > 0 
      ? successful.reduce((acc, s) => 
          acc + (s.data?.statistics.core_completion_rate || 0), 0
        ) / successful.length
      : 0;

    const totalConflicts = successful.reduce((acc, s) => 
      acc + (s.data?.conflicts.length || 0), 0
    );

    return {
      totalStudents: studentIds.length,
      fullyEnrolled,
      partiallyEnrolled,
      notEnrolled,
      completionRate: (fullyEnrolled / studentIds.length) * 100,
      coreSubjectsCompletion: avgCoreCompletion,
      conflictsCount: totalConflicts
    };
  }, [summariesQuery.data, studentIds.length]);

  return {
    ...summariesQuery,
    progress
  };
}