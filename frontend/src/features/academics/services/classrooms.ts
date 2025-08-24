// src/features/academics/services/classrooms.ts
import { apiFetch } from "@api/requestHelper";
import { Classroom, ClassroomSchema } from "@schemas/academics";
import { z } from "zod";

const ClassroomsListSchema = z.array(ClassroomSchema);

export async function listClassrooms(): Promise<Classroom[]> {
  const data = await apiFetch<unknown>("/classrooms");
  return ClassroomsListSchema.parse(data);
}

export async function createClassroom(payload: Partial<Classroom>) {
  const data = await apiFetch<unknown>("/classrooms", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return ClassroomSchema.parse(data);
}

export async function updateClassroom(id: string, payload: Partial<Classroom>) {
  const data = await apiFetch<unknown>(`/classrooms/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return ClassroomSchema.parse(data);
}

export async function deleteClassroom(id: string) {
  await apiFetch<void>(`/classrooms/${id}`, { method: "DELETE" });
}
