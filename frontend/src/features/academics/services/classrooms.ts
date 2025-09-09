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
  return ClassroomSchema.parse(data);
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
