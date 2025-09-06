// src/features/academics/services/subjects.ts
import { apiFetch } from "@api/requestHelper";
import { Subject, SubjectSchema, SubjectCreate } from "@schemas/academics";
import { z } from "zod";

const SubjectsListSchema = z.array(SubjectSchema);

export async function listSubjects(params?: {
  school_id?: string;
  is_active?: boolean;
  grade_band?: string;
  subject_type?: string;
}): Promise<Subject[]> {
  const searchParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });
  }
  
  const queryString = searchParams.toString();
  const url = queryString ? `/subjects?${queryString}` : "/subjects";
  
  const data = await apiFetch<unknown>(url);
  return SubjectsListSchema.parse(data);
}

export async function createSubject(payload: SubjectCreate) {
  const data = await apiFetch<unknown>("/subjects", {
    method: "POST",
    json: payload,
  });
  return SubjectSchema.parse(data);
}

export async function updateSubject(id: string, payload: Partial<Subject>) {
  const data = await apiFetch<unknown>(`/subjects/${id}`, {
    method: "PUT",
    json: payload,
  });
  return SubjectSchema.parse(data);
}

export async function deleteSubject(id: string) {
  await apiFetch<void>(`/subjects/${id}`, { method: "DELETE" });
}
