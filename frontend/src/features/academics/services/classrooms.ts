// src/features/academics/services/classrooms.ts
import { apiFetch } from "@/api/requestHelper";
import { 
  Classroom, 
  ClassroomSchema, 
  ClassroomCreate,
  ClassroomUpdate 
} from "@/schemas/academics";
import { z } from "zod";

const ClassroomsListSchema = z.array(ClassroomSchema);

export async function listClassrooms(params?: {
  academic_year_id?: string;
  subject_id?: string;
  teacher_user_id?: string;
  grade_level?: string;
}): Promise<Classroom[]> {
  const searchParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });
  }
  
  const queryString = searchParams.toString();
  const url = queryString ? `/classrooms?${queryString}` : "/classrooms";
  
  const data = await apiFetch<unknown>(url);
  return ClassroomsListSchema.parse(data);
}

export async function getClassroom(id: string): Promise<Classroom> {
  const data = await apiFetch<unknown>(`/classrooms/${id}`);
  return ClassroomSchema.parse(data);
}

export async function createClassroom(payload: ClassroomCreate): Promise<Classroom> {
  const data = await apiFetch<unknown>("/classrooms", {
    method: "POST",
    json: payload,
  });

  // Debug logging to identify schema mismatch
  console.log("Backend response data:", data);

  try {
    const parsed = ClassroomSchema.parse(data);
    console.log("Successfully parsed classroom:", parsed);
    return parsed;
  } catch (error) {
    console.error("Schema validation error:", error);
    console.error("Raw data that failed parsing:", data);
    throw error;
  }
}

export async function updateClassroom(id: string, payload: ClassroomUpdate): Promise<Classroom> {
  const data = await apiFetch<unknown>(`/classrooms/${id}`, {
    method: "PUT",
    json: payload,
  });
  return ClassroomSchema.parse(data);
}

export async function deleteClassroom(id: string): Promise<void> {
  await apiFetch<void>(`/classrooms/${id}`, { 
    method: "DELETE" 
  });
}
