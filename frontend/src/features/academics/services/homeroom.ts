// src/features/academics/services/homeroom.ts
import { apiFetch } from "@/api/requestHelper";
import { z } from "zod";

// Response schemas for homeroom endpoints
const HomeroomCreationResponseSchema = z.object({
  assignments_created: z.array(z.object({
    id: z.string(),
    subject_name: z.string(),
    subject_code: z.string(),
    assignment_type: z.string(),
    grade_level: z.string(),
  })),
  classrooms_created: z.array(z.object({
    id: z.string(),
    name: z.string(),
    subject_name: z.string(),
    grade_level: z.string(),
  })),
  teacher: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().optional(),
  }),
  grade_level: z.string(),
  academic_year_id: z.string(),
  total_assignments: z.number().int(),
  message: z.string(),
});

const AssignmentPreviewSchema = z.object({
  teacher: z.object({
    id: z.string().nullable(),
    name: z.string().nullable(),
    email: z.string().optional().nullable(),
  }).nullable(),
  grade_level: z.string(),
  academic_year_id: z.string(),
  subjects_to_assign: z.array(z.object({
    id: z.string(),
    name: z.string(),
    code: z.string(),
    subject_type: z.string().optional(),
  })),
  existing_assignments: z.array(z.record(z.string(), z.any())),
  total_new_assignments: z.number().int(),
  total_existing_assignments: z.number().int(),
  will_create_classrooms: z.number().int(),
  ready_for_creation: z.boolean(),
});

const TeacherSubjectsSchema = z.array(z.object({
  subject_id: z.string().uuid(),
  subject_name: z.string(),
  subject_code: z.string(),
  classroom_id: z.string().uuid(),
  classroom_name: z.string(),
  grade_level: z.string(),
  enrollment_count: z.number().int(),
  assignment_date: z.string(),
}));

const AutoAssignCoreResponseSchema = z.object({
  success: z.boolean(),
  assignments_created: z.number().int(),
  teachers_affected: z.number().int(),
  classrooms_created: z.array(z.object({
    teacher_id: z.string().uuid(),
    teacher_name: z.string(),
    grade_level: z.string(),
    classroom_id: z.string().uuid(),
    classroom_name: z.string(),
  })),
  message: z.string(),
});

const AutoEnrollResponseSchema = z.object({
  success: z.boolean(),
  enrollments_created: z.number().int(),
  students_enrolled: z.array(z.object({
    student_id: z.string().uuid(),
    student_name: z.string(),
    classroom_assignments: z.array(z.object({
      subject_id: z.string().uuid(),
      subject_name: z.string(),
      classroom_id: z.string().uuid(),
      classroom_name: z.string(),
    })),
  })),
  message: z.string(),
});

export type HomeroomCreationResponse = z.infer<typeof HomeroomCreationResponseSchema>;
export type AssignmentPreview = z.infer<typeof AssignmentPreviewSchema>;
export type TeacherSubjects = z.infer<typeof TeacherSubjectsSchema>;
export type AutoAssignCoreResponse = z.infer<typeof AutoAssignCoreResponseSchema>;
export type AutoEnrollResponse = z.infer<typeof AutoEnrollResponseSchema>;

// Request types
export interface AutoEnrollStudentsRequest {
  teacher_id: string;
  grade_level: string; 
  academic_year_id: string;
}

// Create homeroom with auto-assignment
export async function createHomeroomWithAutoAssignment(payload: {
  teacher_id: string;
  grade_level: string;
  room_id?: string;
  academic_year_id: string;
}): Promise<HomeroomCreationResponse> {
  const data = await apiFetch<unknown>("/homeroom/create", {
    method: "POST",
    json: payload,
  });
  
  // Handle API error responses
  if (data && typeof data === 'object' && 'detail' in data) {
    throw new Error(String(data.detail));
  }
  
  return HomeroomCreationResponseSchema.parse(data);
}

// Preview homeroom assignment for a teacher/grade combination
export async function previewHomeroomAssignment(
  grade: string, 
  teacherId: string,
  params?: { academic_year_id?: string }
): Promise<AssignmentPreview> {
  const searchParams = new URLSearchParams();
  if (params?.academic_year_id) {
    searchParams.append('academic_year_id', params.academic_year_id);
  }
  
  const queryString = searchParams.toString();
  const url = queryString 
    ? `/homeroom/preview-assignment/${grade}/${teacherId}?${queryString}`
    : `/homeroom/preview-assignment/${grade}/${teacherId}`;
    
  const data = await apiFetch<unknown>(url);
  
  // Handle API error responses
  if (data && typeof data === 'object' && 'detail' in data) {
    throw new Error(String(data.detail));
  }
  
  return AssignmentPreviewSchema.parse(data);
}

// Get teacher's assigned subjects
export async function getTeacherAssignedSubjects(
  teacherId: string,
  params?: { academic_year_id?: string }
): Promise<TeacherSubjects> {
  const searchParams = new URLSearchParams();
  if (params?.academic_year_id) {
    searchParams.append('academic_year_id', params.academic_year_id);
  }
  
  const queryString = searchParams.toString();
  const url = queryString 
    ? `/homeroom/teachers/${teacherId}/subjects?${queryString}`
    : `/homeroom/teachers/${teacherId}/subjects`;
    
  const data = await apiFetch<unknown>(url);
  return TeacherSubjectsSchema.parse(data);
}

// Auto-assign new CORE subject to existing homeroom teachers
export async function autoAssignNewCoreSubject(payload: {
  subject_id: string;
  academic_year_id: string;
  target_grades?: string[]; // Optional: limit to specific grades
}): Promise<AutoAssignCoreResponse> {
  const data = await apiFetch<unknown>("/homeroom/subjects/auto-assign-existing", {
    method: "POST",
    json: payload,
  });
  return AutoAssignCoreResponseSchema.parse(data);
}

// Auto-enroll students in core subjects for a homeroom teacher
export async function autoEnrollStudentsInCoreSubjects(payload: AutoEnrollStudentsRequest): Promise<AutoEnrollResponse> {
  const data = await apiFetch<unknown>("/homeroom/students/auto-enroll", {
    method: "POST",
    json: payload,
  });
  return AutoEnrollResponseSchema.parse(data);
}