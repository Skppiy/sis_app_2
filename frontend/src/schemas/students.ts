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