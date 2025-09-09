// src/features/academics/services/teachers.ts
import { apiFetch } from "@/api/requestHelper";
import { Teacher, TeacherSchema, TeacherCreate } from "@/schemas/academics";
import { z } from "zod";

const TeachersListSchema = z.array(TeacherSchema);

export async function listTeachers(params?: {
  school_id?: string;
  is_active?: boolean;
  grade_level?: string;
  is_specialist?: boolean;
}): Promise<Teacher[]> {
  const searchParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });
  }
  
  const queryString = searchParams.toString();
  const url = queryString ? `/admin/teachers?${queryString}` : "/admin/teachers";
  
  console.log('[TeachersService] Calling API:', url);
  
  try {
    const data = await apiFetch<unknown>(url);
    console.log('[TeachersService] Received data:', data);
    
    // Backend already returns complete teacher data - no enrichment needed!
    const validatedData = TeachersListSchema.parse(data);
    console.log('[TeachersService] Validated teachers:', validatedData);
    
    return validatedData;
  } catch (error) {
    console.error('[TeachersService] Failed to load teachers:', error);
    throw error;
  }
}

export async function createTeacher(payload: TeacherCreate) {
  const data = await apiFetch<unknown>("/admin/teachers", {
    method: "POST",
    json: payload,
  });
  return TeacherSchema.parse(data);
}

export async function updateTeacher(id: string, payload: Partial<Teacher>) {
  const data = await apiFetch<unknown>(`/admin/teachers/${id}`, {
    method: "PUT",
    json: payload,
  });
  return TeacherSchema.parse(data);
}

export async function deleteTeacher(id: string) {
  await apiFetch<void>(`/admin/teachers/${id}`, { method: "DELETE" });
}