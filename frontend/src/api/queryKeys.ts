// src/api/queryKeys.ts
export const queryKeys = {
  // Auth
  auth: {
    context: ['auth', 'context'] as const,
  },

  // Academic Years
  years: {
    all: ['years'] as const,
    lists: () => [...queryKeys.years.all, 'list'] as const,
    list: (filters?: any) => [...queryKeys.years.lists(), filters] as const,
    details: () => [...queryKeys.years.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.years.details(), id] as const,
  },

  // Subjects
  subjects: {
    all: ['subjects'] as const,
    lists: () => [...queryKeys.subjects.all, 'list'] as const,
    list: (filters?: any) => [...queryKeys.subjects.lists(), filters] as const,
    details: () => [...queryKeys.subjects.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.subjects.details(), id] as const,
  },

  // Classrooms
  classrooms: {
    all: ['classrooms'] as const,
    lists: () => [...queryKeys.classrooms.all, 'list'] as const,
    list: (filters?: any) => [...queryKeys.classrooms.lists(), filters] as const,
    details: () => [...queryKeys.classrooms.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.classrooms.details(), id] as const,
    roster: (id: string) => [...queryKeys.classrooms.all, 'roster', id] as const,
  },

  // Rooms
  rooms: {
    all: ['rooms'] as const,
    lists: () => [...queryKeys.rooms.all, 'list'] as const,
    list: (filters?: any) => [...queryKeys.rooms.lists(), filters] as const,
    details: () => [...queryKeys.rooms.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.rooms.details(), id] as const,
    usage: (id: string) => [...queryKeys.rooms.all, 'usage', id] as const,
  },

  // Students
  students: {
    all: ['students'] as const,
    lists: () => [...queryKeys.students.all, 'list'] as const,
    list: (filters?: any) => [...queryKeys.students.lists(), filters] as const,
    details: () => [...queryKeys.students.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.students.details(), id] as const,
    enrollments: (studentId: string) => [...queryKeys.students.all, 'enrollments', studentId] as const,
    nextId: (schoolId: string) => [...queryKeys.students.all, 'nextId', schoolId] as const,
  },

  // Enrollments
  enrollments: {
    all: ['enrollments'] as const,
    lists: () => [...queryKeys.enrollments.all, 'list'] as const,
    list: (filters?: any) => [...queryKeys.enrollments.lists(), filters] as const,
    details: () => [...queryKeys.enrollments.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.enrollments.details(), id] as const,
  },
};