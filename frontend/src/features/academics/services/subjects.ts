// src/features/academics/services/subjects.ts
import { apiFetch } from "@api/requestHelper";
import { Subject, SubjectSchema } from "@schemas/academics";
import { z } from "zod";

const SubjectsListSchema = z.array(SubjectSchema);

export async function listSubjects(): Promise<Subject[]> {
  const data = await apiFetch<unknown>("/subjects");
  return SubjectsListSchema.parse(data);
}

export async function createSubject(payload: Partial<Subject>) {
  const data = await apiFetch<unknown>("/subjects", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return SubjectSchema.parse(data);
}

export async function updateSubject(id: string, payload: Partial<Subject>) {
  const data = await apiFetch<unknown>(`/subjects/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return SubjectSchema.parse(data);
}

export async function deleteSubject(id: string) {
  await apiFetch<void>(`/subjects/${id}`, { method: "DELETE" });
}
