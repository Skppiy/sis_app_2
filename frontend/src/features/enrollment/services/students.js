// src/features/enrollment/services/students.ts
import { apiFetch } from "@/api/requestHelper";
import { StudentSchema, StudentCreateSchema, EnrollmentSchema } from "@/schemas/students";
import { z } from "zod";
// Logging utility for service operations
const logOperation = (operation, details) => {
    if (import.meta.env.DEV) {
        console.log(`[StudentsService] ${operation}`, details);
    }
};
const logError = (operation, error) => {
    console.error(`[StudentsService] ${operation} failed:`, error);
};
const StudentsListSchema = z.array(StudentSchema);
const EnrollmentsListSchema = z.array(EnrollmentSchema);
// List all students with optional filtering
export async function listStudents(params) {
    const searchParams = new URLSearchParams();
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                searchParams.append(key, value.toString());
            }
        });
    }
    const queryString = searchParams.toString();
    const url = queryString ? `/students?${queryString}` : "/students";
    const data = await apiFetch(url);
    return StudentsListSchema.parse(data);
}
// Get a specific student by ID
export async function getStudent(id) {
    const data = await apiFetch(`/students/${id}`);
    return StudentSchema.parse(data);
}
// Create a new student
export async function createStudent(payload) {
    try {
        logOperation('createStudent', { firstName: payload.first_name, lastName: payload.last_name });
        const validatedPayload = StudentCreateSchema.parse(payload);
        const data = await apiFetch("/students", {
            method: "POST",
            json: validatedPayload
        });
        const student = StudentSchema.parse(data);
        logOperation('createStudent success', { studentId: student.id });
        return student;
    }
    catch (error) {
        logError('createStudent', error);
        // Enhanced error handling for student creation
        if (error instanceof z.ZodError) {
            throw new Error('Invalid student data provided. Please check all required fields.');
        }
        if (error && typeof error === 'object' && 'category' in error) {
            const apiError = error;
            switch (apiError.category) {
                case 'validation':
                    if (apiError.message.includes('Student ID')) {
                        throw new Error('This Student ID is already in use. Please choose a different ID.');
                    }
                    if (apiError.message.includes('email')) {
                        throw new Error('This email address is already registered. Please use a different email.');
                    }
                    throw new Error('The student information provided is invalid. Please check all fields.');
                case 'conflict':
                    throw new Error('A student with this information already exists. Please check for duplicates.');
                case 'auth':
                    throw new Error('You do not have permission to create students. Please contact your administrator.');
                default:
                    throw new Error('Failed to create student. Please try again or contact support.');
            }
        }
        throw error;
    }
}
// Update an existing student
export async function updateStudent(id, payload) {
    const data = await apiFetch(`/students/${id}`, {
        method: "PUT",
        json: payload
    });
    return StudentSchema.parse(data);
}
// Delete a student (soft delete)
export async function deleteStudent(id) {
    await apiFetch(`/students/${id}`, {
        method: "DELETE"
    });
}
// Get enrollments for a specific student
export async function getStudentEnrollments(studentId, params) {
    const searchParams = new URLSearchParams();
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                searchParams.append(key, value.toString());
            }
        });
    }
    const queryString = searchParams.toString();
    const url = queryString
        ? `/students/${studentId}/enrollments?${queryString}`
        : `/students/${studentId}/enrollments`;
    const data = await apiFetch(url);
    return EnrollmentsListSchema.parse(data);
}
// Enroll a student in a classroom
export async function enrollStudent(payload) {
    try {
        logOperation('enrollStudent', { studentId: payload.student_id, classroomId: payload.classroom_id });
        const data = await apiFetch("/enrollments", {
            method: "POST",
            json: payload
        });
        const enrollment = EnrollmentSchema.parse(data);
        logOperation('enrollStudent success', { enrollmentId: enrollment.id });
        return enrollment;
    }
    catch (error) {
        logError('enrollStudent', error);
        if (error && typeof error === 'object' && 'category' in error) {
            const apiError = error;
            switch (apiError.category) {
                case 'validation':
                    if (apiError.message.includes('capacity')) {
                        throw new Error('This classroom has reached its maximum capacity. Please choose a different classroom.');
                    }
                    if (apiError.message.includes('already enrolled')) {
                        throw new Error('This student is already enrolled in this classroom.');
                    }
                    if (apiError.message.includes('enrollment period')) {
                        throw new Error('The enrollment period has ended. Please contact administration for assistance.');
                    }
                    throw new Error('The enrollment information provided is invalid.');
                case 'not_found':
                    if (apiError.message.includes('student')) {
                        throw new Error('Student not found. Please refresh and try again.');
                    }
                    if (apiError.message.includes('classroom')) {
                        throw new Error('Classroom not found. Please refresh and try again.');
                    }
                    throw new Error('Required information not found. Please refresh and try again.');
                case 'conflict':
                    throw new Error('This enrollment conflicts with existing data. The student may already be enrolled.');
                case 'auth':
                    throw new Error('You do not have permission to enroll students. Please contact your administrator.');
                default:
                    throw new Error('Failed to enroll student. Please try again or contact support.');
            }
        }
        throw error;
    }
}
// Withdraw/unenroll a student from a classroom
export async function withdrawEnrollment(enrollmentId) {
    await apiFetch(`/enrollments/${enrollmentId}`, {
        method: "DELETE"
    });
}
// Get the next available student ID for a school
export async function getNextStudentId(schoolId) {
    const data = await apiFetch(`/students/next-id?school_id=${schoolId}`);
    return data.student_id;
}
