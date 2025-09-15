// src/features/enrollment/services/enrollment.ts

import { apiFetch } from '@/api';
import { z } from 'zod';
import type { 
  BulkHomeroomEnrollmentRequest,
  BulkHomeroomEnrollmentResponse,
  FlexibleSubjectEnrollmentRequest,
  FlexibleSubjectEnrollmentResponse,
  SpecialProgramEnrollmentRequest,
  SpecialProgramEnrollmentResponse,
  ConflictDetectionResponse,
  StudentEnrollmentSummaryResponse,
  EnrollmentTierInfo
} from '@/schemas/threeTierEnrollment';

// Logging utility for service operations
const logOperation = (operation: string, details?: any) => {
  if (import.meta.env.DEV) {
    console.log(`[ThreeTierEnrollmentService] ${operation}`, details);
  }
};

const logError = (operation: string, error: any) => {
  console.error(`[ThreeTierEnrollmentService] ${operation} failed:`, error);
};

// ========================================================================
// TIER 1: BULK HOMEROOM ENROLLMENT SERVICE
// ========================================================================

/**
 * Tier 1: Bulk enrollment of students in homeroom CORE subjects.
 * 
 * This leverages the homeroom intelligence system to automatically
 * enroll students in all CORE subjects taught by their homeroom teachers.
 */
export const bulkHomeroomEnrollment = async (
  request: BulkHomeroomEnrollmentRequest
): Promise<BulkHomeroomEnrollmentResponse> => {
  try {
    logOperation('bulkHomeroomEnrollment', { 
      gradeLevel: request.grade_level, 
      studentCount: request.students.length 
    });

    const response = await apiFetch<BulkHomeroomEnrollmentResponse>('/enrollments/homeroom/bulk', {
      method: 'POST',
      json: request
    });

    logOperation('bulkHomeroomEnrollment success', {
      enrollmentsCreated: response.summary?.total_enrollments_created || 0,
      conflictsCount: response.conflicts?.length || 0
    });

    return response;
  } catch (error) {
    logError('bulkHomeroomEnrollment', error);
    throw error;
  }
};

// ========================================================================
// TIER 2: FLEXIBLE SUBJECT ENROLLMENT SERVICE
// ========================================================================

/**
 * Tier 2: Flexible enrollment for non-CORE subjects with teacher options.
 * 
 * This handles subjects like PE, Art, Music, etc. where students can be
 * assigned to different teacher sections based on availability and preferences.
 */
export const flexibleSubjectEnrollment = async (
  subjectId: string,
  request: FlexibleSubjectEnrollmentRequest
): Promise<FlexibleSubjectEnrollmentResponse> => {
  try {
    logOperation('flexibleSubjectEnrollment', { 
      subjectId, 
      studentCount: request.students.length 
    });

    const response = await apiFetch<FlexibleSubjectEnrollmentResponse>(
      `/enrollments/flexible/${subjectId}`,
      {
        method: 'POST',
        json: request
      }
    );

    logOperation('flexibleSubjectEnrollment success', {
      enrollmentsCreated: response.summary?.total_enrollments_created || 0,
      teacherDistribution: Object.keys(response.teacher_distribution || {}).length
    });

    return response;
  } catch (error) {
    logError('flexibleSubjectEnrollment', error);
    throw error;
  }
};

// ========================================================================
// TIER 3: SPECIAL PROGRAM ENROLLMENT SERVICE
// ========================================================================

/**
 * Tier 3: Individual enrollment for special programs, advanced classes, etc.
 * 
 * This handles one-off enrollments that require individual consideration,
 * such as gifted programs, special education, ESL, etc.
 */
export const specialProgramEnrollment = async (
  request: SpecialProgramEnrollmentRequest
): Promise<SpecialProgramEnrollmentResponse> => {
  try {
    logOperation('specialProgramEnrollment', { 
      studentId: request.student_id,
      assignmentId: request.teacher_subject_assignment_id 
    });

    const response = await apiFetch<SpecialProgramEnrollmentResponse>('/enrollments/special-program', {
      method: 'POST',
      json: request
    });

    logOperation('specialProgramEnrollment success', {
      enrollmentCreated: !!response.enrollment_created,
      conflictsCount: response.conflicts?.length || 0
    });

    return response;
  } catch (error) {
    logError('specialProgramEnrollment', error);
    throw error;
  }
};

// ========================================================================
// CONFLICT DETECTION AND RESOLUTION SERVICES
// ========================================================================

/**
 * Detect and report enrollment conflicts across the system.
 * 
 * This analyzes enrollments to identify:
 * - Duplicate enrollments
 * - Capacity violations
 * - Schedule conflicts
 * - Missing required subjects
 */
export const detectEnrollmentConflicts = async (
  academicYearId: string,
  gradeLevel?: string,
  studentId?: string
): Promise<ConflictDetectionResponse> => {
  try {
    logOperation('detectEnrollmentConflicts', { academicYearId, gradeLevel, studentId });

    const params = new URLSearchParams();
    if (gradeLevel) params.append('grade_level', gradeLevel);
    if (studentId) params.append('student_id', studentId);

    const queryString = params.toString();
    const url = queryString 
      ? `/enrollments/conflicts/${academicYearId}?${queryString}`
      : `/enrollments/conflicts/${academicYearId}`;

    const response = await apiFetch<ConflictDetectionResponse>(url);

    logOperation('detectEnrollmentConflicts success', {
      totalConflicts: response.summary?.total_conflicts || 0,
      conflictTypes: Object.keys(response.conflicts || {}).length
    });

    return response;
  } catch (error) {
    logError('detectEnrollmentConflicts', error);
    throw error;
  }
};

/**
 * Get comprehensive enrollment summary for a student.
 * 
 * This provides:
 * - All active and inactive enrollments
 * - Enrollments categorized by subject type
 * - Academic performance indicators
 * - Special program participations
 * - Identified conflicts
 */
export const getStudentEnrollmentSummary = async (
  studentId: string,
  academicYearId: string
): Promise<StudentEnrollmentSummaryResponse> => {
  try {
    logOperation('getStudentEnrollmentSummary', { studentId, academicYearId });

    const response = await apiFetch<StudentEnrollmentSummaryResponse>(
      `/enrollments/student/${studentId}/summary?academic_year_id=${academicYearId}`
    );

    logOperation('getStudentEnrollmentSummary success', {
      studentName: response.student?.name || 'Unknown',
      totalEnrollments: response.statistics?.total_enrollments || 0
    });

    return response;
  } catch (error) {
    logError('getStudentEnrollmentSummary', error);
    throw error;
  }
};

// ========================================================================
// ENROLLMENT TIERS INFORMATION SERVICE
// ========================================================================

/**
 * Get information about the three-tier enrollment system.
 * 
 * Returns descriptions and usage guidelines for each enrollment tier.
 */
export const getEnrollmentTiersInfo = async (): Promise<EnrollmentTierInfo> => {
  try {
    logOperation('getEnrollmentTiersInfo');

    const response = await apiFetch<EnrollmentTierInfo>('/enrollments/tiers/info');

    logOperation('getEnrollmentTiersInfo success');

    return response;
  } catch (error) {
    logError('getEnrollmentTiersInfo', error);
    throw error;
  }
};

// ========================================================================
// BULK OPERATIONS HELPERS
// ========================================================================

/**
 * Helper function to validate bulk enrollment requests
 */
export const validateBulkEnrollmentRequest = (
  studentIds: string[],
  gradeLevel: string
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!studentIds || studentIds.length === 0) {
    errors.push('At least one student must be selected');
  }

  const validGrades = ['K', '1', '2', '3', '4', '5'];
  if (!validGrades.includes(gradeLevel)) {
    errors.push(`Grade level must be one of: ${validGrades.join(', ')} for homeroom model`);
  }

  if (studentIds.length > 100) {
    errors.push('Maximum of 100 students can be enrolled at once');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Helper function to estimate enrollment capacity
 */
export const estimateEnrollmentCapacity = (
  studentCount: number,
  subjectCount: number,
  averageClassSize: number = 20
): {
  estimatedEnrollments: number;
  estimatedClassrooms: number;
  capacityWarnings: string[];
} => {
  const estimatedEnrollments = studentCount * subjectCount;
  const estimatedClassrooms = Math.ceil(studentCount / averageClassSize) * subjectCount;
  const warnings: string[] = [];

  if (estimatedEnrollments > 500) {
    warnings.push('Large enrollment operation may take several minutes to complete');
  }

  if (studentCount > averageClassSize * 2) {
    warnings.push('Multiple classrooms may be created for each subject');
  }

  return {
    estimatedEnrollments,
    estimatedClassrooms,
    capacityWarnings: warnings
  };
};

/**
 * Helper function to format enrollment summary statistics
 */
export const formatEnrollmentSummary = (
  response: BulkHomeroomEnrollmentResponse | FlexibleSubjectEnrollmentResponse
): string => {
  const summary = response.summary;
  if (!summary) return 'Enrollment completed';

  const created = summary.total_enrollments_created || 0;
  const conflicts = Array.isArray(response.conflicts) ? response.conflicts.length : 0;

  let message = `Successfully created ${created} enrollment${created !== 1 ? 's' : ''}`;
  if (conflicts > 0) {
    message += ` with ${conflicts} conflict${conflicts !== 1 ? 's' : ''} detected`;
  }

  return message;
};

/**
 * Helper function to extract error messages from API responses
 */
export const extractEnrollmentErrors = (error: any): string[] => {
  if (typeof error === 'string') {
    return [error];
  }

  if (error?.response?.data?.detail) {
    if (Array.isArray(error.response.data.detail)) {
      return error.response.data.detail.map((e: any) => e.msg || e.message || String(e));
    }
    return [String(error.response.data.detail)];
  }

  if (error?.message) {
    return [error.message];
  }

  return ['An unexpected error occurred during enrollment'];
};

// Export all service functions as named exports for flexibility
export {
  // Main tier services
  bulkHomeroomEnrollment as tier1BulkEnrollment,
  flexibleSubjectEnrollment as tier2FlexibleEnrollment,
  specialProgramEnrollment as tier3SpecialEnrollment,
  
  // Utility services
  detectEnrollmentConflicts as detectConflicts,
  getStudentEnrollmentSummary as getStudentSummary,
  getEnrollmentTiersInfo as getTiersInfo,
  
  // Validation helpers
  validateBulkEnrollmentRequest as validateBulkRequest,
  estimateEnrollmentCapacity as estimateCapacity,
  formatEnrollmentSummary as formatSummary,
  extractEnrollmentErrors as extractErrors
};