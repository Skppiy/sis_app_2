// src/features/academics/services/teacherSwaps.ts
import { apiFetch } from "@/api/requestHelper";
import { z } from "zod";

// Response schemas for teacher swap endpoints
const SwapRequestSchema = z.object({
  id: z.string().uuid(),
  requester_teacher_id: z.string().uuid(),
  target_teacher_id: z.string().uuid(),
  requester_subject_id: z.string().uuid(),
  target_subject_id: z.string().uuid(),
  reason: z.string(),
  status: z.enum(['PENDING_TARGET_RESPONSE', 'PENDING_ADMIN_APPROVAL', 'APPROVED', 'REJECTED', 'CANCELLED']),
  requested_at: z.string(),
  target_response_at: z.string().optional(),
  admin_reviewed_at: z.string().optional(),
  admin_comments: z.string().optional(),
  // Enriched data
  requester_teacher: z.object({
    id: z.string().uuid(),
    first_name: z.string(),
    last_name: z.string(),
    email: z.string().email().optional(),
  }),
  target_teacher: z.object({
    id: z.string().uuid(),
    first_name: z.string(),
    last_name: z.string(),
    email: z.string().email().optional(),
  }),
  requester_subject: z.object({
    id: z.string().uuid(),
    name: z.string(),
    code: z.string(),
  }),
  target_subject: z.object({
    id: z.string().uuid(),
    name: z.string(),
    code: z.string(),
  }),
  affected_students_count: z.number().int(),
});

const SwapImpactAnalysisSchema = z.object({
  requester_impact: z.object({
    current_students: z.number().int(),
    students_gained: z.number().int(),
    students_lost: z.number().int(),
    net_change: z.number().int(),
    affected_classrooms: z.array(z.object({
      id: z.string().uuid(),
      name: z.string(),
      grade_level: z.string(),
      enrollment_count: z.number().int(),
    })),
  }),
  target_impact: z.object({
    current_students: z.number().int(),
    students_gained: z.number().int(),
    students_lost: z.number().int(),
    net_change: z.number().int(),
    affected_classrooms: z.array(z.object({
      id: z.string().uuid(),
      name: z.string(),
      grade_level: z.string(),
      enrollment_count: z.number().int(),
    })),
  }),
  schedule_conflicts: z.array(z.object({
    type: z.string(),
    description: z.string(),
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  })),
  grade_compatibility: z.object({
    is_compatible: z.boolean(),
    warnings: z.array(z.string()),
  }),
});

const PendingSwapsSchema = z.array(SwapRequestSchema);

const SwapExecutionResultSchema = z.object({
  success: z.boolean(),
  swap_id: z.string().uuid(),
  enrollments_transferred: z.number().int(),
  notifications_sent: z.number().int(),
  message: z.string(),
});

export type SwapRequest = z.infer<typeof SwapRequestSchema>;
export type SwapImpactAnalysis = z.infer<typeof SwapImpactAnalysisSchema>;
export type PendingSwaps = z.infer<typeof PendingSwapsSchema>;
export type SwapExecutionResult = z.infer<typeof SwapExecutionResultSchema>;

// Create swap request
export async function createSwapRequest(payload: {
  target_teacher_id: string;
  requester_subject_id: string;
  target_subject_id: string;
  reason: string;
}): Promise<SwapRequest> {
  const data = await apiFetch<unknown>("/homeroom/teacher-assignments/swap", {
    method: "POST",
    json: payload,
  });
  return SwapRequestSchema.parse(data);
}

// Get swap impact analysis (before creating request)
export async function getSwapImpactAnalysis(payload: {
  requester_teacher_id: string;
  target_teacher_id: string;
  requester_subject_id: string;
  target_subject_id: string;
}): Promise<SwapImpactAnalysis> {
  const data = await apiFetch<unknown>("/homeroom/teacher-assignments/swap/preview", {
    method: "POST",
    json: payload,
  });
  return SwapImpactAnalysisSchema.parse(data);
}

// Get pending swaps for a teacher (sent + received)
export async function getTeacherPendingSwaps(teacherId: string): Promise<PendingSwaps> {
  const data = await apiFetch<unknown>(`/homeroom/teacher-assignments/swaps/pending?teacher_id=${teacherId}`);
  return PendingSwapsSchema.parse(data);
}

// Respond to swap request (target teacher)
export async function respondToSwapRequest(
  swapId: string, 
  response: 'ACCEPT' | 'DECLINE',
  comments?: string
): Promise<SwapRequest> {
  const data = await apiFetch<unknown>(`/homeroom/teacher-assignments/swaps/${swapId}/respond`, {
    method: "PUT",
    json: { response, comments },
  });
  return SwapRequestSchema.parse(data);
}

// Get pending swaps for admin review
export async function getAdminPendingSwaps(): Promise<PendingSwaps> {
  const data = await apiFetch<unknown>("/homeroom/admin/swaps/pending-approval");
  return PendingSwapsSchema.parse(data);
}

// Admin review swap request
export async function reviewSwapRequest(
  swapId: string,
  decision: 'APPROVE' | 'REJECT',
  adminComments?: string
): Promise<SwapExecutionResult> {
  const data = await apiFetch<unknown>(`/homeroom/admin/swaps/${swapId}/review`, {
    method: "PUT",
    json: { decision, admin_comments: adminComments },
  });
  return SwapExecutionResultSchema.parse(data);
}

// Cancel swap request (requester only, before target responds)
export async function cancelSwapRequest(swapId: string): Promise<SwapRequest> {
  const data = await apiFetch<unknown>(`/homeroom/teacher-assignments/swaps/${swapId}/cancel`, {
    method: "PUT",
  });
  return SwapRequestSchema.parse(data);
}

// Get eligible teachers for swapping (elementary teachers with core subjects)
export async function getEligibleSwapTeachers(
  requesterTeacherId: string,
  requesterSubjectId: string,
  academicYearId?: string
): Promise<Array<{
  teacher: {
    id: string;
    first_name: string;
    last_name: string;
    grade_level: string;
  };
  compatible_subjects: Array<{
    id: string;
    name: string;
    code: string;
    grade_level: string;
    enrollment_count: number;
  }>;
}>> {
  const searchParams = new URLSearchParams();
  searchParams.append('subject_id', requesterSubjectId);
  if (academicYearId) {
    searchParams.append('academic_year_id', academicYearId);
  }
  
  const data = await apiFetch<unknown>(
    `/homeroom/teacher-assignments/swaps/eligible-teachers/${requesterTeacherId}?${searchParams.toString()}`
  );
  
  return z.array(z.object({
    teacher: z.object({
      id: z.string().uuid(),
      first_name: z.string(),
      last_name: z.string(),
      grade_level: z.string(),
    }),
    compatible_subjects: z.array(z.object({
      id: z.string().uuid(),
      name: z.string(),
      code: z.string(),
      grade_level: z.string(),
      enrollment_count: z.number().int(),
    })),
  })).parse(data);
}