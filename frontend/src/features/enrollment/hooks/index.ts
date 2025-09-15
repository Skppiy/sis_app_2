// src/features/enrollment/hooks/index.ts
export {
  useStudents,
  useCreateStudent, 
  useUpdateStudent,
  useDeleteStudent,
  useEnrollStudent,
  useWithdrawEnrollment,
  useStudentEnrollments
} from './useStudents';

export {
  useHomeroomEnrollment,
  useHomeroomTeachers,
  useStudentsForEnrollment,
  useHomeroomEnrollmentPreview,
  useHomeroomEnrollmentConflicts,
  useHomeroomEnrollmentMetrics,
  useHomeroomEnrollmentEligibility
} from './useHomeroomEnrollment';

// Three-Tier Enrollment System Hooks
export {
  useBulkHomeroomEnrollment,
  useBulkEnrollmentValidation,
  useFlexibleSubjectEnrollment,
  useSpecialProgramEnrollment,
  useEnrollmentConflictDetection,
  useConflictResolution,
  useStudentEnrollmentSummary,
  useMultipleStudentSummaries,
  useEnrollmentTiersInfo,
  useEnrollmentWorkflow,
  useEnrollmentProgress
} from './useThreeTierEnrollment';

// Use different name to avoid conflict
export {
  useStudentEnrollments as useStudentEnrollmentDetails
} from './useStudentEnrollments';