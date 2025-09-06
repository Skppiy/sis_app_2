// src/features/academics/services/years.ts
import { apiFetch } from "@/api/requestHelper";
export const YearsAPI = {
    list: () => apiFetch("/academic-years"),
    create: (data) => apiFetch("/academic-years", {
        method: "POST",
        json: data, // ✅ Use json helper instead of manual body
    }),
    update: (id, data) => apiFetch(`/academic-years/${id}`, {
        method: "PUT",
        json: data, // ✅ Use json helper instead of manual body
    }),
    remove: (id) => apiFetch(`/academic-years/${id}`, { method: "DELETE" }),
};
