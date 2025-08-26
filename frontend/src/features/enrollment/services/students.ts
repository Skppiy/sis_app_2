// src/features/enrollment/services/students.ts
import { apiFetch } from "@/api/requestHelper";
import { 
  Student, 
  StudentSchema, 
  StudentCreate, 
  StudentCreateSchema,
  StudentUpdate,
  Enrollment,
  EnrollmentSchema
} from "@/schemas/students";
import { z } from "zod";

const StudentsListSchema = z.array(StudentSchema);
const EnrollmentsListSchema = z.array(EnrollmentSchema);

// List all students with optional filtering
export async function listStudents(params?: {
  school_id?: string;
  grade_level?: string;
  is_active?: boolean;
}): Promise<Student[]> {
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
  
  const data = await apiFetch<unknown>(url);
  return StudentsListSchema.parse(data);
}

// Get a specific student by ID
export async function getStudent(id: string): Promise<Student> {
  const data = await apiFetch<unknown>(`/students/${id}`);
  return StudentSchema.parse(data);
}

// Create a new student
export async function createStudent(payload: StudentCreate): Promise<Student> {
  const validatedPayload = StudentCreateSchema.parse(payload);
  
  const data = await apiFetch<unknown>("/students", {
    method: "POST",
    json: validatedPayload
  });
  return StudentSchema.parse(data);
}

// Update an existing student
export async function updateStudent(id: string, payload: StudentUpdate): Promise<Student> {
  const data = await apiFetch<unknown>(`/students/${id}`, {
    method: "PUT",
    json: payload
  });
  return StudentSchema.parse(data);
}

// Delete a student (soft delete)
export async function deleteStudent(id: string): Promise<void> {
  await apiFetch<void>(`/students/${id}`, {
    method: "DELETE"
  });
}

// Get enrollments for a specific student
export async function getStudentEnrollments(
  studentId: string,
  params?: {
    academic_year_id?: string;
    active_only?: boolean;
  }
): Promise<Enrollment[]> {
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
  
  const data = await apiFetch<unknown>(url);
  return EnrollmentsListSchema.parse(data);
}

// Enroll a student in a classroom
export async function enrollStudent(payload: {
  student_id: string;
  classroom_id: string;
  enrollment_date?: string;
}): Promise<Enrollment> {
  const data = await apiFetch<unknown>("/enrollments", {
    method: "POST",
    json: payload
  });
  return EnrollmentSchema.parse(data);
}

// Withdraw/unenroll a student from a classroom
export async function withdrawEnrollment(enrollmentId: string): Promise<void> {
  await apiFetch<void>(`/enrollments/${enrollmentId}`, {
    method: "DELETE"
  });
}

// Get the next available student ID for a school
export async function getNextStudentId(schoolId: string): Promise<string> {
  const data = await apiFetch<{ student_id: string }>(`/students/next-id?school_id=${schoolId}`);
  return data.student_id;
}