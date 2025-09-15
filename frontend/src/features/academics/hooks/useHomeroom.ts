// src/features/academics/hooks/useHomeroom.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  createHomeroomWithAutoAssignment,
  previewHomeroomAssignment,
  getTeacherAssignedSubjects,
  autoAssignNewCoreSubject,
  type HomeroomCreationResponse,
  type AssignmentPreview,
  type TeacherSubjects,
  type AutoAssignCoreResponse
} from "../services/homeroom";
import { queryKeys } from '@/api/queryKeys';

// Hook for creating a homeroom with auto-assignment
export function useCreateHomeroom() {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: (payload: {
      teacher_id: string;
      grade_level: string;
      room_id?: string;
      academic_year_id: string;
    }) => createHomeroomWithAutoAssignment(payload),
    onSuccess: (data) => {
      // Invalidate related queries
      qc.invalidateQueries({ queryKey: queryKeys.classrooms.lists() });
      qc.invalidateQueries({ queryKey: queryKeys.homeroom.lists() });
      qc.invalidateQueries({ 
        queryKey: queryKeys.homeroom.teacherSubjects(data.teacher.id) 
      });
      
      // If teacher was involved in the creation, invalidate their subject queries
      qc.invalidateQueries({ 
        queryKey: queryKeys.teachers.detail(data.teacher.id) 
      });
    },
  });
}

// Hook for previewing homeroom assignment
export function usePreviewAssignment(
  grade: string | undefined,
  teacherId: string | undefined,
  params?: { academic_year_id?: string }
) {
  return useQuery({
    queryKey: queryKeys.homeroom.preview(grade!, teacherId!, params),
    queryFn: () => previewHomeroomAssignment(grade!, teacherId!, params),
    enabled: !!(grade && teacherId),
    staleTime: 30_000, // 30 seconds cache - preview can change frequently
    retry: false, // Don't retry preview requests as they may be expensive
  });
}

// Hook for getting teacher's assigned subjects
export function useTeacherSubjects(
  teacherId: string | undefined,
  params?: { academic_year_id?: string }
) {
  return useQuery({
    queryKey: queryKeys.homeroom.teacherSubjects(teacherId!, params),
    queryFn: () => getTeacherAssignedSubjects(teacherId!, params),
    enabled: !!teacherId,
    staleTime: 60_000, // 1 minute cache
  });
}

// Hook for auto-assigning new CORE subjects to existing homeroom teachers
export function useAutoAssignCore() {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: (payload: {
      subject_id: string;
      academic_year_id: string;
      target_grades?: string[];
    }) => autoAssignNewCoreSubject(payload),
    onSuccess: (data) => {
      // Invalidate broad queries that might be affected
      qc.invalidateQueries({ queryKey: queryKeys.classrooms.lists() });
      qc.invalidateQueries({ queryKey: queryKeys.homeroom.lists() });
      qc.invalidateQueries({ queryKey: queryKeys.teachers.lists() });
      
      // Invalidate teacher subjects for all affected teachers
      data.classrooms_created.forEach((classroom) => {
        qc.invalidateQueries({ 
          queryKey: queryKeys.homeroom.teacherSubjects(classroom.teacher_id) 
        });
      });
    },
  });
}

// Additional utility hooks

// Hook to check if a teacher can be assigned as homeroom teacher
export function useCanTeacherBeHomeroom(teacherId: string | undefined) {
  const { data: teacherSubjects, isLoading } = useTeacherSubjects(teacherId);
  
  return {
    canBeHomeroom: !isLoading && teacherSubjects ? teacherSubjects.length === 0 : false,
    hasExistingAssignments: !isLoading && teacherSubjects ? teacherSubjects.length > 0 : false,
    isLoading,
  };
}

// Hook to get elementary grades (K-5) for homeroom creation
export function useElementaryGrades() {
  const ELEMENTARY_GRADES = [
    { value: 'K', label: 'Kindergarten' },
    { value: '1', label: '1st Grade' },
    { value: '2', label: '2nd Grade' },
    { value: '3', label: '3rd Grade' },
    { value: '4', label: '4th Grade' },
    { value: '5', label: '5th Grade' },
  ];
  
  return ELEMENTARY_GRADES;
}