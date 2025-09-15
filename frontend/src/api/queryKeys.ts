// src/api/queryKeys.ts - Simplified query key patterns
export const queryKeys = {
  // Auth
  auth: {
    context: ['auth', 'context'] as const,
  },

  // Academic Years - Simplified structure
  years: {
    all: ['years'] as const,
    list: (filters?: any) => ['years', 'list', filters] as const,
    detail: (id: string) => ['years', 'detail', id] as const,
    // Helper for invalidating all list queries
    lists: () => ['years', 'list'] as const,
  },

  // Subjects - Simplified structure
  subjects: {
    all: ['subjects'] as const,
    list: (filters?: any) => ['subjects', 'list', filters] as const,
    detail: (id: string) => ['subjects', 'detail', id] as const,
    lists: () => ['subjects', 'list'] as const,
  },

  // Classrooms - Simplified structure
  classrooms: {
    all: ['classrooms'] as const,
    list: (filters?: any) => ['classrooms', 'list', filters] as const,
    detail: (id: string) => ['classrooms', 'detail', id] as const,
    roster: (id: string) => ['classrooms', 'roster', id] as const,
    lists: () => ['classrooms', 'list'] as const,
  },

  // Rooms - Simplified structure
  rooms: {
    all: ['rooms'] as const,
    list: (filters?: any) => ['rooms', 'list', filters] as const,
    detail: (id: string) => ['rooms', 'detail', id] as const,
    usage: (id: string) => ['rooms', 'usage', id] as const,
    lists: () => ['rooms', 'list'] as const,
  },

  // Teachers - Simplified structure
  teachers: {
    all: ['teachers'] as const,
    list: (filters?: any) => ['teachers', 'list', filters] as const,
    detail: (id: string) => ['teachers', 'detail', id] as const,
    lists: () => ['teachers', 'list'] as const,
  },

  // Students - Simplified structure
  students: {
    all: ['students'] as const,
    list: (filters?: any) => ['students', 'list', filters] as const,
    detail: (id: string) => ['students', 'detail', id] as const,
    enrollments: (studentId: string) => ['students', 'enrollments', studentId] as const,
    nextId: (schoolId: string) => ['students', 'nextId', schoolId] as const,
    lists: () => ['students', 'list'] as const,
  },

  // Enrollments - Simplified structure
  enrollments: {
    all: ['enrollments'] as const,
    list: (filters?: any) => ['enrollments', 'list', filters] as const,
    detail: (id: string) => ['enrollments', 'detail', id] as const,
    lists: () => ['enrollments', 'list'] as const,
  },

  // Homeroom - Query keys for homeroom intelligence system
  homeroom: {
    all: ['homeroom'] as const,
    preview: (grade: string, teacherId: string, filters?: any) => ['homeroom', 'preview', grade, teacherId, filters] as const,
    teacherSubjects: (teacherId?: string, filters?: any) => ['homeroom', 'teacher-subjects', teacherId, filters] as const,
    conflicts: (grade?: string) => ['homeroom', 'conflicts', grade] as const,
    metrics: () => ['homeroom', 'enrollment-metrics'] as const,
    lists: () => ['homeroom', 'list'] as const,
  },

  // Teacher Swaps - Query keys for subject swap system
  teacherSwaps: {
    all: ['teacherSwaps'] as const,
    pending: (teacherId?: string) => ['teacherSwaps', 'pending', teacherId] as const,
    admin: () => ['teacherSwaps', 'admin'] as const,
    eligible: (requesterTeacherId?: string, subjectId?: string, academicYearId?: string) => 
      ['teacherSwaps', 'eligible', requesterTeacherId, subjectId, academicYearId] as const,
    impact: (payload?: any) => ['teacherSwaps', 'impact', payload] as const,
    lists: () => ['teacherSwaps'] as const,
  },
};