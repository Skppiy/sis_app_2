// src/components/enrollment/index.ts

// Main Three-Tier Enrollment Manager
export { default as ThreeTierEnrollmentManager } from './ThreeTierEnrollmentManager';

// Tier-specific components
export { TierOneComponent } from './tiers/TierOneComponent';
export { TierTwoComponent } from './tiers/TierTwoComponent';
export { TierThreeComponent } from './tiers/TierThreeComponent';

// Conflict resolution and summary components
export { ConflictResolutionComponent } from './ConflictResolutionComponent';
export { EnrollmentSummaryComponent } from './EnrollmentSummaryComponent';

// Re-export types for convenience
export type {
  BulkHomeroomEnrollmentRequest,
  BulkHomeroomEnrollmentResponse,
  FlexibleSubjectEnrollmentRequest,
  FlexibleSubjectEnrollmentResponse,
  SpecialProgramEnrollmentRequest,
  SpecialProgramEnrollmentResponse,
  ConflictDetectionResponse,
  StudentEnrollmentSummaryResponse,
  EnrollmentTierInfo,
  EnrollmentConflict,
  EnrollmentSummaryItem
} from '@/schemas/threeTierEnrollment';