// src/features/academics/services/classrooms.ts
import { apiFetch } from "@api/requestHelper";
import { ClassroomSchema } from "@schemas/academics";
import { z } from "zod";
const ClassroomsListSchema = z.array(ClassroomSchema);
export async function listClassrooms(params) {
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
    const data = await apiFetch(url);
    return ClassroomsListSchema.parse(data);
}
export async function getClassroom(id) {
    const data = await apiFetch(`/classrooms/${id}`);
    return ClassroomSchema.parse(data);
}
export async function createClassroom(payload) {
    const data = await apiFetch("/classrooms", {
        method: "POST",
        json: payload,
    });
    return ClassroomSchema.parse(data);
}
export async function updateClassroom(id, payload) {
    const data = await apiFetch(`/classrooms/${id}`, {
        method: "PUT",
        json: payload,
    });
    return ClassroomSchema.parse(data);
}
export async function deleteClassroom(id) {
    await apiFetch(`/classrooms/${id}`, {
        method: "DELETE"
    });
}
