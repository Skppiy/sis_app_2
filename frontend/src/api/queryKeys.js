// src/api/queryKeys.ts - Simplified query key patterns
export const queryKeys = {
    // Auth
    auth: {
        context: ['auth', 'context'],
    },
    // Academic Years - Simplified structure
    years: {
        all: ['years'],
        list: (filters) => ['years', 'list', filters],
        detail: (id) => ['years', 'detail', id],
        // Helper for invalidating all list queries
        lists: () => ['years', 'list'],
    },
    // Subjects - Simplified structure
    subjects: {
        all: ['subjects'],
        list: (filters) => ['subjects', 'list', filters],
        detail: (id) => ['subjects', 'detail', id],
        lists: () => ['subjects', 'list'],
    },
    // Classrooms - Simplified structure
    classrooms: {
        all: ['classrooms'],
        list: (filters) => ['classrooms', 'list', filters],
        detail: (id) => ['classrooms', 'detail', id],
        roster: (id) => ['classrooms', 'roster', id],
        lists: () => ['classrooms', 'list'],
    },
    // Rooms - Simplified structure
    rooms: {
        all: ['rooms'],
        list: (filters) => ['rooms', 'list', filters],
        detail: (id) => ['rooms', 'detail', id],
        usage: (id) => ['rooms', 'usage', id],
        lists: () => ['rooms', 'list'],
    },
    // Teachers - Simplified structure
    teachers: {
        all: ['teachers'],
        list: (filters) => ['teachers', 'list', filters],
        detail: (id) => ['teachers', 'detail', id],
        lists: () => ['teachers', 'list'],
    },
    // Students - Simplified structure
    students: {
        all: ['students'],
        list: (filters) => ['students', 'list', filters],
        detail: (id) => ['students', 'detail', id],
        enrollments: (studentId) => ['students', 'enrollments', studentId],
        nextId: (schoolId) => ['students', 'nextId', schoolId],
        lists: () => ['students', 'list'],
    },
    // Enrollments - Simplified structure
    enrollments: {
        all: ['enrollments'],
        list: (filters) => ['enrollments', 'list', filters],
        detail: (id) => ['enrollments', 'detail', id],
        lists: () => ['enrollments', 'list'],
    },
};
