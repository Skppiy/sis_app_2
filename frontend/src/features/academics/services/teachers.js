// src/features/academics/services/teachers.ts  
import { apiFetch } from "@/api/requestHelper";
import { TeacherSchema } from "@/schemas/academics";
import { z } from "zod";
const TeachersListSchema = z.array(TeacherSchema);
// No enrichment needed - backend returns complete teacher data
export async function listTeachers(params) {
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
        const data = await apiFetch(url);
        console.log('[TeachersService] Received data:', data);
        
        // Backend already returns complete teacher data - no enrichment needed!
        const validatedData = TeachersListSchema.parse(data);
        console.log('[TeachersService] Validated teachers:', validatedData);
        
        return validatedData;
    }
    catch (error) {
        console.error('[TeachersService] Failed to load teachers:', error);
        throw error;
    }
}
export async function createTeacher(payload) {
    const data = await apiFetch("/admin/teachers", {
        method: "POST",
        json: payload,
    });
    return TeacherSchema.parse(data);
}
export async function updateTeacher(id, payload) {
    const data = await apiFetch(`/admin/teachers/${id}`, {
        method: "PUT",
        json: payload,
    });
    return TeacherSchema.parse(data);
}
export async function deleteTeacher(id) {
    await apiFetch(`/admin/teachers/${id}`, { method: "DELETE" });
}