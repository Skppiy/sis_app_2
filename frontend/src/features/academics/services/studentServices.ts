// src/features/academics/services/studentServices.ts
import { apiFetch } from "@/api/requestHelper";
import { z } from "zod";

// Student Services Tag Schema
export const StudentServiceTagSchema = z.object({
  id: z.string().uuid(),
  tag_name: z.string(),
  tag_code: z.string(),
  description: z.string().nullable().optional(),
  school_id: z.string().uuid().nullable().optional(),
  is_active: z.boolean(),
});

export type StudentServiceTag = z.infer<typeof StudentServiceTagSchema>;

export const StudentServiceTagCreateSchema = z.object({
  tag_name: z.string().min(1, "Service name is required"),
  tag_code: z.string().min(1, "Service code is required"),
  description: z.string().optional(),
  school_id: z.string().uuid().optional(),
});

export type StudentServiceTagCreate = z.infer<typeof StudentServiceTagCreateSchema>;

// Student Service Assignment Schema
export const StudentServiceAssignmentSchema = z.object({
  id: z.string().uuid(),
  student_id: z.string().uuid(),
  tag_library_id: z.string().uuid(),
  severity_level: z.enum(["MILD", "MODERATE", "INTENSIVE"]).nullable().optional(),
  notes: z.string().nullable().optional(),
  start_date: z.string(),
  end_date: z.string().nullable().optional(),
  review_date: z.string().nullable().optional(),
  is_active: z.boolean(),
  assigned_by: z.string().uuid().nullable().optional(),
  last_reviewed_by: z.string().uuid().nullable().optional(),
  last_reviewed_date: z.string().nullable().optional(),
  tag: StudentServiceTagSchema.optional(),
});

export type StudentServiceAssignment = z.infer<typeof StudentServiceAssignmentSchema>;

export const StudentServiceAssignmentCreateSchema = z.object({
  student_id: z.string().uuid(),
  tag_library_id: z.string().uuid(),
  severity_level: z.enum(["MILD", "MODERATE", "INTENSIVE"]).optional(),
  notes: z.string().optional(),
  start_date: z.string(),
  end_date: z.string().optional(),
  review_date: z.string().optional(),
});

export type StudentServiceAssignmentCreate = z.infer<typeof StudentServiceAssignmentCreateSchema>;

// API Functions
export async function listStudentServiceTags(): Promise<StudentServiceTag[]> {
  console.log('[StudentServices] Fetching service tags');
  try {
    const data = await apiFetch<unknown>("/student-services/tags");
    const validatedData = z.array(StudentServiceTagSchema).parse(data);
    console.log('[StudentServices] Service tags loaded:', validatedData.length);
    return validatedData;
  } catch (error) {
    console.error('[StudentServices] Failed to load service tags:', error);
    throw error;
  }
}

export async function createStudentServiceTag(payload: StudentServiceTagCreate): Promise<StudentServiceTag> {
  console.log('[StudentServices] Creating service tag:', payload);
  try {
    const data = await apiFetch<unknown>("/student-services/tags", {
      method: "POST",
      json: payload,
    });
    const validatedData = StudentServiceTagSchema.parse(data);
    console.log('[StudentServices] Service tag created:', validatedData);
    return validatedData;
  } catch (error) {
    console.error('[StudentServices] Failed to create service tag:', error);
    throw error;
  }
}

export async function updateStudentServiceTag(id: string, payload: Partial<StudentServiceTagCreate>): Promise<StudentServiceTag> {
  console.log('[StudentServices] Updating service tag:', id, payload);
  try {
    const data = await apiFetch<unknown>(`/student-services/tags/${id}`, {
      method: "PUT",
      json: payload,
    });
    const validatedData = StudentServiceTagSchema.parse(data);
    console.log('[StudentServices] Service tag updated:', validatedData);
    return validatedData;
  } catch (error) {
    console.error('[StudentServices] Failed to update service tag:', error);
    throw error;
  }
}

export async function deactivateStudentServiceTag(id: string): Promise<void> {
  console.log('[StudentServices] Deactivating service tag:', id);
  try {
    await apiFetch<void>(`/student-services/tags/${id}`, {
      method: "DELETE",
    });
    console.log('[StudentServices] Service tag deactivated');
  } catch (error) {
    console.error('[StudentServices] Failed to deactivate service tag:', error);
    throw error;
  }
}

export async function getStudentServiceAssignments(studentId: string): Promise<StudentServiceAssignment[]> {
  console.log('[StudentServices] Fetching assignments for student:', studentId);
  try {
    const data = await apiFetch<unknown>(`/special-needs/students/${studentId}`);
    const validatedData = z.array(StudentServiceAssignmentSchema).parse(data);
    console.log('[StudentServices] Student assignments loaded:', validatedData.length);
    return validatedData;
  } catch (error) {
    console.error('[StudentServices] Failed to load student assignments:', error);
    throw error;
  }
}

export async function createStudentServiceAssignment(payload: StudentServiceAssignmentCreate): Promise<StudentServiceAssignment> {
  console.log('[StudentServices] Creating student assignment:', payload);
  try {
    const data = await apiFetch<unknown>("/special-needs/assignments", {
      method: "POST",
      json: payload,
    });
    const validatedData = StudentServiceAssignmentSchema.parse(data);
    console.log('[StudentServices] Student assignment created:', validatedData);
    return validatedData;
  } catch (error) {
    console.error('[StudentServices] Failed to create student assignment:', error);
    throw error;
  }
}

export async function deleteStudentServiceAssignment(id: string): Promise<void> {
  console.log('[StudentServices] Deleting student assignment:', id);
  try {
    await apiFetch<void>(`/special-needs/assignments/${id}`, {
      method: "DELETE",
    });
    console.log('[StudentServices] Student assignment deleted');
  } catch (error) {
    console.error('[StudentServices] Failed to delete student assignment:', error);
    throw error;
  }
}

// Helper functions
export function formatSeverityLevel(level: string | null | undefined): string {
  if (!level) return 'Not specified';
  switch (level) {
    case 'MILD': return 'Mild';
    case 'MODERATE': return 'Moderate';
    case 'INTENSIVE': return 'Intensive';
    default: return level;
  }
}

export function getSeverityColor(level: string | null | undefined): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' {
  switch (level) {
    case 'MILD': return 'info';
    case 'MODERATE': return 'warning';
    case 'INTENSIVE': return 'error';
    default: return 'default';
  }
}