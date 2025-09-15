import { apiFetch } from '@/api';
import type { 
  StudentSubjectEnrollment,
  StudentSubjectEnrollmentCreate,
  BulkEnrollmentRequest,
  EnrollmentConflict,
  EnrollmentSyncResult
} from '@/schemas/students';

// Auto-enroll student in homeroom CORE subjects
export const autoEnrollStudentInHomeroom = async (studentId: string, homeroomId: string): Promise<StudentSubjectEnrollment[]> => {
  const data = await apiFetch<StudentSubjectEnrollment[]>(`/homeroom/students/auto-enroll`, {
    method: 'POST',
    json: {
      student_id: studentId,
      homeroom_id: homeroomId
    }
  });
  return data;
};

// Get student's current subject enrollments
export const getStudentSubjectEnrollments = async (studentId: string): Promise<StudentSubjectEnrollment[]> => {
  const data = await apiFetch<StudentSubjectEnrollment[]>(`/students/${studentId}/enrollments`);
  return data;
};

// Bulk enroll multiple students
export const bulkEnrollStudents = async (request: BulkEnrollmentRequest): Promise<EnrollmentSyncResult> => {
  const data = await apiFetch<EnrollmentSyncResult>(`/homeroom/students/bulk-enroll`, {
    method: 'POST',
    json: request
  });
  return data;
};

// Remove specific enrollment
export const removeStudentEnrollment = async (studentId: string, enrollmentId: string): Promise<void> => {
  await apiFetch<void>(`/students/${studentId}/enrollments/${enrollmentId}`, {
    method: 'DELETE'
  });
};

// Sync student enrollments with homeroom changes
export const syncStudentWithHomeroom = async (studentId: string): Promise<EnrollmentSyncResult> => {
  const data = await apiFetch<EnrollmentSyncResult>(`/students/${studentId}/enrollments/sync-homeroom`, {
    method: 'PUT'
  });
  return data;
};

// Get enrollment conflicts for resolution
export const getEnrollmentConflicts = async (grade?: string): Promise<EnrollmentConflict[]> => {
  const queryParam = grade ? `?grade=${encodeURIComponent(grade)}` : '';
  const data = await apiFetch<EnrollmentConflict[]>(`/homeroom/students/enrollment-conflicts${queryParam}`);
  return data;
};

// Resolve enrollment conflicts
export const resolveEnrollmentConflicts = async (conflicts: string[]): Promise<EnrollmentSyncResult> => {
  const data = await apiFetch<EnrollmentSyncResult>('/homeroom/students/resolve-conflicts', {
    method: 'POST',
    json: { conflict_ids: conflicts }
  });
  return data;
};