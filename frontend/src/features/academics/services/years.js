// src/features/academics/services/years.ts
import { apiFetch } from "@/api/requestHelper";
// Logging utilities for academic years service
const logOperation = (operation, details) => {
    if (import.meta.env.DEV) {
        console.log(`[YearsService] ${operation}`, details);
    }
};
const logError = (operation, error) => {
    console.error(`[YearsService] ${operation} failed:`, error);
};
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
export async function createYear(data) {
    try {
        logOperation('createYear', { name: data.name });
        const result = await apiFetch("/academic-years", {
            method: "POST",
            json: data,
        });
        logOperation('createYear success', { yearId: result.id });
        return result;
    }
    catch (error) {
        logError('createYear', error);
        if (error && typeof error === 'object' && 'category' in error) {
            const apiError = error;
            switch (apiError.category) {
                case 'validation':
                    if (apiError.message.includes('already exists')) {
                        throw new Error('An academic year with this name already exists. Please choose a different name.');
                    }
                    if (apiError.message.includes('invalid date')) {
                        throw new Error('The start and end dates are invalid. Please check that the end date is after the start date.');
                    }
                    if (apiError.message.includes('overlapping')) {
                        throw new Error('This academic year overlaps with an existing year. Please adjust the dates.');
                    }
                    throw new Error('The academic year information is invalid. Please check all fields.');
                case 'conflict':
                    throw new Error('This academic year conflicts with existing data. Please check for overlapping years.');
                case 'auth':
                    throw new Error('You do not have permission to create academic years. Please contact your administrator.');
                default:
                    throw new Error('Failed to create academic year. Please try again or contact support.');
            }
        }
        throw error;
    }
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
