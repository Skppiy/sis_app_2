// src/features/academics/hooks/useTeacherSwaps.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createSwapRequest,
  getSwapImpactAnalysis,
  getTeacherPendingSwaps,
  respondToSwapRequest,
  getAdminPendingSwaps,
  reviewSwapRequest,
  cancelSwapRequest,
  getEligibleSwapTeachers,
} from '../services/teacherSwaps';
import { queryKeys } from '@/api/queryKeys';
import type { SwapRequest, SwapImpactAnalysis } from '../services/teacherSwaps';

// Hook to get eligible teachers for swapping
export function useEligibleSwapTeachers(
  requesterTeacherId: string | undefined,
  requesterSubjectId: string | undefined,
  academicYearId?: string
) {
  return useQuery({
    queryKey: queryKeys.teacherSwaps.eligible(requesterTeacherId, requesterSubjectId, academicYearId),
    queryFn: () => getEligibleSwapTeachers(requesterTeacherId!, requesterSubjectId!, academicYearId),
    enabled: !!requesterTeacherId && !!requesterSubjectId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to get swap impact analysis
export function useSwapImpactAnalysis(
  payload: {
    requester_teacher_id: string;
    target_teacher_id: string;
    requester_subject_id: string;
    target_subject_id: string;
  } | undefined
) {
  return useQuery({
    queryKey: queryKeys.teacherSwaps.impact(payload),
    queryFn: () => getSwapImpactAnalysis(payload!),
    enabled: !!payload && !!payload.requester_teacher_id && !!payload.target_teacher_id && 
             !!payload.requester_subject_id && !!payload.target_subject_id,
    staleTime: 1 * 60 * 1000, // 1 minute - impact analysis changes frequently
  });
}

// Hook to create a swap request
export function useCreateSwapRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createSwapRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teacherSwaps.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.teacherSwaps.admin() });
    },
  });
}

// Hook to get teacher's pending swaps (sent + received)
export function useTeacherSwaps(teacherId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.teacherSwaps.pending(teacherId),
    queryFn: () => getTeacherPendingSwaps(teacherId!),
    enabled: !!teacherId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes for status updates
  });
}

// Hook to respond to swap request (target teacher)
export function useRespondToSwap() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ swapId, response, comments }: { 
      swapId: string; 
      response: 'ACCEPT' | 'DECLINE';
      comments?: string;
    }) => respondToSwapRequest(swapId, response, comments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teacherSwaps.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.teacherSwaps.admin() });
    },
  });
}

// Hook to cancel swap request (requester)
export function useCancelSwapRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: cancelSwapRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teacherSwaps.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.teacherSwaps.admin() });
    },
  });
}

// Hook to get admin pending swaps
export function useAdminSwaps() {
  return useQuery({
    queryKey: queryKeys.teacherSwaps.admin(),
    queryFn: getAdminPendingSwaps,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes for admin oversight
  });
}

// Hook to review swap request (admin)
export function useReviewSwap() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ swapId, decision, adminComments }: { 
      swapId: string; 
      decision: 'APPROVE' | 'REJECT';
      adminComments?: string;
    }) => reviewSwapRequest(swapId, decision, adminComments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teacherSwaps.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.teacherSwaps.admin() });
      // Also invalidate teacher subjects since assignments might have changed
      queryClient.invalidateQueries({ queryKey: queryKeys.homeroom.teacherSubjects() });
    },
  });
}

// Helper function to get swap status display text
export function getSwapStatusDisplay(status: SwapRequest['status']): {
  text: string;
  color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
} {
  switch (status) {
    case 'PENDING_TARGET_RESPONSE':
      return { text: 'Awaiting Teacher Response', color: 'warning' };
    case 'PENDING_ADMIN_APPROVAL':
      return { text: 'Awaiting Admin Approval', color: 'info' };
    case 'APPROVED':
      return { text: 'Approved & Executed', color: 'success' };
    case 'REJECTED':
      return { text: 'Rejected', color: 'error' };
    case 'CANCELLED':
      return { text: 'Cancelled', color: 'default' };
    default:
      return { text: 'Unknown', color: 'default' };
  }
}

// Helper function to check if user can cancel a swap
export function canCancelSwap(swap: SwapRequest, currentUserId: string): boolean {
  return swap.requester_teacher.id === currentUserId && 
         swap.status === 'PENDING_TARGET_RESPONSE';
}

// Helper function to check if user can respond to a swap
export function canRespondToSwap(swap: SwapRequest, currentUserId: string): boolean {
  return swap.target_teacher.id === currentUserId && 
         swap.status === 'PENDING_TARGET_RESPONSE';
}

// Helper function to format teacher name
export function formatTeacherName(teacher: { first_name: string; last_name: string }): string {
  return `${teacher.first_name} ${teacher.last_name}`;
}

// Helper function to get swap direction text
export function getSwapDirectionText(swap: SwapRequest, currentUserId: string): {
  direction: 'sent' | 'received';
  otherTeacher: { first_name: string; last_name: string };
  yourSubject: { name: string; code: string };
  theirSubject: { name: string; code: string };
} {
  const isSentByUser = swap.requester_teacher.id === currentUserId;
  
  return {
    direction: isSentByUser ? 'sent' : 'received',
    otherTeacher: isSentByUser ? swap.target_teacher : swap.requester_teacher,
    yourSubject: isSentByUser ? swap.requester_subject : swap.target_subject,
    theirSubject: isSentByUser ? swap.target_subject : swap.requester_subject,
  };
}