// FILE: src/schemas/students.ts
// TYPE: FULL REPLACEMENT
// PATH: frontend/src/schemas/students.ts

import { z } from 'zod';

// Base student schema - matches backend StudentOut
export const StudentSchema = z.object({
  id: z.string().uuid(),
  school_id: z.string().uuid(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email().nullable().optional(),
  date_of_birth: z.string().nullable().optional(), // ISO date string
  student_id: z.string().nullable().optional(), // External student ID
  entry_date: z.string().nullable().optional(),
  entry_grade_level: z.string(), // Historical: grade when enrolled
  current_grade_level: z.string(), // Current: grade now
  is_active: z.boolean().default(true),
});

export const StudentCreateSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email").nullable().optional(), // Auto-generated on frontend
  date_of_birth: z.string().nullable().optional(),
  student_id: z.string().nullable().optional(), // Auto-generated on backend
  entry_date: z.string().nullable().optional(),
  entry_grade_level: z.string().min(1, "Grade level is required"),
  // Note: current_grade_level will be set to entry_grade_level on backend
});

export const StudentUpdateSchema = z.object({
  first_name: z.string().min(1, "First name is required").optional(),
  last_name: z.string().min(1, "Last name is required").optional(),
  email: z.string().email("Invalid email").nullable().optional(),
  date_of_birth: z.string().nullable().optional(),
  student_id: z.string().nullable().optional(),
  current_grade_level: z.string().optional(), // Can update current grade
  is_active: z.boolean().optional(),
});

// Enrollment schemas - updated with grade_level
export const EnrollmentSchema = z.object({
  id: z.string().uuid(),
  student_id: z.string().uuid(),
  classroom_id: z.string().uuid(),
  academic_year_id: z.string().uuid().nullable().optional(),
  grade_level: z.string(), // ADDED: Grade for this enrollment
  enrollment_date: z.string().nullable().optional(),
  withdrawal_date: z.string().nullable().optional(),
  enrollment_status: z.string(),
  is_active: z.boolean(),
  withdrawal_reason: z.string().nullable().optional(),
  is_audit_only: z.boolean().default(false),
  requires_accommodation: z.boolean().default(false),
});

export const EnrollmentCreateSchema = z.object({
  student_id: z.string().uuid(),
  classroom_id: z.string().uuid(),
  grade_level: z.string(), // ADDED: Required grade level
  enrollment_date: z.string().optional(),
  enrollment_status: z.enum(['ACTIVE', 'PENDING', 'WITHDRAWN']).default('ACTIVE'),
  is_audit_only: z.boolean().default(false),
  requires_accommodation: z.boolean().default(false),
});

// Student with enrollment details
export const StudentWithEnrollmentsSchema = StudentSchema.extend({
  enrollments: z.array(EnrollmentSchema).default([]),
});

// Types
export type Student = z.infer<typeof StudentSchema>;
export type StudentCreate = z.infer<typeof StudentCreateSchema>;
export type StudentUpdate = z.infer<typeof StudentUpdateSchema>;
export type Enrollment = z.infer<typeof EnrollmentSchema>;
export type EnrollmentCreate = z.infer<typeof EnrollmentCreateSchema>;
export type StudentWithEnrollments = z.infer<typeof StudentWithEnrollmentsSchema>;

// Subject enrollment schemas for the new auto-enrollment system
export const SubjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  code: z.string().optional(),
  category: z.enum(['CORE', 'ELECTIVE', 'SPECIAL', 'REMEDIAL']),
  grade_levels: z.array(z.string()),
  is_active: z.boolean().default(true),
});

export const TeacherSchema = z.object({
  id: z.string().uuid(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().email().optional(),
  is_homeroom_teacher: z.boolean().default(false),
  subjects: z.array(SubjectSchema).optional(),
});

export const StudentSubjectEnrollmentSchema = z.object({
  id: z.string().uuid(),
  student_id: z.string().uuid(),
  subject_id: z.string().uuid(),
  teacher_id: z.string().uuid(),
  classroom_id: z.string().uuid().optional(),
  academic_year_id: z.string().uuid(),
  semester: z.string().optional(),
  quarter: z.string().optional(),
  enrollment_date: z.string(),
  withdrawal_date: z.string().nullable().optional(),
  enrollment_status: z.enum(['ACTIVE', 'INACTIVE', 'WITHDRAWN', 'COMPLETED']),
  enrollment_type: z.enum(['CORE', 'ELECTIVE', 'SPECIAL', 'REMEDIAL']),
  grade_level: z.string(),
  homeroom_based: z.boolean().default(false),
  auto_enrolled: z.boolean().default(false),
  created_at: z.string(),
  updated_at: z.string(),
  // Related data
  subject: SubjectSchema.optional(),
  teacher: TeacherSchema.optional(),
  classroom: z.object({
    id: z.string().uuid(),
    name: z.string(),
  }).optional(),
});

export const EnrollmentConflictSchema = z.object({
  student_id: z.string().uuid(),
  conflicts: z.array(z.object({
    type: z.enum(['MISSING_CORE', 'DUPLICATE', 'SCHEDULE_CONFLICT', 'GRADE_MISMATCH', 'CAPACITY_EXCEEDED']),
    subject_id: z.string().uuid(),
    teacher_id: z.string().uuid().optional(),
    description: z.string(),
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    auto_fixable: z.boolean(),
    recommended_action: z.string(),
  })),
});

export const EnrollmentHealthMetricsSchema = z.object({
  total_students: z.number(),
  properly_enrolled: z.number(),
  missing_core_subjects: z.number(),
  conflict_count: z.number(),
  auto_enrollment_rate: z.number(),
  health_score: z.number(),
  by_grade: z.record(z.string(), z.object({
    total: z.number(),
    healthy: z.number(),
    needs_attention: z.number(),
  })),
  core_subject_coverage: z.record(z.string(), z.object({
    enrolled_count: z.number(),
    coverage_percentage: z.number(),
  })),
});

// Enhanced student schema with subject enrollments
export const StudentWithSubjectEnrollmentsSchema = StudentSchema.extend({
  subject_enrollments: z.array(StudentSubjectEnrollmentSchema).default([]),
  enrollment_health: z.object({
    core_completion_percentage: z.number(),
    missing_core_count: z.number(),
    conflict_count: z.number(),
    auto_enrolled_count: z.number(),
    health_status: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR']),
  }).optional(),
});

// Grade level options for forms
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
  { value: 'SPED', label: 'Special Education' },
  { value: 'UNGRADED', label: 'Ungraded' },
];

// Elementary grades for CORE subject auto-enrollment
export const ELEMENTARY_GRADES = ['K', '1', '2', '3', '4', '5'];

// CORE subjects for auto-enrollment
export const CORE_SUBJECTS = [
  'Mathematics',
  'English Language Arts', 
  'Science',
  'Social Studies',
  'Reading'
] as const;

// Bulk enrollment request schema
export const BulkEnrollmentRequestSchema = z.object({
  student_ids: z.array(z.string().uuid()),
  homeroom_id: z.string().uuid().optional(),
  grade_level: z.string().optional(),
  subject_ids: z.array(z.string().uuid()).optional(), // If specified, override auto-selection
  enrollment_type: z.enum(['AUTO_CORE', 'MANUAL', 'BULK_MANUAL']).default('AUTO_CORE'),
  enrollment_date: z.string().optional(),
  force_overwrite: z.boolean().default(false), // Overwrite existing enrollments
});

// Enrollment sync result schema
export const EnrollmentSyncResultSchema = z.object({
  success: z.boolean(),
  processed_students: z.array(z.string().uuid()),
  enrolled_count: z.number(),
  skipped_count: z.number(),
  error_count: z.number(),
  errors: z.array(z.object({
    student_id: z.string().uuid(),
    subject_id: z.string().uuid().optional(),
    error_message: z.string(),
  })),
  summary: z.object({
    total_enrollments_created: z.number(),
    core_subjects_assigned: z.number(),
    conflicts_resolved: z.number(),
  }),
});

// Student enrollment create schema
export const StudentSubjectEnrollmentCreateSchema = z.object({
  student_id: z.string().uuid(),
  subject_id: z.string().uuid(),
  teacher_id: z.string().uuid(),
  classroom_id: z.string().uuid().optional(),
  enrollment_type: z.enum(['CORE', 'ELECTIVE', 'SPECIAL', 'REMEDIAL']).default('CORE'),
  semester: z.string().optional(),
  quarter: z.string().optional(),
  enrollment_date: z.string().optional(),
  homeroom_based: z.boolean().default(false),
  auto_enrolled: z.boolean().default(false),
});

// Additional type exports
export type Subject = z.infer<typeof SubjectSchema>;
export type Teacher = z.infer<typeof TeacherSchema>;
export type StudentSubjectEnrollment = z.infer<typeof StudentSubjectEnrollmentSchema>;
export type StudentSubjectEnrollmentCreate = z.infer<typeof StudentSubjectEnrollmentCreateSchema>;
export type EnrollmentConflict = z.infer<typeof EnrollmentConflictSchema>;
export type EnrollmentHealthMetrics = z.infer<typeof EnrollmentHealthMetricsSchema>;
export type StudentWithSubjectEnrollments = z.infer<typeof StudentWithSubjectEnrollmentsSchema>;
export type BulkEnrollmentRequest = z.infer<typeof BulkEnrollmentRequestSchema>;
export type EnrollmentSyncResult = z.infer<typeof EnrollmentSyncResultSchema>;