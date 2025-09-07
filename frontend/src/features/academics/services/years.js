// src/features/academics/services/years.ts
import { apiFetch } from "@/api/requestHelper";
// List years with optional filtering
export function listYears(filters) {
    const searchParams = new URLSearchParams();
    if (filters?.school_id)
        searchParams.append('school_id', filters.school_id);
    if (filters?.is_active !== undefined)
        searchParams.append('is_active', filters.is_active.toString());
    const query = searchParams.toString() ? `?${searchParams}` : '';
    return apiFetch(`/academic-years${query}`);
}
// Get a specific year
export function getYear(id) {
    return apiFetch(`/academic-years/${id}`);
}
// Create a year
export function createYear(data) {
    return apiFetch("/academic-years", {
        method: "POST",
        json: data,
    });
}
// Update a year
export function updateYear(id, data) {
    return apiFetch(`/academic-years/${id}`, {
        method: "PUT",
        json: data,
    });
}
// Delete a year
export function deleteYear(id) {
    return apiFetch(`/academic-years/${id}`, { method: "DELETE" });
}
// Legacy API object for backward compatibility
export const YearsAPI = {
    list: () => listYears(),
    create: createYear,
    update: updateYear,
    remove: deleteYear,
};
