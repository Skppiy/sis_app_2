// src/schemas/threeTierEnrollment.ts

import { z } from 'zod';

// ========================================================================
// ENUMS AND CONSTANTS
// ========================================================================

export const EnrollmentTier = {
  TIER_1_CORE: 'TIER_1_CORE',
  TIER_2_FLEXIBLE: 'TIER_2_FLEXIBLE',
  TIER_3_SPECIAL: 'TIER_3_SPECIAL'
} as const;

export const ConflictType = {
  SCHEDULE_CONFLICT: 'SCHEDULE_CONFLICT',
  PREREQUISITE_MISSING: 'PREREQUISITE_MISSING',
  GRADE_MISMATCH: 'GRADE_MISMATCH',
  CAPACITY_EXCEEDED: 'CAPACITY_EXCEEDED',
  DUPLICATE_ENROLLMENT: 'DUPLICATE_ENROLLMENT',
  STUDENT_NOT_FOUND: 'STUDENT_NOT_FOUND'
} as const;

export const ConflictSeverity = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
} as const;

// Elementary grades for homeroom model validation
export const ELEMENTARY_GRADES = ['K', '1', '2', '3', '4', '5'] as const;

// ========================================================================
// TIER 1: BULK HOMEROOM ENROLLMENT SCHEMAS
// ========================================================================

export const BulkHomeroomEnrollmentRequestSchema = z.object({
  academic_year_id: z.string().uuid('Invalid academic year ID'),
  grade_level: z.enum(ELEMENTARY_GRADES, {
    message: 'Grade level must be K-5 for homeroom model'
  }),
  students: z.array(z.string().uuid('Invalid student ID')).min(1, 'At least one student must be selected'),
  auto_create_missing_assignments: z.boolean().default(true)
});

export const EnrollmentCreatedSchema = z.object({
  id: z.string().uuid(),
  student_id: z.string().uuid(),
  student_name: z.string(),
  subject_id: z.string().uuid(),
  subject_name: z.string(),
  teacher_id: z.string().uuid(),
  teacher_name: z.string(),
  classroom_id: z.string().uuid(),
  classroom_name: z.string(),
  enrollment_date: z.string(),
  enrollment_type: z.string(),
  grade_level: z.string()
});

export const EnrollmentConflictSchema = z.object({
  type: z.nativeEnum(ConflictType),
  student_id: z.string().uuid().optional(),
  student_name: z.string().optional(),
  subject_name: z.string().optional(),
  teacher_name: z.string().optional(),
  message: z.string(),
  severity: z.nativeEnum(ConflictSeverity).default('MEDIUM'),
  auto_resolvable: z.boolean().default(false),
  recommended_action: z.string().optional()
});

export const BulkHomeroomEnrollmentResponseSchema = z.object({
  enrollments_created: z.array(EnrollmentCreatedSchema),
  conflicts: z.array(EnrollmentConflictSchema),
  summary: z.object({
    total_enrollments_created: z.number().int(),
    total_students_processed: z.number().int(),
    total_subjects_assigned: z.number().int(),
    conflicts_count: z.number().int(),
    success_rate: z.number().min(0).max(100)
  }),
  message: z.string()
});

// ========================================================================
// TIER 2: FLEXIBLE SUBJECT ENROLLMENT SCHEMAS
// ========================================================================

export const TeacherPreferenceSchema = z.object({
  teacher_id: z.string().uuid(),
  preference_level: z.enum(['REQUIRED', 'PREFERRED', 'ACCEPTABLE', 'AVOID']),
  max_students: z.number().int().positive().optional(),
  notes: z.string().optional()
});

export const FlexibleSubjectEnrollmentRequestSchema = z.object({
  subject_id: z.string().uuid('Invalid subject ID'),
  academic_year_id: z.string().uuid('Invalid academic year ID'),
  students: z.array(z.string().uuid('Invalid student ID')).min(1, 'At least one student must be selected'),
  teacher_preferences: z.record(z.string(), z.array(TeacherPreferenceSchema)).optional(),
  enrollment_options: z.object({
    respect_capacity_limits: z.boolean().default(true),
    allow_cross_grade_enrollment: z.boolean().default(false),
    prioritize_preferences: z.boolean().default(true),
    balance_class_sizes: z.boolean().default(true),
    conflict_resolution_strategy: z.enum(['REJECT', 'OVERRIDE', 'ASK']).default('REJECT')
  }).optional()
});

export const TeacherDistributionInfoSchema = z.object({
  teacher_id: z.string().uuid(),
  teacher_name: z.string(),
  classroom_id: z.string().uuid(),
  classroom_name: z.string(),
  students_enrolled: z.number().int().nonnegative(),
  capacity_remaining: z.number().int().nonnegative(),
  max_capacity: z.number().int().positive(),
  utilization_rate: z.number().min(0).max(100)
});

export const FlexibleSubjectEnrollmentResponseSchema = z.object({
  enrollments_created: z.array(EnrollmentCreatedSchema),
  conflicts: z.array(EnrollmentConflictSchema),
  teacher_distribution: z.record(z.string(), TeacherDistributionInfoSchema),
  summary: z.object({
    total_enrollments_created: z.number().int(),
    total_students_processed: z.number().int(),
    teachers_utilized: z.number().int(),
    average_class_size: z.number(),
    conflicts_count: z.number().int()
  }),
  message: z.string()
});

// ========================================================================
// TIER 3: SPECIAL PROGRAM ENROLLMENT SCHEMAS
// ========================================================================

export const SpecialProgramDetailsSchema = z.object({
  enrollment_type: z.enum(['GIFTED', 'SPECIAL_EDUCATION', 'ESL', 'REMEDIAL', 'ADVANCED', 'OTHER']),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  has_iep: z.boolean().default(false),
  has_504: z.boolean().default(false),
  accommodation_notes: z.string().optional(),
  override_conflicts: z.boolean().default(false),
  parent_consent_required: z.boolean().default(true),
  evaluation_required: z.boolean().default(false),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  additional_requirements: z.record(z.string(), z.any()).optional()
});

export const SpecialProgramEnrollmentRequestSchema = z.object({
  student_id: z.string().uuid('Invalid student ID'),
  teacher_subject_assignment_id: z.string().uuid('Invalid teacher subject assignment ID'),
  academic_year_id: z.string().uuid('Invalid academic year ID'),
  enrollment_details: SpecialProgramDetailsSchema
});

export const SpecialProgramEnrollmentResponseSchema = z.object({
  enrollment_created: EnrollmentCreatedSchema.extend({
    special_program_details: SpecialProgramDetailsSchema,
    requires_approval: z.boolean(),
    approval_workflow_id: z.string().optional()
  }).optional(),
  conflicts: z.array(EnrollmentConflictSchema),
  recommendations: z.array(z.string()),
  message: z.string()
});

// ========================================================================
// CONFLICT DETECTION AND RESOLUTION SCHEMAS
// ========================================================================

export const ConflictDetectionResponseSchema = z.object({
  conflicts: z.record(z.string(), z.array(EnrollmentConflictSchema)),
  summary: z.object({
    total_conflicts: z.number().int(),
    critical_conflicts: z.number().int(),
    high_conflicts: z.number().int(),
    medium_conflicts: z.number().int(),
    low_conflicts: z.number().int(),
    auto_resolvable: z.number().int(),
    students_affected: z.number().int()
  }),
  recommendations: z.array(z.string()),
  resolution_steps: z.array(z.object({
    step: z.number().int(),
    description: z.string(),
    action_required: z.boolean(),
    estimated_time: z.string().optional()
  }))
});

// ========================================================================
// STUDENT ENROLLMENT SUMMARY SCHEMAS
// ========================================================================

export const EnrollmentSummaryItemSchema = z.object({
  id: z.string().uuid(),
  subject_name: z.string(),
  subject_code: z.string(),
  subject_type: z.enum(['CORE', 'ENRICHMENT', 'SPECIAL', 'ELECTIVE', 'REMEDIAL']),
  teacher_name: z.string(),
  classroom_name: z.string(),
  enrollment_type: z.string(),
  enrollment_status: z.enum(['ACTIVE', 'INACTIVE', 'WITHDRAWN', 'PENDING', 'COMPLETED']),
  enrollment_date: z.string().optional(),
  current_grade: z.number().min(0).max(100).optional(),
  grade_letter: z.string().optional(),
  attendance_rate: z.number().min(0).max(100).optional(),
  is_auto_enrolled: z.boolean(),
  has_iep: z.boolean().default(false),
  has_504: z.boolean().default(false),
  tier: z.nativeEnum(EnrollmentTier)
});

export const StudentEnrollmentSummaryResponseSchema = z.object({
  student: z.object({
    id: z.string().uuid(),
    name: z.string(),
    student_id: z.string().optional(),
    current_grade_level: z.string(),
    is_active: z.boolean()
  }),
  academic_year_id: z.string().uuid(),
  enrollment_summary: z.object({
    core_subjects: z.array(EnrollmentSummaryItemSchema),
    enrichment_subjects: z.array(EnrollmentSummaryItemSchema),
    special_programs: z.array(EnrollmentSummaryItemSchema),
    electives: z.array(EnrollmentSummaryItemSchema)
  }),
  statistics: z.object({
    total_enrollments: z.number().int(),
    active_enrollments: z.number().int(),
    core_completion_rate: z.number().min(0).max(100),
    overall_gpa: z.number().min(0).max(4).optional(),
    attendance_rate: z.number().min(0).max(100).optional()
  }),
  conflicts: z.array(EnrollmentConflictSchema),
  recommendations: z.array(z.string()),
  message: z.string()
});

// ========================================================================
// ENROLLMENT TIERS INFORMATION SCHEMA
// ========================================================================

export const EnrollmentTierInfoSchema = z.object({
  enrollment_tiers: z.object({
    tier_1_core: z.object({
      name: z.string(),
      description: z.string(),
      use_case: z.string(),
      subjects: z.array(z.string()),
      automation_level: z.string()
    }),
    tier_2_flexible: z.object({
      name: z.string(),
      description: z.string(),
      use_case: z.string(),
      features: z.array(z.string()),
      automation_level: z.string()
    }),
    tier_3_special: z.object({
      name: z.string(),
      description: z.string(),
      use_case: z.string(),
      features: z.array(z.string()),
      automation_level: z.string()
    })
  }),
  workflow_recommendations: z.array(z.string())
});

// ========================================================================
// UTILITY SCHEMAS
// ========================================================================

export const EnrollmentValidationResultSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(z.string()),
  warnings: z.array(z.string())
});

export const EnrollmentCapacityEstimateSchema = z.object({
  estimatedEnrollments: z.number().int(),
  estimatedClassrooms: z.number().int(),
  capacityWarnings: z.array(z.string())
});

// ========================================================================
// TYPE EXPORTS
// ========================================================================

export type BulkHomeroomEnrollmentRequest = z.infer<typeof BulkHomeroomEnrollmentRequestSchema>;
export type BulkHomeroomEnrollmentResponse = z.infer<typeof BulkHomeroomEnrollmentResponseSchema>;
export type EnrollmentCreated = z.infer<typeof EnrollmentCreatedSchema>;
export type EnrollmentConflict = z.infer<typeof EnrollmentConflictSchema>;

export type FlexibleSubjectEnrollmentRequest = z.infer<typeof FlexibleSubjectEnrollmentRequestSchema>;
export type FlexibleSubjectEnrollmentResponse = z.infer<typeof FlexibleSubjectEnrollmentResponseSchema>;
export type TeacherPreference = z.infer<typeof TeacherPreferenceSchema>;
export type TeacherDistributionInfo = z.infer<typeof TeacherDistributionInfoSchema>;

export type SpecialProgramEnrollmentRequest = z.infer<typeof SpecialProgramEnrollmentRequestSchema>;
export type SpecialProgramEnrollmentResponse = z.infer<typeof SpecialProgramEnrollmentResponseSchema>;
export type SpecialProgramDetails = z.infer<typeof SpecialProgramDetailsSchema>;

export type ConflictDetectionResponse = z.infer<typeof ConflictDetectionResponseSchema>;
export type StudentEnrollmentSummaryResponse = z.infer<typeof StudentEnrollmentSummaryResponseSchema>;
export type EnrollmentSummaryItem = z.infer<typeof EnrollmentSummaryItemSchema>;

export type EnrollmentTierInfo = z.infer<typeof EnrollmentTierInfoSchema>;
export type EnrollmentValidationResult = z.infer<typeof EnrollmentValidationResultSchema>;
export type EnrollmentCapacityEstimate = z.infer<typeof EnrollmentCapacityEstimateSchema>;

// Additional helper types
export type EnrollmentTierType = keyof typeof EnrollmentTier;
export type ConflictTypeKey = keyof typeof ConflictType;
export type ConflictSeverityLevel = keyof typeof ConflictSeverity;

// Subject type mapping for UI components
export const SUBJECT_TYPE_LABELS = {
  CORE: 'Core Subjects',
  ENRICHMENT: 'Enrichment',
  SPECIAL: 'Special Programs',
  ELECTIVE: 'Electives',
  REMEDIAL: 'Remedial'
} as const;

// Conflict severity colors for UI
export const CONFLICT_SEVERITY_COLORS = {
  LOW: 'info',
  MEDIUM: 'warning',
  HIGH: 'error',
  CRITICAL: 'error'
} as const;

// Enrollment status colors for UI
export const ENROLLMENT_STATUS_COLORS = {
  ACTIVE: 'success',
  INACTIVE: 'default',
  WITHDRAWN: 'error',
  PENDING: 'warning',
  COMPLETED: 'info'
} as const;