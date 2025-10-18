// src/features/academics/hooks/useStudentServices.ts
import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listStudentServiceTags,
  createStudentServiceTag,
  updateStudentServiceTag,
  deactivateStudentServiceTag,
  getStudentServiceAssignments,
  createStudentServiceAssignment,
  deleteStudentServiceAssignment,
  type StudentServiceTag,
  type StudentServiceTagCreate,
  type StudentServiceAssignment,
  type StudentServiceAssignmentCreate,
} from '../services/studentServices';

// Hook for managing service tags (admin)
export function useStudentServiceTags() {
  const queryClient = useQueryClient();

  const {
    data: tags = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['student-service-tags'],
    queryFn: listStudentServiceTags,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const createTagMutation = useMutation({
    mutationFn: createStudentServiceTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-service-tags'] });
    },
  });

  const updateTagMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<StudentServiceTagCreate> }) =>
      updateStudentServiceTag(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-service-tags'] });
    },
  });

  const deactivateTagMutation = useMutation({
    mutationFn: deactivateStudentServiceTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-service-tags'] });
    },
  });

  return {
    tags,
    isLoading,
    error,
    refetch,
    createTag: createTagMutation.mutate,
    updateTag: updateTagMutation.mutate,
    deactivateTag: deactivateTagMutation.mutate,
    isCreating: createTagMutation.isPending,
    isUpdating: updateTagMutation.isPending,
    isDeactivating: deactivateTagMutation.isPending,
    createError: createTagMutation.error,
    updateError: updateTagMutation.error,
    deactivateError: deactivateTagMutation.error,
  };
}

// Hook for managing student service assignments
export function useStudentServiceAssignments(studentId?: string) {
  const queryClient = useQueryClient();

  const {
    data: assignments = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['student-service-assignments', studentId],
    queryFn: () => getStudentServiceAssignments(studentId!),
    enabled: !!studentId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const createAssignmentMutation = useMutation({
    mutationFn: createStudentServiceAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['student-service-assignments', studentId]
      });
    },
  });

  const deleteAssignmentMutation = useMutation({
    mutationFn: deleteStudentServiceAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['student-service-assignments', studentId]
      });
    },
  });

  return {
    assignments,
    isLoading,
    error,
    refetch,
    createAssignment: createAssignmentMutation.mutate,
    deleteAssignment: deleteAssignmentMutation.mutate,
    isCreating: createAssignmentMutation.isPending,
    isDeleting: deleteAssignmentMutation.isPending,
    createError: createAssignmentMutation.error,
    deleteError: deleteAssignmentMutation.error,
  };
}

// Combined hook for full student services management
export function useStudentServices(studentId?: string) {
  const tagsData = useStudentServiceTags();
  const assignmentsData = useStudentServiceAssignments(studentId);

  // Filter active tags for assignment selection
  const activeTags = tagsData.tags.filter(tag => tag.is_active);

  // Get currently assigned tag IDs to prevent duplicates
  const assignedTagIds = new Set(
    assignmentsData.assignments
      .filter(assignment => assignment.is_active)
      .map(assignment => assignment.tag_library_id)
  );

  // Filter available tags (not yet assigned)
  const availableTags = activeTags.filter(tag => !assignedTagIds.has(tag.id));

  return {
    // Tags management
    ...tagsData,
    activeTags,
    availableTags,

    // Assignments management
    assignments: assignmentsData.assignments,
    assignmentsLoading: assignmentsData.isLoading,
    assignmentsError: assignmentsData.error,
    createAssignment: assignmentsData.createAssignment,
    deleteAssignment: assignmentsData.deleteAssignment,
    isCreatingAssignment: assignmentsData.isCreating,
    isDeletingAssignment: assignmentsData.isDeleting,
    assignmentCreateError: assignmentsData.createError,
    assignmentDeleteError: assignmentsData.deleteError,
    refetchAssignments: assignmentsData.refetch,
  };
}

// Hook for checking if a student requires accommodations
export function useStudentAccommodationStatus(studentId?: string) {
  const { assignments, isLoading } = useStudentServiceAssignments(studentId);

  const [requiresAccommodation, setRequiresAccommodation] = useState(false);

  useEffect(() => {
    if (!isLoading && assignments) {
      // Check if student has any active assignments
      const hasActiveServices = assignments.some(assignment => assignment.is_active);
      setRequiresAccommodation(hasActiveServices);
    }
  }, [assignments, isLoading]);

  return {
    requiresAccommodation,
    activeServicesCount: assignments.filter(a => a.is_active).length,
    isLoading,
  };
}