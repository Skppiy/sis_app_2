// src/api/queryKeys.ts
export const queryKeys = {
    // Auth
    auth: {
        context: ['auth', 'context'],
    },
    // Academic Years
    years: {
        all: ['years'],
        lists: () => [...queryKeys.years.all, 'list'],
        list: (filters) => [...queryKeys.years.lists(), filters],
        details: () => [...queryKeys.years.all, 'detail'],
        detail: (id) => [...queryKeys.years.details(), id],
    },
    // Subjects
    subjects: {
        all: ['subjects'],
        lists: () => [...queryKeys.subjects.all, 'list'],
        list: (filters) => [...queryKeys.subjects.lists(), filters],
        details: () => [...queryKeys.subjects.all, 'detail'],
        detail: (id) => [...queryKeys.subjects.details(), id],
    },
    // Classrooms
    classrooms: {
        all: ['classrooms'],
        lists: () => [...queryKeys.classrooms.all, 'list'],
        list: (filters) => [...queryKeys.classrooms.lists(), filters],
        details: () => [...queryKeys.classrooms.all, 'detail'],
        detail: (id) => [...queryKeys.classrooms.details(), id],
        roster: (id) => [...queryKeys.classrooms.all, 'roster', id],
    },
    // Rooms
    rooms: {
        all: ['rooms'],
        lists: () => [...queryKeys.rooms.all, 'list'],
        list: (filters) => [...queryKeys.rooms.lists(), filters],
        details: () => [...queryKeys.rooms.all, 'detail'],
        detail: (id) => [...queryKeys.rooms.details(), id],
        usage: (id) => [...queryKeys.rooms.all, 'usage', id],
    },
    // Students
    students: {
        all: ['students'],
        lists: () => [...queryKeys.students.all, 'list'],
        list: (filters) => [...queryKeys.students.lists(), filters],
        details: () => [...queryKeys.students.all, 'detail'],
        detail: (id) => [...queryKeys.students.details(), id],
        enrollments: (studentId) => [...queryKeys.students.all, 'enrollments', studentId],
        nextId: (schoolId) => [...queryKeys.students.all, 'nextId', schoolId],
    },
    // Enrollments
    enrollments: {
        all: ['enrollments'],
        lists: () => [...queryKeys.enrollments.all, 'list'],
        list: (filters) => [...queryKeys.enrollments.lists(), filters],
        details: () => [...queryKeys.enrollments.all, 'detail'],
        detail: (id) => [...queryKeys.enrollments.details(), id],
    },
};
