// src/schemas/academics.ts
import { z } from "zod";

// NOTE: match exact backend fields once confirmed
export const AcademicYearSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Name is required"),
  start_date: z.string().min(1, "Start date is required"), // ISO yyyy-mm-dd
  end_date: z.string().min(1, "End date is required"),
  is_active: z.boolean().default(false),
});
export type AcademicYear = z.infer<typeof AcademicYearSchema>;

export const AcademicYearCreateSchema = AcademicYearSchema.partial({
  id: true,
}).required({
  name: true,
  start_date: true,
  end_date: true,
});
export type AcademicYearCreate = z.infer<typeof AcademicYearCreateSchema>;

export const AcademicYearUpdateSchema = AcademicYearCreateSchema.partial();
export type AcademicYearUpdate = z.infer<typeof AcademicYearUpdateSchema>;

export const SubjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  code: z.string().min(1),
  subject_type: z.string().default("CORE"), // CORE, ENRICHMENT, SPECIAL
  applies_to_elementary: z.boolean().default(true),
  applies_to_middle: z.boolean().default(true),
  applies_to_high: z.boolean().default(true),
  is_homeroom_default: z.boolean().default(false),
  requires_specialist: z.boolean().default(false),
  allows_cross_grade: z.boolean().default(false),
  is_system_core: z.boolean().default(false),
  created_by_admin: z.boolean().default(true),
});
export type Subject = z.infer<typeof SubjectSchema>;

export const SubjectCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  subject_type: z.string().default("CORE"),
  applies_to_elementary: z.boolean().default(true),
  applies_to_middle: z.boolean().default(true),
  applies_to_high: z.boolean().default(true),
  is_homeroom_default: z.boolean().default(false),
  requires_specialist: z.boolean().default(false),
  allows_cross_grade: z.boolean().default(false),
});
export type SubjectCreate = z.infer<typeof SubjectCreateSchema>;

export const SubjectUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  subject_type: z.string().optional(),
  applies_to_elementary: z.boolean().optional(),
  applies_to_middle: z.boolean().optional(),
  applies_to_high: z.boolean().optional(),
  is_homeroom_default: z.boolean().optional(),
  requires_specialist: z.boolean().optional(),
  allows_cross_grade: z.boolean().optional(),
});
export type SubjectUpdate = z.infer<typeof SubjectUpdateSchema>;

// Room schema
export const RoomSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  building: z.string().optional(),
  capacity: z.number().int().optional(),
});
export type Room = z.infer<typeof RoomSchema>;

// Teacher info schema (basic)
export const TeacherInfoSchema = z.object({
  id: z.string().uuid(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().email(),
});
export type TeacherInfo = z.infer<typeof TeacherInfoSchema>;

// Full Teacher schema for teacher management
// Enhanced with better defaults and optional field handling for API compatibility
export const TeacherSchema = z.object({
  id: z.string().uuid(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email().nullable().optional(),
  grade_level: z.string().nullable().optional(), // For elementary homeroom teachers
  homeroom_id: z.string().uuid().nullable().optional(), // Room assigned as homeroom
  homeroom_name: z.string().nullable().optional(), // Populated from room data
  is_specialist: z.boolean().default(false),
  specialist_subject: z.string().nullable().optional(), // e.g., "PE", "Music", "Library"
  specialist_room_id: z.string().uuid().nullable().optional(), // Room where specialist teaches
  specialist_room_name: z.string().nullable().optional(), // Populated from room data
  is_active: z.boolean().default(true),
  student_count: z.number().int().default(0), // Current student assignment count
}).transform((data) => {
  // Transform function to provide safe defaults for display
  return {
    ...data,
    email: data.email || undefined,
    grade_level: data.grade_level || undefined,
    homeroom_id: data.homeroom_id || undefined,
    homeroom_name: data.homeroom_name || undefined,
    specialist_subject: data.specialist_subject || undefined,
    specialist_room_id: data.specialist_room_id || undefined,
    specialist_room_name: data.specialist_room_name || undefined,
    student_count: data.student_count ?? 0,
  };
});
export type Teacher = z.infer<typeof TeacherSchema>;

// Helper function for client-side teacher data transformation
export function transformTeacherForDisplay(teacher: Partial<Teacher>): Teacher {
  return {
    id: teacher.id || '',
    first_name: teacher.first_name || '',
    last_name: teacher.last_name || '',
    email: teacher.email,
    grade_level: teacher.grade_level,
    homeroom_id: teacher.homeroom_id,
    homeroom_name: teacher.homeroom_name,
    is_specialist: teacher.is_specialist ?? false,
    specialist_subject: teacher.specialist_subject,
    specialist_room_id: teacher.specialist_room_id,
    specialist_room_name: teacher.specialist_room_name,
    is_active: teacher.is_active ?? true,
    student_count: teacher.student_count ?? 0,
  };
}

// Helper function to safely get room assignment display text
export function getTeacherRoomDisplay(teacher: Teacher): string {
  if (teacher.is_specialist) {
    return teacher.specialist_room_name || 'Not assigned';
  }
  return teacher.homeroom_name || 'Not assigned';
}

// Helper function to safely get subject display text
export function getTeacherSubjectDisplay(teacher: Teacher): string {
  if (teacher.is_specialist) {
    return teacher.specialist_subject || 'General Specialist';
  }
  return teacher.grade_level ? `Grade ${teacher.grade_level}` : 'Not assigned';
}

export const TeacherCreateSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required").optional().or(z.literal("")),
  grade_level: z.string().optional(),
  homeroom_id: z.string().uuid().optional(),
  is_specialist: z.boolean().default(false),
  specialist_subject: z.string().optional(),
  specialist_room_id: z.string().uuid().optional(),
  is_active: z.boolean().default(true),
}).transform((data) => {
  // Clean up empty strings and ensure consistent data
  return {
    ...data,
    email: data.email === '' ? undefined : data.email,
    grade_level: data.grade_level === '' ? undefined : data.grade_level,
    specialist_subject: data.specialist_subject === '' ? undefined : data.specialist_subject,
  };
});
export type TeacherCreate = z.infer<typeof TeacherCreateSchema>;

export const TeacherUpdateSchema = z.object({
  first_name: z.string().min(1, "First name is required").optional(),
  last_name: z.string().min(1, "Last name is required").optional(),
  email: z.string().email("Valid email is required").optional(),
  grade_level: z.string().optional(),
  homeroom_id: z.string().uuid().optional(),
  is_specialist: z.boolean().optional(),
  specialist_subject: z.string().optional(),
  specialist_room_id: z.string().uuid().optional(),
  is_active: z.boolean().optional(),
}).transform((data) => {
  // Clean up empty strings and ensure consistent data
  return {
    ...data,
    email: data.email === '' ? undefined : data.email,
    grade_level: data.grade_level === '' ? undefined : data.grade_level,
    specialist_subject: data.specialist_subject === '' ? undefined : data.specialist_subject,
  };
});
export type TeacherUpdate = z.infer<typeof TeacherUpdateSchema>;

// Teacher assignment schema
export const TeacherAssignmentSchema = z.object({
  id: z.string().uuid(),
  teacher_user_id: z.string().uuid(),
  role_name: z.string(),
  can_view_grades: z.boolean(),
  can_modify_grades: z.boolean(),
  can_take_attendance: z.boolean(),
  can_view_parent_contact: z.boolean(),
  can_create_assignments: z.boolean(),
  is_active: z.boolean(),
  teacher: TeacherInfoSchema.optional(),
});
export type TeacherAssignment = z.infer<typeof TeacherAssignmentSchema>;

// Updated Classroom schema to match backend
export const ClassroomSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  grade_level: z.string(),
  classroom_type: z.string().default("CORE"),
  max_students: z.number().int().optional(),
  subject_id: z.string().uuid(),
  academic_year_id: z.string().uuid(),
  room_id: z.string().uuid().optional(),
  subject: SubjectSchema.optional(),
  academic_year: AcademicYearSchema.optional(),
  room: RoomSchema.optional(),
  teacher_assignments: z.array(TeacherAssignmentSchema).default([]),
  enrollment_count: z.number().int().default(0),
});
export type Classroom = z.infer<typeof ClassroomSchema>;

export const ClassroomCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  grade_level: z.string().min(1, "Grade level is required"),
  classroom_type: z.string().default("CORE"),
  max_students: z.number().int().positive().optional(),
  subject_id: z.string().uuid("Please select a subject"),
  academic_year_id: z.string().uuid("Please select an academic year"),
  room_id: z.string().uuid().optional(),
});
export type ClassroomCreate = z.infer<typeof ClassroomCreateSchema>;

export const ClassroomUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  grade_level: z.string().min(1, "Grade level is required").optional(),
  classroom_type: z.string().optional(),
  max_students: z.number().int().positive().optional(),
  room_id: z.string().uuid().optional(),
});
export type ClassroomUpdate = z.infer<typeof ClassroomUpdateSchema>;

// Grade level options
export const GRADE_LEVELS = [
  { value: 'PK', label: 'Pre-K' },
  { value: 'K', label: 'Kindergarten' },
  { value: '1', label: '1st Grade' },
  { value: '2', label: '2nd Grade' },
  { value: '3', label: '3rd Grade' },
  { value: '4', label: '4th Grade' },
  { value: '5', label: '5th Grade' },
  { value: '6', label: '6th Grade' },
  { value: '7', label: '7th Grade' },
  { value: '8', label: '8th Grade' },
  { value: 'MULTI', label: 'Multi-Grade' },
];

// Classroom type options
export const CLASSROOM_TYPES = [
  { value: 'CORE', label: 'Core' },
  { value: 'ENRICHMENT', label: 'Enrichment' },
  { value: 'SPECIAL', label: 'Special' },
];
