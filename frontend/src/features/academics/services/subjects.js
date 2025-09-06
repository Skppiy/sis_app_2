// src/features/academics/services/subjects.ts
import { apiFetch } from "@api/requestHelper";
import { SubjectSchema } from "@schemas/academics";
import { z } from "zod";
const SubjectsListSchema = z.array(SubjectSchema);
export async function listSubjects(params) {
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
    const data = await apiFetch(url);
    return SubjectsListSchema.parse(data);
}
export async function createSubject(payload) {
    const data = await apiFetch("/subjects", {
        method: "POST",
        json: payload,
    });
    return SubjectSchema.parse(data);
}
export async function updateSubject(id, payload) {
    const data = await apiFetch(`/subjects/${id}`, {
        method: "PUT",
        json: payload,
    });
    return SubjectSchema.parse(data);
}
export async function deleteSubject(id) {
    await apiFetch(`/subjects/${id}`, { method: "DELETE" });
}
