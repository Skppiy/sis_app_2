// src/features/enrollment/services/students.ts
import { apiFetch } from "@/api/requestHelper";
import { StudentSchema, StudentCreateSchema, EnrollmentSchema } from "@/schemas/students";
import { z } from "zod";
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
    const validatedPayload = StudentCreateSchema.parse(payload);
    const data = await apiFetch("/students", {
        method: "POST",
        json: validatedPayload
    });
    return StudentSchema.parse(data);
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
    const data = await apiFetch("/enrollments", {
        method: "POST",
        json: payload
    });
    return EnrollmentSchema.parse(data);
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
